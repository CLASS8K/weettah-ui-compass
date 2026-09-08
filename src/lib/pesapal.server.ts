import { plans } from "@/components/site/data";

type Customer = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

type PesapalStatus = {
  payment_method?: string;
  confirmation_code?: string;
  payment_status_description?: string;
  status_code?: number;
  merchant_reference?: string;
};

const getBaseUrl = () =>
  process.env["PESAPAL_ENV"] === "live"
    ? "https://pay.pesapal.com/v3/api"
    : "https://cybqa.pesapal.com/pesapalv3/api";

async function getToken() {
  const consumerKey = process.env["PESAPAL_CONSUMER_KEY"];
  const consumerSecret = process.env["PESAPAL_CONSUMER_SECRET"];
  if (!consumerKey || !consumerSecret) throw new Error("PESAPAL_NOT_CONFIGURED");

  const response = await fetch(`${getBaseUrl()}/Auth/RequestToken`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ consumer_key: consumerKey, consumer_secret: consumerSecret }),
  });
  const result = (await response.json()) as { token?: string; message?: string };
  if (!response.ok || !result.token) throw new Error(result.message || "Unable to connect to Pesapal");
  return result.token;
}

async function getNotificationId(token: string, origin: string) {
  const configuredId = process.env["PESAPAL_NOTIFICATION_ID"];
  if (configuredId) return configuredId;

  const response = await fetch(`${getBaseUrl()}/URLSetup/RegisterIPN`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      url: `${origin}/api/public/pesapal/ipn`,
      ipn_notification_type: "GET",
    }),
  });
  const result = (await response.json()) as { ipn_id?: string; message?: string };
  if (!response.ok || !result.ipn_id) throw new Error(result.message || "Unable to register payment notifications");
  return result.ipn_id;
}

export async function createPesapalCheckout(planId: string, customer: Customer, origin: string) {
  const plan = plans.find((item) => item.id === planId);
  if (!plan) throw new Error("PLAN_NOT_FOUND");

  const token = await getToken();
  const notificationId = await getNotificationId(token, origin);
  const reference = `WEETTAH-${crypto.randomUUID()}`;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { error: insertError } = await supabaseAdmin.from("payment_orders").insert({
    merchant_reference: reference,
    country: plan.country,
    data_allowance: plan.data,
    validity_days: plan.days,
    amount_minor: plan.amountMinor,
    currency: "USD",
    customer_email: customer.email,
    customer_first_name: customer.firstName,
    customer_last_name: customer.lastName,
    customer_phone: customer.phone,
  });
  if (insertError) throw new Error("Unable to create your order");

  const response = await fetch(`${getBaseUrl()}/Transactions/SubmitOrderRequest`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      id: reference,
      currency: "USD",
      amount: plan.amountMinor / 100,
      description: `${plan.country} ${plan.data} travel eSIM`,
      callback_url: `${origin}/checkout`,
      cancellation_url: `${origin}/checkout?cancelled=true&reference=${encodeURIComponent(reference)}`,
      notification_id: notificationId,
      billing_address: {
        email_address: customer.email,
        phone_number: customer.phone,
        country_code: "MW",
        first_name: customer.firstName,
        last_name: customer.lastName,
      },
    }),
  });
  const result = (await response.json()) as { redirect_url?: string; order_tracking_id?: string; message?: string };
  if (!response.ok || !result.redirect_url || !result.order_tracking_id) {
    await supabaseAdmin.from("payment_orders").update({ status: "failed" }).eq("merchant_reference", reference);
    throw new Error(result.message || "Pesapal could not start this payment");
  }

  await supabaseAdmin
    .from("payment_orders")
    .update({ pesapal_order_tracking_id: result.order_tracking_id })
    .eq("merchant_reference", reference);

  return { redirectUrl: result.redirect_url };
}

function mapStatus(code?: number) {
  if (code === 1) return "completed";
  if (code === 2) return "failed";
  if (code === 3) return "cancelled";
  if (code === 0) return "invalid";
  return "pending";
}

export async function verifyPesapalOrder(orderTrackingId: string, merchantReference?: string) {
  const token = await getToken();
  const response = await fetch(
    `${getBaseUrl()}/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(orderTrackingId)}`,
    { headers: { Accept: "application/json", Authorization: `Bearer ${token}` } },
  );
  const result = (await response.json()) as PesapalStatus;
  if (!response.ok || !result.merchant_reference) throw new Error("Unable to verify this payment");
  if (merchantReference && result.merchant_reference !== merchantReference) throw new Error("Payment reference mismatch");

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: order } = await supabaseAdmin
    .from("payment_orders")
    .select("merchant_reference, country, data_allowance, validity_days, amount_minor, currency, customer_email")
    .eq("merchant_reference", result.merchant_reference)
    .eq("pesapal_order_tracking_id", orderTrackingId)
    .maybeSingle();
  if (!order) throw new Error("Order not found");

  const status = mapStatus(result.status_code);
  await supabaseAdmin.from("payment_orders").update({
    status,
    payment_method: result.payment_method || null,
    confirmation_code: result.confirmation_code || null,
    provider_status_description: result.payment_status_description || null,
  }).eq("merchant_reference", order.merchant_reference);

  return {
    status,
    country: order.country,
    data: order.data_allowance,
    days: order.validity_days,
    price: new Intl.NumberFormat("en", { style: "currency", currency: order.currency }).format(order.amount_minor / 100),
    email: order.customer_email.replace(/(^.).+(@.*$)/, "$1•••$2"),
    paymentMethod: result.payment_method || null,
    reference: order.merchant_reference,
  };
}