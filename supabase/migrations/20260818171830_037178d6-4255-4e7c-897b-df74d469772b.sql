-- ============ FOOD REQUESTS BOARD ============
CREATE TYPE public.request_status AS ENUM ('OPEN','FULFILLED','CANCELLED');

CREATE TABLE public.food_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  meals_needed integer NOT NULL DEFAULT 1,
  needed_by timestamptz NOT NULL,
  address text NOT NULL,
  notes text,
  veg_only boolean NOT NULL DEFAULT false,
  status public.request_status NOT NULL DEFAULT 'OPEN',
  fulfilled_by uuid REFERENCES auth.users(id),
  fulfilled_donation_id uuid REFERENCES public.donations(id) ON DELETE SET NULL,
  fulfilled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.food_requests TO authenticated;
GRANT ALL ON public.food_requests TO service_role;

ALTER TABLE public.food_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "requests readable by authenticated" ON public.food_requests
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "receivers insert own requests" ON public.food_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = receiver_id);
CREATE POLICY "receivers update own requests" ON public.food_requests
  FOR UPDATE TO authenticated USING (auth.uid() = receiver_id) WITH CHECK (auth.uid() = receiver_id);
CREATE POLICY "receivers delete own open requests" ON public.food_requests
  FOR DELETE TO authenticated USING (auth.uid() = receiver_id AND status = 'OPEN');

CREATE TRIGGER food_requests_updated_at BEFORE UPDATE ON public.food_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX food_requests_status_idx ON public.food_requests (status, needed_by);

-- Race-safe fulfilment by a donor, optionally linking one of their listings
CREATE OR REPLACE FUNCTION public.fulfill_request(_request_id uuid, _donation_id uuid DEFAULT NULL)
RETURNS public.food_requests
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _row public.food_requests; _name text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  IF _donation_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.donations d WHERE d.id = _donation_id AND d.donor_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'You can only link your own listing';
  END IF;

  UPDATE public.food_requests
     SET status = 'FULFILLED', fulfilled_by = auth.uid(),
         fulfilled_donation_id = _donation_id, fulfilled_at = now()
   WHERE id = _request_id AND status = 'OPEN'
  RETURNING * INTO _row;

  IF _row.id IS NULL THEN RAISE EXCEPTION 'This request was already fulfilled or closed'; END IF;

  SELECT COALESCE(NULLIF(org_name,''), display_name, 'A donor') INTO _name
    FROM public.profiles WHERE id = auth.uid();

  INSERT INTO public.notifications (user_id, donation_id, message)
  VALUES (_row.receiver_id, _donation_id,
          COALESCE(_name,'A donor') || ' is fulfilling your request "' || _row.title || '"');

  RETURN _row;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_request(_request_id uuid)
RETURNS public.food_requests
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _row public.food_requests;
BEGIN
  UPDATE public.food_requests SET status = 'CANCELLED'
   WHERE id = _request_id AND receiver_id = auth.uid() AND status = 'OPEN'
  RETURNING * INTO _row;
  IF _row.id IS NULL THEN RAISE EXCEPTION 'Cannot cancel this request'; END IF;
  RETURN _row;
END;
$$;

-- ============ PICKUP QR CODES ============
CREATE TABLE public.pickup_codes (
  donation_id uuid PRIMARY KEY REFERENCES public.donations(id) ON DELETE CASCADE,
  code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pickup_codes TO authenticated;
GRANT ALL ON public.pickup_codes TO service_role;

ALTER TABLE public.pickup_codes ENABLE ROW LEVEL SECURITY;

-- Only the donor of the donation may read the raw code (they display the QR)
CREATE POLICY "donor reads own pickup code" ON public.pickup_codes
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.donations d WHERE d.id = donation_id AND d.donor_id = auth.uid())
  );

-- Donor generates / fetches the handover code for a claimed donation
CREATE OR REPLACE FUNCTION public.get_pickup_code(_donation_id uuid)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _code text; _d public.donations;
BEGIN
  SELECT * INTO _d FROM public.donations WHERE id = _donation_id;
  IF _d.id IS NULL THEN RAISE EXCEPTION 'Donation not found'; END IF;
  IF _d.donor_id <> auth.uid() THEN RAISE EXCEPTION 'Only the donor can show the pickup QR'; END IF;
  IF _d.status <> 'CLAIMED' THEN RAISE EXCEPTION 'Pickup code is only available for claimed donations'; END IF;

  SELECT code INTO _code FROM public.pickup_codes WHERE donation_id = _donation_id;
  IF _code IS NULL THEN
    _code := upper(encode(gen_random_bytes(6), 'hex'));
    INSERT INTO public.pickup_codes (donation_id, code) VALUES (_donation_id, _code)
    ON CONFLICT (donation_id) DO NOTHING;
    SELECT code INTO _code FROM public.pickup_codes WHERE donation_id = _donation_id;
  END IF;
  RETURN _code;
END;
$$;

-- Receiver or assigned volunteer scans the QR and confirms pickup in one tap
CREATE OR REPLACE FUNCTION public.confirm_pickup_with_code(_donation_id uuid, _code text)
RETURNS public.donations
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _row public.donations; _stored text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT code INTO _stored FROM public.pickup_codes WHERE donation_id = _donation_id;
  IF _stored IS NULL OR upper(trim(_code)) <> _stored THEN
    RAISE EXCEPTION 'That pickup code does not match this donation';
  END IF;

  UPDATE public.donations
     SET status = 'PICKED_UP', picked_up_at = now(),
         delivered_at = CASE WHEN volunteer_id IS NOT NULL THEN now() ELSE delivered_at END
   WHERE id = _donation_id AND status = 'CLAIMED'
     AND (claimed_by = auth.uid() OR volunteer_id = auth.uid())
  RETURNING * INTO _row;

  IF _row.id IS NULL THEN RAISE EXCEPTION 'Only the receiver or assigned volunteer can confirm this pickup'; END IF;

  INSERT INTO public.notifications (user_id, donation_id, message)
  SELECT uid, _row.id, 'Pickup confirmed by QR scan for "' || _row.title || '"'
  FROM (SELECT unnest(ARRAY[_row.donor_id, _row.claimed_by, _row.volunteer_id]) AS uid) t
  WHERE uid IS NOT NULL AND uid <> auth.uid();

  RETURN _row;
END;
$$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.food_requests;