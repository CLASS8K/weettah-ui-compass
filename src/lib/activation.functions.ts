import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getActivation = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ token: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { getActivationByToken } = await import("./esim-access.server");
    return getActivationByToken(data.token);
  });