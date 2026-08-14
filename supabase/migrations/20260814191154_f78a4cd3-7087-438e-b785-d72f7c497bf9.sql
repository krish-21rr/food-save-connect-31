
CREATE TYPE public.account_role AS ENUM ('donor','receiver');
CREATE TYPE public.donation_status AS ENUM ('AVAILABLE','CLAIMED','PICKED_UP','EXPIRED');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  display_name text NOT NULL DEFAULT '',
  org_name text,
  phone text,
  address text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.account_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roles readable by authenticated" ON public.user_roles FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.account_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, org_name, phone, address)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(COALESCE(NEW.email,''),'@',1)),
    NEW.raw_user_meta_data->>'org_name',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'address'
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::public.account_role, 'receiver'))
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'cooked',
  quantity text NOT NULL,
  veg boolean NOT NULL DEFAULT true,
  allergens text[] NOT NULL DEFAULT '{}',
  deadline timestamptz NOT NULL,
  address text NOT NULL,
  notes text,
  image_urls text[] NOT NULL DEFAULT '{}',
  status public.donation_status NOT NULL DEFAULT 'AVAILABLE',
  claimed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  claimed_at timestamptz,
  picked_up_at timestamptz,
  expired_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.donations TO authenticated;
GRANT ALL ON public.donations TO service_role;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "donations readable by authenticated" ON public.donations FOR SELECT TO authenticated USING (true);
CREATE POLICY "donors insert own donations" ON public.donations FOR INSERT TO authenticated WITH CHECK (auth.uid() = donor_id);
CREATE POLICY "donors update own donations" ON public.donations FOR UPDATE TO authenticated USING (auth.uid() = donor_id) WITH CHECK (auth.uid() = donor_id);
CREATE POLICY "donors delete own unclaimed donations" ON public.donations FOR DELETE TO authenticated USING (auth.uid() = donor_id AND status = 'AVAILABLE');

CREATE INDEX donations_status_idx ON public.donations (status, deadline);
CREATE INDEX donations_donor_idx ON public.donations (donor_id);
CREATE INDEX donations_claimed_idx ON public.donations (claimed_by);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER donations_updated_at BEFORE UPDATE ON public.donations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  donation_id uuid REFERENCES public.donations(id) ON DELETE CASCADE,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.claim_donation(_donation_id uuid)
RETURNS public.donations LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _row public.donations;
  _claimer text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  UPDATE public.donations
     SET status = 'CLAIMED', claimed_by = auth.uid(), claimed_at = now()
   WHERE id = _donation_id AND status = 'AVAILABLE' AND deadline > now()
  RETURNING * INTO _row;

  IF _row.id IS NULL THEN
    RAISE EXCEPTION 'This donation has already been claimed or expired';
  END IF;

  SELECT COALESCE(NULLIF(org_name,''), display_name, 'A receiver') INTO _claimer
    FROM public.profiles WHERE id = auth.uid();

  INSERT INTO public.notifications (user_id, donation_id, message)
  VALUES (_row.donor_id, _row.id, COALESCE(_claimer,'A receiver') || ' claimed "' || _row.title || '"');

  RETURN _row;
END;
$$;
GRANT EXECUTE ON FUNCTION public.claim_donation(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.mark_picked_up(_donation_id uuid)
RETURNS public.donations LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _row public.donations;
BEGIN
  UPDATE public.donations SET status = 'PICKED_UP', picked_up_at = now()
   WHERE id = _donation_id AND status = 'CLAIMED'
     AND (donor_id = auth.uid() OR claimed_by = auth.uid())
  RETURNING * INTO _row;
  IF _row.id IS NULL THEN RAISE EXCEPTION 'Cannot mark this donation as picked up'; END IF;

  IF _row.claimed_by IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, donation_id, message)
    VALUES (_row.claimed_by, _row.id, 'Pickup confirmed for "' || _row.title || '"');
  END IF;
  RETURN _row;
END;
$$;
GRANT EXECUTE ON FUNCTION public.mark_picked_up(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.expire_stale_donations()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.donations SET status = 'EXPIRED', expired_at = now()
   WHERE status = 'AVAILABLE' AND deadline < now();
$$;
GRANT EXECUTE ON FUNCTION public.expire_stale_donations() TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.donations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

CREATE POLICY "food photos auth read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'food-photos');
CREATE POLICY "food photos auth upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'food-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "food photos owner delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'food-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
