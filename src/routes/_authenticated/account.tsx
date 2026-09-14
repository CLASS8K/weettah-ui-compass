import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Loader2, LogOut, RefreshCw } from "lucide-react";
import { Wordmark } from "@/components/site/chrome";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getMyAccount, type AccountOrder } from "@/lib/account.functions";

export const Route = createFileRoute("/_authenticated/account")({
  staticData: { sitemap: false },
  head: () => ({ meta: [
    { title: "My account — Weettah" },
    { name: "description", content: "View your Weettah orders and manage your eSIMs in one place." },
    { name: "robots", content: "noindex" },
  ] }),
  component: AccountPage,
});

const statusCopy: Record<AccountOrder["esimStatus"], { title: string; body: string }> = {
  ready: { title: "eSIM ready", body: "Open your install page to scan the QR code or copy the manual code." },
  preparing: { title: "Preparing your eSIM", body: "This usually takes a minute or two. Refresh shortly." },
  not_paid: { title: "Payment pending", body: "Online payment is not available yet. Our team will contact you with the next steps for this order." },
  attention: { title: "Needs our attention", body: "Your payment went through but the eSIM didn't issue. Contact support with this reference and we'll sort it out." },
};

function AccountPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const loadAccount = useServerFn(getMyAccount);
  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ["my-account"],
    queryFn: () => loadAccount(),
  });

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-5">
          <Wordmark />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild><Link to="/destinations">Buy a plan</Link></Button>
            <Button variant="outline" size="sm" onClick={signOut}><LogOut />Sign out</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-14">
        <p className="text-xs font-bold uppercase text-primary">My account</p>
        <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">Your orders and eSIMs</h1>
        <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">
          {data?.email ? `Signed in as ${data.email}. ` : ""}Everything bought with this email address appears here.
        </p>

        <div className="mt-8 flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}>
            {isFetching ? <Loader2 className="animate-spin" /> : <RefreshCw />}Refresh
          </Button>
        </div>

        {isLoading && <p className="mt-10 text-sm text-muted-foreground">Loading your orders…</p>}

        {isError && (
          <p role="alert" className="mt-10 rounded-md bg-surface px-4 py-3 text-sm font-semibold text-surface-foreground">
            We couldn't load your orders right now. Please try refreshing in a moment.
          </p>
        )}

        {data && data.orders.length === 0 && (
          <div className="mt-10 rounded-lg border border-border p-8">
            <h2 className="text-xl font-extrabold">No orders yet</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Once you reserve a plan with this email address, it will show up here with its eSIM status.
            </p>
            <Button className="mt-6" asChild><Link to="/destinations">Browse destinations <ArrowRight /></Link></Button>
          </div>
        )}

        {data && data.orders.length > 0 && (
          <ul className="mt-10 space-y-5">
            {data.orders.map((order) => (
              <li key={order.reference} className="overflow-hidden rounded-lg border border-border">
                <div className="flex flex-wrap items-start justify-between gap-3 bg-secondary px-6 py-5 text-secondary-foreground">
                  <div>
                    <p className="text-xs font-bold uppercase text-surface">Order {order.reference}</p>
                    <h2 className="mt-2 text-2xl font-extrabold">{order.country}</h2>
                    <p className="mt-1 text-secondary-foreground/75">{order.data} · {order.days} days · {order.price}</p>
                  </div>
                  <span className="rounded-full bg-background px-3 py-1 text-xs font-bold text-foreground">{order.paymentStatus}</span>
                </div>
                <div className="space-y-4 px-6 py-6">
                  <div>
                    <h3 className="font-bold">{statusCopy[order.esimStatus].title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{statusCopy[order.esimStatus].body}</p>
                  </div>
                  {order.activationUrl && (
                    <Button size="lg" className="h-12 w-full sm:w-auto" asChild>
                      <a href={order.activationUrl}>Open my install page <ArrowRight /></a>
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">Ordered {new Date(order.purchasedAt).toLocaleDateString()}</p>
                </div>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-12 text-sm text-muted-foreground">
          Bought with a different email? <Link to="/my-esim" className="font-semibold underline">Look up that order</Link>.
        </p>
      </main>
    </div>
  );
}
