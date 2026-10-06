// Server-only. Keeps plan_costs in line with what eSIM Access charges us, then
// reprices every costed plan to markup x wholesale (never below the floor).
//
// Two sources feed the same import:
//   - syncSupplierPrices(): eSIM Access "Get All Data Packages" (/package/list).
//     Prices come back in units of USD/10,000 (10000 = $1.00).
//   - importPriceRows(): rows from the Price Viewer CSV export, as a fallback.

type SupplierPackage = { packageCode?: string; slug?: string; price?: number | string };

export type PriceImportResult = {
  source: string;
  received: number;
  matched: number;
  costsChanged: number;
  repriced: number;
};

// Refuses a suspicious import instead of repricing the catalogue on bad data.
const MIN_MATCH_SHARE = 0.5;
const PAGE = 1000;

// PostgREST caps each response (1,000 rows by default), so page through.
async function fetchAll<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>) {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1);
    if (error) throw new Error("Unable to load pricing data");
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) return rows;
  }
}

export async function importPriceRows(
  rows: { code: string; wholesaleUsd: number }[],
  source: string,
): Promise<PriceImportResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const costByCode = new Map<string, number>();
  for (const row of rows) {
    const code = row.code.trim();
    if (code && Number.isFinite(row.wholesaleUsd) && row.wholesaleUsd > 0) costByCode.set(code, row.wholesaleUsd);
  }
  if (costByCode.size === 0) throw new Error("PRICE_IMPORT_EMPTY");

  const plans = await fetchAll<{ id: string; supplier_package_code: string | null }>((from, to) =>
    supabaseAdmin.from("plans").select("id, supplier_package_code").not("supplier_package_code", "is", null).order("id").range(from, to));
  const existing = await fetchAll<{ plan_id: string; wholesale_usd: number }>((from, to) =>
    supabaseAdmin.from("plan_costs").select("plan_id, wholesale_usd").order("plan_id").range(from, to));
  const current = new Map(existing.map((row) => [row.plan_id, Number(row.wholesale_usd)]));

  const mapped = plans.filter((plan) => plan.supplier_package_code);
  const upserts: { plan_id: string; wholesale_usd: number; source: string; synced_at: string }[] = [];
  const now = new Date().toISOString();
  let matched = 0;
  for (const plan of mapped) {
    const cost = costByCode.get(plan.supplier_package_code!);
    if (cost === undefined) continue;
    matched += 1;
    if (current.get(plan.id) !== cost) upserts.push({ plan_id: plan.id, wholesale_usd: cost, source, synced_at: now });
  }

  if (mapped.length > 0 && matched / mapped.length < MIN_MATCH_SHARE) {
    throw new Error(`PRICE_IMPORT_LOW_MATCH: only ${matched} of ${mapped.length} plans found in the price list`);
  }

  for (let i = 0; i < upserts.length; i += 500) {
    const { error } = await supabaseAdmin.from("plan_costs").upsert(upserts.slice(i, i + 500), { onConflict: "plan_id" });
    if (error) throw new Error("Unable to save plan costs");
  }

  const { data: repriced, error: repriceError } = await supabaseAdmin.rpc("reprice_plans", { _reason: `${source} ${now.slice(0, 10)}` });
  if (repriceError) throw new Error("Unable to reprice plans");

  return { source, received: costByCode.size, matched, costsChanged: upserts.length, repriced: repriced ?? 0 };
}

export async function syncSupplierPrices(): Promise<PriceImportResult> {
  const { supplierRequest } = await import("./esim-access.server");
  const result = await supplierRequest<{ packageList?: SupplierPackage[] }>("/package/list", {
    locationCode: "",
    type: "",
    slug: "",
    packageCode: "",
    iccid: "",
  });
  const list = result?.packageList ?? [];
  const rows: { code: string; wholesaleUsd: number }[] = [];
  for (const item of list) {
    const units = Number(item.price);
    if (!Number.isFinite(units) || units <= 0) continue;
    const wholesaleUsd = units / 10000;
    if (item.packageCode) rows.push({ code: item.packageCode, wholesaleUsd });
    // Plans imported from the CSV may carry the slug-style code instead.
    if (item.slug && item.slug !== item.packageCode) rows.push({ code: item.slug, wholesaleUsd });
  }
  if (rows.length === 0) throw new Error("SUPPLIER_PRICE_LIST_EMPTY");
  return importPriceRows(rows, "esim_access_api");
}
