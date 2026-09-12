import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Check, Clock, ShieldCheck, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Footer, Header, SectionHead } from "@/components/site/chrome";
import { CheckoutDialog } from "@/components/site/checkout-dialog";
import { faqs, steps } from "@/components/site/data";
import { getDestination, type PublicPlan } from "@/lib/plans.functions";

export const Route = createFileRoute("/destinations/$slug")({
  loader: async ({ params }) => {
    const result = await getDestination({ data: { slug: params.slug } });
    if (!result.destination) throw notFound();
    return result;
  },
  head: ({ loaderData }) => {
    if (!loaderData?.destination) {
      return { meta: [{ title: "Destination not found — Weettah" }, { name: "robots", content: "noindex" }] };
    }
    const { country, fromPrice, plans } = loaderData.destination;
    const title = `${country} travel eSIM — data plans from ${fromPrice} | Weettah`;
    const description = `Stay online in ${country} with a Weettah eSIM. Compare ${plans.length} data plan${plans.length === 1 ? "" : "s"} from ${fromPrice}, with clear one-off pricing.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: DestinationNotFound,
  component: DestinationPage,
});

function DestinationNotFound() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-3xl px-5 py-24 text-center lg:px-8">
        <h1 className="text-4xl font-extrabold">We don't have that destination yet</h1>
        <p className="mt-4 text-muted-foreground">It may have been renamed or paused. Browse everywhere we cover right now.</p>
        <Button className="mt-8" asChild><Link to="/destinations">See all destinations <ArrowRight /></Link></Button>
      </main>
      <Footer />
    </div>
  );
}

function DestinationPage() {
  const { destination, related, guide } = Route.useLoaderData();
  const [selectedPlan, setSelectedPlan] = useState<PublicPlan | null>(null);
  if (!destination) return <DestinationNotFound />;

  const pageFaqs = [...(guide?.faqs ?? []), ...faqs];
  const facts = [
    { label: "Capital", value: guide?.capital },
    { label: "Currency", value: guide?.currency },
    { label: "Languages", value: guide?.languages },
    { label: "Power plug", value: guide?.powerPlug },
    { label: "Emergency number", value: guide?.emergencyNumber },
    { label: "Best time to visit", value: guide?.bestTime },
  ].filter((fact) => Boolean(fact.value));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        mainEntity: pageFaqs.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
      {
        "@type": "Product",
        name: `${destination.country} travel eSIM`,
        description: guide?.intro || `Prepaid travel data for ${destination.country} from Weettah.`,
        brand: { "@type": "Brand", name: "Weettah" },
        offers: destination.plans.map((plan) => ({
          "@type": "Offer",
          name: `${plan.data} · ${plan.days} days`,
          price: (plan.amountMinor / 100).toFixed(2),
          priceCurrency: plan.currency,
          availability: "https://schema.org/InStock",
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <section className="bg-secondary text-secondary-foreground">
          <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
            <nav aria-label="Breadcrumb" className="text-sm text-secondary-foreground/70">
              <Link to="/" className="hover:text-secondary-foreground">Home</Link>
              <span className="px-2">/</span>
              <Link to="/destinations" className="hover:text-secondary-foreground">Destinations</Link>
              <span className="px-2">/</span>
              <span className="text-secondary-foreground">{destination.country}</span>
            </nav>
            <p className="mt-8 text-5xl" aria-hidden>{destination.flag}</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-tight sm:text-6xl">{destination.country} travel eSIM</h1>
            <p className="mt-5 max-w-2xl leading-relaxed text-secondary-foreground/80">
              {guide?.intro
                ? guide.intro
                : `Land in ${destination.country} already online. Install before you fly, keep your usual number for calls and messages, and pay one clear price from ${destination.fromPrice} — no roaming bills waiting when you get home.`}
            </p>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold">
              <span className="flex items-center gap-2"><Check className="text-surface" />Keep your number</span>
              <span className="flex items-center gap-2"><Clock className="text-surface" />Delivered in about a minute</span>
              <span className="flex items-center gap-2"><ShieldCheck className="text-surface" />Refundable if unused</span>
            </div>
          </div>
        </section>

        {(guide?.coverage || facts.length > 0 || (guide?.tips?.length ?? 0) > 0) && (
          <section className="border-b border-border bg-surface">
            <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:py-20">
              <div>
                {guide?.coverage && (
                  <>
                    <SectionHead label="Coverage" title={`Which networks you'll use in ${destination.country}`} />
                    <p className="mt-6 max-w-2xl leading-relaxed text-muted-foreground">{guide.coverage}</p>
                  </>
                )}
                {(guide?.tips?.length ?? 0) > 0 && (
                  <>
                    <h3 className="mt-12 text-xl font-bold">Local tips worth knowing</h3>
                    <ul className="mt-5 space-y-4 border-t border-border pt-5">
                      {guide!.tips.map((tip) => (
                        <li key={tip} className="flex gap-3 leading-relaxed text-muted-foreground">
                          <Check className="mt-1 shrink-0 text-primary" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
              {facts.length > 0 && (
                <aside className="h-fit rounded-lg border border-border bg-background p-6">
                  <h2 className="text-xs font-bold uppercase text-primary">{destination.country} at a glance</h2>
                  <dl className="mt-5 divide-y divide-border">
                    {facts.map((fact) => (
                      <div key={fact.label} className="flex justify-between gap-6 py-3 text-sm">
                        <dt className="text-muted-foreground">{fact.label}</dt>
                        <dd className="text-right font-semibold">{fact.value}</dd>
                      </div>
                    ))}
                  </dl>
                </aside>
              )}
            </div>
          </section>
        )}



        <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
          <SectionHead label="Plans" title={`Data plans for ${destination.country}`} body="One-off payment. Top up anytime if the data runs out — nothing renews on its own." />
          <div className="mt-10 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {destination.plans.map((plan) => (
              <article key={plan.id} className="flex min-h-60 flex-col bg-background p-6">
                <div className="flex items-start justify-between">
                  <h3 className="font-display text-2xl font-extrabold">{plan.data}</h3>
                  {plan.popular && <span className="text-xs font-bold uppercase text-primary">Popular</span>}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Valid for {plan.days} days from first connection in {destination.country}.</p>
                <div className="mt-auto flex items-end justify-between pt-8">
                  <p>
                    <span className="text-xs text-muted-foreground">Total, all in</span>
                    <span className="block font-display text-2xl font-extrabold">{plan.price}</span>
                    <span className="text-xs text-muted-foreground">charged in US dollars</span>
                  </p>
                  <Button onClick={() => setSelectedPlan(plan)}>Buy <ArrowRight /></Button>
                </div>
              </article>
            ))}
          </div>
          <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Smartphone className="shrink-0 text-primary" />
            Not sure your phone takes an eSIM? <a href="/#compatibility" className="font-bold underline">Run the phone check</a> first.
          </p>
        </section>

        <section className="bg-surface">
          <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
            <SectionHead label="How it works" title={`Getting connected in ${destination.country}`} />
            <ol className="mt-10 grid border-y border-border md:grid-cols-3">
              {steps.map((step, index) => (
                <li key={step.title} className="border-b border-border py-8 md:border-b-0 md:border-r md:px-8 md:first:pl-0 md:last:border-r-0">
                  <p className="font-display text-5xl font-extrabold text-primary">0{index + 1}</p>
                  <h3 className="mt-8 text-xl font-bold">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-12 px-5 py-16 lg:grid-cols-[0.75fr_1.25fr] lg:px-8 lg:py-20">
          <SectionHead label="Good to know" title="Questions before you buy" />
          <Accordion type="single" collapsible>
            {pageFaqs.map((item) => (
              <AccordionItem key={item.q} value={item.q}>
                <AccordionTrigger className="py-5 text-left text-base font-bold hover:no-underline">{item.q}</AccordionTrigger>
                <AccordionContent className="max-w-2xl pb-5 leading-relaxed text-muted-foreground">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {related.length > 0 && (
          <section className="border-t border-border">
            <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
              <SectionHead label="Nearby" title={`More of ${destination.region}`} />
              <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
                {related.map((item) => (
                  <Link key={item.slug} to="/destinations/$slug" params={{ slug: item.slug }} className="group bg-background p-6 transition-colors hover:bg-surface">
                    <span className="text-3xl" aria-hidden>{item.flag}</span>
                    <h3 className="mt-6 text-lg font-bold">{item.country}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">From {item.fromPrice}</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </main>
      <Footer />
      <CheckoutDialog plan={selectedPlan} open={selectedPlan !== null} onOpenChange={(open) => { if (!open) setSelectedPlan(null); }} />
    </div>
  );
}
