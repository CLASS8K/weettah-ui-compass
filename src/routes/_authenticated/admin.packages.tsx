import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { listAdminPlans, updateAdminPlan } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/packages")({
  staticData: { sitemap: false },
  head: () => ({ meta: [
    { title: "Packages — Weettah Operations" }, { name: "description", content: "Manage Weettah eSIM package prices and supplier codes." },
    { property: "og:title", content: "Packages — Weettah Operations" }, { property: "og:description", content: "Manage Weettah eSIM package prices and supplier codes." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: PackagesPage,
});

function PackagesPage() {
  const load = useServerFn(listAdminPlans);
  const save = useServerFn(updateAdminPlan);
  const client = useQueryClient();
  const plans = useQuery({ queryKey: ["admin-plans"], queryFn: () => load() });
  const mutation = useMutation({ mutationFn: save, onSuccess: () => client.invalidateQueries({ queryKey: ["admin-plans"] }) });
  return <AdminShell title="Packages" description="Set the customer price, storefront visibility, and private supplier package code for each plan.">{plans.isLoading ? <p className="flex items-center gap-2 py-16 text-muted-foreground"><Loader2 className="animate-spin" />Loading packages…</p> : <div className="grid gap-4 xl:grid-cols-2">{plans.data?.map((plan) => <PackageEditor key={plan.id} plan={plan} onSave={(data) => mutation.mutate({ data })} saving={mutation.isPending} />)}</div>}</AdminShell>;
}

function PackageEditor({ plan, onSave, saving }: { plan: Awaited<ReturnType<typeof listAdminPlans>>[number]; onSave: (data: { id: string; amountMinor: number; supplierPackageCode: string; isActive: boolean; isPopular: boolean; displayOrder: number }) => void; saving: boolean }) {
  const [price, setPrice] = useState((plan.amount_minor / 100).toFixed(2));
  const [code, setCode] = useState(plan.supplier_package_code ?? "");
  const [active, setActive] = useState(plan.is_active);
  const [popular, setPopular] = useState(plan.is_popular);
  const [order, setOrder] = useState(String(plan.display_order));
  useEffect(() => { setPrice((plan.amount_minor / 100).toFixed(2)); setCode(plan.supplier_package_code ?? ""); setActive(plan.is_active); setPopular(plan.is_popular); setOrder(String(plan.display_order)); }, [plan]);
  return <article className="rounded-md border border-border bg-card p-5"><div className="flex items-start justify-between"><div><p className="text-2xl" aria-hidden>{plan.flag}</p><h2 className="mt-2 text-lg font-bold">{plan.country}</h2><p className="text-sm text-muted-foreground">{plan.data_allowance} · {plan.validity_days} days · {plan.id}</p></div>{active && <span className="flex items-center gap-1 text-xs font-bold text-accent"><Check />Live</span>}</div><div className="mt-6 grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor={`${plan.id}-price`}>Customer price ({plan.currency})</Label><Input id={`${plan.id}-price`} type="number" min="0.01" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} /></div><div className="space-y-2"><Label htmlFor={`${plan.id}-order`}>Display order</Label><Input id={`${plan.id}-order`} type="number" min="0" value={order} onChange={(e) => setOrder(e.target.value)} /></div><div className="space-y-2 sm:col-span-2"><Label htmlFor={`${plan.id}-code`}>Supplier package code</Label><Input id={`${plan.id}-code`} value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter package code" /></div></div><div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5"><div className="flex gap-5"><Label className="flex items-center gap-2"><Switch checked={active} onCheckedChange={setActive} />Visible</Label><Label className="flex items-center gap-2"><Switch checked={popular} onCheckedChange={setPopular} />Popular</Label></div><Button size="sm" onClick={() => onSave({ id: plan.id, amountMinor: Math.round(Number(price) * 100), supplierPackageCode: code.trim(), isActive: active, isPopular: popular, displayOrder: Number(order) })} disabled={saving || !Number(price)}><Save />Save</Button></div></article>;
}