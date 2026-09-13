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
import {
  deleteAdminDestinationContent,
  listAdminDestinationContent,
  saveAdminDestinationContent,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/guides")({
  staticData: { sitemap: false },
  head: () => ({ meta: [
    { title: "Destination guides — Weettah Operations" },
    { name: "description", content: "Write the local travel content shown on each Weettah destination page." },
    { property: "og:title", content: "Destination guides — Weettah Operations" },
    { property: "og:description", content: "Write the local travel content shown on each Weettah destination page." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: GuidesPage,
});

type Guide = Awaited<ReturnType<typeof listAdminDestinationContent>>[number];

type GuideDraft = {
  slug: string;
  country: string;
  intro: string;
  coverage: string;
  capital: string;
  currency: string;
  languages: string;
  powerPlug: string;
  emergencyNumber: string;
  bestTime: string;
  tips: string[];
  faqs: { q: string; a: string }[];
  isPublished: boolean;
};

function GuidesPage() {
  const load = useServerFn(listAdminDestinationContent);
  const save = useServerFn(saveAdminDestinationContent);
  const remove = useServerFn(deleteAdminDestinationContent);
  const client = useQueryClient();
  const guides = useQuery({ queryKey: ["admin-guides"], queryFn: () => load() });
  const invalidate = () => client.invalidateQueries({ queryKey: ["admin-guides"] });
  const saveMutation = useMutation({ mutationFn: save, onSuccess: invalidate });
  const deleteMutation = useMutation({ mutationFn: remove, onSuccess: invalidate });
  const [adding, setAdding] = useState(false);

  return (
    <AdminShell title="Destination guides" description="Local content for each country page — what search visitors read before they buy.">
      {guides.isLoading ? (
        <p className="flex items-center gap-2 py-16 text-muted-foreground"><Loader2 className="animate-spin" />Loading guides…</p>
      ) : (
        <div className="grid gap-4">
          {guides.data?.map((guide) => (
            <GuideEditor
              key={guide.id}
              guide={guide}
              saving={saveMutation.isPending}
              onSave={(draft) => saveMutation.mutate({ data: { ...draft, id: guide.id } })}
              onDelete={() => deleteMutation.mutate({ data: { id: guide.id } })}
            />
          ))}
          {adding ? (
            <GuideEditor
              saving={saveMutation.isPending}
              onSave={(draft) => saveMutation.mutate({ data: draft }, { onSuccess: () => setAdding(false) })}
              onDelete={() => setAdding(false)}
            />
          ) : (
            <button type="button" onClick={() => setAdding(true)} className="flex min-h-24 items-center justify-center gap-2 rounded-md border border-dashed border-border p-5 text-sm font-bold text-muted-foreground hover:text-foreground">
              <Plus /> Add a destination guide
            </button>
          )}
        </div>
      )}
    </AdminShell>
  );
}

function parseFaqs(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [q, ...rest] = line.split("|");
      return { q: (q ?? "").trim(), a: rest.join("|").trim() };
    })
    .filter((item) => item.q && item.a);
}

function GuideEditor({ guide, onSave, onDelete, saving }: {
  guide?: Guide;
  onSave: (draft: GuideDraft) => void;
  onDelete: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    slug: guide?.slug ?? "",
    country: guide?.country ?? "",
    intro: guide?.intro ?? "",
    coverage: guide?.coverage ?? "",
    capital: guide?.capital ?? "",
    currency: guide?.currency ?? "",
    languages: guide?.languages ?? "",
    powerPlug: guide?.power_plug ?? "",
    emergencyNumber: guide?.emergency_number ?? "",
    bestTime: guide?.best_time ?? "",
  });
  const [tips, setTips] = useState(Array.isArray(guide?.tips) ? (guide!.tips as string[]).join("\n") : "");
  const [faqs, setFaqs] = useState(
    Array.isArray(guide?.local_faqs)
      ? (guide!.local_faqs as { q: string; a: string }[]).map((item) => `${item.q} | ${item.a}`).join("\n")
      : "",
  );
  const [published, setPublished] = useState(guide?.is_published ?? true);

  useEffect(() => {
    if (!guide) return;
    setForm({
      slug: guide.slug,
      country: guide.country,
      intro: guide.intro ?? "",
      coverage: guide.coverage ?? "",
      capital: guide.capital ?? "",
      currency: guide.currency ?? "",
      languages: guide.languages ?? "",
      powerPlug: guide.power_plug ?? "",
      emergencyNumber: guide.emergency_number ?? "",
      bestTime: guide.best_time ?? "",
    });
    setPublished(guide.is_published);
  }, [guide]);

  const set = (key: keyof typeof form) => (event: { target: { value: string } }) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  return (
    <article className="rounded-md border border-border bg-card p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Country</Label>
          <Input value={form.country} onChange={set("country")} placeholder="Kenya" />
        </div>
        <div className="space-y-2">
          <Label>Page address (slug)</Label>
          <Input value={form.slug} onChange={set("slug")} placeholder="kenya" />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Opening paragraph</Label>
          <Textarea rows={4} value={form.intro} onChange={set("intro")} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Network coverage</Label>
          <Textarea rows={3} value={form.coverage} onChange={set("coverage")} />
        </div>
        <div className="space-y-2">
          <Label>Capital</Label>
          <Input value={form.capital} onChange={set("capital")} />
        </div>
        <div className="space-y-2">
          <Label>Currency</Label>
          <Input value={form.currency} onChange={set("currency")} />
        </div>
        <div className="space-y-2">
          <Label>Languages</Label>
          <Input value={form.languages} onChange={set("languages")} />
        </div>
        <div className="space-y-2">
          <Label>Power plug</Label>
          <Input value={form.powerPlug} onChange={set("powerPlug")} />
        </div>
        <div className="space-y-2">
          <Label>Emergency number</Label>
          <Input value={form.emergencyNumber} onChange={set("emergencyNumber")} />
        </div>
        <div className="space-y-2">
          <Label>Best time to visit</Label>
          <Input value={form.bestTime} onChange={set("bestTime")} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Travel tips — one per line</Label>
          <Textarea rows={4} value={tips} onChange={(event) => setTips(event.target.value)} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Local questions — one per line, as "Question | Answer"</Label>
          <Textarea rows={4} value={faqs} onChange={(event) => setFaqs(event.target.value)} />
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
        <Label className="flex items-center gap-2"><Switch checked={published} onCheckedChange={setPublished} />Published</Label>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" className="text-destructive" onClick={onDelete}><Trash2 />{guide ? "Remove" : "Cancel"}</Button>
          <Button
            size="sm"
            disabled={saving || !form.country.trim() || !form.slug.trim()}
            onClick={() => onSave({
              ...form,
              slug: form.slug.trim().toLowerCase(),
              tips: tips.split("\n").map((tip) => tip.trim()).filter(Boolean),
              faqs: parseFaqs(faqs),
              isPublished: published,
            })}
          >
            <Save />Save
          </Button>
        </div>
      </div>
    </article>
  );
}
