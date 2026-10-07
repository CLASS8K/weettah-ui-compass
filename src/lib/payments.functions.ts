import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const checkoutSchema = z.object({
  planId: z.string().min(1),
  firstName: z.string().trim().min(2).max(60),
  lastName: z.string().trim().min(2).max(60),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(7).max(24).regex(/^\+?[0-9 ()-]+$/),
  // "mwk": mobile money and Malawian cards, charged in kwacha.
  // "usd": international Visa/Mastercard, charged in US dollars (if enabled).
  payWith: z.enum(["mwk", "usd"]).default("mwk"),
});

// Records the order, then hands the customer to PayChangu checkout. If PayChangu
// isn't configured (no secret key), the order is saved as a manual reservation.
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

    const { paychanguConfigured, computeCharge, encodeCharge, initiateCheckout } = await import("./paychangu.server");
    if (!paychanguConfigured()) return { ok: true as const, reference, checkoutUrl: null };

    const { getPricingSettings } = await import("./pricing.server");
    const pricing = await getPricingSettings();
    // USD only for card buyers who chose it, and only while the option is on;
    // otherwise everyone pays the kwacha price shown on the site.
    const charge = data.payWith === "usd" && pricing?.cardUsdEnabled && plan.currency === "USD"
      ? { amount: plan.amount_minor / 100, currency: "USD" as const }
      : computeCharge(plan.amount_minor, plan.currency, pricing);
    const { error: chargeError } = await supabaseAdmin.from("payment_orders").update({
      payment_method: "paychangu",
      provider_status_description: encodeCharge(charge),
    }).eq("merchant_reference", reference);
    if (chargeError) throw new Error("Unable to start payment");

    try {
      const checkoutUrl = await initiateCheckout({
        txRef: reference,
        charge,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        title: "Weettah eSIM",
        description: `${plan.data_allowance} · ${plan.validity_days} days`,
      });
      return { ok: true as const, reference, checkoutUrl };
    } catch (initError) {
      console.error("PayChangu checkout could not start", initError);
      await supabaseAdmin.from("payment_orders").update({
        status: "cancelled",
        fulfillment_error: initError instanceof Error ? initError.message.slice(0, 300) : "Checkout failed to start",
      }).eq("merchant_reference", reference);
      throw new Error("Unable to start payment");
    }
  });

const confirmSchema = z.object({ reference: z.string().trim().regex(/^WEETTAH-[0-9a-f-]{36}$/i) });

// Called by /payment/complete after PayChangu redirects back.
export const confirmPayment = createServerFn({ method: "POST" })
  .inputValidator((input) => confirmSchema.parse(input))
  .handler(async ({ data }) => {
    const { paychanguConfigured } = await import("./paychangu.server");
    if (!paychanguConfigured()) return { state: "not_found" as const };
    const { confirmPaychanguOrder } = await import("./payment-confirmation.server");
    return confirmPaychanguOrder(data.reference);
  });

// Lets pages describe the checkout that is actually live.
export const getPaymentMode = createServerFn({ method: "GET" }).handler(async () => {
  const { paychanguConfigured } = await import("./paychangu.server");
  return { online: paychanguConfigured() };
});
