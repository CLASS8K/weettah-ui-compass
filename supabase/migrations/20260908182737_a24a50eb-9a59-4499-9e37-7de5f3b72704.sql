CREATE TYPE public.app_role AS ENUM ('supplier_admin');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);
CREATE POLICY "Server manages user roles"
ON public.user_roles FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
REVOKE ALL ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated, service_role;

CREATE TABLE public.plans (
  id TEXT PRIMARY KEY,
  country TEXT NOT NULL,
  flag TEXT NOT NULL,
  region TEXT NOT NULL,
  data_allowance TEXT NOT NULL,
  validity_days INTEGER NOT NULL CHECK (validity_days > 0),
  amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (char_length(currency) = 3),
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  supplier_package_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plans TO authenticated;
GRANT ALL ON public.plans TO service_role;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Supplier admins can read plans"
ON public.plans FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'supplier_admin'));
CREATE POLICY "Supplier admins can create plans"
ON public.plans FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'supplier_admin'));
CREATE POLICY "Supplier admins can update plans"
ON public.plans FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'supplier_admin'))
WITH CHECK (public.has_role(auth.uid(), 'supplier_admin'));
CREATE POLICY "Supplier admins can delete plans"
ON public.plans FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'supplier_admin'));
CREATE POLICY "Server manages plans"
ON public.plans FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE TABLE public.integration_settings (
  id TEXT PRIMARY KEY CHECK (id IN ('esim_access', 'pesapal')),
  provider_name TEXT NOT NULL,
  api_base_url TEXT,
  environment TEXT NOT NULL DEFAULT 'test' CHECK (environment IN ('test', 'live')),
  notification_id TEXT,
  encrypted_credentials TEXT,
  credential_hint TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.integration_settings TO authenticated;
GRANT ALL ON public.integration_settings TO service_role;
ALTER TABLE public.integration_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Supplier admins can read integration settings"
ON public.integration_settings FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'supplier_admin'));
CREATE POLICY "Supplier admins can create integration settings"
ON public.integration_settings FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'supplier_admin'));
CREATE POLICY "Supplier admins can update integration settings"
ON public.integration_settings FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'supplier_admin'))
WITH CHECK (public.has_role(auth.uid(), 'supplier_admin'));
CREATE POLICY "Server manages integration settings"
ON public.integration_settings FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.set_admin_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_plans_updated_at
BEFORE UPDATE ON public.plans
FOR EACH ROW EXECUTE FUNCTION public.set_admin_updated_at();
CREATE TRIGGER set_integration_settings_updated_at
BEFORE UPDATE ON public.integration_settings
FOR EACH ROW EXECUTE FUNCTION public.set_admin_updated_at();

CREATE INDEX plans_active_order_idx ON public.plans (is_active, display_order);
CREATE INDEX payment_orders_pending_admin_idx ON public.payment_orders (status, fulfillment_status, created_at DESC);

INSERT INTO public.plans (id, country, flag, region, data_allowance, validity_days, amount_minor, currency, is_active, is_popular, display_order)
VALUES
  ('za-3gb-30d', 'South Africa', '🇿🇦', 'Africa', '3 GB', 30, 960, 'USD', true, true, 10),
  ('ke-5gb-30d', 'Kenya', '🇰🇪', 'Africa', '5 GB', 30, 1180, 'USD', true, true, 20),
  ('ng-3gb-30d', 'Nigeria', '🇳🇬', 'Africa', '3 GB', 30, 1020, 'USD', true, false, 30),
  ('gh-5gb-30d', 'Ghana', '🇬🇭', 'Africa', '5 GB', 30, 1240, 'USD', true, false, 40),
  ('gb-3gb-15d', 'United Kingdom', '🇬🇧', 'Europe', '3 GB', 15, 890, 'USD', true, false, 50),
  ('us-5gb-30d', 'United States', '🇺🇸', 'North America', '5 GB', 30, 1250, 'USD', true, false, 60),
  ('ae-5gb-15d', 'United Arab Emirates', '🇦🇪', 'Middle East', '5 GB', 15, 1420, 'USD', true, false, 70),
  ('jp-10gb-30d', 'Japan', '🇯🇵', 'Asia', '10 GB', 30, 1940, 'USD', true, false, 80);

INSERT INTO public.integration_settings (id, provider_name, api_base_url, environment)
VALUES
  ('esim_access', 'eSIM Access', 'https://api.esimaccess.com/api/v1/open', 'live'),
  ('pesapal', 'Pesapal', 'https://cybqa.pesapal.com/pesapalv3/api', 'test');