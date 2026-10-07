import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, RefreshCw, Save, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getAdminPricing, importAdminPriceCsv, syncAdminSupplierPrices, updateAdminPricing } from "@/lib/pricing.functions";

const STALE_RATE_DAYS = 7;

// Minimal RFC 4180 parser: the Price Viewer export quotes fields that contain commas.
function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { field += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") { row.push(field); field = ""; }
    else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += char;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((cell) => cell.trim()));
}

// Reads the eSIM Access Price Viewer export: "ID" is the package code, "Price(USD)" our cost.
function priceRowsFromCsv(text: string) {
  const [header, ...body] = parseCsv(text);
  if (!header) throw new Error("The file is empty.");
  const codeIndex = header.findIndex((h) => h.trim().toLowerCase() === "id");
  const priceIndex = header.findIndex((h) => h.trim().toLowerCase() === "price(usd)");
  if (codeIndex < 0 || priceIndex < 0) throw new Error("Expected the eSIM Access price export with “ID” and “Price(USD)” columns.");
  return body
    .map((cells) => ({ code: (cells[codeIndex] ?? "").trim(), wholesaleUsd: Number((cells[priceIndex] ?? "").replace(/[$,\s]/g, "")) }))
    .filter((row) => row.code && Number.isFinite(row.wholesaleUsd) && row.wholesaleUsd > 0);
}

function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

export function PricingPanel() {
  const load = useServerFn(getAdminPricing);
  const save = useServerFn(updateAdminPricing);
  const sync = useServerFn(syncAdminSupplierPrices);
  const importCsv = useServerFn(importAdminPriceCsv);
  const client = useQueryClient();
  const pricing = useQuery({ queryKey: ["admin-pricing"], queryFn: () => load() });
  const fileInput = useRef<HTMLInputElement>(null);

  const [rate, setRate] = useState("");
  const [markup, setMarkup] = useState("");
  const [floor, setFloor] = useState("");
  const [rounding, setRounding] = useState("");
  const [cardUsd, setCardUsd] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!pricing.data) return;
    setRate(String(pricing.data.mwkPerUsd));
    setMarkup(String(pricing.data.markup));
    setFloor(String(pricing.data.minMarkup));
    setRounding(String(pricing.data.mwkRounding));
    setCardUsd(pricing.data.cardUsdEnabled);
  }, [pricing.data]);

  const refresh = () => Promise.all([
    client.invalidateQueries({ queryKey: ["admin-pricing"] }),
    client.invalidateQueries({ queryKey: ["admin-plans"] }),
  ]);

  const saveMutation = useMutation({
    mutationFn: () => save({ data: { mwkPerUsd: Number(rate), markup: Number(markup), minMarkup: Number(floor), mwkRounding: Number(rounding), cardUsdEnabled: cardUsd } }),
    onSuccess: (result) => { setMessage(result.repriced ? `Saved. ${result.repriced} plans repriced.` : "Saved. New prices are live."); void refresh(); },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Unable to save"),
  });
  const syncMutation = useMutation({
    mutationFn: () => sync(),
    onSuccess: (r) => { setMessage(`Synced from eSIM Access: ${r.matched} plans matched, ${r.costsChanged} costs changed, ${r.repriced} prices updated.`); void refresh(); },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Sync failed"),
  });
  const csvMutation = useMutation({
    mutationFn: async (file: File) => importCsv({ data: { rows: priceRowsFromCsv(await file.text()) } }),
    onSuccess: (r) => { setMessage(`Imported price list: ${r.matched} plans matched, ${r.costsChanged} costs changed, ${r.repriced} prices updated.`); void refresh(); },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Import failed"),
  });

  if (pricing.isLoading) return <p className="flex items-center gap-2 py-6 text-muted-foreground"><Loader2 className="animate-spin" />Loading pricing…</p>;
  if (!pricing.data) return <p className="py-6 text-destructive">Pricing settings could not be loaded.</p>;

  const data = pricing.data;
  const rateAge = daysSince(data.rateUpdatedAt);
  const busy = saveMutation.isPending || syncMutation.isPending || csvMutation.isPending;
  const example = Number(rate) > 0 && Number(markup) > 0 ? Math.ceil((10 * Number(markup) * Number(rate)) / (Number(rounding) || 50)) * (Number(rounding) || 50) : null;

  return (
    <section className="mb-8 rounded-md border border-border bg-card p-5" aria-labelledby="pricing-heading">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="pricing-heading" className="text-lg font-bold">Pricing</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Customers see and pay kwacha. Set the rate to what replacing a dollar actually costs you, not the bank rate.
            A plan's price is wholesale × markup, never below wholesale × floor.
          </p>
        </div>
        <p className={`text-sm font-bold ${rateAge >= STALE_RATE_DAYS ? "text-destructive" : "text-muted-foreground"}`}>
          Rate last changed {rateAge === 0 ? "today" : `${rateAge} day${rateAge === 1 ? "" : "s"} ago`}
        </p>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2"><Label htmlFor="pricing-rate">MWK per USD</Label><Input id="pricing-rate" type="number" min="1000" max="20000" step="1" value={rate} onChange={(e) => setRate(e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="pricing-markup">Markup on wholesale</Label><Input id="pricing-markup" type="number" min="1" max="3" step="0.01" value={markup} onChange={(e) => setMarkup(e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="pricing-floor">Floor (minimum markup)</Label><Input id="pricing-floor" type="number" min="1" max="3" step="0.01" value={floor} onChange={(e) => setFloor(e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="pricing-rounding">Round prices up to (MWK)</Label><Input id="pricing-rounding" type="number" min="1" max="1000" step="1" value={rounding} onChange={(e) => setRounding(e.target.value)} /></div>
      </div>
      {example !== null && <p className="mt-3 text-xs text-muted-foreground">Example: a plan costing us $10.00 sells for MWK {example.toLocaleString("en")}{Number(markup) > 0 ? ` (or $${(10 * Number(markup)).toFixed(2)} by international card, if enabled)` : ""}.</p>}

      <div className="mt-5 rounded-md border border-border p-4">
        <Label className="flex items-center gap-3 font-bold"><Switch checked={cardUsd} onCheckedChange={setCardUsd} />Let international Visa/Mastercard pay in US dollars</Label>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Mobile money is always charged in kwacha. When this is on, checkout also offers card payment in USD at wholesale × markup.
          Only turn it on once PayChangu confirms USD card payments settle to you in US dollars. If they convert to kwacha at the official rate, every USD sale loses money.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-5">
        <Button size="sm" onClick={() => saveMutation.mutate()} disabled={busy}><Save />Save pricing</Button>
        <Button size="sm" variant="outline" onClick={() => syncMutation.mutate()} disabled={busy}>{syncMutation.isPending ? <Loader2 className="animate-spin" /> : <RefreshCw />}Sync supplier prices now</Button>
        <Button size="sm" variant="outline" onClick={() => fileInput.current?.click()} disabled={busy}>{csvMutation.isPending ? <Loader2 className="animate-spin" /> : <Upload />}Import price CSV</Button>
        <input ref={fileInput} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) csvMutation.mutate(file); e.target.value = ""; }} />
        <p className="text-xs text-muted-foreground">
          {data.costedPlans} plans have a known cost{data.lastCostSync ? ` · last cost update ${new Date(data.lastCostSync).toLocaleString("en-GB")}` : ""}
        </p>
      </div>
      {message && <p className="mt-3 text-sm" role="status">{message}</p>}
    </section>
  );
}
