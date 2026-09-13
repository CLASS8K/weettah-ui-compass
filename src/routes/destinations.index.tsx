import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Footer, Header, SectionHead } from "@/components/site/chrome";
import { getDestinations } from "@/lib/plans.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/destinations/")({
  staticData: { sitemap: true },
  loader: async () => ({ destinations: await getDestinations() }),
  head: () => ({
    meta: [
      { title: "Travel eSIM destinations — Weettah" },
      { name: "description", content: "Browse Weettah travel eSIM data plans by country, with clear one-off prices and local network coverage." },
      { property: "og:title", content: "Travel eSIM destinations — Weettah" },
      { property: "og:description", content: "Find a data plan for your next trip, from Africa to everywhere." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DestinationsPage,
});

function DestinationsPage() {
  const { destinations } = Route.useLoaderData();
  const list = destinations ?? [];
  const regions = useMemo(() => ["All", ...Array.from(new Set(list.map((item) => item.region))).sort()], [list]);
  const [region, setRegion] = useState("All");
  const [query, setQuery] = useState("");
  const visible = useMemo(
    () => list.filter((item) => (region === "All" || item.region === region) && item.country.toLowerCase().includes(query.trim().toLowerCase())),
    [list, region, query],
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <section className="bg-secondary text-secondary-foreground">
          <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
            <p className="text-xs font-bold uppercase text-surface">{list.length} destinations live</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-extrabold leading-tight sm:text-6xl">Data plans for wherever you're going next.</h1>
            <p className="mt-5 max-w-2xl leading-relaxed text-secondary-foreground/80">Pick a country to see every Weettah plan for it — how much data, how many days, and what you pay in total. No roaming surcharges, no contracts.</p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <SectionHead label="Browse" title="Choose your destination" />
            <div className="relative w-full lg:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a country" aria-label="Search a country" className="h-12 pl-10" />
            </div>
          </div>

          <div className="mt-8 flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Filter destinations by region">
            {regions.map((item) => (
              <Button key={item} variant={region === item ? "default" : "outline"} role="tab" aria-selected={region === item} onClick={() => setRegion(item)} className={cn("shrink-0")}>{item}</Button>
            ))}
          </div>

          {visible.length === 0 ? (
            <p className="py-16 text-center text-muted-foreground">No destinations found. Try another search.</p>
          ) : (
            <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((item) => (
                <Link key={item.slug} to="/destinations/$slug" params={{ slug: item.slug }} className="group flex flex-col bg-background p-6 transition-colors hover:bg-surface">
                  <div className="flex items-start justify-between">
                    <span className="text-3xl" aria-hidden>{item.flag}</span>
                    {item.popular && <span className="text-xs font-bold uppercase text-primary">Popular</span>}
                  </div>
                  <h2 className="mt-8 text-xl font-bold">{item.country}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{item.region} · {item.plans.length} plan{item.plans.length === 1 ? "" : "s"}</p>
                  <div className="mt-auto flex items-end justify-between pt-8">
                    <p>
                      <span className="text-xs text-muted-foreground">From</span>
                      <span className="block font-display text-2xl font-extrabold">{item.fromPrice}</span>
                    </p>
                    <ArrowRight className="text-primary transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
