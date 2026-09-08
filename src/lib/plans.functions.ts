import { createServerFn } from "@tanstack/react-start";

export type PublicPlan = {
  id: string;
  country: string;
  slug: string;
  flag: string;
  region: string;
  data: string;
  days: number;
  price: string;
  amountMinor: number;
  currency: string;
  popular: boolean;
};

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatPrice(amountMinor: number, currency: string) {
  return new Intl.NumberFormat("en", { style: "currency", currency }).format(amountMinor / 100);
}

async function loadActivePlans(): Promise<PublicPlan[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("plans")
    .select("id, country, flag, region, data_allowance, validity_days, amount_minor, currency, is_popular")
    .eq("is_active", true)
    .order("display_order");
  if (error) throw new Error("Unable to load plans");
  return (data ?? []).map((plan) => ({
    id: plan.id,
    country: plan.country,
    slug: slugify(plan.country),
    flag: plan.flag,
    region: plan.region,
    data: plan.data_allowance,
    days: plan.validity_days,
    amountMinor: plan.amount_minor,
    currency: plan.currency,
    price: formatPrice(plan.amount_minor, plan.currency),
    popular: plan.is_popular,
  }));
}

export const getPublicPlans = createServerFn({ method: "GET" }).handler(async () => loadActivePlans());

export type Destination = {
  slug: string;
  country: string;
  flag: string;
  region: string;
  plans: PublicPlan[];
  fromPrice: string;
  popular: boolean;
};

function groupDestinations(plans: PublicPlan[]): Destination[] {
  const map = new Map<string, Destination>();
  for (const plan of plans) {
    const existing = map.get(plan.slug);
    if (existing) {
      existing.plans.push(plan);
      existing.popular = existing.popular || plan.popular;
      continue;
    }
    map.set(plan.slug, {
      slug: plan.slug,
      country: plan.country,
      flag: plan.flag,
      region: plan.region,
      plans: [plan],
      fromPrice: plan.price,
      popular: plan.popular,
    });
  }
  for (const destination of map.values()) {
    destination.plans.sort((a, b) => a.amountMinor - b.amountMinor);
    const cheapest = destination.plans[0];
    if (cheapest) destination.fromPrice = formatPrice(cheapest.amountMinor, cheapest.currency);
  }
  return [...map.values()];
}

export const getDestinations = createServerFn({ method: "GET" }).handler(async () =>
  groupDestinations(await loadActivePlans()),
);

export const getDestination = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => ({ slug: slugify(String(data?.slug ?? "")) }))
  .handler(async ({ data }) => {
    const all = groupDestinations(await loadActivePlans());
    const destination = all.find((item) => item.slug === data.slug) ?? null;
    const related = destination
      ? all.filter((item) => item.slug !== destination.slug && item.region === destination.region).slice(0, 4)
      : [];
    return { destination, related };
  });
