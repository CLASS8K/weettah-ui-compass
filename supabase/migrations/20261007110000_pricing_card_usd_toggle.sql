-- Lets checkout offer international Visa/Mastercard payment in USD alongside
-- kwacha (mobile money and Malawian cards). Off until PayChangu confirms that
-- USD card payments settle in USD: if they were converted to MWK at the official
-- rate, a USD sale would not cover the cost of replacing the dollars.
ALTER TABLE public.pricing_settings
  ADD COLUMN card_usd_enabled BOOLEAN NOT NULL DEFAULT false;
COMMENT ON COLUMN public.pricing_settings.card_usd_enabled IS
  'When true, checkout offers international Visa/Mastercard payment in USD at the plan''s USD price. Turn on only once PayChangu settles USD card payments in USD.';
