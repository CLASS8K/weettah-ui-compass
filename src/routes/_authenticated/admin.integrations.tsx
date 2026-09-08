import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, LockKeyhole, Save } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { AdminShell, StatusBadge } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAdminIntegrations, updateAdminIntegration } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/integrations")({
  head: () => ({ meta: [
    { title: "Integrations — Weettah Operations" }, { name: "description", content: "Manage Weettah supplier and payment connections." },
    { property: "og:title", content: "Integrations — Weettah Operations" }, { property: "og:description", content: "Manage Weettah supplier and payment connections." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: IntegrationsPage,
});

function IntegrationsPage() {
  const load = useServerFn(getAdminIntegrations);
  const save = useServerFn(updateAdminIntegration);
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["admin-integrations"], queryFn: () => load() });
  const mutation = useMutation({ mutationFn: save, onSuccess: () => client.invalidateQueries({ queryKey: ["admin-integrations"] }) });
  return <AdminShell title="Integrations" description="Manage private supplier and payment credentials. Saved secrets are encrypted and can never be revealed again."><div className="mb-6 flex items-start gap-3 rounded-md bg-surface p-4 text-sm text-surface-foreground"><LockKeyhole className="mt-0.5 shrink-0" /><p>Leave credential fields blank to keep saved values. Entering a new value replaces the encrypted credential.</p></div>{query.isLoading ? <p className="flex items-center gap-2 py-16 text-muted-foreground"><Loader2 className="animate-spin" />Loading integrations…</p> : <div className="space-y-5">{query.data?.map((item) => <IntegrationEditor key={item.id} item={item} saving={mutation.isPending} onSave={(data) => mutation.mutate({ data })} />)}</div>}</AdminShell>;
}

function IntegrationEditor({ item, saving, onSave }: { item: Awaited<ReturnType<typeof getAdminIntegrations>>[number]; saving: boolean; onSave: (data: { id: "esim_access" | "pesapal"; providerName: string; apiBaseUrl: string; environment: "test" | "live"; notificationId: string; primarySecret: string; secondarySecret: string }) => void }) {
  const [name, setName] = useState(item.provider_name); const [url, setUrl] = useState(item.api_base_url ?? ""); const [environment, setEnvironment] = useState<"test" | "live">(item.environment as "test" | "live"); const [notification, setNotification] = useState(item.notification_id ?? ""); const [primary, setPrimary] = useState(""); const [secondary, setSecondary] = useState("");
  useEffect(() => { setName(item.provider_name); setUrl(item.api_base_url ?? ""); setEnvironment(item.environment as "test" | "live"); setNotification(item.notification_id ?? ""); }, [item]);
  const submit = (event: FormEvent) => { event.preventDefault(); onSave({ id: item.id as "esim_access" | "pesapal", providerName: name, apiBaseUrl: url, environment, notificationId: notification, primarySecret: primary, secondarySecret: secondary }); setPrimary(""); setSecondary(""); };
  const supplier = item.id === "esim_access";
  return <form onSubmit={submit} className="rounded-md border border-border bg-card p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase text-primary">{supplier ? "eSIM delivery" : "Payments"}</p><h2 className="mt-1 text-xl font-bold">{item.provider_name}</h2><p className="mt-1 text-xs text-muted-foreground">Last updated {new Date(item.updated_at).toLocaleString()}</p></div><div className="flex items-center gap-2">{item.configured && <CheckCircle2 className="text-accent" />}<StatusBadge value={item.configured ? "configured" : "not configured"} /></div></div><div className="mt-6 grid gap-5 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor={`${item.id}-name`}>Provider name</Label><Input id={`${item.id}-name`} value={name} onChange={(e) => setName(e.target.value)} required /></div><div className="space-y-2"><Label>Environment</Label><Select value={environment} onValueChange={(value) => setEnvironment(value as "test" | "live")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="test">Test</SelectItem><SelectItem value="live">Live</SelectItem></SelectContent></Select></div><div className="space-y-2 sm:col-span-2"><Label htmlFor={`${item.id}-url`}>API address</Label><Input id={`${item.id}-url`} type="url" value={url} onChange={(e) => setUrl(e.target.value)} required /></div>{!supplier && <div className="space-y-2 sm:col-span-2"><Label htmlFor="notification">Notification ID</Label><Input id="notification" value={notification} onChange={(e) => setNotification(e.target.value)} /></div>}<div className="space-y-2"><Label htmlFor={`${item.id}-primary`}>{supplier ? "Access code" : "Consumer key"}</Label><Input id={`${item.id}-primary`} type="password" autoComplete="new-password" value={primary} onChange={(e) => setPrimary(e.target.value)} placeholder={item.credential_hint ?? "Not configured"} /></div>{!supplier && <div className="space-y-2"><Label htmlFor={`${item.id}-secondary`}>Consumer secret</Label><Input id={`${item.id}-secondary`} type="password" autoComplete="new-password" value={secondary} onChange={(e) => setSecondary(e.target.value)} placeholder={item.configured ? "Saved securely" : "Not configured"} /></div>}</div><div className="mt-6 flex justify-end border-t border-border pt-5"><Button type="submit" disabled={saving}><Save />Save integration</Button></div></form>;
}