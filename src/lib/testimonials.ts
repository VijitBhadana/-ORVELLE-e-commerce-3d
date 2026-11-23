/**
 * Testimonials shown in the corridor section (one per screen, six screens).
 *
 * ⚠ PLACEHOLDER CONTENT — these are sample reviews written for the demo store, not real
 * customers. Replace them with genuine reviews (with the customer's permission) before
 * launch, then set SAMPLE_REVIEWS to false so the "Sample review" tag disappears.
 */
export const SAMPLE_REVIEWS = true;

export type Testimonial = {
  quote: string;
  name: string;
  city: string;
  /** product slug from lib/products.ts — the look they bought */
  look: string;
  rating: 1 | 2 | 3 | 4 | 5;
};

export const TESTIMONIALS: Testimonial[] = [
  {
    quote: "The set arrived pressed and ready. I wore it straight to a client meeting and got asked where it was from twice.",
    name: "Sample Customer A",
    city: "Mumbai",
    look: "classic-white-navy",
    rating: 5,
  },
  {
    quote: "Finally a shirt and trousers I don't have to think about. The colours just work together.",
    name: "Sample Customer B",
    city: "Bengaluru",
    look: "sky-blue-beige",
    rating: 5,
  },
  {
    quote: "Sizing guide was spot on. Fits like it was tailored, and the fabric still looks new after many washes.",
    name: "Sample Customer C",
    city: "Delhi",
    look: "black-grey",
    rating: 5,
  },
  {
    quote: "Bought it for a weekend trip and ended up wearing it to dinner as well. Easy, sharp, comfortable.",
    name: "Sample Customer D",
    city: "Pune",
    look: "olive-cream",
    rating: 4,
  },
  {
    quote: "The exchange was painless — new size at my door in three days. That alone earns a repeat order.",
    name: "Sample Customer E",
    city: "Hyderabad",
    look: "pink-charcoal",
    rating: 5,
  },
  {
    quote: "Clean lines, honest colours, no fuss. Exactly what the site promised, and exactly what I wanted.",
    name: "Sample Customer F",
    city: "Jaipur",
    look: "classic-white-navy",
    rating: 5,
  },
];
