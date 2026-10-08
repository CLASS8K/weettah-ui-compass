import { createHmac, timingSafeEqual } from "node:crypto";
import { toMwk, type PricingSettings } from "./pricing.server";

// PayChangu Standard Checkout — https://developer.paychangu.com/docs/standard-checkout
// Server-only: uses the secret key. Never import this from client code.

const API_BASE = "https://api.paychangu.com";
const CHARGE_PREFIX = "paychangu:";

export type Charge = { amount: number; currency: "MWK" | "USD" };

export function paychanguConfigured() {
  return Boolean(process.env["PAYCHANGU_SECRET_KEY"]);
}

function secretKey() {
  const key = process.env["PAYCHANGU_SECRET_KEY"];
  if (!key) throw new Error("PAYCHANGU_NOT_CONFIGURED");
  return key;
}

export function siteUrl() {
  return (process.env["SITE_URL"] || "https://www.weettah.com").replace(/\/+$/, "");
}

// Plans are priced in USD and sold in MWK. With pricing settings (from
// pricing.server) we charge exactly the kwacha price shown on the site. Without
// them we fall back to PAYCHANGU_MWK_PER_USD, and failing that, USD.
export function computeCharge(
  amountMinor: number,
  currency: string,
  pricing?: Pick<PricingSettings, "mwkPerUsd" | "mwkRounding"> | null,
): Charge {
  if (currency === "USD" && pricing) return { amount: toMwk(amountMinor, pricing), currency: "MWK" };
  const rate = Number(process.env["PAYCHANGU_MWK_PER_USD"] || "");
  if (currency === "USD" && Number.isFinite(rate) && rate > 0) {
    return { amount: Math.ceil((amountMinor / 100) * rate), currency: "MWK" };
  }
  if (currency === "MWK") return { amount: Math.ceil(amountMinor / 100), currency: "MWK" };
  if (currency !== "USD") throw new Error("UNSUPPORTED_CURRENCY");
  return { amount: amountMinor / 100, currency: "USD" };
}

// The charged amount is locked at checkout and stored on the order so that
// verification compares against what we asked for, even if the rate changes.
export function encodeCharge(charge: Charge) {
  return JSON.stringify({ charge } satisfies Pick<PaymentDetails, "charge">);
}

// Stored in payment_orders.provider_status_description (server-only column).
export type PaymentDetails = {
  charge: Charge;
  method?: string;
  account?: string | null;
  fee?: number | null;
};

export function decodePaymentDetails(value: string | null): PaymentDetails | null {
  if (!value) return null;
  if (value.startsWith("{")) {
    try {
      const parsed = JSON.parse(value) as PaymentDetails;
      const { currency, amount } = parsed.charge ?? ({} as Charge);
      if ((currency === "MWK" || currency === "USD") && Number(amount) > 0) return parsed;
    } catch {
      return null;
    }
    return null;
  }
  // Legacy format from the first release: "paychangu:MWK:1900 via Mobile Money".
  if (!value.startsWith(CHARGE_PREFIX)) return null;
  const [main, via] = value.slice(CHARGE_PREFIX.length).split(" via ");
  const [currency, amount] = (main ?? "").split(":");
  const parsed = Number(amount);
  if ((currency !== "MWK" && currency !== "USD") || !Number.isFinite(parsed) || parsed <= 0) return null;
  return { charge: { currency, amount: parsed }, method: via?.trim() || undefined };
}

export function decodeCharge(value: string | null): Charge | null {
  return decodePaymentDetails(value)?.charge ?? null;
}

type InitiateInput = {
  txRef: string;
  charge: Charge;
  email: string;
  firstName: string;
  lastName: string;
  title: string;
  description: string;
};

