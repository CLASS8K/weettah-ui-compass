REVOKE ALL ON public.integration_settings FROM anon, authenticated;
REVOKE ALL ON public.payment_orders FROM anon, authenticated;
GRANT ALL ON public.integration_settings TO service_role;
GRANT ALL ON public.payment_orders TO service_role;

DROP POLICY IF EXISTS "Deny all non-server access to integration settings" ON public.integration_settings;
CREATE POLICY "Deny all non-server access to integration settings"
ON public.integration_settings
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS "Deny all non-server access to payment orders" ON public.payment_orders;
CREATE POLICY "Deny all non-server access to payment orders"
ON public.payment_orders
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);