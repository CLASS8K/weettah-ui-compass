import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, RefreshCw, XCircle } from "lucide-react";
import weettahLogo from "@/assets/weettah-logo.png";
import { Button } from "@/components/ui/button";
import { confirmPayment } from "@/lib/payments.functions";

// PayChangu sends the customer here after paying (callback_url) or after
// cancelling / failing (return_url). We confirm server-side, then hand off to
// the private install page.
export const Route = createFileRoute("/payment/complete")({
  staticData: { sitemap: false },
  validateSearch: (search: Record<string, unknown>) => ({
    tx_ref: typeof search["tx_ref"] === "string" ? search["tx_ref"] : undefined,
    status: typeof search["status"] === "string" ? search["status"] : undefined,
  }),
  head: () => ({ meta: [
    { title: "Confirming your payment | Weettah" },
    { name: "robots", content: "noindex" },
  ] }),
  component: PaymentCompletePage,
});

type View = "checking" | "pending" | "failed" | "missing";
const MAX_ATTEMPTS = 6;

function PaymentCompletePage() {
  const search = useSearch({ from: "/payment/complete" });
  const navigate = useNavigate();
  const confirm = useServerFn(confirmPayment);
  const [view, setView] = useState<View>("checking");
  const attempts = useRef(0);

  const check = async () => {
    if (!search.tx_ref) { setView("missing"); return; }
    setView("checking");
    try {
      const result = await confirm({ data: { reference: search.tx_ref } });
      if (result.state === "paid") {
        await navigate({ to: "/activate", search: { token: result.activationToken }, replace: true });
        return;
      }
      if (result.state === "failed") { setView("failed"); return; }
      if (result.state === "not_found") { setView("missing"); return; }
      // return_url sends status=failed when the customer cancels or the charge fails.
      if (search.status === "failed") { setView("failed"); return; }
      // Mobile money can take a few seconds to settle after the customer approves.
      attempts.current += 1;
      if (attempts.current < MAX_ATTEMPTS) { setTimeout(() => void check(), 4000); return; }
      setView("pending");
    } catch {
      setView("pending");
    }
  };
  useEffect(() => { attempts.current = 0; void check(); }, [search.tx_ref]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-3xl items-center px-5">
          <Link to="/" className="inline-flex items-center" aria-label="Weettah home">
            <img src={weettahLogo} alt="Weettah" width={1276} height={371} className="h-8 w-auto" />
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-16">
        {view === "checking" && (
          <section className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <h1 className="mt-6 text-3xl font-extrabold sm:text-4xl">Confirming your payment…</h1>
            <p className="mt-3 text-muted-foreground">If you paid with mobile money, this can take a few seconds. Please keep this page open.</p>
          </section>
        )}
        {view === "pending" && (
          <section>
            <p className="text-xs font-bold uppercase text-primary">Still checking</p>
            <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">We haven't received confirmation yet.</h1>
            <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">If money left your account, don't pay again. Confirmation can lag for mobile money. Check again in a minute, or look up your order any time with your email and this reference.</p>
            {search.tx_ref && <p className="mt-6 break-all font-mono text-sm font-bold">{search.tx_ref}</p>}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button onClick={() => { attempts.current = 0; void check(); }}><RefreshCw />Check again</Button>
              <Button variant="outline" asChild><Link to="/my-esim">Find my eSIM</Link></Button>
            </div>
          </section>
        )}
        {view === "failed" && (
          <section>
            <XCircle className="h-10 w-10 text-destructive" />
            <h1 className="mt-5 text-3xl font-extrabold sm:text-4xl">Payment didn't go through.</h1>
            <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">You haven't been charged for this order. You can choose your plan again and retry, or email support@weettah.com if something looks wrong.</p>
            <Button className="mt-8" asChild><Link to="/destinations">Choose a plan</Link></Button>
          </section>
        )}
        {view === "missing" && (
          <section>
            <h1 className="text-3xl font-extrabold sm:text-4xl">We couldn't find that payment.</h1>
            <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">Open the link from your payment confirmation again, or look up your order with your email and reference.</p>
            <Button className="mt-8" variant="outline" asChild><Link to="/my-esim">Find my eSIM</Link></Button>
          </section>
        )}
      </main>
    </div>
  );
}
