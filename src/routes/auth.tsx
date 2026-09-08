import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowRight, KeyRound, Loader2 } from "lucide-react";
import weettahLogo from "@/assets/weettah-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({ meta: [
    { title: "Operations sign in — Weettah" },
    { name: "description", content: "Secure sign in for Weettah operations." },
    { property: "og:title", content: "Operations sign in — Weettah" },
    { property: "og:description", content: "Secure sign in for Weettah operations." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setNotice(null);
    try {
      if (!sent) {
        const { error } = await supabase.auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { shouldCreateUser: true } });
        if (error) throw error;
        setSent(true);
        setNotice("We sent a secure sign-in code to your email.");
      } else {
        const { error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: code.trim(), type: "email" });
        if (error) throw error;
        await navigate({ to: "/admin", replace: true });
      }
    } catch {
      setNotice(sent ? "That code is invalid or has expired. Request a fresh code and try again." : "We couldn't send the code. Check the address and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[1fr_1.1fr]">
      <section className="flex items-center px-5 py-10 sm:px-10 lg:px-16">
        <div className="w-full max-w-md">
          <a href="/" className="inline-flex rounded-sm bg-card px-2 py-1.5" aria-label="Weettah home"><img src={weettahLogo} alt="Weettah" width={1276} height={371} className="h-9 w-auto" /></a>
          <p className="mt-12 text-xs font-bold uppercase text-primary">Private operations</p>
          <h1 className="mt-3 text-4xl font-extrabold">Sign in to manage Weettah.</h1>
          <p className="mt-4 leading-relaxed text-muted-foreground">Access is limited to approved, verified administrator email addresses.</p>
          <form onSubmit={submit} className="mt-8 space-y-5">
            <div className="space-y-2"><Label htmlFor="admin-email">Email address</Label><Input id="admin-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={sent} required /></div>
            {sent && <div className="space-y-2"><Label htmlFor="admin-code">Six-digit code</Label><Input id="admin-code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value)} minLength={6} maxLength={8} required autoFocus /></div>}
            {notice && <p role="status" className="rounded-md bg-surface px-4 py-3 text-sm text-surface-foreground">{notice}</p>}
            <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : sent ? <KeyRound /> : <ArrowRight />}{sent ? "Verify code" : "Email me a code"}</Button>
            {sent && <Button type="button" variant="ghost" className="w-full" onClick={() => { setSent(false); setCode(""); setNotice(null); }}>Use a different email</Button>}
          </form>
        </div>
      </section>
      <aside className="hidden bg-secondary p-16 text-secondary-foreground lg:flex lg:flex-col lg:justify-end">
        <p className="text-sm font-bold uppercase text-surface">Built here. Managed here.</p>
        <p className="mt-5 max-w-xl font-display text-5xl font-extrabold leading-tight">Packages, payments and activations in one calm workspace.</p>
      </aside>
    </main>
  );
}