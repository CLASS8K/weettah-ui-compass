import { createFileRoute } from "@tanstack/react-router";

const REFERENCE = /^WEETTAH-[0-9a-f-]{36}$/i;

// PayChangu webhook (Settings > API & Webhooks in the PayChangu dashboard).
// The body is only a hint: we check the HMAC signature, then re-verify the
// transaction with PayChangu before marking anything paid.
export const Route = createFileRoute("/api/public/paychangu/webhook")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawBody = await request.text();
        const { verifyWebhookSignature } = await import("@/lib/paychangu.server");
        if (!verifyWebhookSignature(rawBody, request.headers.get("Signature"))) {
          return new Response("Invalid signature", { status: 401 });
        }

        let payload: Record<string, unknown> = {};
        try { payload = JSON.parse(rawBody) as Record<string, unknown>; } catch { /* acknowledged below */ }
        const nested = (payload["data"] ?? {}) as Record<string, unknown>;
        const candidate = [payload["tx_ref"], nested["tx_ref"], payload["reference"]]
          .find((value) => typeof value === "string" && REFERENCE.test(value)) as string | undefined;

        if (candidate) {
          try {
            const { confirmPaychanguOrder } = await import("@/lib/payment-confirmation.server");
            await confirmPaychanguOrder(candidate);
          } catch (error) {
            console.error("PayChangu webhook confirmation failed", error);
            return new Response("Retry later", { status: 500 });
          }
        }
        return new Response("OK", { status: 200 });
      },
    },
  },
});
