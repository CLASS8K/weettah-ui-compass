export const serviceStats = [
  { value: "$0", label: "Roaming surcharges" },
  { value: "30-day", label: "Refund if unused" },
];

// `online` is true once PayChangu is configured. Until then we describe the
// manual reservation flow, so the site never promises a checkout that isn't live.
export function getSteps(online: boolean) {
  return [
    {
      title: "Pick your destination",
      body: "Choose where you're going and how much data you need. The price you see is final, with no roaming surcharges.",
    },
    online
      ? {
          title: "Pay your way",
          body: "Pay with Airtel Money, TNM Mpamba or card through PayChangu. Your eSIM QR code is ready as soon as the payment clears.",
        }
      : {
          title: "Reserve your eSIM",
          body: "Send us your order and we'll email you the payment details. Your eSIM QR code is ready as soon as you've paid.",
        },
    {
      title: "Scan and land connected",
      body: "Install it before you fly and switch it on when you land. Your usual number stays active for calls and texts.",
    },
  ];
}

export const faqs = [
  {
    q: "What's an eSIM, in one line?",
    a: "An eSIM is a digital SIM built into your phone. You install it by scanning a QR code, there's no card to swap, and your usual number keeps working for calls and texts.",
  },
  {
    q: "Will my phone work with an eSIM?",
    a: "Most phones released since 2018 support eSIM, including iPhone XS and newer, Google Pixel 3 and newer, and recent Samsung Galaxy S and Z models. Your phone also needs to be unlocked. If you're not sure, dial *#06#. If an EID number appears, your phone supports eSIM.",
  },
  {
    q: "Do I keep my normal phone number?",
    a: "Yes. The eSIM adds a data line next to your existing SIM, so calls, SMS and WhatsApp on your usual number keep working. Just keep data roaming switched off on your home SIM.",
  },
  {
    q: "When does my plan start counting down?",
    a: "Your plan starts when the eSIM first connects to a network at your destination, not when you buy it. You can safely buy and install it days before you travel.",
  },
  {
    q: "What happens if I run out of data?",
    a: "Email support@weettah.com and we'll add more data to the same eSIM, so there's nothing to reinstall.",
  },
  {
    q: "Can I get a refund?",
    a: "If you haven't activated your eSIM, you can ask for a full refund within 30 days of buying it. If it's activated but not working, our support team will help you fix it, and we'll refund you if we can't.",
  },
];

export function getTrustPoints(online: boolean) {
  return [
    { title: "30-day refund if unused", body: "Haven't activated your eSIM? Ask for a full refund within 30 days. No questions asked." },
    online
      ? { title: "Mobile money or card", body: "Pay securely through PayChangu with Airtel Money, TNM Mpamba, Visa or Mastercard." }
      : { title: "Nothing to pay upfront", body: "Reserve your plan now. We'll email you the payment details." },
    { title: "QR code once you've paid", body: "Your install page is ready as soon as your payment is confirmed. You can reopen it any time from Find my eSIM." },
    { title: "Real people on support", body: "Email support@weettah.com and a real person will reply." },
  ];
}
