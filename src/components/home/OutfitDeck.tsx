"use client";

/**
 * Outfit deck — the Coco-cola-web "flavour deck" rebuilt for the five looks.
 *
 * A pinned stage holds an intro card plus one full-screen panel per outfit.
 * As you scroll, each panel slides in from the right while the one beneath
 * scales back and darkens; the mannequin swings in rotated and then floats,
 * the copy arrives line by line (staggered), and a giant outline word drifts
 * behind. Same timing constants as Coco-cola-web (SLIDE, LEAD, cubic ease-out).
 *
 * Scroll writes CSS variables (--t, --out) straight onto the panels, so nothing
 * re-renders while scrolling; React only updates when the active look changes.
 */

import Image from "next/image";
import Link from "next/link";
import { useMotionValueEvent } from "framer-motion";
import { ArrowRight, Check, ShoppingBag } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { useScrollProgress } from "@/lib/useScrollProgress";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import { defaultSize } from "@/components/product/bits";
import { formatPrice, type Product } from "@/lib/products";
import { useStore } from "@/lib/store";

const SLIDE = 0.62; // share of each panel's scroll spent sliding in
const LEAD = 0.04; // the intro card holds this long
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

/** per-look colours, all mixed from the palette (warm ivory #E6D5BD base, soft black #101010, burnt orange #D5360C): panels alternate a shaded-ivory glow with an orange accent and a peach (orange-on-ivory) glow with a soft-black accent */
const THEMES: Record<string, { glow: string; base: string; accent: string; ghost: string }> = {
  "classic-white-navy": { glow: "#d5c5af", base: "#e6d5bd", accent: "#d5360c", ghost: "White" },
  "sky-blue-beige": { glow: "#e3b89d", base: "#e6d5bd", accent: "#101010", ghost: "Sky" },
  "black-grey": { glow: "#ccbda8", base: "#e6d5bd", accent: "#d5360c", ghost: "Black" },
  "olive-cream": { glow: "#e1a588", base: "#e6d5bd", accent: "#101010", ghost: "Olive" },
  "pink-charcoal": { glow: "#d7b69d", base: "#e6d5bd", accent: "#d5360c", ghost: "Pink" },
};
const FALLBACK = { glow: "#e3b89d", base: "#e6d5bd", accent: "#d5360c", ghost: "Look" };

const delay = (d: number) => ({ "--d": d }) as CSSProperties;
/** transparent mannequin cutouts built by tools/build_assets.py (public/img/cutouts) */
const CUTOUT_SLUGS = new Set(Object.keys(THEMES));
const cutout = (p: Product, small = false) => (CUTOUT_SLUGS.has(p.slug) ? `/img/cutouts/${p.slug}${small ? "-sm" : ""}.webp` : small ? p.imageSm : p.image);
const shortName = (p: Product) => p.name.replace(/\s+Set$/i, "").replace(/^Classic\s+/i, "");
const firstSentence = (s: string) => (s.match(/^.*?[.!?](\s|$)/)?.[0] ?? s).trim();

