import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const checkoutSchema = z.object({
  planId: z.string().min(1),
  firstName: z.string().trim().min(2).max(60),
  lastName: z.string().trim().min(2).max(60),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(7).max(24).regex(/^\+?[0-9 ()-]+$/),
});

// Payment gateways are not connected yet. Orders are recorded as pending
// reservations so nothing is lost, and the team follows up manually.
export const requestOrder = createServerFn({ method: "POST" })
  .inputValidator((input) => checkoutSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: plan } = await supabaseAdmin
      .from("plans")
      .select("id, country, data_allowance, validity_days, amount_minor, currency")
      .eq("id", data.planId)
      .eq("is_active", true)
      .maybeSingle();
    if (!plan) throw new Error("This plan is no longer available");

    const reference = `WEETTAH-${crypto.randomUUID()}`;
    const { error } = await supabaseAdmin.from("payment_orders").insert({
      merchant_reference: reference,
      plan_id: plan.id,
      country: plan.country,
      data_allowance: plan.data_allowance,
      validity_days: plan.validity_days,
      amount_minor: plan.amount_minor,
      currency: plan.currency,
      customer_email: data.email,
      customer_first_name: data.firstName,
      customer_last_name: data.lastName,
      customer_phone: data.phone,
    });
    if (error) throw new Error("Unable to save your request");

    return { ok: true as const, reference };
  });
