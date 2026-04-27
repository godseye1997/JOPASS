/* ── Pricing ── */
// 1 credit = 1 JOD
const CREDIT_TO_JOD = 1;

function toJOD(credits) {
  return (credits * CREDIT_TO_JOD).toFixed(2);
}

/* ── Browse Categories ── */
const VENUE_CATEGORIES = ['Health and Wellness', 'Sports Activities', 'Beauty and Wellness', 'Activities', 'Education', 'Dining'];

// Parse category field — supports legacy single string and new JSON array
function parseCategories(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (_) {
    return [raw];
  }
}

function formatCategories(arr) {
  return JSON.stringify(arr);
}

/* ── Vendor data (populated from Supabase on init) ── */
let VENDORS = [];

const CREDIT_PACKS = [
  { id: 1, credits: 5,  price: 5.00,  label: "Starter",    description: "Good for a session or two" },
  { id: 2, credits: 10, price: 10.00, label: "Basic",      description: "A handful of sessions" },
  { id: 3, credits: 25, price: 25.00, label: "Popular",    description: "Best for regular users" },
  { id: 4, credits: 50, price: 50.00, label: "Power",      description: "For the avid deal hunter" },
];
