CREATE OR REPLACE FUNCTION public.orders_for_email(_email text)
RETURNS TABLE (
  merchant_reference text,
  country text,
  data_allowance text,
  validity_days integer,
  amount_minor integer,
  currency text,
  created_at timestamptz,
  status text,
  fulfillment_status text,
  activation_token uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.merchant_reference, o.country, o.data_allowance, o.validity_days,
         o.amount_minor, o.currency, o.created_at, o.status,
         o.fulfillment_status, o.activation_token
  FROM public.payment_orders o
  WHERE lower(btrim(o.customer_email)) = lower(btrim(_email))
  ORDER BY o.created_at DESC
  LIMIT 200
$$;

REVOKE ALL ON FUNCTION public.orders_for_email(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.orders_for_email(text) TO service_role;