import { createFileRoute } from "@tanstack/react-router";

const REFERENCE = /^WEETTAH-[0-9a-f-]{36}$/i;

// PayChangu doesn't document one fixed payload shape: the verify API returns
// `tx_ref`, while the webhook samples show `reference` and `charge_id`. Search
// the whole payload for our own order reference instead of guessing the key.
function findOrderReference(value: unknown, depth = 0): string | undefined {
  if (typeof value === "string") return REFERENCE.test(value.trim()) ? value.trim() : undefined;
  if (depth > 4 || value === null || typeof value !== "object") return undefined;
  for (const item of Object.values(value as Record<string, unknown>)) {
    const found = findOrderReference(item, depth + 1);
    if (found) return found;
  }
  return undefined;
}

// PayChangu webhook (Settings > API & Webhooks in the PayChangu dashboard).
// The body is only a hint: we check the HMAC signature, then re-verify the
// transaction with PayChangu before marking anything paid. Fulfilment is
// idempotent, so duplicate deliveries and the customer's return page racing
// this handler can't issue two eSIMs.
export const Route = createFileRoute("/api/public/paychangu/webhook")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawBody = await request.text();
        const { verifyWebhookSignature } = await import("@/lib/paychangu.server");
        if (!verifyWebhookSignature(rawBody, request.headers.get("Signature"))) {
          console.warn("PayChangu webhook rejected: missing or invalid signature");
          return new Response("Invalid signature", { status: 401 });
        }

        let payload: Record<string, unknown> = {};
        try { payload = JSON.parse(rawBody) as Record<string, unknown>; } catch { /* acknowledged below */ }
        const reference = findOrderReference(payload);

        if (!reference) {
          // Signed but not about a Weettah order (payouts, other events), or a
          // shape we don't recognise. Log the shape only, no customer data, so
          // it can be investigated. The reconciliation job still catches the payment.
          const nested = payload["data"];
          console.warn("PayChangu webhook without a Weettah reference", {
            event_type: payload["event_type"] ?? null,
            status: payload["status"] ?? null,
            keys: Object.keys(payload),
            data_keys: nested && typeof nested === "object" ? Object.keys(nested) : [],
          });
          return new Response("OK", { status: 200 });
        }

        try {
          const { confirmPaychanguOrder } = await import("@/lib/payment-confirmation.server");
          const result = await confirmPaychanguOrder(reference);
          console.log("PayChangu webhook processed", reference, result.state);
        } catch (error) {
          console.error("PayChangu webhook confirmation failed", error);
          return new Response("Retry later", { status: 500 });
        }
        return new Response("OK", { status: 200 });
      },
    },
  },
});
