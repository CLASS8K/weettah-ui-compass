import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const lookupSchema = z.object({
  email: z.string().trim().email().max(200),
  reference: z.string().trim().min(4).max(64),
});

export type OrderLookupResult =
  | { found: false }
  | {
      found: true;
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

export const lookupOrder = createServerFn({ method: "POST" })
  .inputValidator((input) => lookupSchema.parse(input))
  .handler(async ({ data }): Promise<OrderLookupResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("payment_orders")
      .select(
        "merchant_reference, country, data_allowance, validity_days, amount_minor, currency, created_at, status, fulfillment_status, activation_token, customer_email, payment_method",
      )
      .eq("merchant_reference", data.reference)
      .maybeSingle();

    if (error) throw new Error("Unable to look up this order");
    // Exact, case-insensitive email match — never ILIKE, so wildcard
    // characters in user input carry no special meaning.
    if (!row || row.customer_email.trim().toLowerCase() !== data.email.toLowerCase()) return { found: false };

    // Customer paid but closed the tab before confirmation (common with mobile
    // money). Re-verify with PayChangu now instead of showing "Awaiting payment".
    if (row.status === "pending" && row.payment_method === "paychangu") {
      try {
        const { confirmPaychanguOrder } = await import("./payment-confirmation.server");
        const result = await confirmPaychanguOrder(row.merchant_reference);
        if (result.state !== "pending") {
          const { data: refreshed } = await supabaseAdmin
            .from("payment_orders")
            .select("status, fulfillment_status, activation_token")
            .eq("merchant_reference", row.merchant_reference)
            .maybeSingle();
          if (refreshed) Object.assign(row, refreshed);
        }
      } catch (confirmError) {
        console.error("Order lookup could not re-verify payment", confirmError);
      }
    }

    const paid = row.status === "completed";
    const esimStatus = !paid
      ? ("not_paid" as const)
      : row.fulfillment_status === "ready"
        ? ("ready" as const)
        : row.fulfillment_status === "failed"
          ? ("attention" as const)
          : ("preparing" as const);

    return {
      found: true,
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
