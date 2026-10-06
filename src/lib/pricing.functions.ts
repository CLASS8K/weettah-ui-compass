import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin } from "./admin.functions";

export type AdminPricing = {
  mwkPerUsd: number;
  markup: number;
  minMarkup: number;
  mwkRounding: number;
  rateUpdatedAt: string;
  updatedAt: string;
  updatedBy: string | null;
  costedPlans: number;
  lastCostSync: string | null;
};

export const getAdminPricing = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminPricing> => {
    const { supabaseAdmin } = await assertAdmin(context);
    const { data, error } = await supabaseAdmin.from("pricing_settings").select("*").eq("id", 1).single();
    if (error || !data) throw new Error("Unable to load pricing settings");
    const { count } = await supabaseAdmin.from("plan_costs").select("plan_id", { count: "exact", head: true });
    const { data: latest } = await supabaseAdmin.from("plan_costs").select("synced_at").order("synced_at", { ascending: false }).limit(1).maybeSingle();
    return {
      mwkPerUsd: Number(data.mwk_per_usd),
      markup: Number(data.markup),
      minMarkup: Number(data.min_markup),
      mwkRounding: Number(data.mwk_rounding),
      rateUpdatedAt: data.rate_updated_at,
      updatedAt: data.updated_at,
      updatedBy: data.updated_by,
      costedPlans: count ?? 0,
      lastCostSync: latest?.synced_at ?? null,
    };
  });

const pricingUpdate = z.object({
  // Wide bounds catch typos (e.g. 415 or 41500) without blocking real moves.
  mwkPerUsd: z.number().min(1000).max(20000),
  markup: z.number().min(1).max(3),
  minMarkup: z.number().min(1).max(3),
  mwkRounding: z.number().int().min(1).max(1000),
}).refine((value) => value.markup >= value.minMarkup, { message: "Markup must be at least the floor", path: ["markup"] });

export const updateAdminPricing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => pricingUpdate.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin, email } = await assertAdmin(context);
    const { data: current, error: loadError } = await supabaseAdmin.from("pricing_settings").select("mwk_per_usd, markup, min_markup").eq("id", 1).single();
    if (loadError || !current) throw new Error("Unable to load pricing settings");
    const now = new Date().toISOString();
    const rateChanged = Number(current.mwk_per_usd) !== data.mwkPerUsd;
    const { error } = await supabaseAdmin.from("pricing_settings").update({
      mwk_per_usd: data.mwkPerUsd,
      markup: data.markup,
      min_markup: data.minMarkup,
      mwk_rounding: data.mwkRounding,
      updated_at: now,
      updated_by: email,
      ...(rateChanged ? { rate_updated_at: now } : {}),
    }).eq("id", 1);
    if (error) throw new Error("Unable to save pricing settings");

    // The rate applies instantly (prices are converted at request time). A new
    // markup or floor needs the USD prices recalculated from wholesale.
    let repriced = 0;
    if (Number(current.markup) !== data.markup || Number(current.min_markup) !== data.minMarkup) {
      const { data: count, error: repriceError } = await supabaseAdmin.rpc("reprice_plans", { _reason: `markup change by ${email}` });
      if (repriceError) throw new Error("Settings saved, but repricing failed");
      repriced = count ?? 0;
    }
    return { ok: true, repriced };
  });

export const syncAdminSupplierPrices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { syncSupplierPrices } = await import("./price-sync.server");
    return syncSupplierPrices();
  });

const csvImport = z.object({
  rows: z.array(z.object({ code: z.string().min(1).max(80), wholesaleUsd: z.number().positive().max(10000) })).min(1).max(10000),
});

export const importAdminPriceCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => csvImport.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { importPriceRows } = await import("./price-sync.server");
    return importPriceRows(data.rows, "esim_access_csv");
  });
