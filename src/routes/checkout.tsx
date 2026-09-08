import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Check, Clock3, RotateCw, X } from "lucide-react";
import weettahLogo from "@/assets/weettah-logo.png";
import { Button } from "@/components/ui/button";
import { checkPayment } from "@/lib/payments.functions";

type Result = Awaited<ReturnType<typeof checkPayment>>;

export const Route = createFileRoute("/checkout")({
  validateSearch: (search: Record<string, unknown>) => ({
    OrderTrackingId: typeof search["OrderTrackingId"] === "string" ? search["OrderTrackingId"] : undefined,
    OrderMerchantReference: typeof search["OrderMerchantReference"] === "string" ? search["OrderMerchantReference"] : undefined,
    cancelled: search["cancelled"] === "true",
  }),
  head: () => ({
    meta: [
      { title: "Payment status — Weettah" },
      { name: "description", content: "Check the status of your Weettah eSIM payment." },
      { property: "og:title", content: "Payment status — Weettah" },
      { property: "og:description", content: "Your secure Weettah eSIM payment status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CheckoutStatus,
});

function CheckoutStatus() {
  const search = useSearch({ from: "/checkout" });
  const verify = useServerFn(checkPayment);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadStatus = async () => {
    if (!search.OrderTrackingId) return;
    setRefreshing(true);
    setError(false);
    try {
      setResult(await verify({ data: { trackingId: search.OrderTrackingId, reference: search.OrderMerchantReference } }));
    } catch {
      setError(true);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { void loadStatus(); }, [search.OrderTrackingId]);

  const completed = result?.status === "completed";
  const failed = result?.status === "failed" || result?.status === "invalid" || result?.status === "cancelled" || search.cancelled;

  return (
    <main className="min-h-screen bg-background px-5 py-8 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <Link to="/" aria-label="Weettah home" className="inline-flex rounded-sm bg-card px-2 py-1.5">
          <img src={weettahLogo} alt="Weettah" width={1276} height={371} className="h-9 w-auto" />
        </Link>
        <section className="mt-10 border-y border-border py-10 sm:py-14">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface">
            {completed ? <Check className="h-7 w-7 text-accent" /> : failed ? <X className="h-7 w-7 text-destructive" /> : <Clock3 className="h-7 w-7 text-primary" />}
          </div>
          <p className="mt-7 text-xs font-bold uppercase text-primary">Payment status</p>
          <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">
            {completed ? "You're connected." : failed ? "Payment wasn't completed." : "We're confirming your payment."}
          </h1>
          <p className="mt-5 max-w-xl leading-relaxed text-muted-foreground">
            {completed
              ? `Your ${result.country} eSIM details will be sent to ${result.email}.`
              : failed
                ? "No eSIM has been issued. You can return to the plans and try again."
                : error
                  ? "We couldn't refresh the payment yet. Your money is safe—try checking again in a moment."
                  : "Mobile-money confirmations can take a moment. You can safely keep this page open."}
          </p>

          {result && (
            <dl className="mt-8 divide-y divide-border border-y border-border text-sm">
              <div className="flex justify-between gap-6 py-4"><dt className="text-muted-foreground">Plan</dt><dd className="text-right font-bold">{result.country} · {result.data} · {result.days} days</dd></div>
              <div className="flex justify-between gap-6 py-4"><dt className="text-muted-foreground">Total</dt><dd className="font-bold">{result.price}</dd></div>
              {result.paymentMethod && <div className="flex justify-between gap-6 py-4"><dt className="text-muted-foreground">Paid with</dt><dd className="font-bold">{result.paymentMethod}</dd></div>}
              <div className="flex justify-between gap-6 py-4"><dt className="text-muted-foreground">Reference</dt><dd className="max-w-[65%] break-all text-right font-bold">{result.reference}</dd></div>
            </dl>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {!completed && !failed && search.OrderTrackingId && <Button onClick={() => void loadStatus()} disabled={refreshing}>{refreshing ? <RotateCw className="animate-spin" /> : <RotateCw />}Check again</Button>}
            <Button variant={completed ? "default" : "outline"} asChild><Link to="/" hash="destinations">{completed ? "Explore more plans" : "Back to plans"}</Link></Button>
          </div>
        </section>
        <p className="mt-6 text-sm text-muted-foreground">Need help? Keep your payment reference and contact Weettah support.</p>
      </div>
    </main>
  );
}