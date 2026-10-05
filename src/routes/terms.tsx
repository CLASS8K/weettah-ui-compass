import { createFileRoute, Link } from "@tanstack/react-router";
import { LEGAL, LegalPage, type LegalSection } from "@/components/site/legal";

export const Route = createFileRoute("/terms")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Terms of service | Weettah" },
      { name: "description", content: "The terms that apply when you buy and use a Weettah travel eSIM." },
      { property: "og:title", content: "Terms of service | Weettah" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: TermsPage,
});

const sections: LegalSection[] = [
  {
    heading: "Who we are",
    body: (
      <p>
        Weettah is a company registered in Malawi and based in {LEGAL.city}. In these terms, "we", "us" and "our" mean Weettah, and "you" means the person buying or using a Weettah eSIM. You can reach us at <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.
      </p>
    ),
  },
  {
    heading: "What you're buying",
    body: (
      <>
        <p>A Weettah eSIM is a prepaid, data-only mobile plan for the destination you choose. Each plan has a fixed amount of data and a fixed number of days.</p>
        <ul>
          <li>It gives you mobile data only. It does not include a phone number, voice calls or SMS.</li>
          <li>Your plan is supplied through our network partners, who connect you to local mobile networks at your destination.</li>
          <li>Your usual SIM and number keep working alongside the eSIM.</li>
        </ul>
      </>
    ),
  },
  {
    heading: "Your phone",
    body: (
      <>
        <p>Before you buy, it's your responsibility to make sure your phone supports eSIM and is unlocked, meaning it isn't tied to one network. Our phone check and the *#06# test help with this, but they can't guarantee that every phone will work.</p>
        <p>An eSIM can usually be installed only once. If you delete it or reset your phone, you may not be able to install it again.</p>
      </>
    ),
  },
  {
    heading: "Prices and payment",
    body: (
      <>
        <ul>
          <li>Prices are shown in US dollars and include all fees we charge. There are no activation fees, and nothing renews automatically.</li>
          <li>If you pay in Malawi kwacha, for example with Airtel Money or TNM Mpamba, we convert the price at our current rate. You'll see the exact amount before you confirm.</li>
          <li>Payments are processed by PayChangu. We never see or store your card number or mobile money PIN.</li>
          <li>Your bank or mobile money provider may charge its own fees. Those are between you and them.</li>
        </ul>
        <p>When online payment isn't available, we may accept your order as a reservation and email you the payment details. We only issue your eSIM once payment is confirmed.</p>
      </>
    ),
  },
  {
    heading: "Delivery and activation",
    body: (
      <>
        <p>Once your payment is confirmed, we send you to a private install page with your QR code and manual install details. You can reopen it any time from <Link to="/my-esim">Find my eSIM</Link> with your email and order reference.</p>
        <p>Your plan's validity starts when the eSIM first connects to a supported network at your destination, not when you buy it. Unused data expires when the validity period ends.</p>
      </>
    ),
  },
  {
    heading: "Coverage and speed",
    body: (
      <p>Coverage and speeds depend on the local networks at your destination, your phone and where you are. We list the networks we expect you to use, but we can't guarantee uninterrupted service, a particular speed or coverage in every location.</p>
    ),
  },
  {
    heading: "Fair and lawful use",
    body: (
      <>
        <p>You agree not to use your eSIM:</p>
        <ul>
          <li>for anything illegal, or to harm or defraud anyone;</li>
          <li>to resell, share as a commercial service, or run automated traffic, unless we agree in writing;</li>
          <li>in a way that disrupts the network for other users.</li>
        </ul>
        <p>Our network partners may apply their own fair use limits. If you break these rules, we may suspend your eSIM without a refund.</p>
      </>
    ),
  },
  {
    heading: "Refunds",
    body: (
      <p>Refunds are covered by our <Link to="/refunds">refund policy</Link>, which forms part of these terms.</p>
    ),
  },
  {
    heading: "Our responsibility to you",
    body: (
      <>
        <p>We provide our service with reasonable care and skill. If something goes wrong because of us, we'll try to fix it, and if we can't, we'll refund what you paid for the affected plan.</p>
        <p>To the extent the law allows, our total liability for any order is limited to the amount you paid for it. We aren't responsible for indirect losses, such as missed connections, lost bookings or lost business, or for problems caused by your phone, your network settings or a local network's outage.</p>
        <p>Nothing in these terms limits any rights you have under Malawian consumer protection law that can't be excluded.</p>
      </>
    ),
  },
  {
    heading: "Your personal information",
    body: (
      <p>Our <Link to="/privacy">privacy policy</Link> explains what we collect when you buy from us and how we use it.</p>
    ),
  },
  {
    heading: "Changes to these terms",
    body: (
      <p>We may update these terms from time to time. The version on this page when you place an order is the one that applies to that order.</p>
    ),
  },
  {
    heading: "Law and disputes",
    body: (
      <p>These terms are governed by the laws of Malawi. If you have a complaint, please email us first and we'll do our best to resolve it. If we can't agree, either of us can take the matter to the courts of Malawi.</p>
    ),
  },
];

function TermsPage() {
  return <LegalPage current="/terms" title="Terms of service" intro="These terms apply when you buy or use a Weettah travel eSIM. Please read them before you place an order." sections={sections} />;
}
