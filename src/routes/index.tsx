import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { faqs, plans, regions, stats, steps } from "@/components/site/data";
import {
  Check,
  Globe2,
  Menu,
  QrCode,
  Search,
  ShieldCheck,
  Signal,
  Wallet,
  X,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Weettah — Travel eSIM data in 180+ countries" },
      {
        name: "description",
        content:
          "Buy a travel eSIM in under a minute. Instant delivery, clear prices, data in 180+ countries — keep your own number while you travel.",
      },
      { property: "og:title", content: "Weettah — Travel eSIM data in 180+ countries" },
      {
        property: "og:description",
        content:
          "Instant eSIM delivery, clear prices and 24/7 human support. Land connected in 180+ countries.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Stats />
        <Steps />
        <Plans />
        <Why />
        <Faq />
        <CtaBand />
      </main>
      <Footer />
    </div>
  );
}

const nav = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Destinations", href: "#destinations" },
  { label: "Why Weettah", href: "#why" },
  { label: "FAQ", href: "#faq" },
];

function Wordmark() {
  return (
    <a href="#top" className="flex items-center gap-2">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
        <Signal className="h-4 w-4" />
      </span>
      <span className="font-display text-lg font-bold tracking-tight">weettah</span>
    </a>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header
      id="top"
      className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Wordmark />
        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {nav.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {n.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            Log in
          </Button>
          <Button size="sm" asChild>
            <a href="#destinations">Find your plan</a>
          </Button>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="grid h-10 w-10 place-items-center rounded-lg border border-border md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-border bg-background px-5 py-4 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {nav.map((n) => (
              <a
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-3 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                {n.label}
              </a>
            ))}
          </nav>
          <Button className="mt-3 w-full" asChild>
            <a href="#destinations" onClick={() => setOpen(false)}>
              Find your plan
            </a>
          </Button>
        </div>
      )}
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]"
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            eSIM delivered in about 60 seconds
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
            Land abroad already
            <span className="block text-primary">connected.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Weettah is a travel eSIM for 180+ countries. Buy before you fly, scan one QR code, and
            use data the moment you switch off airplane mode — no shops, no roaming bills, no
            swapping out your SIM.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="h-12 px-7 text-base" asChild>
              <a href="#destinations">See plans and prices</a>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-7 text-base" asChild>
              <a href="#how-it-works">How it works</a>
            </Button>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {["Keep your own number", "No contract", "Refund if unused"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-accent" />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <PhoneMock />
      </div>
    </section>
  );
}

