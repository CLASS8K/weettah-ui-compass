import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

export const Route = createFileRoute("/api/public/activation/qr")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      GET: async ({ request }) => {
        const parsed = z.string().uuid().safeParse(new URL(request.url).searchParams.get("token"));
        if (!parsed.success) return new Response("Not found", { status: 404 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data } = await supabaseAdmin.from("payment_orders")
          .select("qr_code_url, status, fulfillment_status")
          .eq("activation_token", parsed.data)
          .maybeSingle();
        if (!data?.qr_code_url || data.status !== "completed" || data.fulfillment_status !== "ready") {
          return new Response("Not ready", { status: 404 });
        }
        const image = await fetch(data.qr_code_url);
        if (!image.ok) return new Response("Not available", { status: 502 });
        return new Response(image.body, {
          headers: {
            "Content-Type": image.headers.get("content-type") || "image/png",
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff",
          },
        });
      },
    },
  },
});