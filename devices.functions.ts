import { createServerFn } from "@tanstack/react-start";

export type PublicDevice = {
  id: string;
  brand: string;
  models: string;
};

export const getSupportedDevices = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("supported_devices")
    .select("id, brand, models")
    .eq("is_active", true)
    .order("display_order");
  if (error) throw new Error("Unable to load supported devices");
  return data satisfies PublicDevice[];
});
