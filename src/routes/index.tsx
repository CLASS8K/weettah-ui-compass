import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, Check, Menu, Search, X } from "lucide-react";
import heroImage from "@/assets/weettah-africa-hero.jpg";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { faqs, plans, regions, stats, steps } from "@/components/site/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Weettah — Africa-first travel eSIM" },
      { name: "description", content: "An African-made travel eSIM with instant data in 180+ countries. Clear prices, quick setup, and support that understands your journey." },
      { property: "og:title", content: "Weettah — Africa-first travel eSIM" },
      { property: "og:description", content: "Travel data made in Africa, for everywhere you go." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const nav = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Destinations", href: "#destinations" },
  { label: "Why Weettah", href: "#why" },
  { label: "FAQs", href: "#faq" },
];

function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <a href="#top" className={cn("font-display text-2xl font-extrabold", light && "text-primary-foreground")}>
      weettah<span className="text-primary">.</span>
    </a>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header id="top" className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Wordmark />
        <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
          {nav.map((item) => <a key={item.href} href={item.href} className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">{item.label}</a>)}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="sm">Log in</Button>
          <Button size="sm" asChild><a href="#destinations">Get connected <ArrowRight /></a></Button>
        </div>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((value) => !value)}>
          {open ? <X /> : <Menu />}
        </Button>
      </div>
      {open && (
        <div className="border-t border-border bg-background px-5 py-5 md:hidden">
          <nav className="flex flex-col" aria-label="Mobile navigation">
            {nav.map((item) => <a key={item.href} href={item.href} onClick={() => setOpen(false)} className="border-b border-border py-4 font-semibold">{item.label}</a>)}
          </nav>
          <Button className="mt-5 w-full" asChild><a href="#destinations">Get connected <ArrowRight /></a></Button>
        </div>
      )}
    </header>
  );
}

function Hero() {
  return (
    <section className="relative min-h-[calc(84svh-4rem)] overflow-hidden bg-secondary text-secondary-foreground">
      <img src={heroImage} alt="African traveller using Weettah on a rooftop in Marrakech" width={1920} height={1280} className="absolute inset-0 h-full w-full object-cover object-[68%_center]" />
      <div className="absolute inset-0 bg-secondary/65" />
      <div className="relative mx-auto flex min-h-[calc(84svh-4rem)] max-w-7xl items-end px-5 py-12 sm:items-center lg:px-8 lg:py-20">
        <div className="max-w-3xl">
          <p className="mb-5 text-sm font-bold uppercase text-surface">African-made · Worldwide connection</p>
          <h1 className="text-5xl font-extrabold leading-[0.96] sm:text-7xl lg:text-8xl">Made here.<br /><span className="text-surface">Ready everywhere.</span></h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-secondary-foreground/85 sm:text-lg">Fast, fair travel data built with African journeys in mind. Choose a plan, install in minutes, and arrive online in 180+ countries.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="h-12 px-6" asChild><a href="#destinations">Find your destination <ArrowRight /></a></Button>
            <Button size="lg" variant="outline" className="h-12 border-secondary-foreground/50 bg-secondary/20 text-secondary-foreground hover:bg-secondary-foreground hover:text-secondary" asChild><a href="#how-it-works">See how it works</a></Button>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
            {["Keep your number", "No surprise roaming", "Instant delivery"].map((item) => <span key={item} className="flex items-center gap-2"><Check className="text-surface" />{item}</span>)}
          </div>
        </div>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className="bg-accent text-accent-foreground">
      <div className="mx-auto grid max-w-7xl grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => <div key={stat.label} className="border-b border-accent-foreground/20 px-5 py-7 lg:border-b-0 lg:border-r lg:last:border-r-0"><p className="font-display text-3xl font-extrabold sm:text-4xl">{stat.value}</p><p className="mt-1 text-xs font-semibold uppercase text-accent-foreground/75">{stat.label}</p></div>)}
      </div>
    </section>
  );
}

function SectionHead({ label, title, body }: { label: string; title: string; body?: string }) {
  return <div className="max-w-2xl"><p className="text-xs font-bold uppercase text-primary">{label}</p><h2 className="mt-3 text-4xl font-extrabold leading-tight sm:text-5xl">{title}</h2>{body && <p className="mt-4 leading-relaxed text-muted-foreground">{body}</p>}</div>;
}

function Steps() {
  return (
    <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
      <SectionHead label="Simple by design" title="From choosing to connected in three steps." />
      <ol className="mt-12 grid border-y border-border md:grid-cols-3">
        {steps.map((step, index) => <li key={step.title} className="border-b border-border py-8 md:border-b-0 md:border-r md:px-8 md:first:pl-0 md:last:border-r-0"><p className="font-display text-5xl font-extrabold text-primary">0{index + 1}</p><h3 className="mt-8 text-xl font-bold">{step.title}</h3><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.body}</p></li>)}
      </ol>
    </section>
  );
}

