import { createFileRoute, Link } from "@tanstack/react-router";
import { LEGAL, LegalPage, type LegalSection } from "@/components/site/legal";

export const Route = createFileRoute("/refunds")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Refund policy | Weettah" },
      { name: "description", content: "When you can get a refund for a Weettah eSIM and how to ask for one." },
      { property: "og:title", content: "Refund policy | Weettah" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: RefundsPage,
});

const sections: LegalSection[] = [
  {
    heading: "Unused eSIMs: full refund within 30 days",
    body: (
      <p>If your eSIM hasn't connected to a network yet, you can ask for a full refund within 30 days of buying it. You don't need to give a reason.</p>
    ),
  },
  {
    heading: "eSIMs that don't work",
    body: (
      <>
        <p>If your eSIM has been activated but you can't get online, contact us while you're still at your destination. We'll work with you and our network partner to fix it.</p>
        <p>If we can't fix it, we'll refund you in full, or for the part of the plan you couldn't use.</p>
      </>
    ),
  },
  {
    heading: "When we can't offer a refund",
    body: (
      <ul>
        <li>You've used some or all of the data and the service worked as described.</li>
        <li>More than 30 days have passed since you bought an eSIM you never used.</li>
        <li>Your plan expired, or ran out of data, before the end of your trip.</li>
        <li>You deleted the eSIM from your phone or reset your phone after installing it.</li>
        <li>Your phone doesn't support eSIM or is locked to one network, and you installed the eSIM anyway. If you haven't installed it yet, the 30-day refund for unused eSIMs still applies.</li>
        <li>Your eSIM was suspended for breaking our <Link to="/terms">terms of service</Link>.</li>
      </ul>
    ),
  },
  {
    heading: "How to ask for a refund",
    body: (
      <p>
        Email <a href={`mailto:${LEGAL.email}?subject=Refund%20request`}>{LEGAL.email}</a> from the address you ordered with. Include your order reference, which starts with WEETTAH-, and tell us briefly what happened. We'll reply within 2 business days.
      </p>
    ),
  },
  {
    heading: "How you'll be refunded",
    body: (
      <>
        <p>We refund the amount you paid, in the currency you paid in, to your original payment method: your mobile money wallet or your card.</p>
        <p>We process approved refunds within 5 business days. Your bank or mobile money provider may take a few more days to show the money in your account.</p>
        <p>Once we refund an eSIM, we deactivate it and it can't be used again.</p>
      </>
    ),
  },
  {
    heading: "Your legal rights",
    body: <p>This policy doesn't affect any rights you have under Malawian consumer protection law.</p>,
  },
];

function RefundsPage() {
  return <LegalPage current="/refunds" title="Refund policy" intro="We want you to land connected. If something goes wrong, here's when we'll refund you and how to ask." sections={sections} />;
}
