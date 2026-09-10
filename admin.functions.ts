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
  const { data: role, error: roleError } = await supabaseAdmin.from("user_roles")
    .select("id")
    .eq("user_id", context.userId)
    .eq("role", "supplier_admin")
    .maybeSingle();
  if (roleError || !role) throw new Error("Forbidden");
  return { email, supabaseAdmin };
}

export const claimAdminAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: userData, error: userError } = await context.supabase.auth.getUser();
    const email = userData.user?.email?.toLowerCase();
    if (userError || !email || !userData.user?.email_confirmed_at || !APPROVED_ADMINS.has(email)) {
      throw new Error("Forbidden");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("user_roles").upsert(
      { user_id: context.userId, role: "supplier_admin" },
      { onConflict: "user_id,role" },
    );
    if (error) throw new Error("Unable to grant admin access");
    return { ok: true };
  });

export const verifyAdminAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { email } = await assertAdmin(context);
    return { email };
  });

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { email, supabaseAdmin } = await assertAdmin(context);
    const [{ data: recentOrders, error }, { data: statuses }, { count: plans }] = await Promise.all([
      supabaseAdmin.from("payment_orders")
        .select("merchant_reference, country, amount_minor, currency, status, fulfillment_status, customer_email, created_at")
        .order("created_at", { ascending: false }).limit(8),
      supabaseAdmin.from("payment_orders").select("status, fulfillment_status"),
      supabaseAdmin.from("plans").select("id", { count: "exact", head: true }).eq("is_active", true),
    ]);
    if (error) throw new Error("Unable to load operations overview");
    const all = statuses ?? [];
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
      recentOrders: recentOrders ?? [],
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
    const safeQuery = data.query.replace(/[^a-zA-Z0-9@._+\- ]/g, "").trim();
    if (safeQuery) query = query.or(`merchant_reference.ilike.%${safeQuery}%,customer_email.ilike.%${safeQuery}%,country.ilike.%${safeQuery}%`);
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
      const { data: claimed, error } = await supabaseAdmin.from("payment_orders")
        .update({ fulfillment_status: "not_started", fulfillment_error: null })
        .eq("merchant_reference", data.reference)
        .eq("fulfillment_status", "failed")
        .select("merchant_reference")
        .maybeSingle();
      if (error) throw new Error("Unable to retry activation");
      if (!claimed) return { ok: true };
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

function approvedApiBase(id: "esim_access" | "pesapal", environment: "test" | "live", value: string) {
  const normalized = value.replace(/\/+$/, "");
  const allowed = id === "esim_access"
    ? ["https://api.esimaccess.com/api/v1/open"]
    : environment === "live"
      ? ["https://pay.pesapal.com/v3/api"]
      : ["https://cybqa.pesapal.com/pesapalv3/api"];
  if (!allowed.includes(normalized)) throw new Error("Use the official provider API address for this environment");
  return normalized;
}

export const updateAdminIntegration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => integrationUpdate.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await assertAdmin(context);
    const apiBaseUrl = approvedApiBase(data.id, data.environment, data.apiBaseUrl);
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
      api_base_url: apiBaseUrl,
      environment: data.environment,
      notification_id: data.notificationId || null,
      encrypted_credentials: encrypted,
      credential_hint: primary ? `••••${primary.slice(-4)}` : null,
    }).eq("id", data.id);
    if (error) throw new Error("Unable to save integration");
    return { ok: true };
  });
const ipnInput = z.object({ url: z.string().url().max(300) });

export const registerAdminIpn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => ipnInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const parsed = new URL(data.url);
    const allowedHost = parsed.hostname === "weettah.com" || parsed.hostname.endsWith(".weettah.com") || parsed.hostname.endsWith(".lovable.app");
    if (parsed.protocol !== "https:" || !allowedHost || parsed.pathname !== "/api/public/pesapal/ipn") {
      throw new Error("Use your live site address ending in /api/public/pesapal/ipn");
    }
    const { registerPesapalIpn } = await import("./pesapal.server");
    return registerPesapalIpn(parsed.toString());
  });

