/* ── Pricing ── */
// 1 JOD = 2 credits  →  1 credit = 0.50 JOD
const CREDIT_TO_JOD = 0.5;

function toJOD(credits) {
  return (credits * CREDIT_TO_JOD).toFixed(2);
}

/* ── Browse Categories ── */
const VENUE_CATEGORIES = ['Health and Wellness', 'Sports Activities', 'Beauty and Wellness', 'Activities'];

/* ── Vendor data (populated from Supabase on init) ── */
let VENDORS = [];

const CREDIT_PACKS = [
  { id: 1, credits: 10,  price: 5.00,  label: "Starter",    description: "Great for trying out JoPass" },
  { id: 2, credits: 20,  price: 10.00, label: "Popular",    description: "Best value for regular users" },
  { id: 3, credits: 55,  price: 25.00, label: "Power User", description: "For the avid deal hunter" },
  { id: 4, credits: 110, price: 50.00, label: "Ultimate",   description: "Maximum savings, maximum fun" },
];
