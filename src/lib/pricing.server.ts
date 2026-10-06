// Server-only. Turns a plan's USD price into the kwacha amount we show and charge.
//
// The rate, markup and floor live in public.pricing_settings (service role only),
// so they can be changed from the admin panel without a redeploy. The page and
// the checkout both call toMwk(), so the price a customer sees is the price
// PayChangu charges.

export type PricingSettings = {
  mwkPerUsd: number;
  markup: number;
  minMarkup: number;
  mwkRounding: number;
  rateUpdatedAt: string | null;
};

const FALLBACK_ROUNDING = 50;

// Used only if the settings row can't be read: the old env var keeps checkout
// working instead of failing every order.
function fallbackSettings(): PricingSettings | null {
  const rate = Number(process.env["PAYCHANGU_MWK_PER_USD"] || "");
  if (!Number.isFinite(rate) || rate <= 0) return null;
  return { mwkPerUsd: rate, markup: 1.5, minMarkup: 1.3, mwkRounding: FALLBACK_ROUNDING, rateUpdatedAt: null };
}

export async function getPricingSettings(): Promise<PricingSettings | null> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("pricing_settings")
      .select("mwk_per_usd, markup, min_markup, mwk_rounding, rate_updated_at")
      .eq("id", 1)
      .maybeSingle();
    if (error || !data) throw error ?? new Error("PRICING_SETTINGS_MISSING");
    const mwkPerUsd = Number(data.mwk_per_usd);
    if (!Number.isFinite(mwkPerUsd) || mwkPerUsd <= 0) throw new Error("PRICING_RATE_INVALID");
    return {
      mwkPerUsd,
      markup: Number(data.markup),
      minMarkup: Number(data.min_markup),
      mwkRounding: Number(data.mwk_rounding) || FALLBACK_ROUNDING,
      rateUpdatedAt: data.rate_updated_at,
    };
  } catch (error) {
    console.error("Pricing settings unavailable, using PAYCHANGU_MWK_PER_USD fallback", error);
    return fallbackSettings();
  }
}

// USD minor units (cents) -> whole kwacha, rounded up to the configured step
// (MWK 50 by default) so prices read cleanly and never round below cost.
export function toMwk(amountMinorUsd: number, settings: Pick<PricingSettings, "mwkPerUsd" | "mwkRounding">) {
  const step = Math.max(1, Math.round(settings.mwkRounding));
  const raw = (amountMinorUsd / 100) * settings.mwkPerUsd;
  return Math.ceil(raw / step) * step;
}

