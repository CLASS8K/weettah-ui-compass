import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Loader2, Search } from "lucide-react";
import weettahLogo from "@/assets/weettah-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lookupOrder, type OrderLookupResult } from "@/lib/orders.functions";

export const Route = createFileRoute("/my-esim")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Find my eSIM — Weettah" },
      { name: "description", content: "Look up a Weettah order with your email and order reference to check payment, see your eSIM status, and reopen your install page." },
      { property: "og:title", content: "Find my eSIM — Weettah" },
      { property: "og:description", content: "Check your Weettah order and reopen your eSIM install page." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MyEsim,
});

const statusCopy: Record<string, { title: string; body: string }> = {
  ready: { title: "Your eSIM is ready", body: "Open your install page to scan the QR code or copy the manual code." },
  preparing: { title: "We're preparing your eSIM", body: "This usually takes a minute or two. Refresh this page shortly." },
  not_paid: { title: "Payment pending", body: "Online payment is not available yet. Our team will contact you with the next steps for this order." },
  attention: { title: "Something needs our attention", body: "Your payment went through but the eSIM didn't issue. Contact support with this reference and we'll sort it out." },
};

function MyEsim() {
  const lookup = useServerFn(lookupOrder);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OrderLookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    const values = new FormData(event.currentTarget);
    try {
      setResult(await lookup({ data: { email: String(values.get("email") || ""), reference: String(values.get("reference") || "") } }));
    } catch {
      setError("We couldn't check that right now. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">
          <Link to="/" className="inline-flex items-center" aria-label="Weettah home">
            <img src={weettahLogo} alt="Weettah" width={1276} height={371} className="h-8 w-auto" />
          </Link>
          <Button variant="ghost" size="sm" asChild><Link to="/">Buy a plan</Link></Button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-14">
        <h1 className="text-4xl font-extrabold sm:text-5xl">Find my eSIM</h1>
        <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">
          Enter the email you paid with and the order reference from your confirmation page. We'll show your order and reopen your install page.
        </p>
        <form onSubmit={submit} className="mt-10 grid gap-5 rounded-lg border border-border p-6 sm:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="email">Email address</Label><Input id="email" name="email" type="email" autoComplete="email" required /></div>
          <div className="space-y-2"><Label htmlFor="reference">Order reference</Label><Input id="reference" name="reference" placeholder="WTH-…" required /></div>
          <div className="sm:col-span-2">
            <Button type="submit" size="lg" className="h-12 w-full" disabled={loading}>
              {loading ? <><Loader2 className="animate-spin" />Checking…</> : <><Search />Find my order</>}
            </Button>
          </div>
        </form>

        {error && <p role="alert" className="mt-6 rounded-md bg-surface px-4 py-3 text-sm font-semibold text-surface-foreground">{error}</p>}

        {result?.found === false && (
          <p role="status" className="mt-6 rounded-md border border-border px-4 py-4 text-sm leading-relaxed">
            We couldn't find an order with that email and reference. Check both for typos — the reference is on the page you saw after paying.
          </p>
        )}

        {result?.found && (
          <article className="mt-8 overflow-hidden rounded-lg border border-border">
            <div className="bg-secondary px-6 py-6 text-secondary-foreground">
              <p className="text-xs font-bold uppercase text-surface">Order {result.reference}</p>
              <h2 className="mt-2 text-2xl font-extrabold">{result.country}</h2>
              <p className="mt-1 text-secondary-foreground/75">{result.data} · {result.days} days · {result.price}</p>
            </div>
            <div className="space-y-5 px-6 py-6">
              <div className="flex flex-wrap justify-between gap-2 border-b border-border pb-4 text-sm">
                <span className="text-muted-foreground">Payment</span>
                <span className="font-bold">{result.paymentStatus}</span>
              </div>
              <div>
                <h3 className="font-bold">{statusCopy[result.esimStatus]?.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{statusCopy[result.esimStatus]?.body}</p>
              </div>
              {result.activationUrl && (
                <Button size="lg" className="h-12 w-full" asChild>
                  <a href={result.activationUrl}>Open my install page <ArrowRight /></a>
                </Button>
              )}
              <p className="text-xs text-muted-foreground">Purchased {new Date(result.purchasedAt).toLocaleDateString()}</p>
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
