import { decodeCharge, verifyTransaction, type PaymentDetails } from "./paychangu.server";

export type ConfirmationResult =
  | { state: "paid"; activationToken: string }
  | { state: "pending" }
  | { state: "failed" }
  | { state: "not_found" };

// Shared by the customer return page and the PayChangu webhook. Idempotent:
// safe to call any number of times for the same order.
export async function confirmPaychanguOrder(reference: string): Promise<ConfirmationResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: order, error } = await supabaseAdmin
    .from("payment_orders")
    .select("merchant_reference, plan_id, status, fulfillment_status, supplier_order_no, activation_token, payment_method, provider_status_description")
    .eq("merchant_reference", reference)
    .maybeSingle();
  if (error || !order) return { state: "not_found" };

  if (order.status === "completed") {
    await provisionQuietly(order);
    return { state: "paid", activationToken: order.activation_token };
  }
  if (order.payment_method !== "paychangu") return { state: "pending" };
  if (order.status !== "pending") return { state: "failed" };

  const expected = decodeCharge(order.provider_status_description);
  if (!expected) return { state: "pending" };

  const transaction = await verifyTransaction(reference);
  if (!transaction) return { state: "pending" };
  if (transaction.status === "failed") {
    await supabaseAdmin.from("payment_orders").update({ status: "failed" })
      .eq("merchant_reference", reference).eq("status", "pending");
    return { state: "failed" };
  }
  if (transaction.status !== "success") return { state: "pending" };

  const amountOk = Number.isFinite(transaction.amount) && transaction.amount + 0.001 >= expected.amount;
  if (transaction.txRef !== reference || transaction.currency !== expected.currency || !amountOk) {
    // Paid, but not what we asked for. Hold for a human instead of releasing an eSIM.
    await supabaseAdmin.from("payment_orders").update({
      status: "invalid",
      fulfillment_error: `Payment mismatch: got ${transaction.currency} ${transaction.amount}, expected ${expected.currency} ${expected.amount}`,
    }).eq("merchant_reference", reference).eq("status", "pending");
    return { state: "failed" };
  }

  // Conditional update so two concurrent confirmations can't both win.
  const details: PaymentDetails = {
    charge: expected,
    method: transaction.method,
    account: transaction.account,
    fee: transaction.fee,
  };
  await supabaseAdmin.from("payment_orders").update({
    status: "completed",
    payment_method: transaction.method,
    confirmation_code: transaction.reference,
    provider_status_description: JSON.stringify(details),
  }).eq("merchant_reference", reference).eq("status", "pending");

  await provisionQuietly({ ...order, status: "completed" });
  return { state: "paid", activationToken: order.activation_token };
}

async function provisionQuietly(order: {
  merchant_reference: string;
  plan_id: string | null;
  fulfillment_status: string;
  supplier_order_no: string | null;
}) {
  if (order.fulfillment_status === "ready") return;
  try {
    const { provisionPaidOrder } = await import("./esim-access.server");
    await provisionPaidOrder(order);
  } catch (error) {
    // The activation page retries; admin can also retry from Orders.
    console.error("eSIM provisioning after PayChangu payment failed", error);
  }
}
