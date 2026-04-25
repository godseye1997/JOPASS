/* ── Pricing ── */
// 1 credit = 1 JOD
const CREDIT_TO_JOD = 1;

function toJOD(credits) {
  return (credits * CREDIT_TO_JOD).toFixed(2);
}

/* ── Browse Categories ── */
const VENUE_CATEGORIES = ['Health and Wellness', 'Sports Activities', 'Beauty and Wellness', 'Activities'];

/* ── Vendor data (populated from Supabase on init) ── */
let VENDORS = [];

const CREDIT_PACKS = [
  { id: 1, credits: 5,  price: 5.00,  label: "5 Credits",  description: "5 JOD · 5 credits" },
  { id: 2, credits: 10, price: 10.00, label: "10 Credits", description: "10 JOD · 10 credits" },
  { id: 3, credits: 25, price: 25.00, label: "25 Credits", description: "25 JOD · 25 credits" },
  { id: 4, credits: 50, price: 50.00, label: "50 Credits", description: "50 JOD · 50 credits" },
];
