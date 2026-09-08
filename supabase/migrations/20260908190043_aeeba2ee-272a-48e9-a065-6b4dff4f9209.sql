CREATE TABLE public.supported_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand text NOT NULL,
  models text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.supported_devices TO anon;
GRANT SELECT ON public.supported_devices TO authenticated;
GRANT ALL ON public.supported_devices TO service_role;

ALTER TABLE public.supported_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read visible devices" ON public.supported_devices
FOR SELECT USING (is_active = true);

CREATE POLICY "Server manages supported devices" ON public.supported_devices
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER set_supported_devices_updated_at
BEFORE UPDATE ON public.supported_devices
FOR EACH ROW EXECUTE FUNCTION public.set_admin_updated_at();

INSERT INTO public.supported_devices (brand, models, display_order) VALUES
('Apple', 'iPhone XS, XS Max, XR and every iPhone since (11, 12, 13, 14, 15, 16, SE 3rd gen), iPad Pro 3rd gen and newer', 1),
('Samsung', 'Galaxy S20 and newer, Z Flip and Z Fold (all), Note 20, A54, A55', 2),
('Google', 'Pixel 3 and newer (Pixel 3 must be a global model), including Pixel Fold and all a-series from 3a', 3),
('Huawei', 'P40, P40 Pro, Mate 40 Pro', 4),
('Others', 'Oppo Find X3 Pro and newer, Reno 5A+, Xiaomi 12T Pro and 13/14 series, Motorola Razr 2019+, Edge 40, Sony Xperia 10 III/IV/V', 5);