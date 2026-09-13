import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/health")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      GET: async () => {
        const result: Record<string, string> = {
          SUPABASE_URL: process.env["SUPABASE_URL"] ? "SET" : "MISSING",
          SUPABASE_SERVICE_ROLE_KEY: process.env["SUPABASE_SERVICE_ROLE_KEY"] ? "SET" : "MISSING",
          SUPABASE_PUBLISHABLE_KEY: process.env["SUPABASE_PUBLISHABLE_KEY"] ? "SET" : "MISSING",
          NODE: process.version,
        };
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data, error } = await supabaseAdmin.from("plans").select("id").limit(1);
          result["supabaseTest"] = error ? `ERROR: ${error.message}` : `OK (${data?.length ?? 0} rows)`;
        } catch (e) {
          result["supabaseTest"] = `EXCEPTION: ${e instanceof Error ? e.message : String(e)}`;
        }
        return new Response(JSON.stringify(result, null, 2), {
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
