import { getIntegrationSettings } from "./integration-settings.server";

type Customer = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

type PesapalStatus = {
  amount?: number;
  currency?: string;
  payment_method?: string;
  confirmation_code?: string;
  payment_status_description?: string;
  status_code?: number;
  merchant_reference?: string;
};

async function getConfiguration() {
  try {
    const settings = await getIntegrationSettings("pesapal");
    return {
      baseUrl: settings.api_base_url || (settings.environment === "live" ? "https://pay.pesapal.com/v3/api" : "https://cybqa.pesapal.com/pesapalv3/api"),
      consumerKey: settings.credentials["consumerKey"],
      consumerSecret: settings.credentials["consumerSecret"],
      notificationId: settings.notification_id,
    };
  } catch {
    return {
      baseUrl: process.env["PESAPAL_ENV"] === "live" ? "https://pay.pesapal.com/v3/api" : "https://cybqa.pesapal.com/pesapalv3/api",
      consumerKey: process.env["PESAPAL_CONSUMER_KEY"],
      consumerSecret: process.env["PESAPAL_CONSUMER_SECRET"],
      notificationId: process.env["PESAPAL_NOTIFICATION_ID"] || null,
    };
  }
}

async function getToken() {
  const { baseUrl, consumerKey, consumerSecret } = await getConfiguration();
  if (!consumerKey || !consumerSecret) throw new Error("PESAPAL_NOT_CONFIGURED");

  const response = await fetch(`${baseUrl}/Auth/RequestToken`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ consumer_key: consumerKey, consumer_secret: consumerSecret }),
  });
  const result = (await response.json()) as { token?: string; message?: string };
  if (!response.ok || !result.token) throw new Error(result.message || "Unable to connect to Pesapal");
  return result.token;
}

async function getNotificationId(token: string, origin: string) {
  const { baseUrl, notificationId: configuredId } = await getConfiguration();
  if (configuredId) return configuredId;

  const response = await fetch(`${baseUrl}/URLSetup/RegisterIPN`, {
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
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: plan } = await supabaseAdmin.from("plans")
    .select("id, country, data_allowance, validity_days, amount_minor, currency")
    .eq("id", planId).eq("is_active", true).maybeSingle();
  if (!plan) throw new Error("PLAN_NOT_FOUND");

  const token = await getToken();
  const notificationId = await getNotificationId(token, origin);
  const reference = `WEETTAH-${crypto.randomUUID()}`;

  const { error: insertError } = await supabaseAdmin.from("payment_orders").insert({
    merchant_reference: reference,
    plan_id: plan.id,
    country: plan.country,
    data_allowance: plan.data_allowance,
    validity_days: plan.validity_days,
    amount_minor: plan.amount_minor,
    currency: plan.currency,
    customer_email: customer.email,
    customer_first_name: customer.firstName,
    customer_last_name: customer.lastName,
    customer_phone: customer.phone,
  });
  if (insertError) throw new Error("Unable to create your order");

  const { baseUrl } = await getConfiguration();
  const response = await fetch(`${baseUrl}/Transactions/SubmitOrderRequest`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      id: reference,
      currency: plan.currency,
      amount: plan.amount_minor / 100,
      description: `${plan.country} ${plan.data_allowance} travel eSIM`,
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
  const { baseUrl } = await getConfiguration();
  const response = await fetch(
    `${baseUrl}/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(orderTrackingId)}`,
    { headers: { Accept: "application/json", Authorization: `Bearer ${token}` } },
  );
  const result = (await response.json()) as PesapalStatus;
  if (!response.ok || !result.merchant_reference) throw new Error("Unable to verify this payment");
  if (merchantReference && result.merchant_reference !== merchantReference) throw new Error("Payment reference mismatch");

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: order } = await supabaseAdmin
    .from("payment_orders")
    .select("merchant_reference, plan_id, country, data_allowance, validity_days, amount_minor, currency, customer_email, fulfillment_status, supplier_order_no, activation_token")
    .eq("merchant_reference", result.merchant_reference)
    .eq("pesapal_order_tracking_id", orderTrackingId)
    .maybeSingle();
  if (!order) throw new Error("Order not found");
  if (result.currency !== order.currency || Math.round((result.amount ?? -1) * 100) !== order.amount_minor) {
    throw new Error("Payment amount mismatch");
  }

  const status = mapStatus(result.status_code);
  const { error: updateError } = await supabaseAdmin.from("payment_orders").update({
    status,
    payment_method: result.payment_method || null,
    confirmation_code: result.confirmation_code || null,
    provider_status_description: result.payment_status_description || null,
  }).eq("merchant_reference", order.merchant_reference);
  if (updateError) throw new Error("Unable to save payment status");

  if (status === "completed" && order.fulfillment_status !== "ready") {
    try {
      const { provisionPaidOrder } = await import("./esim-access.server");
      await provisionPaidOrder(order);
    } catch (error) {
      if (!(error instanceof Error && error.message === "ESIM_ACCESS_NOT_CONFIGURED")) console.error("eSIM fulfillment failed", error);
    }
  }

  const { data: fulfilledOrder } = await supabaseAdmin.from("payment_orders")
    .select("fulfillment_status")
    .eq("merchant_reference", order.merchant_reference)
    .maybeSingle();

  return {
    status,
    country: order.country,
    data: order.data_allowance,
    days: order.validity_days,
    price: new Intl.NumberFormat("en", { style: "currency", currency: order.currency }).format(order.amount_minor / 100),
    email: order.customer_email.replace(/(^.).+(@.*$)/, "$1•••$2"),
    paymentMethod: result.payment_method || null,
    reference: order.merchant_reference,
    fulfillmentStatus: fulfilledOrder?.fulfillment_status || order.fulfillment_status,
    activationToken: order.activation_token,
  };
}