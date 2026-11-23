export const SIZES = ["S", "M", "L", "XL", "XXL"] as const;
export type Size = (typeof SIZES)[number];

export type Swatch = { name: string; hex: string; family: string };

export type Product = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  shirt: Swatch;
  pant: Swatch;
  price: number;
  /** original price — when higher than price a discount badge is shown */
  compareAt?: number;
  image: string;
  imageSm: string;
  gallery: string[];
  stock: Record<Size, number>;
  isNew?: boolean;
  collections: string[];
  description: string;
  /** Placeholder copy — replace with real supplier specifications. */
  fabric: string[];
  fit: string;
  care: string[];
  createdAt: string;
};

const img = (slug: string) => ({
  image: `/img/products/${slug}.webp`,
  imageSm: `/img/products/${slug}-sm.webp`,
  gallery: [
    `/img/products/${slug}.webp`,
    `/img/products/${slug}-top.webp`,
    `/img/products/${slug}-bottom.webp`,
    `/img/film/${slug}.webp`,
  ],
});

const PLACEHOLDER_FABRIC = [
  "Shirt fabric: composition to be confirmed",
  "Trouser fabric: composition to be confirmed",
  "Weight & weave: to be confirmed",
];
const PLACEHOLDER_CARE = [
  "Follow the care label attached to each garment",
  "Wash similar colours together",
  "Detailed care instructions to be confirmed",
];

/** Product catalogue (mock data). Demo stock levels persist in LocalStorage. */
export const SEED_PRODUCTS: Product[] = [
  {
    id: "p-01",
    slug: "classic-white-navy",
    name: "Classic White & Navy Set",
    tagline: "The boardroom essential",
    shirt: { name: "White", hex: "#F4F4F2", family: "White" },
    pant: { name: "Navy Blue", hex: "#1D2A44", family: "Navy" },
    price: 4499,
    compareAt: 5299,
    ...img("classic-white-navy"),
    stock: { S: 8, M: 14, L: 12, XL: 6, XXL: 3 },
    collections: ["office-edit"],
    description:
      "A crisp white shirt paired with deep navy trousers — the most dependable combination in a man's wardrobe. Sharp enough for the boardroom, relaxed enough for dinner.",
    fabric: PLACEHOLDER_FABRIC,
    fit: "Tailored fit through the chest and waist, straight-leg trousers. Fit details shown are indicative — confirm against the final size chart.",
    care: PLACEHOLDER_CARE,
    createdAt: "2026-09-02",
  },
  {
    id: "p-02",
    slug: "sky-blue-beige",
    name: "Sky Blue & Beige Set",
    tagline: "Light, bright, effortless",
    shirt: { name: "Light Blue", hex: "#AFC8E6", family: "Blue" },
    pant: { name: "Beige", hex: "#C8AE88", family: "Beige" },
    price: 4299,
    ...img("sky-blue-beige"),
    stock: { S: 6, M: 10, L: 9, XL: 0, XXL: 2 },
    collections: ["office-edit", "weekend-ease"],
    description:
      "A soft sky-blue shirt over warm beige chinos. A daylight combination that moves easily from a client lunch to a weekend afternoon.",
    fabric: PLACEHOLDER_FABRIC,
    fit: "Regular fit shirt with a tapered chino. Fit details shown are indicative — confirm against the final size chart.",
    care: PLACEHOLDER_CARE,
    createdAt: "2026-09-10",
  },
  {
    id: "p-03",
    slug: "black-grey",
    name: "Black & Grey Set",
    tagline: "Quiet confidence after dark",
    shirt: { name: "Black", hex: "#141414", family: "Black" },
    pant: { name: "Light Grey", hex: "#B9B9B7", family: "Grey" },
    price: 4799,
    compareAt: 5499,
    ...img("black-grey"),
    stock: { S: 4, M: 9, L: 11, XL: 7, XXL: 5 },
    isNew: true,
    collections: ["office-edit", "after-hours"],
    description:
      "A deep black shirt balanced by light grey trousers. Modern contrast with a minimal attitude — made for evenings that start at the office.",
    fabric: PLACEHOLDER_FABRIC,
    fit: "Slim fit shirt with a straight trouser. Fit details shown are indicative — confirm against the final size chart.",
    care: PLACEHOLDER_CARE,
    createdAt: "2026-10-04",
  },
  {
    id: "p-04",
    slug: "olive-cream",
    name: "Olive & Cream Set",
    tagline: "Earth tones, elevated",
    shirt: { name: "Olive Green", hex: "#5E6B3A", family: "Green" },
    pant: { name: "Cream", hex: "#EDE6D3", family: "Cream" },
    price: 4599,
    ...img("olive-cream"),
    stock: { S: 5, M: 12, L: 10, XL: 8, XXL: 4 },
    isNew: true,
    collections: ["weekend-ease"],
    description:
      "A rich olive shirt with clean cream trousers. Grounded, warm and quietly distinctive — the look for long weekends and slow mornings.",
    fabric: PLACEHOLDER_FABRIC,
    fit: "Relaxed fit shirt with a straight cream trouser. Fit details shown are indicative — confirm against the final size chart.",
    care: PLACEHOLDER_CARE,
    createdAt: "2026-10-18",
  },
  {
    id: "p-05",
    slug: "pink-charcoal",
    name: "Pink & Charcoal Set",
    tagline: "Colour, with composure",
    shirt: { name: "Light Pink", hex: "#E9C3CB", family: "Pink" },
    pant: { name: "Dark Charcoal", hex: "#2E2E30", family: "Charcoal" },
    price: 4399,
    compareAt: 4999,
    ...img("pink-charcoal"),
    stock: { S: 7, M: 11, L: 0, XL: 6, XXL: 2 },
    isNew: true,
    collections: ["weekend-ease", "after-hours"],
    description:
      "A soft pink shirt anchored by dark charcoal trousers. A confident dose of colour, kept in check by a sharp, dark base.",
    fabric: PLACEHOLDER_FABRIC,
    fit: "Tailored fit shirt with a slim charcoal trouser. Fit details shown are indicative — confirm against the final size chart.",
    care: PLACEHOLDER_CARE,
    createdAt: "2026-11-01",
  },
];

export const COLLECTIONS = [
  {
    id: "office-edit",
    name: "The Office Edit",
    blurb: "Sharp, dependable combinations for the working week.",
    cover: "/img/editorial/classic-white-navy.webp",
  },
  {
    id: "weekend-ease",
    name: "Weekend Ease",
    blurb: "Softer colours and relaxed lines for days off the clock.",
    cover: "/img/editorial/olive-cream.webp",
  },
  {
    id: "after-hours",
    name: "After Hours",
    blurb: "Darker bases and confident contrast for the evening.",
    cover: "/img/editorial/black-grey.webp",
  },
] as const;

export const totalStock = (p: Product) => SIZES.reduce((n, s) => n + (p.stock[s] ?? 0), 0);
export const discountPct = (p: Product) =>
  p.compareAt && p.compareAt > p.price ? Math.round((1 - p.price / p.compareAt) * 100) : 0;

const fmt = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
export const formatPrice = (n: number) => fmt.format(Math.round(n));
