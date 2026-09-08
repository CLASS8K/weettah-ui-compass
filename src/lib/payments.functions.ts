import { createServerFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";
import { z } from "zod";

const checkoutSchema = z.object({
  planId: z.string().min(1),
  firstName: z.string().trim().min(2).max(60),
  lastName: z.string().trim().min(2).max(60),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(7).max(24).regex(/^\+?[0-9 ()-]+$/),
});

export const beginCheckout = createServerFn({ method: "POST" })
  .inputValidator((input) => checkoutSchema.parse(input))
  .handler(async ({ data }) => {
    const { createPesapalCheckout } = await import("./pesapal.server");
    try {
      return { ok: true as const, ...(await createPesapalCheckout(data.planId, data, getRequestUrl().origin)) };
    } catch (error) {
      if (error instanceof Error && error.message === "PESAPAL_NOT_CONFIGURED") {
        return { ok: false as const, reason: "not_configured" as const };
      }
      throw error;
    }
  });

export const checkPayment = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ trackingId: z.string().uuid(), reference: z.string().optional() }).parse(input))
  .handler(async ({ data }) => {
    const { verifyPesapalOrder } = await import("./pesapal.server");
    return verifyPesapalOrder(data.trackingId, data.reference);
  });