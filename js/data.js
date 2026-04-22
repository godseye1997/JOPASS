/* ── Pricing ── */
// 1 credit = 1 JOD
const CREDIT_TO_JOD = 1;

function toJOD(credits) {
  return (credits * CREDIT_TO_JOD).toFixed(2);
}

/* ── Sample Data ── */
const VENDORS = [
  {
    id: 1,
    name: "FitZone Gym",
    category: "Gym",
    icon: "🏋️",
    color: "#e17055",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=300&fit=crop",
    description: "Full-access gym sessions with top-tier equipment and personal trainers.",
    services: [
      { id: 101, name: "Open Gym Session", credits: 3, price: 5, jopassPrice: 3, duration: "60 min" },
      { id: 102, name: "Group HIIT Class", credits: 4, price: 7, jopassPrice: 4, duration: "45 min" },
      { id: 103, name: "Personal Training", credits: 8, price: 14, jopassPrice: 8, duration: "60 min" },
    ]
  },
  {
    id: 2,
    name: "Luxe Hair Studio",
    category: "Salon",
    icon: "💇",
    color: "#fd79a8",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=300&fit=crop",
    description: "Premium hair styling and treatment services at discounted rates.",
    services: [
      { id: 201, name: "Haircut & Style", credits: 5, price: 9, jopassPrice: 5, duration: "45 min" },
      { id: 202, name: "Color Treatment", credits: 10, price: 18, jopassPrice: 10, duration: "90 min" },
      { id: 203, name: "Blowout", credits: 3, price: 6, jopassPrice: 3, duration: "30 min" },
    ]
  },
  {
    id: 3,
    name: "Tranquil Touch Spa",
    category: "Massage",
    icon: "💆",
    color: "#00b894",
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&h=300&fit=crop",
    description: "Relaxing massage therapy sessions to melt away stress.",
    services: [
      { id: 301, name: "Swedish Massage", credits: 6, price: 11, jopassPrice: 6, duration: "60 min" },
      { id: 302, name: "Deep Tissue Massage", credits: 8, price: 14, jopassPrice: 8, duration: "60 min" },
      { id: 303, name: "Hot Stone Therapy", credits: 10, price: 17, jopassPrice: 10, duration: "75 min" },
    ]
  },
  {
    id: 4,
    name: "Glow Beauty Bar",
    category: "Salon",
    icon: "✨",
    color: "#e84393",
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=300&fit=crop",
    description: "Facials, manicures, and beauty treatments to look your best.",
    services: [
      { id: 401, name: "Express Facial", credits: 4, price: 7, jopassPrice: 4, duration: "30 min" },
      { id: 402, name: "Gel Manicure", credits: 3, price: 5, jopassPrice: 3, duration: "40 min" },
      { id: 403, name: "Full Glam Makeup", credits: 7, price: 12, jopassPrice: 7, duration: "60 min" },
    ]
  },
  {
    id: 5,
    name: "Peak Performance",
    category: "Gym",
    icon: "🧗",
    color: "#0984e3",
    image: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&h=300&fit=crop",
    description: "Rock climbing, functional training, and fitness classes.",
    services: [
      { id: 501, name: "Climbing Session", credits: 5, price: 9, jopassPrice: 5, duration: "90 min" },
      { id: 502, name: "CrossFit Class", credits: 4, price: 7, jopassPrice: 4, duration: "60 min" },
      { id: 503, name: "Yoga Flow", credits: 3, price: 5, jopassPrice: 3, duration: "60 min" },
    ]
  },
  {
    id: 6,
    name: "Serenity Wellness",
    category: "Massage",
    icon: "🧘",
    color: "#6c5ce7",
    image: "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=600&h=300&fit=crop",
    description: "Holistic wellness treatments combining massage and meditation.",
    services: [
      { id: 601, name: "Aromatherapy Massage", credits: 7, price: 12, jopassPrice: 7, duration: "60 min" },
      { id: 602, name: "Reflexology", credits: 5, price: 9, jopassPrice: 5, duration: "45 min" },
      { id: 603, name: "Couples Massage", credits: 14, price: 24, jopassPrice: 14, duration: "75 min" },
    ]
  },
  {
    id: 7,
    name: "Iron Temple",
    category: "Gym",
    icon: "💪",
    color: "#2d3436",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=300&fit=crop",
    description: "Hardcore training facility for serious lifters and athletes.",
    services: [
      { id: 701, name: "Open Gym Access", credits: 2, price: 4, jopassPrice: 2, duration: "120 min" },
      { id: 702, name: "Powerlifting Coach", credits: 10, price: 18, jopassPrice: 10, duration: "60 min" },
      { id: 703, name: "Boxing Class", credits: 5, price: 8, jopassPrice: 5, duration: "60 min" },
    ]
  },
  {
    id: 8,
    name: "The Nail Room",
    category: "Salon",
    icon: "💅",
    color: "#fab1a0",
    image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=300&fit=crop",
    description: "Nail art, pedicures, and hand treatments by expert technicians.",
    services: [
      { id: 801, name: "Classic Manicure", credits: 2, price: 4, jopassPrice: 2, duration: "30 min" },
      { id: 802, name: "Spa Pedicure", credits: 4, price: 7, jopassPrice: 4, duration: "45 min" },
      { id: 803, name: "Nail Art Set", credits: 6, price: 10, jopassPrice: 6, duration: "60 min" },
    ]
  },
];

const CREDIT_PACKS = [
  { id: 1, credits: 10, price: 7.00, label: "Starter", description: "Great for trying out JoPass" },
  { id: 2, credits: 25, price: 15.00, label: "Popular", description: "Best value for regular users" },
  { id: 3, credits: 50, price: 27.50, label: "Power User", description: "For the avid deal hunter" },
  { id: 4, credits: 100, price: 45.00, label: "Ultimate", description: "Maximum savings, maximum fun" },
];
