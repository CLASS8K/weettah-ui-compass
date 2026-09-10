import { createHmac } from "node:crypto";
import { getIntegrationSettings } from "./integration-settings.server";

type FulfillmentOrder = {
  merchant_reference: string;
  plan_id: string | null;
  fulfillment_status: string;
  supplier_order_no: string | null;
};

type SupplierResponse<T> = {
  success: boolean;
  errorCode?: string | null;
  errorMsg?: string | null;
  errorMessage?: string | null;
  obj?: T;
};

type SupplierProfile = {
  esimTranNo?: string;
  iccid?: string;
  ac?: string;
  qrCodeUrl?: string;
  apn?: string;
};

async function getConfiguration() {
  try {
    const settings = await getIntegrationSettings("esim_access");
    const accessCode = settings.credentials["accessCode"];
    if (!accessCode) throw new Error("ESIM_ACCESS_NOT_CONFIGURED");
    return { accessCode, apiBase: settings.api_base_url || "https://api.esimaccess.com/api/v1/open" };
  } catch {
    const accessCode = process.env["ESIM_ACCESS_CODE"];
    if (!accessCode) throw new Error("ESIM_ACCESS_NOT_CONFIGURED");
    return { accessCode, apiBase: "https://api.esimaccess.com/api/v1/open" };
  }
}

async function supplierRequest<T>(path: string, payload: Record<string, unknown>) {
  const { accessCode, apiBase } = await getConfiguration();
  const body = JSON.stringify(payload);
  const timestamp = Date.now().toString();
  const requestId = crypto.randomUUID();
  const signature = createHmac("sha256", accessCode)
    .update(`${timestamp}${requestId}${accessCode}${body}`)
    .digest("hex")
    .toLowerCase();
  const response = await fetch(`${apiBase}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "RT-AccessCode": accessCode,
      "RT-Timestamp": timestamp,
      "RT-RequestID": requestId,
      "RT-Signature": signature,
    },
    body,
  });
  const result = (await response.json()) as SupplierResponse<T>;
  if (!response.ok || !result.success) {
    throw new Error(result.errorMsg || result.errorMessage || result.errorCode || "ESIM_ACCESS_REQUEST_FAILED");
  }
  return result.obj;
}

async function saveProfile(reference: string, profile: SupplierProfile) {
  if (!profile.qrCodeUrl || !profile.ac || !profile.iccid) return false;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("payment_orders").update({
    fulfillment_status: "ready",
    esim_transaction_no: profile.esimTranNo || null,
    iccid: profile.iccid,
    activation_code: profile.ac,
    qr_code_url: profile.qrCodeUrl,
    apn: profile.apn || null,
    fulfillment_error: null,
    fulfilled_at: new Date().toISOString(),
  }).eq("merchant_reference", reference);
  if (error) throw new Error("Unable to save eSIM activation details");
  return true;
}

async function retrieveProfile(reference: string, orderNo: string) {
  const result = await supplierRequest<{ esimList?: SupplierProfile[] }>("/esim/query", {
    orderNo,
    iccid: "",
    pager: { pageNum: 1, pageSize: 20 },
  });
  const profile = result?.esimList?.[0];
  return profile ? saveProfile(reference, profile) : false;
}

export async function provisionPaidOrder(order: FulfillmentOrder) {
  if (order.fulfillment_status === "ready") return;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: plan } = order.plan_id
    ? await supabaseAdmin.from("plans").select("supplier_package_code").eq("id", order.plan_id).maybeSingle()
    : { data: null };
  let packageCode = plan?.supplier_package_code;
  if (!packageCode) {
    const rawPackages = process.env["ESIM_ACCESS_PACKAGES"];
    if (rawPackages && order.plan_id) {
      try { packageCode = (JSON.parse(rawPackages) as Record<string, string>)[order.plan_id]; } catch { /* transition fallback only */ }
    }
  }
  if (!packageCode) throw new Error("ESIM_PACKAGE_NOT_MAPPED");

  if (order.supplier_order_no) {
    await retrieveProfile(order.merchant_reference, order.supplier_order_no);
    return;
  }

  const { data: claimed, error: claimError } = await supabaseAdmin
    .from("payment_orders")
    .update({ fulfillment_status: "provisioning", fulfillment_error: null })
    .eq("merchant_reference", order.merchant_reference)
    .in("fulfillment_status", ["not_started", "failed"])
    .select("merchant_reference")
    .maybeSingle();
  if (claimError) throw new Error("Unable to start eSIM activation");
  if (!claimed) return;

  try {
    const result = await supplierRequest<{ orderNo?: string }>("/esim/order", {
      transactionId: order.merchant_reference,
      packageInfoList: [{ packageCode, count: 1 }],
    });
    if (!result?.orderNo) throw new Error("Supplier did not return an order number");
    const { error: orderError } = await supabaseAdmin.from("payment_orders").update({
      supplier_order_no: result.orderNo,
    }).eq("merchant_reference", order.merchant_reference);
    if (orderError) throw new Error("Unable to save supplier order");

    for (let attempt = 0; attempt < 4; attempt += 1) {
      if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 2500));
      try {
        if (await retrieveProfile(order.merchant_reference, result.orderNo)) return;
      } catch (error) {
        if (attempt === 3) throw error;
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 300) : "Activation failed";
    await supabaseAdmin.from("payment_orders").update({ fulfillment_status: "failed", fulfillment_error: message }).eq("merchant_reference", order.merchant_reference);
    throw error;
  }
}

export async function getActivationByToken(token: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: order, error } = await supabaseAdmin.from("payment_orders")
    .select("merchant_reference, plan_id, country, data_allowance, validity_days, status, fulfillment_status, supplier_order_no, activation_code, apn, iccid, activation_token")
    .eq("activation_token", token)
    .maybeSingle();
  if (error || !order) throw new Error("ACTIVATION_NOT_FOUND");

  if (order.status === "completed" && order.fulfillment_status !== "ready") {
    try {
      await provisionPaidOrder(order);
    } catch {
      // The status screen stays recoverable while credentials or allocation are pending.
    }
  }

  const { data: refreshed } = await supabaseAdmin.from("payment_orders")
    .select("country, data_allowance, validity_days, status, fulfillment_status, activation_code, apn, iccid")
    .eq("activation_token", token)
    .maybeSingle();
  if (!refreshed) throw new Error("ACTIVATION_NOT_FOUND");
  return refreshed;
}