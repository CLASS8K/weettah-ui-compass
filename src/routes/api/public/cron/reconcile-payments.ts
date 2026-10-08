import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "node:crypto";

// Re-verifies recent pending PayChangu orders so a paid customer gets their
// eSIM even if the webhook didn't match and they closed the payment page.
// Called by Vercel Cron (vercel.json) and optionally by an external scheduler
// more often. Requires "Authorization: Bearer <CRON_SECRET>".
function authorized(header: string | null) {
  const secret = process.env["CRON_SECRET"];
  if (!secret || !header) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(header);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export const Route = createFileRoute("/api/public/cron/reconcile-payments")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!authorized(request.headers.get("Authorization"))) {
          return new Response("Unauthorized", { status: 401 });
        }
        const { paychanguConfigured } = await import("@/lib/paychangu.server");
        if (!paychanguConfigured()) return Response.json({ ok: true, skipped: "paychangu_not_configured" });
        try {
          const { reconcilePendingPaychanguOrders } = await import("@/lib/payment-confirmation.server");
          const summary = await reconcilePendingPaychanguOrders();
          console.log("PayChangu reconciliation complete", summary);
          return Response.json({ ok: true, ...summary });
        } catch (error) {
          console.error("PayChangu reconciliation failed", error);
          const message = error instanceof Error ? error.message.slice(0, 200) : "Reconciliation failed";
          return Response.json({ ok: false, error: message }, { status: 500 });
        }
      },
    },
  },
});
