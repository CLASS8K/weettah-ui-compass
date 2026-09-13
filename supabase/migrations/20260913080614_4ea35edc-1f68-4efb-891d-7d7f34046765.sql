GRANT SELECT (id, country, flag, region, data_allowance, validity_days, amount_minor, currency, is_active, is_popular, display_order) ON public.plans TO anon;
GRANT SELECT (id, country, flag, region, data_allowance, validity_days, amount_minor, currency, is_active, is_popular, display_order) ON public.plans TO authenticated;
CREATE POLICY "Anyone can read active plans"
ON public.plans
FOR SELECT
TO anon, authenticated
USING (is_active = true);