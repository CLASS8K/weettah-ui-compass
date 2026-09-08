import { createServerFn } from "@tanstack/react-start";

export type PublicPlan = {
  id: string;
  country: string;
  flag: string;
  region: string;
  data: string;
  days: number;
  price: string;
  amountMinor: number;
  currency: string;
  popular: boolean;
};

export const getPublicPlans = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("plans")
    .select("id, country, flag, region, data_allowance, validity_days, amount_minor, currency, is_popular")
    .eq("is_active", true)
    .order("display_order");
  if (error) throw new Error("Unable to load plans");
  return data.map((plan) => ({
    id: plan.id,
    country: plan.country,
    flag: plan.flag,
    region: plan.region,
    data: plan.data_allowance,
    days: plan.validity_days,
    amountMinor: plan.amount_minor,
    currency: plan.currency,
    price: new Intl.NumberFormat("en", { style: "currency", currency: plan.currency }).format(plan.amount_minor / 100),
    popular: plan.is_popular,
  })) satisfies PublicPlan[];
});