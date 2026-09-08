import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const APPROVED_ADMINS = new Set(["admin@takeflyt.com", "admin@weettah.com"]);

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data: userData, error: userError } = await context.supabase.auth.getUser();
  const email = userData.user?.email?.toLowerCase();
  if (userError || !email || !userData.user?.email_confirmed_at || !APPROVED_ADMINS.has(email)) {
    throw new Error("Forbidden");
  }
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error: roleError } = await supabaseAdmin.from("user_roles").upsert(
    { user_id: context.userId, role: "supplier_admin" },
    { onConflict: "user_id,role" },
  );
  if (roleError) throw new Error("Unable to verify admin access");
  return { email, supabaseAdmin };
}

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { email, supabaseAdmin } = await assertAdmin(context);
    const [{ data: orders, error }, { count: plans }] = await Promise.all([
      supabaseAdmin.from("payment_orders")
        .select("merchant_reference, country, amount_minor, currency, status, fulfillment_status, customer_email, created_at")
        .order("created_at", { ascending: false }).limit(8),
      supabaseAdmin.from("plans").select("id", { count: "exact", head: true }).eq("is_active", true),
    ]);
    if (error) throw new Error("Unable to load operations overview");
    const all = orders ?? [];
    return {
      email,
      activePlans: plans ?? 0,
      metrics: {
        pending: all.filter((item) => item.status === "pending").length,
        awaiting: all.filter((item) => item.status === "completed" && item.fulfillment_status === "not_started").length,
        provisioning: all.filter((item) => item.fulfillment_status === "provisioning").length,
        failed: all.filter((item) => item.fulfillment_status === "failed").length,
        ready: all.filter((item) => item.fulfillment_status === "ready").length,
      },
      recentOrders: all,
    };
  });

const orderFilter = z.object({
  query: z.string().max(120).default(""),
  status: z.enum(["all", "pending", "completed", "failed", "cancelled", "invalid"]).default("all"),
  fulfillment: z.enum(["all", "not_started", "provisioning", "ready", "failed"]).default("all"),
});

export const listAdminOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => orderFilter.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await assertAdmin(context);
    let query = supabaseAdmin.from("payment_orders")
      .select("merchant_reference, country, data_allowance, validity_days, amount_minor, currency, customer_email, customer_first_name, customer_last_name, customer_phone, status, payment_method, fulfillment_status, fulfillment_error, supplier_order_no, created_at, updated_at")
      .order("created_at", { ascending: false }).limit(100);
    if (data.status !== "all") query = query.eq("status", data.status);
    if (data.fulfillment !== "all") query = query.eq("fulfillment_status", data.fulfillment);
    if (data.query) query = query.or(`merchant_reference.ilike.%${data.query}%,customer_email.ilike.%${data.query}%,country.ilike.%${data.query}%`);
    const { data: orders, error } = await query;
    if (error) throw new Error("Unable to load orders");
    return orders;
  });

export const retryAdminFulfillment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ reference: z.string().min(8).max(100) }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await assertAdmin(context);
    const { data: order } = await supabaseAdmin.from("payment_orders")
      .select("merchant_reference, plan_id, status, fulfillment_status, supplier_order_no")
      .eq("merchant_reference", data.reference).maybeSingle();
    if (!order || order.status !== "completed") throw new Error("Only paid orders can be activated");
    if (order.fulfillment_status === "failed") {
      await supabaseAdmin.from("payment_orders").update({ fulfillment_status: "not_started", fulfillment_error: null }).eq("merchant_reference", data.reference);
      order.fulfillment_status = "not_started";
    }
    const { provisionPaidOrder } = await import("./esim-access.server");
    await provisionPaidOrder(order);
    return { ok: true };
  });

export const listAdminPlans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await assertAdmin(context);
    const { data, error } = await supabaseAdmin.from("plans").select("*").order("display_order");
    if (error) throw new Error("Unable to load packages");
    return data;
  });

const planUpdate = z.object({
  id: z.string().min(3).max(80),
  amountMinor: z.number().int().positive(),
  supplierPackageCode: z.string().max(160),
  isActive: z.boolean(),
  isPopular: z.boolean(),
  displayOrder: z.number().int().min(0).max(10000),
});

export const updateAdminPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => planUpdate.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await assertAdmin(context);
    const { error } = await supabaseAdmin.from("plans").update({
      amount_minor: data.amountMinor,
      supplier_package_code: data.supplierPackageCode || null,
      is_active: data.isActive,
      is_popular: data.isPopular,
      display_order: data.displayOrder,
    }).eq("id", data.id);
    if (error) throw new Error("Unable to save package");
    return { ok: true };
  });

export const getAdminIntegrations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await assertAdmin(context);
    const { data, error } = await supabaseAdmin.from("integration_settings")
      .select("id, provider_name, api_base_url, environment, notification_id, credential_hint, encrypted_credentials, updated_at")
      .order("id");
    if (error) throw new Error("Unable to load integrations");
    return data.map(({ encrypted_credentials, ...item }) => ({ ...item, configured: Boolean(encrypted_credentials) }));
  });

const integrationUpdate = z.object({
  id: z.enum(["esim_access", "pesapal"]),
  providerName: z.string().min(2).max(80),
  apiBaseUrl: z.string().url().max(300),
  environment: z.enum(["test", "live"]),
  notificationId: z.string().max(200),
  primarySecret: z.string().max(1000),
  secondarySecret: z.string().max(1000),
});

export const updateAdminIntegration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => integrationUpdate.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await assertAdmin(context);
    const { decryptCredentials, encryptCredentials } = await import("./integration-settings.server");
    const { data: current } = await supabaseAdmin.from("integration_settings")
      .select("encrypted_credentials").eq("id", data.id).maybeSingle();
    const credentials = await decryptCredentials(current?.encrypted_credentials ?? null);
    if (data.primarySecret) credentials[data.id === "esim_access" ? "accessCode" : "consumerKey"] = data.primarySecret;
    if (data.secondarySecret) credentials["consumerSecret"] = data.secondarySecret;
    const primary = credentials[data.id === "esim_access" ? "accessCode" : "consumerKey"];
    const encrypted = Object.keys(credentials).length ? await encryptCredentials(credentials) : null;
    const { error } = await supabaseAdmin.from("integration_settings").update({
      provider_name: data.providerName,
      api_base_url: data.apiBaseUrl,
      environment: data.environment,
      notification_id: data.notificationId || null,
      encrypted_credentials: encrypted,
      credential_hint: primary ? `••••${primary.slice(-4)}` : null,
    }).eq("id", data.id);
    if (error) throw new Error("Unable to save integration");
    return { ok: true };
  });