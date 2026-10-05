import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AccountOrder = {
  reference: string;
  country: string;
  data: string;
  days: number;
  price: string;
  purchasedAt: string;
  paymentStatus: string;
  esimStatus: "ready" | "preparing" | "not_paid" | "attention";
  activationUrl: string | null;
};

export type AccountSummary = {
  email: string;
  orders: AccountOrder[];
};

export const getMyAccount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AccountSummary> => {
    const { data: userData, error: userError } = await context.supabase.auth.getUser();
    const email = userData.user?.email?.trim().toLowerCase();
    if (userError || !email || !userData.user?.email_confirmed_at) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Exact, case-insensitive match on the signed-in address — the SQL function
    // compares with lower()/btrim(), never a pattern match.
    const { data, error } = await supabaseAdmin.rpc("orders_for_email", { _email: email });
    if (error) throw new Error("Unable to load your orders");

    const orders = (data ?? []).map((row): AccountOrder => {
      const paid = row.status === "completed";
      const esimStatus = !paid
        ? ("not_paid" as const)
        : row.fulfillment_status === "ready"
          ? ("ready" as const)
          : row.fulfillment_status === "failed"
            ? ("attention" as const)
            : ("preparing" as const);
      return {
        reference: row.merchant_reference,
        country: row.country,
        data: row.data_allowance,
        days: row.validity_days,
        price: new Intl.NumberFormat("en", { style: "currency", currency: row.currency }).format(row.amount_minor / 100),
        purchasedAt: row.created_at,
        paymentStatus: paid ? "Paid" : row.status === "failed" ? "Payment failed" : "Awaiting payment",
        esimStatus,
        activationUrl: esimStatus === "ready" && row.activation_token ? `/activate?token=${row.activation_token}` : null,
      };
    });

    return { email, orders };
  });
