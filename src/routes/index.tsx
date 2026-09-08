import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Check, CreditCard, Loader2, LockKeyhole, Menu, Search, ShieldCheck, Smartphone, X } from "lucide-react";
import heroImage from "@/assets/weettah-africa-hero.jpg";
import weettahLogo from "@/assets/weettah-logo.png";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { faqs, regions, stats, steps, supportedDevices, trustPoints, unsupportedNote } from "@/components/site/data";
import { cn } from "@/lib/utils";
import { beginCheckout } from "@/lib/payments.functions";
import { getPublicPlans, type PublicPlan as Plan } from "@/lib/plans.functions";


export const Route = createFileRoute("/")({
  loader: () => getPublicPlans(),
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
  { label: "Check my phone", href: "#compatibility" },
  { label: "FAQs", href: "#faq" },
];


function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <a href="#top" className="inline-flex shrink-0 items-center" aria-label="Weettah home">
      <span className={cn("inline-flex rounded-sm px-1.5 py-1", light && "bg-background")}>
        <img src={weettahLogo} alt="Weettah" width={1276} height={371} className="h-8 w-auto sm:h-9" />
      </span>
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
          <Button variant="ghost" size="sm" asChild><Link to="/my-esim">Find my eSIM</Link></Button>
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
            <Link to="/my-esim" onClick={() => setOpen(false)} className="border-b border-border py-4 font-semibold">Find my eSIM</Link>
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
          <h1 className="text-4xl font-extrabold leading-[0.98] sm:text-7xl lg:text-8xl">Made here.<br /><span className="text-surface">Ready <span className="block sm:inline">everywhere.</span></span></h1>
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
  const plans = Route.useLoaderData();
  const [region, setRegion] = useState("All");
  const [query, setQuery] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
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
            {visible.map((plan) => <article key={plan.id} className="flex min-h-64 flex-col bg-secondary p-6 transition-colors hover:bg-secondary-foreground/5"><div className="flex items-start justify-between"><span className="text-3xl" aria-hidden>{plan.flag}</span>{plan.popular && <span className="text-xs font-bold uppercase text-surface">Popular</span>}</div><h3 className="mt-8 text-xl font-bold">{plan.country}</h3><p className="mt-1 text-sm text-secondary-foreground/65">{plan.data} · {plan.days} days</p><p className="mt-2 text-xs leading-relaxed text-secondary-foreground/55">One-off payment. Top up anytime if the data runs out — your plan never renews on its own.</p><div className="mt-auto flex items-end justify-between pt-8"><p><span className="text-xs text-secondary-foreground/60">Total, all in</span><span className="block font-display text-2xl font-extrabold">{plan.price}</span><span className="text-xs text-secondary-foreground/60">charged in US dollars</span></p><Button size="icon" aria-label={`Choose ${plan.country} plan`} onClick={() => setSelectedPlan(plan)}><ArrowRight /></Button></div></article>)}
          </div>
        )}
      </div>
      <CheckoutDialog plan={selectedPlan} open={selectedPlan !== null} onOpenChange={(open) => { if (!open) setSelectedPlan(null); }} />
    </section>
  );
}

function CheckoutDialog({ plan, open, onOpenChange }: { plan: Plan | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const checkout = useServerFn(beginCheckout);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);


  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!plan) return;
    setSubmitting(true);
    setNotice(null);
    const values = new FormData(event.currentTarget);
    try {
      const result = await checkout({ data: {
        planId: plan.id,
        firstName: String(values.get("firstName") || ""),
        lastName: String(values.get("lastName") || ""),
        email: String(values.get("email") || ""),
        phone: String(values.get("phone") || ""),
      } });
      if (!result.ok) {
        setNotice("Checkout is ready in test mode. Pesapal merchant credentials are still needed before payments can open.");
        return;
      }
      window.location.assign(result.redirectUrl);
    } catch {
      setNotice("We couldn't start checkout. Please check your details and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92svh] overflow-y-auto border-border bg-background p-0 sm:max-w-2xl">
        {plan && <>
          <div className="bg-secondary px-6 py-7 text-secondary-foreground sm:px-8">
            <DialogHeader>
              <p className="text-xs font-bold uppercase text-surface">Secure checkout</p>
              <DialogTitle className="mt-2 text-2xl font-extrabold sm:text-3xl">{plan.flag} {plan.country}</DialogTitle>
              <DialogDescription className="text-secondary-foreground/70">{plan.data} of data · {plan.days} days</DialogDescription>
            </DialogHeader>
            <div className="mt-6 border-t border-secondary-foreground/20 pt-5">
              <div className="flex items-end justify-between">
                <span className="text-sm text-secondary-foreground/70">Total due today</span>
                <span className="font-display text-3xl font-extrabold">{plan.price}</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-secondary-foreground/60">One-off payment in US dollars — no taxes or activation fees added, and nothing renews later. If you pay by mobile money or card in another currency, your provider converts at their own rate.</p>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-6 px-6 py-7 sm:px-8">
            <div>
              <h3 className="font-bold">Where should we send your eSIM?</h3>
              <p className="mt-1 text-sm text-muted-foreground">Your QR code and setup steps arrive by email after payment.</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="firstName">First name</Label><Input id="firstName" name="firstName" autoComplete="given-name" required minLength={2} /></div>
              <div className="space-y-2"><Label htmlFor="lastName">Last name</Label><Input id="lastName" name="lastName" autoComplete="family-name" required minLength={2} /></div>
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="email">Email address</Label><Input id="email" name="email" type="email" autoComplete="email" required /></div>
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="phone">Mobile number</Label><Input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="+265…" required minLength={7} /></div>
            </div>
            <div className="border-y border-border py-5">
              <p className="text-xs font-bold uppercase text-muted-foreground">Pay securely with</p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm font-semibold sm:grid-cols-3">
                <span className="flex items-center gap-2"><Smartphone className="text-primary" />Mobile money</span>
                <span className="flex items-center gap-2"><CreditCard className="text-primary" />Visa & Mastercard</span>
                <span className="flex items-center gap-2"><ShieldCheck className="text-primary" />Pesapal</span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Available methods depend on your country and Pesapal merchant approval. Payment details are entered securely on Pesapal, not stored by Weettah.</p>
            </div>
            {notice && <p role="alert" className="rounded-md bg-surface px-4 py-3 text-sm font-semibold text-surface-foreground">{notice}</p>}
            <Button type="submit" size="lg" className="h-12 w-full" disabled={submitting}>
              {submitting ? <><Loader2 className="animate-spin" />Opening secure payment…</> : <><LockKeyhole />Continue to payment · {plan.price}</>}
            </Button>
            <p className="text-center text-xs text-muted-foreground">By continuing, you agree to Weettah's terms and refund policy.</p>
          </form>
        </>}
      </DialogContent>
    </Dialog>
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