type ReportOrder = {
  country: string;
  amount_minor: number;
  currency: string;
  status: string;
  fulfillment_status: string;
  payment_method: string | null;
  created_at: string;
};

function groupTotals(rows: ReportOrder[], key: (row: ReportOrder) => string) {
  const totals = new Map<string, { label: string; orders: number; revenueMinor: number }>();
  for (const row of rows) {
    const label = key(row) || "Unknown";
    const entry = totals.get(label) ?? { label, orders: 0, revenueMinor: 0 };
    entry.orders += 1;
    entry.revenueMinor += row.amount_minor;
    totals.set(label, entry);
  }
  return [...totals.values()].sort((a, b) => b.revenueMinor - a.revenueMinor);
}

export const getAdminReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ days: z.number().int().min(7).max(365).default(30) }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await assertAdmin(context);
    const since = new Date(Date.now() - data.days * 86400000).toISOString();
    const { data: rows, error } = await supabaseAdmin.from("payment_orders")
      .select("country, amount_minor, currency, status, fulfillment_status, payment_method, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: true })
      .limit(5000);
    if (error) throw new Error("Unable to build the report");
    const all = (rows ?? []) as ReportOrder[];
    const paid = all.filter((row) => row.status === "completed");
    const currency = paid[0]?.currency ?? all[0]?.currency ?? "USD";
    const daily = new Map<string, { day: string; orders: number; revenueMinor: number }>();
    for (let index = data.days - 1; index >= 0; index -= 1) {
      const day = new Date(Date.now() - index * 86400000).toISOString().slice(0, 10);
      daily.set(day, { day, orders: 0, revenueMinor: 0 });
    }
    for (const row of paid) {
      const day = row.created_at.slice(0, 10);
      const entry = daily.get(day);
      if (entry) { entry.orders += 1; entry.revenueMinor += row.amount_minor; }
    }
    const ready = paid.filter((row) => row.fulfillment_status === "ready").length;
    return {
      days: data.days,
      currency,
      totals: {
        orders: all.length,
        paidOrders: paid.length,
        revenueMinor: paid.reduce((sum, row) => sum + row.amount_minor, 0),
        averageMinor: paid.length ? Math.round(paid.reduce((sum, row) => sum + row.amount_minor, 0) / paid.length) : 0,
        paymentRate: all.length ? Math.round((paid.length / all.length) * 100) : 0,
        activationRate: paid.length ? Math.round((ready / paid.length) * 100) : 0,
      },
      daily: [...daily.values()],
      byCountry: groupTotals(paid, (row) => row.country).slice(0, 8),
      byMethod: groupTotals(paid, (row) => row.payment_method ?? "Unknown").slice(0, 8),
    };
  });

function csvCell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export const exportAdminOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => orderFilter.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await assertAdmin(context);
    let query = supabaseAdmin.from("payment_orders")
      .select("merchant_reference, created_at, updated_at, country, data_allowance, validity_days, amount_minor, currency, status, payment_method, confirmation_code, fulfillment_status, fulfillment_error, supplier_order_no, iccid, customer_first_name, customer_last_name, customer_email, customer_phone")
      .order("created_at", { ascending: false }).limit(5000);
    if (data.status !== "all") query = query.eq("status", data.status);
    if (data.fulfillment !== "all") query = query.eq("fulfillment_status", data.fulfillment);
    const safeQuery = data.query.replace(/[^a-zA-Z0-9@._+\- ]/g, "").trim();
    if (safeQuery) query = query.or(`merchant_reference.ilike.%${safeQuery}%,customer_email.ilike.%${safeQuery}%,country.ilike.%${safeQuery}%`);
    const { data: orders, error } = await query;
    if (error) throw new Error("Unable to export orders");
    const headers = ["Reference", "Created", "Updated", "Country", "Data", "Days", "Amount", "Currency", "Payment status", "Payment method", "Confirmation code", "Activation status", "Activation error", "Supplier order", "ICCID", "First name", "Last name", "Email", "Phone"];
    const lines = [headers.join(",")];
    for (const order of orders ?? []) {
      lines.push([
        order.merchant_reference, order.created_at, order.updated_at, order.country, order.data_allowance, order.validity_days,
        (order.amount_minor / 100).toFixed(2), order.currency, order.status, order.payment_method, order.confirmation_code,
        order.fulfillment_status, order.fulfillment_error, order.supplier_order_no, order.iccid,
        order.customer_first_name, order.customer_last_name, order.customer_email, order.customer_phone,
      ].map(csvCell).join(","));
    }
    return { filename: `weettah-orders-${new Date().toISOString().slice(0, 10)}.csv`, csv: lines.join("\n"), rows: orders?.length ?? 0 };
  });

