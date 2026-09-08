export const stats = [
  { value: "180+", label: "Countries covered" },
  { value: "2,800+", label: "Data plans" },
  { value: "60s", label: "Average delivery" },
  { value: "24/7", label: "Human support" },
];

export type Plan = {
  id: string;
  country: string;
  flag: string;
  region: string;
  data: string;
  days: number;
  price: string;
  amountMinor: number;
  popular?: boolean;
};

export const plans: Plan[] = [
  { id: "za-3gb-30d", country: "South Africa", flag: "🇿🇦", region: "Africa", data: "3 GB", days: 30, price: "$9.60", amountMinor: 960, popular: true },
  { id: "ke-5gb-30d", country: "Kenya", flag: "🇰🇪", region: "Africa", data: "5 GB", days: 30, price: "$11.80", amountMinor: 1180, popular: true },
  { id: "ng-3gb-30d", country: "Nigeria", flag: "🇳🇬", region: "Africa", data: "3 GB", days: 30, price: "$10.20", amountMinor: 1020 },
  { id: "gh-5gb-30d", country: "Ghana", flag: "🇬🇭", region: "Africa", data: "5 GB", days: 30, price: "$12.40", amountMinor: 1240 },
  { id: "gb-3gb-15d", country: "United Kingdom", flag: "🇬🇧", region: "Europe", data: "3 GB", days: 15, price: "$8.90", amountMinor: 890 },
  { id: "us-5gb-30d", country: "United States", flag: "🇺🇸", region: "North America", data: "5 GB", days: 30, price: "$12.50", amountMinor: 1250 },
  { id: "ae-5gb-15d", country: "United Arab Emirates", flag: "🇦🇪", region: "Middle East", data: "5 GB", days: 15, price: "$14.20", amountMinor: 1420 },
  { id: "jp-10gb-30d", country: "Japan", flag: "🇯🇵", region: "Asia", data: "10 GB", days: 30, price: "$19.40", amountMinor: 1940 },
];

export const regions = ["All", "Africa", "Asia", "Europe", "North America", "Middle East"];

export const steps = [
  {
    title: "Pick your destination",
    body: "Choose the country or region you're travelling to and the amount of data you need. Prices are final — no roaming surcharges.",
  },
  {
    title: "Pay and get your QR code",
    body: "Checkout takes under a minute. Your eSIM arrives by email straight away, with the QR code and setup steps.",
  },
  {
    title: "Scan and land connected",
    body: "Install before you fly, then switch it on when you land. Your usual number stays active for calls and texts.",
  },
];

export const faqs = [
  {
    q: "Will my phone work with an eSIM?",
    a: "Most phones released after 2018 support eSIM, including iPhone XS and newer, Google Pixel 3 and newer, and recent Samsung Galaxy S and Z models. Your phone also needs to be carrier-unlocked. If you're unsure, dial *#06# — if you see an EID number, you're good.",
  },
  {
    q: "Do I keep my normal phone number?",
    a: "Yes. The eSIM adds a data-only line alongside your existing SIM, so calls, SMS and WhatsApp on your usual number keep working. Just leave your home data roaming switched off.",
  },
  {
    q: "When does my plan start counting down?",
    a: "The validity period starts the moment your eSIM first connects to a network abroad — not when you buy it. So you can safely purchase and install days before you travel.",
  },
  {
    q: "What happens if I run out of data?",
    a: "You can top up from your account in a couple of taps and the new data is added to the same eSIM. No need to reinstall anything.",
  },
  {
    q: "Can I get a refund?",
    a: "If your eSIM hasn't been activated, you can request a full refund within 30 days of purchase. If it's activated but not working, our support team will troubleshoot with you and refund if we can't fix it.",
  },
];
