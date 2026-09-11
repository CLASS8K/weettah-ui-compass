import { createServerFileRoute } from "@tanstack/react-start/server";

export const ServerRoute = createServerFileRoute("/api/health").methods({
  GET: async () => {
    const result: Record<string, string> = {
      SUPABASE_URL: process.env["SUPABASE_URL"] ? "SET" : "MISSING",
      SUPABASE_SERVICE_ROLE_KEY: process.env["SUPABASE_SERVICE_ROLE_KEY"] ? "SET" : "MISSING",
      SUPABASE_PUBLISHABLE_KEY: process.env["SUPABASE_PUBLISHABLE_KEY"] ? "SET" : "MISSING",
      VITE_SUPABASE_URL: process.env["VITE_SUPABASE_URL"] ? "SET" : "MISSING",
      NODE: process.version,
    };
    try {
      const res = await fetch(`${process.env["SUPABASE_URL"]}/rest/v1/plans?select=count&limit=1`, {
        headers: {
          apikey: process.env["SUPABASE_SERVICE_ROLE_KEY"]!,
          Authorization: `Bearer ${process.env["SUPABASE_SERVICE_ROLE_KEY"]}`,
        },
      });
      result.supabaseTest = `HTTP ${res.status}`;
    } catch (e) {
      result.supabaseTest = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
    }
    return new Response(JSON.stringify(result, null, 2), {
      headers: { "content-type": "application/json" },
    });
  },
});