export const listAdminDevices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await assertAdmin(context);
    const { data, error } = await supabaseAdmin.from("supported_devices").select("*").order("display_order");
    if (error) throw new Error("Unable to load devices");
    return data;
  });

const deviceInput = z.object({
  id: z.string().uuid().optional(),
  brand: z.string().min(1).max(80),
  models: z.string().min(1).max(1200),
  isActive: z.boolean(),
  displayOrder: z.number().int().min(0).max(10000),
});

export const saveAdminDevice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => deviceInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await assertAdmin(context);
    const row = { brand: data.brand.trim(), models: data.models.trim(), is_active: data.isActive, display_order: data.displayOrder };
    const { error } = data.id
      ? await supabaseAdmin.from("supported_devices").update(row).eq("id", data.id)
      : await supabaseAdmin.from("supported_devices").insert(row);
    if (error) throw new Error("Unable to save device");
    return { ok: true };
  });

export const deleteAdminDevice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await assertAdmin(context);
    const { error } = await supabaseAdmin.from("supported_devices").delete().eq("id", data.id);
    if (error) throw new Error("Unable to remove device");
    return { ok: true };
  });

export const listAdminDestinationContent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await assertAdmin(context);
    const { data, error } = await supabaseAdmin.from("destination_content").select("*").order("country");
    if (error) throw new Error("Unable to load destination guides");
    return data;
  });

const guideInput = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/),
  country: z.string().min(1).max(80),
  intro: z.string().max(4000),
  coverage: z.string().max(4000),
  capital: z.string().max(120),
  currency: z.string().max(120),
  languages: z.string().max(200),
  powerPlug: z.string().max(120),
  emergencyNumber: z.string().max(120),
  bestTime: z.string().max(200),
  tips: z.array(z.string().max(400)).max(10),
  faqs: z.array(z.object({ q: z.string().min(1).max(200), a: z.string().min(1).max(1200) })).max(10),
  isPublished: z.boolean(),
});

export const saveAdminDestinationContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => guideInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await assertAdmin(context);
    const row = {
      slug: data.slug.trim(),
      country: data.country.trim(),
      intro: data.intro.trim(),
      coverage: data.coverage.trim(),
      capital: data.capital.trim(),
      currency: data.currency.trim(),
      languages: data.languages.trim(),
      power_plug: data.powerPlug.trim(),
      emergency_number: data.emergencyNumber.trim(),
      best_time: data.bestTime.trim(),
      tips: data.tips.map((tip) => tip.trim()).filter(Boolean),
      local_faqs: data.faqs,
      is_published: data.isPublished,
    };
    const { error } = data.id
      ? await supabaseAdmin.from("destination_content").update(row).eq("id", data.id)
      : await supabaseAdmin.from("destination_content").insert(row);
    if (error) throw new Error("Unable to save destination guide");
    return { ok: true };
  });

export const deleteAdminDestinationContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await assertAdmin(context);
    const { error } = await supabaseAdmin.from("destination_content").delete().eq("id", data.id);
    if (error) throw new Error("Unable to remove destination guide");
    return { ok: true };
  });
