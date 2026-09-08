import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CreditCard, Loader2, LockKeyhole, ShieldCheck, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { beginCheckout } from "@/lib/payments.functions";
import type { PublicPlan } from "@/lib/plans.functions";

export function CheckoutDialog({ plan, open, onOpenChange }: { plan: PublicPlan | null; open: boolean; onOpenChange: (open: boolean) => void }) {
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
            <div className="rounded-md border border-border p-4">
              <div className="flex items-start gap-3">
                <Checkbox id="compat" checked={confirmed} onCheckedChange={(value) => setConfirmed(value === true)} className="mt-1" />
                <Label htmlFor="compat" className="text-sm font-semibold leading-relaxed">My phone supports eSIM and isn't locked to one network</Label>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                Not sure? Dial <span className="font-bold">*#06#</span> — if an EID number appears, you're good. You can also{" "}
                <a href="/#compatibility" className="font-bold underline">check the phone list</a>.
              </p>
            </div>
            {notice && <p role="alert" className="rounded-md bg-surface px-4 py-3 text-sm font-semibold text-surface-foreground">{notice}</p>}
            <Button type="submit" size="lg" className="h-12 w-full" disabled={submitting || !confirmed}>
              {submitting ? <><Loader2 className="animate-spin" />Opening secure payment…</> : <><LockKeyhole />Continue to payment · {plan.price}</>}
            </Button>
            <p className="text-center text-xs text-muted-foreground">By continuing, you agree to Weettah's terms and refund policy.</p>
          </form>
        </>}
      </DialogContent>
    </Dialog>
  );
}
