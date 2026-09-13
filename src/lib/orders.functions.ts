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
        "merchant_reference, country, data_allowance, validity_days, amount_minor, currency, created_at, status, fulfillment_status, activation_token, customer_email",
      )
      .eq("merchant_reference", data.reference)
      .maybeSingle();

    if (error) throw new Error("Unable to look up this order");
    // Exact, case-insensitive email match — never ILIKE, so wildcard
    // characters in user input carry no special meaning.
    if (!row || row.customer_email.trim().toLowerCase() !== data.email.toLowerCase()) return { found: false };

    const paid = row.status === "COMPLETED";
    const esimStatus = !paid
      ? ("not_paid" as const)
      : row.fulfillment_status === "fulfilled"
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
      paymentStatus: paid ? "Paid" : row.status === "FAILED" ? "Payment failed" : "Awaiting payment",
      esimStatus,
      activationUrl: esimStatus === "ready" && row.activation_token ? `/activate?token=${row.activation_token}` : null,
    };
  });
