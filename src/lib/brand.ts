/**
 * Brand configuration. Everything brand-specific lives here so the store can be
 * re-branded without touching components. "ORVELLE" is a placeholder name.
 * Contact details below are placeholders — replace before going live.
 */
export const BRAND = {
  name: "ORVELLE",
  mark: "O",
  tagline: "Menswear, considered.",
  description:
    "Curated outfit combinations for the modern man — clean lines, honest colours and pieces that work from Monday to Sunday.",
  currency: "INR",
  locale: "en-IN",
  contact: {
    email: "hello@orvelle.example",
    phone: "+91 00000 00000",
    address: "Studio address — to be updated",
    hours: "Mon – Sat, 10:00 – 19:00",
  },
  social: [
    { label: "Instagram", href: "#" },
    { label: "Pinterest", href: "#" },
    { label: "X", href: "#" },
    { label: "YouTube", href: "#" },
  ],
  shipping: {
    freeAbove: 2999,
    fee: 149,
  },
} as const;

/** Editable site copy — change it here. */
export type SiteContent = {
  announcement: string;
  heroHeading: string;
  heroSubheading: string;
  editorialHeading: string;
  promoHeading: string;
  promoText: string;
  promoCode: string;
  deliveryInfo: string;
  returnsInfo: string;
};

export const DEFAULT_CONTENT: SiteContent = {
  announcement: "Complimentary shipping on orders above ₹2,999 · Use WELCOME10 for 10% off your first order",
  heroHeading: "Redefine your everyday style.",
  heroSubheading:
    "Discover thoughtfully curated men's essentials designed for confidence, comfort and timeless style.",
  editorialHeading: "Style is not just what you wear. It's how you present yourself.",
  promoHeading: "The Essentials Edit",
  promoText: "Five complete looks. One effortless wardrobe. Take 10% off your first order.",
  promoCode: "WELCOME10",
  deliveryInfo:
    "Delivery timelines and charges are placeholder content — update them in src/lib/brand.ts to match your logistics partner.",
  returnsInfo:
    "Return and exchange policy is placeholder content — update it in src/lib/brand.ts before launch.",
};

export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Collections", href: "/collections" },
  { label: "New Arrivals", href: "/new-arrivals" },
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
] as const;
