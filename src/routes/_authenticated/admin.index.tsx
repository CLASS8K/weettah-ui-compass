import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, ArrowRight, Boxes, CheckCircle2, Clock3, Loader2, Radio } from "lucide-react";
import { AdminShell, StatusBadge } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { getAdminOverview } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/")({
  staticData: { sitemap: false },
  head: () => ({ meta: [
    { title: "Operations overview — Weettah" },
    { name: "description", content: "Weettah package, payment, and activation operations overview." },
    { property: "og:title", content: "Operations overview — Weettah" },
    { property: "og:description", content: "Weettah package, payment, and activation operations overview." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: OverviewPage,
});

function OverviewPage() {
  const load = useServerFn(getAdminOverview);
  const query = useQuery({ queryKey: ["admin-overview"], queryFn: () => load() });
  if (query.isLoading) return <AdminShell title="Overview" description="A live view of sales and eSIM delivery."><Loading /></AdminShell>;
  if (query.isError || !query.data) return <AdminShell title="Access unavailable" description="This account is not approved for Weettah operations."><ErrorState /></AdminShell>;
  const { metrics, recentOrders } = query.data;
  const cards = [
    ["Pending payment", metrics.pending, Clock3],
    ["Awaiting activation", metrics.awaiting, Radio],
    ["Provisioning", metrics.provisioning, Loader2],
    ["Needs attention", metrics.failed, AlertTriangle],
    ["Ready", metrics.ready, CheckCircle2],
    ["Active packages", query.data.activePlans, Boxes],
  ] as const;
  return (
    <AdminShell title="Overview" description={`Signed in as ${query.data.email}. Track what needs attention across payments and eSIM delivery.`}>
      <section className="grid gap-px overflow-hidden rounded-md bg-border sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, value, Icon]) => <div key={label} className="bg-card p-5"><Icon className="text-primary" /><p className="mt-6 font-display text-4xl font-extrabold">{value}</p><p className="mt-1 text-sm text-muted-foreground">{label}</p></div>)}
      </section>
      <section className="mt-10">
        <div className="flex items-center justify-between"><div><h2 className="text-xl font-bold">Recent orders</h2><p className="mt-1 text-sm text-muted-foreground">The latest customer checkouts.</p></div><Button variant="outline" asChild><Link to="/admin/orders">View all <ArrowRight /></Link></Button></div>
        <div className="mt-5 divide-y divide-border border-y border-border">
          {recentOrders.length === 0 ? <p className="py-10 text-sm text-muted-foreground">No orders yet.</p> : recentOrders.map((order) => <div key={order.merchant_reference} className="grid gap-3 py-4 sm:grid-cols-[1.2fr_1fr_auto] sm:items-center"><div><p className="font-bold">{order.country}</p><p className="text-xs text-muted-foreground">{order.customer_email} · {new Date(order.created_at).toLocaleString()}</p></div><p className="text-sm font-semibold">{new Intl.NumberFormat("en", { style: "currency", currency: order.currency }).format(order.amount_minor / 100)}</p><div className="flex gap-2"><StatusBadge value={order.status} /><StatusBadge value={order.fulfillment_status} /></div></div>)}
        </div>
      </section>
    </AdminShell>
  );
}

function Loading() { return <div className="flex items-center gap-3 py-16 text-muted-foreground"><Loader2 className="animate-spin" />Loading operations…</div>; }
function ErrorState() { return <div className="border-y border-border py-10"><p className="font-bold">You don't have access to this workspace.</p><p className="mt-2 text-sm text-muted-foreground">Sign in with an approved, verified administrator email.</p><Button className="mt-5" asChild><Link to="/auth">Return to sign in</Link></Button></div>; }