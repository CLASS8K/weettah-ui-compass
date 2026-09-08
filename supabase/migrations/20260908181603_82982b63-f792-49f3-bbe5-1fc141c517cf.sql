ALTER TABLE public.payment_orders
  ADD COLUMN plan_id text,
  ADD COLUMN fulfillment_status text NOT NULL DEFAULT 'not_started',
  ADD COLUMN supplier_order_no text,
  ADD COLUMN esim_transaction_no text,
  ADD COLUMN iccid text,
  ADD COLUMN activation_code text,
  ADD COLUMN qr_code_url text,
  ADD COLUMN apn text,
  ADD COLUMN fulfillment_error text,
  ADD COLUMN fulfilled_at timestamp with time zone;

ALTER TABLE public.payment_orders
  ADD CONSTRAINT payment_orders_fulfillment_status_check
  CHECK (fulfillment_status IN ('not_started', 'provisioning', 'ready', 'failed'));

CREATE INDEX payment_orders_supplier_order_no_idx
  ON public.payment_orders (supplier_order_no)
  WHERE supplier_order_no IS NOT NULL;