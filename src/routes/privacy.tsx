import { createFileRoute } from "@tanstack/react-router";
import { LEGAL, LegalPage, type LegalSection } from "@/components/site/legal";

export const Route = createFileRoute("/privacy")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Privacy policy | Weettah" },
      { name: "description", content: "What personal information Weettah collects, why, who we share it with and your rights." },
      { property: "og:title", content: "Privacy policy | Weettah" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: PrivacyPage,
});

const sections: LegalSection[] = [
  {
    heading: "Who is responsible for your information",
    body: (
      <p>
        Weettah, a company registered in Malawi and based in {LEGAL.city}, is responsible for the personal information described here. We handle it in line with the Malawi Data Protection Act, 2024. For any privacy question or request, email <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.
      </p>
    ),
  },
  {
    heading: "What we collect",
    body: (
      <>
        <ul>
          <li><strong>Your details:</strong> first and last name, email address and mobile number, which you give us at checkout.</li>
          <li><strong>Your order:</strong> the plan, destination, price, payment status, order reference and the date you bought it.</li>
          <li><strong>Your eSIM:</strong> technical identifiers such as the ICCID and activation code, so we can deliver and support it.</li>
          <li><strong>Payment confirmation:</strong> PayChangu tells us whether your payment succeeded, its reference and the payment method used. We never receive your card number or mobile money PIN.</li>
          <li><strong>Messages:</strong> anything you send us when you contact support.</li>
          <li><strong>Technical data:</strong> our hosting provider keeps standard server logs, such as IP address, browser type and the pages requested, for security and troubleshooting.</li>
        </ul>
        <p>Our phone check runs inside your browser. It reads your phone's model or software version to tell you whether it supports eSIM, and it doesn't send that information to us.</p>
      </>
    ),
  },
  {
    heading: "Why we use it",
    body: (
      <ul>
        <li>To process your order, take payment, deliver your eSIM and help you install it. We need this to fulfil our contract with you.</li>
        <li>To answer your questions and handle refunds.</li>
        <li>To keep financial records, as required by tax and accounting law.</li>
        <li>To prevent fraud and keep our service secure, which is in our legitimate interest and yours.</li>
      </ul>
    ),
  },
  {
    heading: "Who we share it with",
    body: (
      <>
        <p>We don't sell your personal information or share it for advertising. We only share it with the service providers we need to run Weettah:</p>
        <ul>
          <li><strong>PayChangu</strong> processes your payment. It receives your name, email and the amount due.</li>
          <li><strong>eSIM Access</strong>, our connectivity partner, issues your eSIM. It receives the plan and our order reference, not your name, email or phone number.</li>
          <li><strong>Supabase</strong> hosts our database and sends sign-in codes for your account.</li>
          <li><strong>Vercel</strong> hosts our website.</li>
        </ul>
        <p>We may also share information if the law requires it, or to protect our rights or someone's safety.</p>
      </>
    ),
  },
  {
    heading: "Information stored outside Malawi",
    body: (
      <p>Some of our providers store data on servers outside Malawi. When this happens, we choose established providers that protect data with security measures such as encryption, access controls and contractual safeguards.</p>
    ),
  },
  {
    heading: "How long we keep it",
    body: (
      <p>We keep order and payment records for as long as tax and accounting law requires. We keep support messages for as long as we need them to help you, and server logs for a short period. When we no longer need information, we delete or anonymise it.</p>
    ),
  },
  {
    heading: "Your rights",
    body: (
      <>
        <p>You can ask us to:</p>
        <ul>
          <li>give you a copy of the personal information we hold about you;</li>
          <li>correct anything that's wrong or incomplete;</li>
          <li>delete your information, unless we have to keep it by law;</li>
          <li>stop using your information for a particular purpose.</li>
        </ul>
        <p>Email <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> from the address you ordered with and we'll respond within 30 days. If you're not happy with our answer, you can complain to the Malawi Communications Regulatory Authority (MACRA), which oversees data protection in Malawi.</p>
      </>
    ),
  },
  {
    heading: "Cookies and storage",
    body: (
      <p>We don't use advertising or tracking cookies. If you sign in to your account, your browser stores a sign-in session so you stay logged in. You can clear it at any time by signing out or clearing your browser data.</p>
    ),
  },
  {
    heading: "Security",
    body: (
      <p>We protect your information with encryption in transit, restricted access to our database and encrypted storage of our supplier credentials. Your install page is private and can only be opened with its unique link.</p>
    ),
  },
  {
    heading: "Children",
    body: <p>Weettah isn't intended for anyone under 18. If you're under 18, please ask a parent or guardian to buy for you.</p>,
  },
  {
    heading: "Changes to this policy",
    body: <p>If we change how we use your information, we'll update this page and change the effective date above.</p>,
  },
];

function PrivacyPage() {
  return <LegalPage current="/privacy" title="Privacy policy" intro="This policy explains what personal information we collect when you use Weettah, why we need it, who we share it with and the choices you have." sections={sections} />;
}