export default function OutfitDeck() {
  const { products } = useStore();
  const looks = products.slice(0, 5);
  const sectionRef = useRef<HTMLElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLElement>(null);
  const panelRefs = useRef<(HTMLElement | null)[]>([]);
  const [current, setCurrent] = useState(-1);
  const currentRef = useRef(-1);
  const { scrollTo } = useSmoothScroll();

  const { scrollYProgress } = useScrollProgress({ target: sectionRef, offset: ["start start", "end end"] });

  const update = useCallback(
    (raw: number) => {
      const n = looks.length;
      const dp = clamp((raw - LEAD) / (1 - LEAD)) * n;
      const ts = looks.map((_, i) => ease(clamp((dp - i) / SLIDE)));
      panelRefs.current.forEach((el, i) => {
        if (!el) return;
        const t = ts[i] ?? 0;
        const out = ts[i + 1] ?? 0;
        el.style.setProperty("--t", t.toFixed(4));
        el.style.setProperty("--out", out.toFixed(4));
        el.style.visibility = t > 0 && out < 1 ? "visible" : "hidden";
      });
      introRef.current?.style.setProperty("--out", (ts[0] ?? 0).toFixed(4));
      if (barRef.current) barRef.current.style.transform = `scaleX(${raw.toFixed(4)})`;
      let cur = -1;
      ts.forEach((t, i) => t > 0.5 && (cur = i));
      if (cur !== currentRef.current) {
        currentRef.current = cur;
        setCurrent(cur);
      }
    },
    [looks]
  );

  useMotionValueEvent(scrollYProgress, "change", update);
  useEffect(() => update(scrollYProgress.get()), [update, scrollYProgress]);

  const goTo = (i: number) => {
    const el = sectionRef.current;
    if (!el) return;
    const max = el.offsetHeight - window.innerHeight;
    const dp = i + SLIDE + (1 - SLIDE) * 0.5;
    const top = el.getBoundingClientRect().top + window.scrollY;
    scrollTo(top + (LEAD + (dp / looks.length) * (1 - LEAD)) * max, { duration: 1.4 });
  };

  return (
    <section ref={sectionRef} id="outfits" aria-label="The five outfits" className="relative h-[750vh]">
      <div className="sticky top-0 h-svh overflow-hidden bg-ink">
        {/* intro card */}
        <div ref={introRef} className="deck-intro absolute inset-0 flex flex-col items-center justify-center px-5 pt-16 text-center sm:px-10">
          <p className="eyebrow">The line-up</p>
          <h2 className="display mt-3 text-[clamp(64px,13vw,220px)]">Meet the five.</h2>
          <div aria-hidden className="mt-6 flex w-full max-w-[min(1100px,100%)] items-end justify-center gap-[4%]">
            {looks.map((p) => (
              <div key={p.id} className="relative h-[clamp(150px,30vh,300px)] w-[clamp(56px,11vw,130px)] min-w-0">
                <Image src={cutout(p, true)} alt="" fill sizes="130px" loading="eager" className="object-contain [filter:drop-shadow(0_18px_24px_rgba(16,16,16,0.22))]" />
              </div>
            ))}
          </div>
          <p className="label mt-4 text-muted">Keep scrolling</p>
        </div>

        {looks.map((p, i) => {
          const th = THEMES[p.slug] ?? FALLBACK;
          return (
            <article
              key={p.id}
              ref={(el) => {
                panelRefs.current[i] = el;
              }}
              className="deck-panel"
              style={{ "--glow": th.glow, "--base": th.base, "--accent": th.accent } as CSSProperties}
              aria-label={p.name}
            >
              <div className="deck-ghost" aria-hidden>
                {th.ghost}
              </div>
              <div className="deck-figure">
                <div className="animate-deck-float relative h-full w-full motion-reduce:animate-none">
                  <Image
                    src={cutout(p)}
                    alt={`${p.name} on a mannequin`}
                    fill
                    sizes="(max-width: 900px) 60vw, 30vw"
                    className="object-contain [filter:drop-shadow(0_30px_50px_rgba(16,16,16,0.28))]"
                  />
                </div>
              </div>
              <DeckCopy product={p} index={i} total={looks.length} />
            </article>
          );
        })}

        {/* HUD: names + progress, like Coco-cola-web's flavour dots */}
        <div className={`absolute right-5 bottom-[22px] left-5 z-[5] transition-opacity duration-400 sm:right-10 sm:left-10 ${current >= 0 ? "opacity-100" : "pointer-events-none opacity-0"}`}>
          <div role="group" aria-label="Jump to an outfit" className="no-scrollbar mb-[10px] flex gap-[clamp(14px,2.2vw,32px)] overflow-x-auto">
            {looks.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => goTo(i)}
                aria-current={current === i}
                className={`shrink-0 py-1 text-[12px] font-extrabold tracking-[0.14em] whitespace-nowrap uppercase transition-colors duration-300 hover:text-white ${current === i ? "text-white" : "text-muted"}`}
              >
                {shortName(p)}
              </button>
            ))}
          </div>
          <div className="h-[2px] bg-line">
            <i ref={barRef} className="block h-full w-full origin-left scale-x-0 bg-gold" />
          </div>
        </div>
      </div>
    </section>
  );
}

function DeckCopy({ product: p, index, total }: { product: Product; index: number; total: number }) {
  const { addToCart } = useStore();
  const [added, setAdded] = useState(false);
  const points = [`${p.shirt.name} shirt with ${p.pant.name.toLowerCase()} trousers`, firstSentence(p.fit), "Sizes S – XXL · ships as a complete set"];
  const facts: [string, string][] = [
    ["Shirt", p.shirt.name],
    ["Trousers", p.pant.name],
    ["Price", formatPrice(p.price)],
  ];

  return (
    <div className="relative min-w-0">
      <p className="deck-stag deck-narrow-sm mb-[14px] text-[13px] font-extrabold tracking-[0.22em] text-(--accent) uppercase" style={delay(0)}>
        {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")} — {p.tagline}
      </p>
      <h3 className="deck-stag deck-title display whitespace-nowrap" style={delay(1)}>
        {shortName(p)}
      </h3>
      <p className="deck-stag deck-line mt-[14px] text-[clamp(19px,1.9vw,28px)] leading-[1.2] font-extrabold" style={delay(2)}>
        {firstSentence(p.description)}
      </p>
      <ul className="deck-stag deck-points mt-[22px] grid gap-[11px]" style={delay(3)}>
        {points.map((pt) => (
          <li
            key={pt}
            className="relative pl-[22px] text-[clamp(15px,1.2vw,18px)] leading-[1.35] font-semibold text-muted before:absolute before:top-[0.6em] before:left-0 before:h-[3px] before:w-[10px] before:bg-(--accent) before:content-['']"
          >
            {pt}
          </li>
        ))}
      </ul>
      <dl className="deck-stag deck-facts mt-[26px] flex gap-[clamp(22px,3vw,48px)] border-t border-line pt-[18px]" style={delay(4)}>
        {facts.map(([term, value]) => (
          <div key={term}>
            <dt className="text-[11px] font-extrabold tracking-[0.18em] text-muted uppercase">{term}</dt>
            <dd className="mt-[4px] font-display text-[clamp(22px,2.2vw,34px)] text-(--accent) uppercase">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="deck-stag deck-cta mt-[26px] flex flex-wrap gap-3" style={delay(5)}>
        <Link href={`/product/${p.slug}`} className="btn btn-gold btn-sm sm:h-[3.25rem] sm:px-7">
          Shop the look <ArrowRight size={14} />
        </Link>
        <button
          type="button"
          className="btn btn-ghost btn-sm sm:h-[3.25rem] sm:px-7"
          onClick={() => {
            const s = defaultSize(p);
            if (s && addToCart(p.id, s, 1)) {
              setAdded(true);
              window.setTimeout(() => setAdded(false), 1600);
            }
          }}
        >
          {added ? <Check size={14} /> : <ShoppingBag size={14} />} {added ? "Added" : "Add to bag"}
        </button>
      </div>
    </div>
  );
}
