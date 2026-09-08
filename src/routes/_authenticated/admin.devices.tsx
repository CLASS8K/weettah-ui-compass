import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { deleteAdminDevice, listAdminDevices, saveAdminDevice } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/devices")({
  head: () => ({ meta: [
    { title: "Phone check — Weettah Operations" },
    { name: "description", content: "Manage the phones listed in the Weettah eSIM compatibility checker." },
    { property: "og:title", content: "Phone check — Weettah Operations" },
    { property: "og:description", content: "Manage the phones listed in the Weettah eSIM compatibility checker." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: DevicesPage,
});

type Device = Awaited<ReturnType<typeof listAdminDevices>>[number];

function DevicesPage() {
  const load = useServerFn(listAdminDevices);
  const save = useServerFn(saveAdminDevice);
  const remove = useServerFn(deleteAdminDevice);
  const client = useQueryClient();
  const devices = useQuery({ queryKey: ["admin-devices"], queryFn: () => load() });
  const invalidate = () => client.invalidateQueries({ queryKey: ["admin-devices"] });
  const saveMutation = useMutation({ mutationFn: save, onSuccess: invalidate });
  const deleteMutation = useMutation({ mutationFn: remove, onSuccess: invalidate });
  const [adding, setAdding] = useState(false);

  return (
    <AdminShell title="Phone check" description="These brand groups power the “Will it work on your phone?” checker on the storefront.">
      {devices.isLoading ? (
        <p className="flex items-center gap-2 py-16 text-muted-foreground"><Loader2 className="animate-spin" />Loading phones…</p>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {devices.data?.map((device) => (
            <DeviceEditor
              key={device.id}
              device={device}
              saving={saveMutation.isPending}
              onSave={(data) => saveMutation.mutate({ data: { ...data, id: device.id } })}
              onDelete={() => deleteMutation.mutate({ data: { id: device.id } })}
            />
          ))}
          {adding ? (
            <DeviceEditor
              saving={saveMutation.isPending}
              onSave={(data) => saveMutation.mutate({ data }, { onSuccess: () => setAdding(false) })}
              onDelete={() => setAdding(false)}
            />
          ) : (
            <button type="button" onClick={() => setAdding(true)} className="flex min-h-40 items-center justify-center gap-2 rounded-md border border-dashed border-border p-5 text-sm font-bold text-muted-foreground hover:text-foreground">
              <Plus /> Add a brand group
            </button>
          )}
        </div>
      )}
    </AdminShell>
  );
}

function DeviceEditor({ device, onSave, onDelete, saving }: {
  device?: Device;
  onSave: (data: { brand: string; models: string; isActive: boolean; displayOrder: number }) => void;
  onDelete: () => void;
  saving: boolean;
}) {
  const [brand, setBrand] = useState(device?.brand ?? "");
  const [models, setModels] = useState(device?.models ?? "");
  const [active, setActive] = useState(device?.is_active ?? true);
  const [order, setOrder] = useState(String(device?.display_order ?? 0));
  useEffect(() => {
    if (!device) return;
    setBrand(device.brand);
    setModels(device.models);
    setActive(device.is_active);
    setOrder(String(device.display_order));
  }, [device]);

  return (
    <article className="rounded-md border border-border bg-card p-5">
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <div className="space-y-2">
          <Label>Brand</Label>
          <Input value={brand} onChange={(event) => setBrand(event.target.value)} placeholder="e.g. Samsung" />
        </div>
        <div className="space-y-2">
          <Label>Display order</Label>
          <Input type="number" min="0" value={order} onChange={(event) => setOrder(event.target.value)} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Supported models</Label>
          <Textarea rows={3} value={models} onChange={(event) => setModels(event.target.value)} placeholder="Galaxy S20 and newer, Z Flip and Z Fold…" />
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
        <Label className="flex items-center gap-2"><Switch checked={active} onCheckedChange={setActive} />Visible</Label>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" className="text-destructive" onClick={onDelete}><Trash2 />{device ? "Remove" : "Cancel"}</Button>
          <Button size="sm" disabled={saving || !brand.trim() || !models.trim()} onClick={() => onSave({ brand, models, isActive: active, displayOrder: Number(order) || 0 })}><Save />Save</Button>
        </div>
      </div>
    </article>
  );
}
