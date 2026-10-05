import { createHmac, timingSafeEqual } from "node:crypto";

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

// Plans are priced in USD. Mobile money in Malawi settles in MWK, so when
// PAYCHANGU_MWK_PER_USD is set we charge the kwacha equivalent (rounded up to
// a whole kwacha). Without it we charge in USD (card only in practice).
export function computeCharge(amountMinor: number, currency: string): Charge {
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
  return `${CHARGE_PREFIX}${charge.currency}:${charge.amount}`;
}

export function decodeCharge(value: string | null): Charge | null {
  if (!value?.startsWith(CHARGE_PREFIX)) return null;
  const [currency, amount] = value.slice(CHARGE_PREFIX.length).split(":");
  const parsed = Number(amount);
  if ((currency !== "MWK" && currency !== "USD") || !Number.isFinite(parsed) || parsed <= 0) return null;
  return { currency, amount: parsed };
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

export type VerifiedTransaction = {
  status: string;
  txRef: string;
  amount: number;
  currency: string;
  reference: string | null;
  channel: string | null;
};

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
          tx_ref?: string;
          amount?: number | string;
          currency?: string;
          reference?: string;
          authorization?: { channel?: string };
        };
      }
    | null;
  const data = result?.data;
  if (!data) return null;
  return {
    status: result?.status === "success" ? String(data.status ?? "") : "unknown",
    txRef: String(data.tx_ref ?? ""),
    amount: Number(data.amount),
    currency: String(data.currency ?? ""),
    reference: data.reference ? String(data.reference) : null,
    channel: data.authorization?.channel ? String(data.authorization.channel) : null,
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