function Plans() {
  const [region, setRegion] = useState("All");
  const [query, setQuery] = useState("");
  const visible = useMemo(() => plans.filter((plan) => (region === "All" || plan.region === region) && plan.country.toLowerCase().includes(query.trim().toLowerCase())), [region, query]);
  return (
    <section id="destinations" className="bg-secondary text-secondary-foreground">
      <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <SectionHead label="Go near. Go far." title="Where are you headed?" body="Straightforward prices. Local network coverage. No activation fee." />
          <div className="relative w-full lg:max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-foreground/60" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a country" aria-label="Search a country" className="h-12 border-secondary-foreground/30 bg-secondary-foreground/10 pl-10 text-secondary-foreground placeholder:text-secondary-foreground/60" /></div>
        </div>
        <div className="mt-8 flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Filter plans by region">
          {regions.map((item) => <Button key={item} variant={region === item ? "default" : "outline"} onClick={() => setRegion(item)} role="tab" aria-selected={region === item} className={cn("shrink-0", region !== item && "border-secondary-foreground/30 bg-transparent text-secondary-foreground hover:bg-secondary-foreground hover:text-secondary")}>{item}</Button>)}
        </div>
        {visible.length === 0 ? <p className="py-16 text-center text-secondary-foreground/70">No plans found. Try another destination.</p> : (
          <div className="mt-8 grid gap-px overflow-hidden rounded-lg bg-secondary-foreground/20 sm:grid-cols-2 lg:grid-cols-4">
            {visible.map((plan) => <article key={plan.country} className="flex min-h-64 flex-col bg-secondary p-6 transition-colors hover:bg-secondary-foreground/5"><div className="flex items-start justify-between"><span className="text-3xl" aria-hidden>{plan.flag}</span>{plan.popular && <span className="text-xs font-bold uppercase text-surface">Popular</span>}</div><h3 className="mt-8 text-xl font-bold">{plan.country}</h3><p className="mt-1 text-sm text-secondary-foreground/65">{plan.data} · {plan.days} days</p><div className="mt-auto flex items-end justify-between pt-8"><p><span className="text-xs text-secondary-foreground/60">From</span><span className="block font-display text-2xl font-extrabold">{plan.price}</span></p><Button size="icon" aria-label={`Choose ${plan.country} plan`}><ArrowRight /></Button></div></article>)}
          </div>
        )}
      </div>
    </section>
  );
}

const promises = [
  ["01", "Africa-first, not Africa-afterthought", "Built around the routes, payment realities, and support needs of African travellers."],
  ["02", "Prices that say what they mean", "The price you see is the price you pay. No roaming shock waiting at home."],
  ["03", "Human help, across time zones", "Real support when you need it, whether you're in Accra, London, Dubai, or beyond."],
  ["04", "One eSIM, more journeys", "Top up as you move. Keep your usual SIM in place for calls, texts, and WhatsApp."],
];

function Why() {
  return (
    <section id="why" className="bg-surface"><div className="mx-auto grid max-w-7xl gap-14 px-5 py-20 lg:grid-cols-[0.8fr_1.2fr] lg:px-8 lg:py-28"><SectionHead label="Made on the continent" title="Connection that gets where you're coming from." body="Weettah is proudly African-made and built to make the world feel closer — without the roaming runaround." /><div className="divide-y divide-border border-y border-border">{promises.map(([number, title, body]) => <div key={number} className="grid grid-cols-[3rem_1fr] gap-4 py-6"><span className="font-display font-bold text-primary">{number}</span><div><h3 className="text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p></div></div>)}</div></div></section>
  );
}

function Faq() {
  return (
    <section id="faq" className="mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-[0.75fr_1.25fr] lg:px-8 lg:py-28"><SectionHead label="Good to know" title="Questions, answered plainly." body="Everything you need before you connect." /><Accordion type="single" collapsible>{faqs.map((item) => <AccordionItem key={item.q} value={item.q}><AccordionTrigger className="py-5 text-left text-base font-bold hover:no-underline">{item.q}</AccordionTrigger><AccordionContent className="max-w-2xl pb-5 leading-relaxed text-muted-foreground">{item.a}</AccordionContent></AccordionItem>)}</Accordion></section>
  );
}

function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground"><div className="mx-auto max-w-7xl px-5 py-16 lg:px-8"><div className="flex flex-col justify-between gap-10 border-b border-secondary-foreground/20 pb-14 lg:flex-row lg:items-end"><div><Wordmark light /><h2 className="mt-8 max-w-2xl text-4xl font-extrabold sm:text-6xl">The world is calling.<br /><span className="text-surface">Pick up connected.</span></h2></div><Button size="lg" asChild><a href="#destinations">Choose a plan <ArrowRight /></a></Button></div><div className="flex flex-col justify-between gap-6 pt-8 text-sm text-secondary-foreground/60 sm:flex-row"><p>© {new Date().getFullYear()} Weettah. African-made. Globally connected.</p><div className="flex gap-6"><a href="#top">Terms</a><a href="#top">Privacy</a><a href="#faq">Support</a></div></div></div></footer>
  );
}

function Home() {
  return <div className="min-h-screen bg-background"><Header /><main><Hero /><Stats /><Steps /><Plans /><Why /><Faq /></main><Footer /></div>;
}