import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const ipnSchema = z.object({
  OrderTrackingId: z.string().uuid(),
  OrderMerchantReference: z.string().min(1).max(50),
  OrderNotificationType: z.string().optional(),
});

export const Route = createFileRoute("/api/public/pesapal/ipn")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const parsed = ipnSchema.safeParse(Object.fromEntries(url.searchParams));
        if (!parsed.success) return Response.json({ status: 500 }, { status: 400 });

        try {
          const { verifyPesapalOrder } = await import("@/lib/pesapal.server");
          await verifyPesapalOrder(parsed.data.OrderTrackingId, parsed.data.OrderMerchantReference);
          return Response.json({
            orderNotificationType: parsed.data.OrderNotificationType || "IPNCHANGE",
            orderTrackingId: parsed.data.OrderTrackingId,
            orderMerchantReference: parsed.data.OrderMerchantReference,
            status: 200,
          });
        } catch {
          return Response.json({
            orderNotificationType: parsed.data.OrderNotificationType || "IPNCHANGE",
            orderTrackingId: parsed.data.OrderTrackingId,
            orderMerchantReference: parsed.data.OrderMerchantReference,
            status: 500,
          }, { status: 500 });
        }
      },
    },
  },
});