import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestOrder } from "@/lib/payments.functions";
import type { PublicPlan } from "@/lib/plans.functions";

export function CheckoutDialog({ plan, open, onOpenChange }: { plan: PublicPlan | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const reserve = useServerFn(requestOrder);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!plan) return;
    setSubmitting(true);
    setNotice(null);
    const values = new FormData(event.currentTarget);
    try {
      const result = await reserve({ data: {
        planId: plan.id,
        firstName: String(values.get("firstName") || ""),
        lastName: String(values.get("lastName") || ""),
        email: String(values.get("email") || ""),
        phone: String(values.get("phone") || ""),
      } });
      setReference(result.reference);
    } catch {
      setNotice("We couldn't save your request. Please check your details and try again.");
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
              <p className="text-xs font-bold uppercase text-surface">Reserve your eSIM</p>
              <DialogTitle className="mt-2 text-2xl font-extrabold sm:text-3xl">{plan.flag} {plan.country}</DialogTitle>
              <DialogDescription className="text-secondary-foreground/70">{plan.data} of data · {plan.days} days</DialogDescription>
            </DialogHeader>
            <div className="mt-6 border-t border-secondary-foreground/20 pt-5">
              <div className="flex items-end justify-between">
                <span className="text-sm text-secondary-foreground/70">Plan price</span>
                <span className="font-display text-3xl font-extrabold">{plan.price}</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-secondary-foreground/60">One-off price in US dollars — no taxes or activation fees added, and nothing renews later. Nothing is charged now.</p>
            </div>
          </div>

          {reference ? (
            <div className="space-y-5 px-6 py-8 sm:px-8">
              <CheckCircle2 className="h-9 w-9 text-accent" />
              <div>
                <h3 className="text-2xl font-extrabold">Request received</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">Online payment isn't open yet, so we've saved your {plan.country} request. Our team will email you to arrange payment and send your eSIM.</p>
              </div>
              <dl className="divide-y divide-border border-y border-border text-sm">
                <div className="flex justify-between gap-6 py-4"><dt className="text-muted-foreground">Plan</dt><dd className="text-right font-bold">{plan.country} · {plan.data} · {plan.days} days</dd></div>
                <div className="flex justify-between gap-6 py-4"><dt className="text-muted-foreground">Reference</dt><dd className="max-w-[65%] break-all text-right font-bold">{reference}</dd></div>
              </dl>
              <Button size="lg" className="h-12 w-full" onClick={() => { setReference(null); onOpenChange(false); }}>Done</Button>
            </div>
          ) : (
          <form onSubmit={submit} className="space-y-6 px-6 py-7 sm:px-8">
            <div>
              <h3 className="font-bold">Where should we reach you?</h3>
              <p className="mt-1 text-sm text-muted-foreground">Card and mobile money payments are coming soon. For now we'll email you to complete your order and send your QR code.</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="firstName">First name</Label><Input id="firstName" name="firstName" autoComplete="given-name" required minLength={2} /></div>
              <div className="space-y-2"><Label htmlFor="lastName">Last name</Label><Input id="lastName" name="lastName" autoComplete="family-name" required minLength={2} /></div>
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="email">Email address</Label><Input id="email" name="email" type="email" autoComplete="email" required /></div>
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="phone">Mobile number</Label><Input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="+265…" required minLength={7} /></div>
            </div>
            <div className="border-y border-border py-5">
              <p className="text-xs font-bold uppercase text-muted-foreground">Payment</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Online payment is not switched on yet. Send your request now and we'll come back to you with payment details — you won't be charged anything here.</p>
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
