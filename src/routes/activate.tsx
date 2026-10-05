import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, Copy, Loader2, RefreshCw, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import weettahLogo from "@/assets/weettah-logo.png";
import { Button } from "@/components/ui/button";
import { getActivation } from "@/lib/activation.functions";
import { countryDisplayName } from "@/lib/country-names";

type Activation = Awaited<ReturnType<typeof getActivation>>;

export const Route = createFileRoute("/activate")({
  staticData: { sitemap: false },
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search["token"] === "string" ? search["token"] : undefined,
  }),
  head: () => ({ meta: [
    { title: "Install your eSIM | Weettah" },
    { name: "description", content: "Install and activate your Weettah travel eSIM." },
    { property: "og:title", content: "Install your eSIM | Weettah" },
    { property: "og:description", content: "Your private Weettah eSIM installation page." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: ActivatePage,
});

function ActivatePage() {
  const search = useSearch({ from: "/activate" });
  const load = useServerFn(getActivation);
  const [activation, setActivation] = useState<Activation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  const refresh = async () => {
    if (!search.token) { setError(true); setLoading(false); return; }
    setLoading(true);
    try { setActivation(await load({ data: { token: search.token } })); setError(false); }
    catch { setError(true); }
    finally { setLoading(false); }
  };
  useEffect(() => { void refresh(); }, [search.token]);

  const ready = activation?.status === "completed" && activation.fulfillment_status === "ready" && activation.activation_code;
  const copyCode = async () => {
    if (!activation?.activation_code) return;
    await navigator.clipboard.writeText(activation.activation_code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return <main className="min-h-screen bg-background px-5 py-8 sm:py-14">
    <div className="mx-auto max-w-5xl">
      <Link to="/" aria-label="Weettah home" className="inline-flex rounded-sm bg-card px-2 py-1.5"><img src={weettahLogo} alt="Weettah" width={1276} height={371} className="h-9 w-auto" /></Link>
      {loading ? <section className="flex min-h-[60vh] items-center justify-center"><div className="text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /><p className="mt-4 font-semibold">Preparing your Weettah eSIM…</p></div></section> : error ? <section className="mt-10 border-y border-border py-14"><p className="text-xs font-bold uppercase text-primary">Private activation</p><h1 className="mt-3 text-4xl font-extrabold">This install link isn't available.</h1><p className="mt-4 text-muted-foreground">Check that you opened the complete link from your Weettah order.</p><Button asChild variant="outline" className="mt-7"><Link to="/">Back to plans</Link></Button></section> : !ready ? <section className="mt-10 border-y border-border py-14"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div><p className="mt-7 text-xs font-bold uppercase text-primary">Activation in progress</p><h1 className="mt-3 max-w-2xl text-4xl font-extrabold sm:text-5xl">Your eSIM is being prepared.</h1><p className="mt-5 max-w-xl leading-relaxed text-muted-foreground">Your payment is confirmed. Keep this private page open and check again in a moment.</p><Button onClick={() => void refresh()} className="mt-8"><RefreshCw />Check again</Button></section> : <>
        <section className="mt-10 py-6 sm:py-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent"><Check className="h-6 w-6 text-accent-foreground" /></div>
            <div>
              <p className="text-xs font-bold uppercase text-primary">Payment confirmed</p>
              <h1 className="text-2xl font-extrabold sm:text-3xl">Your {countryDisplayName(activation.country)} eSIM is ready.</h1>
            </div>
          </div>

          <div className="mx-auto mt-8 max-w-xl overflow-hidden rounded-2xl border border-border bg-background shadow-lg">
            <div className="flex items-start justify-between bg-secondary px-6 py-6 text-secondary-foreground">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-surface/80">Weettah eSIM</p>
                <p className="mt-1 font-display text-2xl font-extrabold">{countryDisplayName(activation.country)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-surface/80">Data</p>
                <p className="mt-1 font-display text-2xl font-extrabold">{activation.data_allowance}</p>
              </div>
            </div>
            <div className="relative flex items-center justify-between bg-secondary">
              <div className="h-5 w-5 -translate-x-2.5 rounded-full bg-background" />
              <div className="flex-1 border-t-2 border-dashed border-secondary-foreground/25" />
              <div className="h-5 w-5 translate-x-2.5 rounded-full bg-background" />
            </div>
            <div className="grid gap-6 px-6 py-7 sm:grid-cols-[176px_1fr] sm:items-center">
              <div className="rounded-xl bg-card p-3">
                <div className="aspect-square overflow-hidden rounded-md bg-background p-2"><img src={`/api/public/activation/qr?token=${encodeURIComponent(search.token || "")}`} alt="QR code to install your Weettah eSIM" className="h-full w-full object-contain" /></div>
                <p className="mt-2 text-center text-xs font-semibold">Scan with your phone camera</p>
              </div>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-5">
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Validity</dt>
                  <dd className="mt-1 font-bold">{activation.validity_days} days</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</dt>
                  <dd className="mt-1 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" /><span className="font-bold">Active</span></dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">ICCID</dt>
                  <dd className="mt-1 break-all font-mono text-xs font-bold">{activation.iccid}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Booking reference</dt>
                  <dd className="mt-1 break-all font-mono text-sm font-bold">{activation.merchant_reference}</dd>
                </div>
              </dl>
            </div>
            <div className="border-t border-border px-6 py-4">
              <div className="flex h-8 items-end gap-[2px]">
                {Array.from({ length: 48 }).map((_, i) => (
                  <div key={i} className="flex-1 bg-foreground" style={{ height: `${[100, 40, 70, 100, 30, 60, 100, 45, 80, 55, 100, 35][i % 12]}%` }} />
                ))}
              </div>
              <p className="mt-2 text-center font-mono text-[10px] tracking-widest text-muted-foreground">{activation.merchant_reference}</p>
            </div>
          </div>
          <p className="mx-auto mt-6 max-w-xl text-center leading-relaxed text-muted-foreground">Install it before you travel, then turn on data roaming for the Weettah eSIM when you arrive.</p>
        </section>
        <section className="py-12"><p className="text-xs font-bold uppercase text-primary">Install manually</p><h2 className="mt-2 text-3xl font-extrabold">Can't scan the QR code?</h2><div className="mt-6 rounded-lg border border-border bg-card p-5"><p className="text-xs text-muted-foreground">Activation code</p><p className="mt-2 break-all font-mono text-sm font-semibold">{activation.activation_code}</p><Button variant="outline" className="mt-4" onClick={() => void copyCode()}>{copied ? <Check /> : <Copy />}{copied ? "Copied" : "Copy code"}</Button>{activation.apn && <p className="mt-5 border-t border-border pt-4 text-sm"><span className="text-muted-foreground">APN: </span><strong>{activation.apn}</strong></p>}</div>
          <div className="mt-8 grid gap-px overflow-hidden rounded-lg bg-border md:grid-cols-2"><article className="bg-background p-6"><Smartphone className="text-primary" /><h3 className="mt-4 text-xl font-bold">iPhone</h3><ol className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground"><li>1. Open Settings → Mobile Service.</li><li>2. Tap Add eSIM → Use QR Code.</li><li>3. Scan the code above and label it Weettah.</li><li>4. On arrival, choose Weettah for mobile data and turn on data roaming.</li></ol></article><article className="bg-background p-6"><Smartphone className="text-primary" /><h3 className="mt-4 text-xl font-bold">Android</h3><ol className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground"><li>1. Open Settings → Network & internet.</li><li>2. Tap SIMs → Add eSIM.</li><li>3. Scan the code above and label it Weettah.</li><li>4. On arrival, select Weettah for data and enable roaming.</li></ol></article></div>
        </section>
      </>}
    </div>
  </main>;
}