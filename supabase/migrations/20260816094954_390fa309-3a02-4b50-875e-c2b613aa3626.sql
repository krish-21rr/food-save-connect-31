-- Delivery assignment fields
ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS delivery_requested boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS volunteer_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS volunteer_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

-- Chat messages tied to a donation
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id uuid NOT NULL REFERENCES public.donations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_donation_participant(_donation_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.donations d
    WHERE d.id = _donation_id
      AND (d.donor_id = _user_id OR d.claimed_by = _user_id OR d.volunteer_id = _user_id)
  );
$$;

CREATE POLICY "participants read messages" ON public.messages
  FOR SELECT TO authenticated
  USING (public.is_donation_participant(donation_id, auth.uid()));

CREATE POLICY "participants send messages" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.is_donation_participant(donation_id, auth.uid()));

CREATE INDEX IF NOT EXISTS messages_donation_created_idx ON public.messages(donation_id, created_at);

-- Notify the other participants when a message arrives
CREATE OR REPLACE FUNCTION public.notify_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _d public.donations; _name text;
BEGIN
  SELECT * INTO _d FROM public.donations WHERE id = NEW.donation_id;
  SELECT COALESCE(NULLIF(org_name,''), display_name, 'Someone') INTO _name
    FROM public.profiles WHERE id = NEW.sender_id;

  INSERT INTO public.notifications (user_id, donation_id, message)
  SELECT uid, NEW.donation_id, COALESCE(_name,'Someone') || ': ' || left(NEW.body, 80)
  FROM (SELECT unnest(ARRAY[_d.donor_id, _d.claimed_by, _d.volunteer_id]) AS uid) t
  WHERE uid IS NOT NULL AND uid <> NEW.sender_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS messages_notify ON public.messages;
CREATE TRIGGER messages_notify AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.notify_on_message();

-- Receivers (or donors) can request a volunteer driver
CREATE OR REPLACE FUNCTION public.request_delivery(_donation_id uuid)
RETURNS public.donations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _row public.donations;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  UPDATE public.donations SET delivery_requested = true
   WHERE id = _donation_id
     AND status = 'CLAIMED'
     AND volunteer_id IS NULL
     AND (donor_id = auth.uid() OR claimed_by = auth.uid())
  RETURNING * INTO _row;

  IF _row.id IS NULL THEN RAISE EXCEPTION 'Cannot request a volunteer for this donation'; END IF;
  RETURN _row;
END;
$$;

-- Race-safe volunteer assignment
CREATE OR REPLACE FUNCTION public.accept_delivery(_donation_id uuid)
RETURNS public.donations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _row public.donations; _name text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.has_role(auth.uid(), 'volunteer') THEN
    RAISE EXCEPTION 'Only volunteers can accept delivery runs';
  END IF;

  UPDATE public.donations
     SET volunteer_id = auth.uid(), volunteer_accepted_at = now()
   WHERE id = _donation_id
     AND status = 'CLAIMED'
     AND delivery_requested = true
     AND volunteer_id IS NULL
     AND deadline > now()
  RETURNING * INTO _row;

  IF _row.id IS NULL THEN RAISE EXCEPTION 'This run was already taken or is no longer available'; END IF;

  SELECT COALESCE(NULLIF(org_name,''), display_name, 'A volunteer') INTO _name
    FROM public.profiles WHERE id = auth.uid();

  INSERT INTO public.notifications (user_id, donation_id, message)
  SELECT uid, _row.id, COALESCE(_name,'A volunteer') || ' accepted the delivery run for "' || _row.title || '"'
  FROM (SELECT unnest(ARRAY[_row.donor_id, _row.claimed_by]) AS uid) t
  WHERE uid IS NOT NULL;

  RETURN _row;
END;
$$;

-- Volunteer can drop a run
CREATE OR REPLACE FUNCTION public.cancel_delivery(_donation_id uuid)
RETURNS public.donations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _row public.donations;
BEGIN
  UPDATE public.donations SET volunteer_id = NULL, volunteer_accepted_at = NULL
   WHERE id = _donation_id AND volunteer_id = auth.uid() AND status = 'CLAIMED'
  RETURNING * INTO _row;
  IF _row.id IS NULL THEN RAISE EXCEPTION 'Cannot cancel this run'; END IF;
  RETURN _row;
END;
$$;

-- Allow the assigned volunteer to complete the handover too
CREATE OR REPLACE FUNCTION public.mark_picked_up(_donation_id uuid)
RETURNS public.donations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _row public.donations;
BEGIN
  UPDATE public.donations SET status = 'PICKED_UP', picked_up_at = now(),
         delivered_at = CASE WHEN volunteer_id IS NOT NULL THEN now() ELSE delivered_at END
   WHERE id = _donation_id AND status = 'CLAIMED'
     AND (donor_id = auth.uid() OR claimed_by = auth.uid() OR volunteer_id = auth.uid())
  RETURNING * INTO _row;
  IF _row.id IS NULL THEN RAISE EXCEPTION 'Cannot mark this donation as picked up'; END IF;

  INSERT INTO public.notifications (user_id, donation_id, message)
  SELECT uid, _row.id, 'Pickup confirmed for "' || _row.title || '"'
  FROM (SELECT unnest(ARRAY[_row.donor_id, _row.claimed_by, _row.volunteer_id]) AS uid) t
  WHERE uid IS NOT NULL AND uid <> auth.uid();

  RETURN _row;
END;
$$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;