function PhoneMock() {
  return (
    <div className="relative mx-auto w-full max-w-[19rem]">
      <div className="rounded-[2.5rem] border border-border bg-card p-3 shadow-2xl shadow-black/40">
        <div className="rounded-[2rem] bg-surface p-5">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>9:41</span>
            <span className="flex items-center gap-1">
              <Signal className="h-3 w-3 text-accent" /> Weettah
            </span>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">Active plan</p>
          <p className="font-display text-2xl font-bold">Japan · 10 GB</p>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-full w-[62%] rounded-full bg-primary" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">6.2 GB left · 18 days remaining</p>

          <div className="mt-6 space-y-2">
            {plans.slice(0, 3).map((p) => (
              <div
                key={p.country}
                className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2.5"
              >
                <span className="flex items-center gap-2 text-sm">
                  <span aria-hidden>{p.flag}</span>
                  {p.country}
                </span>
                <span className="text-sm font-semibold text-primary">{p.price}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">
            <QrCode className="h-4 w-4" /> Install eSIM
          </div>
        </div>
      </div>
    </div>
  );
}

function Stats() {
  return (
    <section className="border-y border-border bg-surface">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px px-5 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="px-2 py-8 text-center">
            <p className="font-display text-3xl font-bold text-foreground sm:text-4xl">{s.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function SectionHead({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body?: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-bold sm:text-4xl">{title}</h2>
      {body && <p className="mt-4 text-base leading-relaxed text-muted-foreground">{body}</p>}
    </div>
  );
}

function Steps() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-5 py-20 lg:py-24">
      <SectionHead
        eyebrow="How it works"
        title="Three steps, about a minute"
        body="No queueing at an airport kiosk and no tiny plastic SIM to lose."
      />
      <ol className="mt-12 grid gap-6 md:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.title} className="rounded-2xl border border-border bg-card p-7">
            <span className="grid h-9 w-9 place-items-center rounded-full border border-primary/40 font-display text-sm font-bold text-primary">
              {i + 1}
            </span>
            <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Plans() {
  const [region, setRegion] = useState("All");
  const [query, setQuery] = useState("");

  const visible = useMemo(
    () =>
      plans.filter(
        (p) =>
          (region === "All" || p.region === region) &&
          p.country.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [region, query],
  );

  return (
    <section id="destinations" className="border-y border-border bg-surface">
      <div className="mx-auto max-w-6xl px-5 py-20 lg:py-24">
        <SectionHead
          eyebrow="Destinations"
          title="Find your plan"
          body="Prices below are what you pay — taxes included, no activation fee."
        />

        <div className="mt-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a country"
              aria-label="Search a country"
              className="h-11 bg-card pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by region">
            {regions.map((r) => (
              <button
                key={r}
                type="button"
                role="tab"
                aria-selected={region === r}
                onClick={() => setRegion(r)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm transition-colors",
                  region === r
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <p className="mt-14 text-center text-muted-foreground">
            No plans match that search yet — try another country.
          </p>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {visible.map((p) => (
              <article
                key={p.country}
                className="group relative flex flex-col rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/60"
              >
                {p.popular && (
                  <span className="absolute right-4 top-4 rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-medium text-accent">
                    Popular
                  </span>
                )}
                <span className="text-3xl" aria-hidden>
                  {p.flag}
                </span>
                <h3 className="mt-4 text-base font-semibold">{p.country}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {p.data} · {p.days} days
                </p>
                <p className="mt-5 font-display text-2xl font-bold text-primary">{p.price}</p>
                <Button variant="outline" className="mt-5 w-full">
                  Choose plan
                </Button>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

const reasons = [
  {
    icon: Wallet,
    title: "One price, no surprises",
    body: "What you see at checkout is the total. No roaming charges landing on your bill three weeks later.",
  },
  {
    icon: Globe2,
    title: "Coverage where you actually go",
    body: "180+ countries on tier-one local networks, including regional plans that follow you across borders.",
  },
  {
    icon: QrCode,
    title: "Set up before you fly",
    body: "Install on your home Wi-Fi and switch the line on when you land. No hunting for a shop in a new city.",
  },
  {
    icon: ShieldCheck,
    title: "Real people on support",
    body: "Chat with a human any hour of the day, in any time zone. Most questions are answered in minutes.",
  },
];

function Why() {
  return (
    <section id="why" className="mx-auto max-w-6xl px-5 py-20 lg:py-24">
      <SectionHead eyebrow="Why Weettah" title="Built for people who actually travel" />
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {reasons.map((r) => (
          <div key={r.title} className="flex gap-4 rounded-2xl border border-border bg-card p-7">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
              <r.icon className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-lg font-semibold">{r.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section id="faq" className="border-y border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 lg:grid-cols-[0.8fr_1.2fr] lg:py-24">
        <SectionHead
          eyebrow="FAQ"
          title="Questions before you buy"
          body="Still unsure? Support is one message away, day or night."
        />
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((f) => (
            <AccordionItem key={f.q} value={f.q} className="border-border">
              <AccordionTrigger className="py-5 text-base font-medium no-underline hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

function CtaBand() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20 lg:py-24">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card px-8 py-14 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[100px]"
        />
        <div className="relative">
          <h2 className="text-3xl font-bold sm:text-4xl">Your next trip, already online</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Pick a destination, pay once, and arrive connected. Unused eSIMs are refundable for 30
            days.
          </p>
          <Button size="lg" className="mt-8 h-12 px-8 text-base" asChild>
            <a href="#destinations">Find your plan</a>
          </Button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Wordmark />
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            Travel eSIM data in 180+ countries. Instant delivery, clear prices.
          </p>
        </div>
        {[
          { title: "Product", links: ["Destinations", "How it works", "Device support", "Top-ups"] },
          { title: "Company", links: ["About", "Blog", "Partners", "Contact"] },
          { title: "Legal", links: ["Terms", "Privacy", "Refunds", "Fair use"] },
        ].map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h3 className="text-sm font-semibold">{col.title}</h3>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l}>
                  <a
                    href="#top"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-border px-5 py-6">
        <p className="mx-auto max-w-6xl text-xs text-muted-foreground">
          © {new Date().getFullYear()} Weettah. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
