ALTER TABLE public.payment_orders
  ADD COLUMN activation_token uuid NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX payment_orders_activation_token_idx
  ON public.payment_orders (activation_token);