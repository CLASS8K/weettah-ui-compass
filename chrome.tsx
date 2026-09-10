import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import weettahLogo from "@/assets/weettah-logo.png";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Destinations", href: "/destinations" },
  { label: "Check my phone", href: "/#compatibility" },
  { label: "FAQs", href: "/#faq" },
];

export function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className="inline-flex shrink-0 items-center" aria-label="Weettah home">
      <span className={cn("inline-flex rounded-sm px-1.5 py-1", light && "bg-background")}>
        <img src={weettahLogo} alt="Weettah" width={1276} height={371} className="h-8 w-auto sm:h-9" />
      </span>
    </Link>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header id="top" className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Wordmark />
        <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
          {nav.map((item) => (
            <a key={item.href} href={item.href} className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">{item.label}</a>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="sm" asChild><Link to="/my-esim">Find my eSIM</Link></Button>
          <Button size="sm" asChild><Link to="/destinations">Get connected <ArrowRight /></Link></Button>
        </div>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((value) => !value)}>
          {open ? <X /> : <Menu />}
        </Button>
      </div>
      {open && (
        <div className="border-t border-border bg-background px-5 py-5 md:hidden">
          <nav className="flex flex-col" aria-label="Mobile navigation">
            {nav.map((item) => (
              <a key={item.href} href={item.href} onClick={() => setOpen(false)} className="border-b border-border py-4 font-semibold">{item.label}</a>
            ))}
            <Link to="/my-esim" onClick={() => setOpen(false)} className="border-b border-border py-4 font-semibold">Find my eSIM</Link>
          </nav>
          <Button className="mt-5 w-full" asChild><Link to="/destinations" onClick={() => setOpen(false)}>Get connected <ArrowRight /></Link></Button>
        </div>
      )}
    </header>
  );
}

export function SectionHead({ label, title, body }: { label: string; title: string; body?: string }) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-bold uppercase text-primary">{label}</p>
      <h2 className="mt-3 text-4xl font-extrabold leading-tight sm:text-5xl">{title}</h2>
      {body && <p className="mt-4 leading-relaxed text-muted-foreground">{body}</p>}
    </div>
  );
}

export function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="flex flex-col justify-between gap-10 border-b border-secondary-foreground/20 pb-14 lg:flex-row lg:items-end">
          <div>
            <Wordmark light />
            <h2 className="mt-8 max-w-2xl text-4xl font-extrabold sm:text-6xl">The world is calling.<br /><span className="text-surface">Pick up connected.</span></h2>
          </div>
          <Button size="lg" asChild><Link to="/destinations">Choose a plan <ArrowRight /></Link></Button>
        </div>
        <div className="flex flex-col justify-between gap-6 pt-8 text-sm text-secondary-foreground/60 sm:flex-row">
          <p>© {new Date().getFullYear()} Weettah. African-made. Globally connected.</p>
          <div className="flex flex-wrap gap-6">
            <Link to="/destinations">Destinations</Link>
            <Link to="/my-esim">Find my eSIM</Link>
            <a href="/#compatibility">Phone check</a>
            <a href="/#faq">Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
