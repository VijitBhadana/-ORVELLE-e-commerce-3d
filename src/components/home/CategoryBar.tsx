import Link from "next/link";
import { Ellipsis, Shirt, ShoppingBag, Watch, type LucideIcon } from "lucide-react";
import type { SVGProps } from "react";

/**
 * Light category tab bar that sits on top of the black perks strip at the bottom
 * of the street section. Narrower than the strip, rounded on top only, so it
 * reads as a tab rising out of it. Hoodie / jeans / sneaker / cap have no lucide
 * icon, so they are drawn here in the same 24px line style.
 *
 * The store sells complete sets for now, so every tab opens the shop.
 */

type IconCmp = LucideIcon | ((p: SVGProps<SVGSVGElement>) => React.ReactElement);

const line = { fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round" } as const;

const Hoodie = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...line} {...p}>
    <path d="M9 3.6c-1.2.6-1.6 2-1.4 3.4M15 3.6c1.2.6 1.6 2 1.4 3.4" />
    <path d="M9 3.6a3.4 3.4 0 0 0 6 0" />
    <path d="M7.6 7 4.8 8.4 3 15.5l2.4.9 1.2-4.2V21h10.8v-8.8l1.2 4.2 2.4-.9-1.8-7.1L16.4 7c-1 1.2-2.6 2-4.4 2s-3.4-.8-4.4-2Z" />
    <path d="M10.4 9v3M13.6 9v3M9 17.5h6" />
  </svg>
);

const Jeans = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...line} {...p}>
    <path d="M6.8 3h10.4l1.4 18h-4.4L12 10.5 9.8 21H5.4Z" />
    <path d="M6.6 6h10.8M12 6v4.5M8.6 6c0 1.5-.8 2.6-2 3M15.4 6c0 1.5.8 2.6 2 3" />
  </svg>
);

const Sneaker = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...line} {...p}>
    <path d="M2.5 17.5V11l2.8-3.2 3 2.6c1.6 1.2 3.4 1.9 5.4 2.3l4.6.9c2 .4 3.2 1.8 3.2 3.4v.5Z" />
    <path d="M2.5 17.5V19h19v-1.5M9.2 11l1.4-1.6M11.4 12.2l1.4-1.6M5.5 14.5h3" />
  </svg>
);

const Cap = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...line} {...p}>
    <rect x="4" y="5" width="16" height="13" rx="4" />
    <path d="M4 14.5c2.4-1.6 5-2.4 8-2.4s5.6.8 8 2.4" />
    <path d="M9.6 8.4h4.8v2.4H9.6z" />
  </svg>
);

const CATEGORIES: { label: string; Icon: IconCmp }[] = [
  { label: "T-Shirts", Icon: Shirt },
  { label: "Hoodies", Icon: Hoodie },
  { label: "Jeans", Icon: Jeans },
  { label: "Sneakers", Icon: Sneaker },
  { label: "Accessories", Icon: Cap },
  { label: "Bags", Icon: ShoppingBag },
  { label: "Watches", Icon: Watch },
  { label: "View All", Icon: Ellipsis },
];

export default function CategoryBar({ active = "T-Shirts" }: { active?: string }) {
  return (
    <nav aria-label="Shop by category" className="mx-[3%] rounded-t-2xl bg-[#f0e5d6] md:mx-[5%]">
      <ul className="no-scrollbar flex overflow-x-auto px-2 pt-2 md:grid md:grid-cols-8 md:overflow-visible md:px-4 md:pt-1.5">
        {CATEGORIES.map(({ label, Icon }) => {
          const on = label === active;
          return (
            <li key={label} className="min-w-[74px] flex-1">
              <Link
                href="/shop"
                aria-current={on ? "page" : undefined}
                className="group flex flex-col items-center gap-0.5 px-1 pb-1.5 outline-offset-2 md:gap-1 md:pb-1"
              >
                <span
                  className={`grid h-8 w-8 place-items-center rounded-full transition-colors duration-300 md:h-[34px] md:w-[34px] ${
                    on ? "bg-gold text-ink" : "bg-ink-2 text-fg group-hover:bg-gold group-hover:text-ink"
                  }`}
                >
                  <Icon className="h-4 w-4 md:h-[18px] md:w-[18px]" strokeWidth={1.6} aria-hidden />
                </span>
                <span className="text-[10.5px] leading-none font-semibold whitespace-nowrap text-fg md:text-[12px]">{label}</span>
                <span className={`mt-0.5 h-[2px] w-8 rounded-full md:w-11 ${on ? "bg-gold" : "bg-transparent"}`} />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
