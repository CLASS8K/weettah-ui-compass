CREATE POLICY "Server manages payment orders"
ON public.payment_orders
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);