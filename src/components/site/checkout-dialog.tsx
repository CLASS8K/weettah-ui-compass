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
            <div className="px-6 py-8 sm:px-8">
              <div className="mx-auto max-w-md">
                <div className="mb-6 flex items-center gap-2 text-accent">
                  <CheckCircle2 className="h-6 w-6" />
                  <span className="font-bold">Request received</span>
                </div>
                <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-lg">
                  <div className="bg-secondary px-6 py-6 text-secondary-foreground">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-surface/80">Weettah eSIM</p>
                        <p className="mt-1 font-display text-2xl font-extrabold">{plan.flag} {plan.country}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-surface/80">Data</p>
                        <p className="mt-1 font-display text-2xl font-extrabold">{plan.data}</p>
                      </div>
                    </div>
                  </div>
                  <div className="relative flex items-center justify-between bg-secondary">
                    <div className="h-5 w-5 -translate-x-2.5 rounded-full bg-background" />
                    <div className="flex-1 border-t-2 border-dashed border-secondary-foreground/25" />
                    <div className="h-5 w-5 translate-x-2.5 rounded-full bg-background" />
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-5 px-6 py-6">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Validity</p>
                      <p className="mt-1 font-bold">{plan.days} days</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Price</p>
                      <p className="mt-1 font-bold">{plan.price}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Booking reference</p>
                      <p className="mt-1 break-all font-mono text-sm font-bold">{reference}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        <p className="text-sm font-bold">Awaiting payment</p>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-border px-6 py-4">
                    <div className="flex h-8 items-end gap-[2px]">
                      {Array.from({ length: 48 }).map((_, i) => (
                        <div key={i} className="flex-1 bg-foreground" style={{ height: `${[100, 40, 70, 100, 30, 60, 100, 45, 80, 55, 100, 35][i % 12]}%` }} />
                      ))}
                    </div>
                    <p className="mt-2 text-center font-mono text-[10px] tracking-widest text-muted-foreground">{reference}</p>
                  </div>
                </div>
                <p className="mt-5 text-center text-sm leading-relaxed text-muted-foreground">
                  Online payment isn't open yet, so we've saved your {plan.country} request. Our team will email you to arrange payment and send your eSIM QR code.
                </p>
                <Button size="lg" className="mt-6 h-12 w-full" onClick={() => { setReference(null); onOpenChange(false); }}>Done</Button>
              </div>
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
              {submitting ? <><Loader2 className="animate-spin" />Sending your request…</> : <><LockKeyhole />Reserve this eSIM · {plan.price}</>}
            </Button>
            <p className="text-center text-xs text-muted-foreground">By continuing, you agree to Weettah's terms and refund policy.</p>
          </form>
          )}
        </>}
      </DialogContent>
    </Dialog>
  );
}
