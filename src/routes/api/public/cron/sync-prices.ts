import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "node:crypto";

// Nightly supplier price sync, called by Vercel Cron (see vercel.json).
// Vercel sends "Authorization: Bearer <CRON_SECRET>" when CRON_SECRET is set in
// the project's environment variables. Without that secret the route refuses
// every request, so it can't be used to trigger repricing from outside.
function authorized(header: string | null) {
  const secret = process.env["CRON_SECRET"];
  if (!secret || !header) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(header);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export const Route = createFileRoute("/api/public/cron/sync-prices")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!authorized(request.headers.get("Authorization"))) {
          return new Response("Unauthorized", { status: 401 });
        }
        try {
          const { syncSupplierPrices } = await import("@/lib/price-sync.server");
          const result = await syncSupplierPrices();
          console.log("Supplier price sync complete", result);
          return Response.json({ ok: true, ...result });
        } catch (error) {
          console.error("Supplier price sync failed", error);
          const message = error instanceof Error ? error.message.slice(0, 200) : "Sync failed";
          return Response.json({ ok: false, error: message }, { status: 500 });
        }
      },
    },
  },
});
