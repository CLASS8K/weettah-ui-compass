import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, Loader2, RotateCw, Search } from "lucide-react";
import { useState } from "react";
import { AdminShell, StatusBadge } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { exportAdminOrders, listAdminOrders, retryAdminFulfillment } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  head: () => ({ meta: [
    { title: "Orders — Weettah Operations" }, { name: "description", content: "Manage Weettah payments and eSIM delivery." },
    { property: "og:title", content: "Orders — Weettah Operations" }, { property: "og:description", content: "Manage Weettah payments and eSIM delivery." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: OrdersPage,
});

function OrdersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "pending" | "completed" | "failed" | "cancelled" | "invalid">("all");
  const [fulfillment, setFulfillment] = useState<"all" | "not_started" | "provisioning" | "ready" | "failed">("all");
  const load = useServerFn(listAdminOrders);
  const retry = useServerFn(retryAdminFulfillment);
  const exportOrders = useServerFn(exportAdminOrders);
  const client = useQueryClient();
  const orders = useQuery({ queryKey: ["admin-orders", search, status, fulfillment], queryFn: () => load({ data: { query: search, status, fulfillment } }) });
  const mutation = useMutation({ mutationFn: (reference: string) => retry({ data: { reference } }), onSuccess: () => client.invalidateQueries({ queryKey: ["admin-orders"] }) });
  const download = useMutation({
    mutationFn: () => exportOrders({ data: { query: search, status, fulfillment } }),
    onSuccess: (result) => {
      const url = URL.createObjectURL(new Blob([result.csv], { type: "text/csv;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url; link.download = result.filename;
      document.body.appendChild(link); link.click(); link.remove();
      URL.revokeObjectURL(url);
    },
  });
  return (
    <AdminShell title="Orders" description="Review payment and fulfillment status, find customer orders, and retry failed activations.">
      <div className="mb-4 flex justify-end">
        <Button variant="outline" size="sm" onClick={() => download.mutate()} disabled={download.isPending}>
          {download.isPending ? <Loader2 className="animate-spin" /> : <Download />}Export CSV
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_12rem_12rem]">
        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input className="pl-10" placeholder="Reference, customer, or country" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}><SelectTrigger aria-label="Payment status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All payments</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="failed">Failed</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem><SelectItem value="invalid">Invalid</SelectItem></SelectContent></Select>
        <Select value={fulfillment} onValueChange={(value) => setFulfillment(value as typeof fulfillment)}><SelectTrigger aria-label="Activation status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All activations</SelectItem><SelectItem value="not_started">Not started</SelectItem><SelectItem value="provisioning">Provisioning</SelectItem><SelectItem value="ready">Ready</SelectItem><SelectItem value="failed">Failed</SelectItem></SelectContent></Select>
      </div>
      {orders.isLoading ? <p className="flex items-center gap-2 py-16 text-muted-foreground"><Loader2 className="animate-spin" />Loading orders…</p> : orders.isError ? <p className="py-16 text-destructive">Orders could not be loaded.</p> : (
        <div className="mt-7 space-y-3">
          {orders.data?.length === 0 && <p className="border-y border-border py-12 text-center text-muted-foreground">No matching orders.</p>}
          {orders.data?.map((order) => <article key={order.merchant_reference} className="rounded-md border border-border bg-card p-5"><div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold">{order.country} · {order.data_allowance}</h2><StatusBadge value={order.status} /><StatusBadge value={order.fulfillment_status} /></div><p className="mt-2 text-sm text-muted-foreground">{order.customer_first_name} {order.customer_last_name} · {order.customer_email} · {order.customer_phone}</p><p className="mt-1 break-all font-mono text-xs text-muted-foreground">{order.merchant_reference}</p></div><div className="flex flex-wrap items-center gap-4"><div className="text-right"><p className="font-bold">{new Intl.NumberFormat("en", { style: "currency", currency: order.currency }).format(order.amount_minor / 100)}</p><p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p></div>{order.status === "completed" && order.fulfillment_status !== "ready" && <Button size="sm" variant="outline" onClick={() => mutation.mutate(order.merchant_reference)} disabled={mutation.isPending}><RotateCw className={mutation.isPending ? "animate-spin" : ""} />Retry activation</Button>}</div></div>{order.fulfillment_error && <p className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{order.fulfillment_error}</p>}{order.supplier_order_no && <p className="mt-3 text-xs text-muted-foreground">Supplier order: {order.supplier_order_no}</p>}</article>)}
        </div>
      )}
    </AdminShell>
  );
}