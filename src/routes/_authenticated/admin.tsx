import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { verifyAdminAccess } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  staticData: { sitemap: false },
  beforeLoad: async () => {
    try {
      return await verifyAdminAccess();
    } catch {
      throw redirect({ to: "/auth" });
    }
  },
  component: () => <Outlet />,
});
