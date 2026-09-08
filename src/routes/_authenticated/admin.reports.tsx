import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAdminReport } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  head: () => ({ meta: [
    { title: "Reports — Weettah Operations" }, { name: "description", content: "Weettah sales, payment and activation performance." },
    { property: "og:title", content: "Reports — Weettah Operations" }, { property: "og:description", content: "Weettah sales, payment and activation performance." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: ReportsPage,
});

function money(minor: number, currency: string) {
  return new Intl.NumberFormat("en", { style: "currency", currency }).format(minor / 100);
}

function ReportsPage() {
  const [days, setDays] = useState("30");
  const load = useServerFn(getAdminReport);
  const report = useQuery({ queryKey: ["admin-report", days], queryFn: () => load({ data: { days: Number(days) } }) });
  const peak = Math.max(1, ...(report.data?.daily.map((entry) => entry.revenueMinor) ?? [1]));

  return (
    <AdminShell title="Reports" description="Track sales, payment success and eSIM activation performance over time.">
      <div className="mb-7 max-w-xs">
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger aria-label="Reporting period"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last 12 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {report.isLoading ? (
        <p className="flex items-center gap-2 py-16 text-muted-foreground"><Loader2 className="animate-spin" />Building report…</p>
      ) : report.isError || !report.data ? (
        <p className="py-16 text-destructive">The report could not be built.</p>
      ) : (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Revenue", value: money(report.data.totals.revenueMinor, report.data.currency) },
              { label: "Paid orders", value: String(report.data.totals.paidOrders) },
              { label: "Average order", value: money(report.data.totals.averageMinor, report.data.currency) },
              { label: "Activation success", value: `${report.data.totals.activationRate}%` },
            ].map((card) => (
              <div key={card.label} className="rounded-md border border-border bg-card p-5">
                <p className="text-xs font-bold uppercase text-muted-foreground">{card.label}</p>
                <p className="mt-2 text-2xl font-extrabold">{card.value}</p>
              </div>
            ))}
          </div>

          <section className="rounded-md border border-border bg-card p-5 sm:p-6">
            <h2 className="text-lg font-bold">Daily revenue</h2>
            <p className="mt-1 text-sm text-muted-foreground">{report.data.totals.orders} checkouts started · {report.data.totals.paymentRate}% completed payment</p>
            <div className="mt-6 flex h-40 items-end gap-1 overflow-x-auto">
              {report.data.daily.map((entry) => (
                <div key={entry.day} className="flex min-w-1.5 flex-1 flex-col justify-end" title={`${entry.day}: ${money(entry.revenueMinor, report.data.currency)}`}>
                  <div className="rounded-t-sm bg-primary" style={{ height: `${Math.max(2, (entry.revenueMinor / peak) * 100)}%` }} />
                </div>
              ))}
            </div>
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            {[
              { title: "Top destinations", rows: report.data.byCountry },
              { title: "Payment methods", rows: report.data.byMethod },
            ].map((block) => (
              <section key={block.title} className="rounded-md border border-border bg-card p-5 sm:p-6">
                <h2 className="text-lg font-bold">{block.title}</h2>
                {block.rows.length === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">No paid orders in this period yet.</p>
                ) : (
                  <ul className="mt-4 divide-y divide-border">
                    {block.rows.map((row) => (
                      <li key={row.label} className="flex items-center justify-between gap-4 py-3">
                        <span className="font-medium capitalize">{row.label}</span>
                        <span className="text-right text-sm"><span className="font-bold">{money(row.revenueMinor, report.data.currency)}</span><span className="block text-xs text-muted-foreground">{row.orders} orders</span></span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </div>
      )}
    </AdminShell>
  );
}
