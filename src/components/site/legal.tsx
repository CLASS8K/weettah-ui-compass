import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Footer, Header } from "@/components/site/chrome";

export const LEGAL = {
  company: "Weettah",
  city: "Lilongwe, Malawi",
  email: "support@weettah.com",
  effective: "5 October 2026",
};

export type LegalSection = { heading: string; body: ReactNode };

const pages = [
  { to: "/terms", label: "Terms of service" },
  { to: "/privacy", label: "Privacy policy" },
  { to: "/refunds", label: "Refund policy" },
] as const;

export function LegalPage({ title, intro, sections, current }: { title: string; intro: string; sections: LegalSection[]; current: (typeof pages)[number]["to"] }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-3xl px-5 py-16 lg:py-24">
        <nav aria-label="Legal pages" className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
          {pages.map((page) => (
            <Link key={page.to} to={page.to} className={page.to === current ? "text-foreground underline underline-offset-4" : "text-muted-foreground hover:text-foreground"}>
              {page.label}
            </Link>
          ))}
        </nav>
        <h1 className="mt-10 text-4xl font-extrabold sm:text-5xl">{title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">Effective {LEGAL.effective}</p>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{intro}</p>
        <div className="mt-12 space-y-10">
          {sections.map((section, index) => (
            <section key={section.heading}>
              <h2 className="text-xl font-bold">{index + 1}. {section.heading}</h2>
              <div className="mt-3 space-y-3 leading-relaxed text-muted-foreground [&_a]:font-semibold [&_a]:text-foreground [&_a]:underline [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-2">
                {section.body}
              </div>
            </section>
          ))}
        </div>
        <p className="mt-16 border-t border-border pt-8 text-sm text-muted-foreground">
          Questions about this page? Email <a className="font-semibold text-foreground underline" href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.
        </p>
      </main>
      <Footer />
    </div>
  );
}
