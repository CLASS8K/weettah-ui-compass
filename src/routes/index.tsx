import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, Search, ShieldCheck, Smartphone } from "lucide-react";
import heroImage from "@/assets/weettah-africa-hero.jpg";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { faqs, serviceStats, steps, trustPoints, unsupportedNote } from "@/components/site/data";
import { Footer, Header, SectionHead } from "@/components/site/chrome";
import { cn } from "@/lib/utils";
import { detectDevice, type DeviceHint } from "@/lib/device-detect";
import { getSupportedDevices } from "@/lib/devices.functions";
import { getPublicPlans, type PublicPlan as Plan } from "@/lib/plans.functions";


export const Route = createFileRoute("/")({
  loader: async () => ({ plans: await getPublicPlans(), devices: await getSupportedDevices() }),
  head: () => ({
    meta: [
      { title: "Weettah — Africa-first travel eSIM" },
      { name: "description", content: "An African-made travel eSIM with clear prices, quick setup, and support that understands your journey." },
      { property: "og:title", content: "Weettah — Africa-first travel eSIM" },
      { property: "og:description", content: "Travel data made in Africa, for everywhere you go." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});


function Hero() {
  return (
    <section className="relative min-h-[calc(84svh-4rem)] overflow-hidden bg-secondary text-secondary-foreground">
      <img src={heroImage} alt="African traveller using Weettah on a rooftop in Marrakech" width={1920} height={1280} className="absolute inset-0 h-full w-full object-cover object-[68%_center]" />
      <div className="absolute inset-0 bg-secondary/65" />
      <div className="relative mx-auto flex min-h-[calc(84svh-4rem)] max-w-7xl items-end px-5 py-12 sm:items-center lg:px-8 lg:py-20">
        <div className="max-w-3xl">
          <p className="mb-5 text-sm font-bold uppercase text-surface">African-made · Worldwide connection</p>
          <h1 className="text-4xl font-extrabold leading-[0.98] sm:text-7xl lg:text-8xl">Made here.<br /><span className="text-surface">Ready <span className="block sm:inline">everywhere.</span></span></h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-secondary-foreground/85 sm:text-lg">Fast, fair travel data built with African journeys in mind. Choose a plan, install in minutes, and arrive online.</p>
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
  const { plans } = Route.useLoaderData();
  const planList = plans ?? [];
  const countries = new Set(planList.map((plan) => plan.country)).size;
  const stats = [
    { value: `${countries}`, label: countries === 1 ? "Destination live" : "Destinations live" },
    { value: `${planList.length}`, label: planList.length === 1 ? "Data plan" : "Data plans" },
    ...serviceStats,
  ];
  return (
    <section className="bg-accent text-accent-foreground">
      <div className="mx-auto grid max-w-7xl grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => <div key={stat.label} className="border-b border-accent-foreground/20 px-5 py-7 lg:border-b-0 lg:border-r lg:last:border-r-0"><p className="font-display text-3xl font-extrabold sm:text-4xl">{stat.value}</p><p className="mt-1 text-xs font-semibold uppercase text-accent-foreground/75">{stat.label}</p></div>)}
      </div>
    </section>
  );
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
  const { plans } = Route.useLoaderData();
  const planList = plans ?? [];
  const [region, setRegion] = useState("All");
  const [query, setQuery] = useState("");
  const destinations = useMemo(() => {
    const grouped = new Map<string, { country: string; slug: string; flag: string; region: string; plans: Plan[]; popular: boolean }>();
    for (const plan of planList) {
      const item = grouped.get(plan.slug);
      if (item) {
        item.plans.push(plan);
        item.popular ||= plan.popular;
      } else {
        grouped.set(plan.slug, { country: plan.country, slug: plan.slug, flag: plan.flag, region: plan.region, plans: [plan], popular: plan.popular });
      }
    }
    return [...grouped.values()].sort((a, b) => Number(b.popular) - Number(a.popular) || a.country.localeCompare(b.country));
  }, [planList]);
  const regions = useMemo(() => ["All", ...Array.from(new Set(destinations.map((item) => item.region))).sort()], [destinations]);
  const visible = useMemo(() => destinations.filter((item) => (region === "All" || item.region === region) && item.country.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 6), [destinations, region, query]);
  return (
    <section id="destinations" className="bg-secondary text-secondary-foreground">
      <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <SectionHead label="Go near. Go far." title="Where are you headed?" body="Start with a destination. You'll compare data sizes and validity on the next page." />
          <div className="relative w-full lg:max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-foreground/60" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a country" aria-label="Search a country" className="h-12 border-secondary-foreground/30 bg-secondary-foreground/10 pl-10 text-secondary-foreground placeholder:text-secondary-foreground/60" /></div>
        </div>
        <div className="mt-8 flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Filter plans by region">
          {regions.map((item) => <Button key={item} variant={region === item ? "default" : "outline"} onClick={() => setRegion(item)} role="tab" aria-selected={region === item} className={cn("shrink-0", region !== item && "border-secondary-foreground/30 bg-transparent text-secondary-foreground hover:bg-secondary-foreground hover:text-secondary")}>{item}</Button>)}
        </div>
        {visible.length === 0 ? <p className="py-16 text-center text-secondary-foreground/70">No plans found. Try another destination.</p> : (
          <div className="mt-8 grid gap-px overflow-hidden rounded-lg bg-secondary-foreground/20 sm:grid-cols-2 lg:grid-cols-4">
            {visible.map((destination) => {
              const cheapest = [...destination.plans].sort((a, b) => a.amountMinor - b.amountMinor)[0];
              return <article key={destination.slug} className="flex min-h-56 flex-col bg-secondary p-6 transition-colors hover:bg-secondary-foreground/5"><div className="flex items-start justify-between"><span className="text-3xl" aria-hidden>{destination.flag}</span>{destination.popular && <span className="text-xs font-bold uppercase text-surface">Popular</span>}</div><h3 className="mt-8 text-xl font-bold"><Link to="/destinations/$slug" params={{ slug: destination.slug }} className="hover:underline">{destination.country}</Link></h3><p className="mt-1 text-sm text-secondary-foreground/65">{destination.plans.length} {destination.plans.length === 1 ? "plan" : "plans"} available</p><div className="mt-auto flex items-end justify-between pt-8"><p><span className="text-xs text-secondary-foreground/60">Plans from</span><span className="block font-display text-2xl font-extrabold">{cheapest?.price}</span></p><Button size="icon" aria-label={`View ${destination.country} plans`} asChild><Link to="/destinations/$slug" params={{ slug: destination.slug }}><ArrowRight /></Link></Button></div></article>;
            })}
          </div>
        )}
        <div className="mt-10">
          <Button variant="outline" size="lg" className="border-secondary-foreground/40 bg-transparent text-secondary-foreground hover:bg-secondary-foreground hover:text-secondary" asChild>
            <Link to="/destinations">Browse all destinations <ArrowRight /></Link>
          </Button>
        </div>
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

function Trust() {
  return (
    <section aria-label="Buying with confidence" className="border-y border-border bg-background">
      <div className="mx-auto grid max-w-7xl gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
        {trustPoints.map((point) => (
          <div key={point.title} className="bg-background px-5 py-8 lg:px-8">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 shrink-0 text-primary" />
              <div>
                <h3 className="font-bold leading-snug">{point.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{point.body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Compatibility() {
  const { devices } = Route.useLoaderData();
  const deviceList = devices ?? [];
  const [query, setQuery] = useState("");
  const [hint, setHint] = useState<DeviceHint | null>(null);
  useEffect(() => {
    setHint(detectDevice(navigator.userAgent));
  }, []);
  const term = query.trim().toLowerCase();
  const matches = useMemo(
    () => (term.length < 2 ? deviceList : deviceList.filter((item) => `${item.brand} ${item.models}`.toLowerCase().includes(term))),
    [term, deviceList],
  );
  return (
    <section id="compatibility" className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
      <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
        <SectionHead label="Before you pay" title="Will it work on your phone?" body="We take a first guess from the phone you're browsing on, then you can search to be sure. Buying an eSIM your phone can't use is the one mistake we'd rather you never make." />
        <div className="relative w-full lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="e.g. iPhone 13, Galaxy S22" aria-label="Search your phone model" className="h-12 pl-10" />
        </div>
      </div>
      {hint && (
        <div className={cn("mt-10 flex flex-col gap-3 rounded-lg border p-6 sm:flex-row sm:items-start", hint.verdict === "likely" ? "border-accent/40 bg-accent/5" : "border-border")}>
          {hint.verdict === "likely" ? <Check className="mt-0.5 shrink-0 text-accent" /> : <Smartphone className="mt-0.5 shrink-0 text-muted-foreground" />}
          <div>
            <h3 className="font-bold">{hint.verdict === "likely" ? `Good news — your ${hint.name} should work` : `You're browsing on: ${hint.name}`}</h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{hint.note}</p>
            {hint.search && hint.search !== query && (
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setQuery(hint.search)}>Check {hint.search} in the list</Button>
            )}
          </div>
        </div>
      )}
      {matches.length === 0 ? (
        <div className="mt-6 rounded-lg border border-border p-6">
          <h3 className="font-bold">We can't confirm that one from the name alone</h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{unsupportedNote}</p>
        </div>
      ) : (
        <>
          <ul className="mt-6 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
            {matches.map((item) => (
              <li key={item.id} className="bg-background p-6">
                <div className="flex items-center gap-2">
                  <Check className="text-primary" />
                  <h3 className="text-lg font-bold">{item.brand}</h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.models}</p>
              </li>
            ))}
          </ul>
          <p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted-foreground">{unsupportedNote}</p>
        </>
      )}
    </section>
  );
}


function Faq() {
  return (
    <section id="faq" className="mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-[0.75fr_1.25fr] lg:px-8 lg:py-28"><SectionHead label="Good to know" title="Questions, answered plainly." body="Everything you need before you connect." /><Accordion type="single" collapsible>{faqs.map((item) => <AccordionItem key={item.q} value={item.q}><AccordionTrigger className="py-5 text-left text-base font-bold hover:no-underline">{item.q}</AccordionTrigger><AccordionContent className="max-w-2xl pb-5 leading-relaxed text-muted-foreground">{item.a}</AccordionContent></AccordionItem>)}</Accordion></section>
  );
}


function Home() {
  return <div className="min-h-screen bg-background"><Header /><main><Hero /><Stats /><Steps /><Trust /><Plans /><Compatibility /><Why /><Faq /></main><Footer /></div>;
}