export async function initiateCheckout(input: InitiateInput): Promise<string> {
  const completeUrl = `${siteUrl()}/payment/complete`;
  const response = await fetch(`${API_BASE}/payment`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${secretKey()}`,
    },
    body: JSON.stringify({
      amount: input.charge.amount,
      currency: input.charge.currency,
      tx_ref: input.txRef,
      email: input.email,
      first_name: input.firstName,
      last_name: input.lastName,
      callback_url: completeUrl,
      return_url: completeUrl,
      customization: { title: input.title, description: input.description },
      meta: { source: "weettah-web" },
    }),
  });
  const result = (await response.json().catch(() => null)) as
    | { status?: string; message?: unknown; data?: { checkout_url?: string } }
    | null;
  const checkoutUrl = result?.data?.checkout_url;
  if (!response.ok || result?.status !== "success" || !checkoutUrl) {
    const message = typeof result?.message === "string" ? result.message : JSON.stringify(result?.message ?? response.status);
    throw new Error(`PAYCHANGU_INIT_FAILED: ${message}`.slice(0, 300));
  }
  if (!checkoutUrl.startsWith("https://")) throw new Error("PAYCHANGU_INIT_FAILED: unexpected checkout URL");
  return checkoutUrl;
}

// True only on the live Vercel production deployment. Preview and local builds
// must never be able to release a real eSIM for a test-mode payment.
export function isProductionDeploy() {
  return process.env["VERCEL_ENV"] === "production";
}

export type VerifiedTransaction = {
  status: string;
  // "live" or "test" as reported by PayChangu; null if the field is absent.
  mode: string | null;
  txRef: string;
  amount: number;
  currency: string;
  reference: string | null;
  channel: string | null;
  method: string;
  account: string | null;
  fee: number | null;
};

// Turns PayChangu's authorization block into a label people recognise:
// "Airtel Money", "TNM Mpamba", "Visa", "Mastercard", or a generic fallback.
function describeMethod(authorization: Record<string, unknown>): { method: string; account: string | null } {
  const text = JSON.stringify(authorization).toLowerCase();
  const channel = String(authorization["channel"] ?? "");
  const brand = String(authorization["brand"] ?? authorization["card_type"] ?? "").toLowerCase();
  const cardNumber = String(authorization["card_number"] ?? authorization["last4"] ?? "");
  const mobile = String(authorization["mobile_number"] ?? authorization["phone"] ?? authorization["msisdn"] ?? "");

  if (/card/i.test(channel) || cardNumber) {
    const method = brand.includes("visa") ? "Visa" : brand.includes("master") ? "Mastercard" : "Card";
    const last4 = cardNumber.replace(/\D/g, "").slice(-4);
    return { method, account: last4 ? `•••• ${last4}` : null };
  }
  const method = text.includes("airtel") ? "Airtel Money"
    : text.includes("tnm") || text.includes("mpamba") ? "TNM Mpamba"
    : text.includes("changu") ? "Changu MoMo"
    : /mobile/i.test(channel) ? "Mobile money"
    : channel || "PayChangu";
  const digits = mobile.replace(/\D/g, "");
  return { method, account: digits.length >= 6 ? `${digits.slice(0, 3)}•••${digits.slice(-3)}` : null };
}

// Always re-query PayChangu before giving value — never trust redirects or webhook bodies alone.
export async function verifyTransaction(txRef: string): Promise<VerifiedTransaction | null> {
  const response = await fetch(`${API_BASE}/verify-payment/${encodeURIComponent(txRef)}`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${secretKey()}` },
  });
  if (response.status === 404) return null;
  const result = (await response.json().catch(() => null)) as
    | {
        status?: string;
        data?: {
          status?: string;
          mode?: string;
          tx_ref?: string;
          amount?: number | string;
          currency?: string;
          reference?: string;
          charges?: number | string;
          authorization?: Record<string, unknown>;
        };
      }
    | null;
  const data = result?.data;
  if (!data) return null;
  return {
    status: result?.status === "success" ? String(data.status ?? "") : "unknown",
    mode: data.mode ? String(data.mode).toLowerCase() : null,
    txRef: String(data.tx_ref ?? ""),
    amount: Number(data.amount),
    currency: String(data.currency ?? ""),
    reference: data.reference ? String(data.reference) : null,
    channel: data.authorization?.["channel"] ? String(data.authorization["channel"]) : null,
    ...describeMethod(data.authorization ?? {}),
    fee: Number.isFinite(Number(data.charges)) ? Number(data.charges) : null,
  };
}

export function verifyWebhookSignature(rawBody: string, signature: string | null) {
  const secret = process.env["PAYCHANGU_WEBHOOK_SECRET"];
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const given = signature.trim().toLowerCase();
  if (given.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(given));
}
