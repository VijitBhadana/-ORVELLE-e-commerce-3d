"use client";

import { useScrollProgress } from "@/lib/useScrollProgress";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion, useTransform } from "framer-motion";
import { ArrowRight, Plus, ShoppingBag } from "lucide-react";
import { useRef, useState } from "react";
import { ColorPair, Price, defaultSize } from "@/components/product/bits";
import { useStore } from "@/lib/store";
import type { Product } from "@/lib/products";

/** client-supplied transparent cutouts (public/img/cutouts, built by tools/build_assets.py) */
const CUTOUTS = new Set(["classic-white-navy", "sky-blue-beige", "black-grey", "olive-cream", "pink-charcoal"]);
const cutout = (p: Product) => (CUTOUTS.has(p.slug) ? `/img/cutouts/${p.slug}.webp` : p.image);

/**
 * "Shop the look": full-screen outfit panels that stack — each panel pins,
 * then scales back and dims as the next look slides over it.
 */
export default function StyleShowcase() {
  const { products } = useStore();
  const looks = products.slice(0, 5);
  return (
    <section id="looks" className="relative bg-ink">
      <div className="mx-auto max-w-[1500px] px-5 pt-24 pb-12 sm:px-8 lg:px-10">
        <p className="eyebrow">02 — Shop the look</p>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-6">
          <h2 className="display text-[clamp(46px,5.8vw,100px)]">
            Dressed, <em className="text-gold">head to toe.</em>
          </h2>
          <p className="max-w-sm text-sm text-muted">Tap the markers to see each piece. Every look ships as a complete set.</p>
        </div>
      </div>
      <div className="relative">
        {looks.map((p, i) => (
          <Panel key={p.id} product={p} index={i} total={looks.length} />
        ))}
      </div>
    </section>
  );
}

function Panel({ product: p, index, total }: { product: Product; index: number; total: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScrollProgress({ target: ref, offset: ["start start", "end start"] });
  const { scrollYProgress: enter } = useScrollProgress({ target: ref, offset: ["start end", "start start"] });
  const scale = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [1, 0.86]);
  const dim = useTransform(scrollYProgress, [0, 1], [0, 0.75]);
  const imgY = useTransform(enter, [0, 1], reduce ? ["0%", "0%"] : ["14%", "0%"]);
  const clip = useTransform(enter, [0, 0.85], reduce ? ["inset(0% 0% 0% 0%)", "inset(0% 0% 0% 0%)"] : ["inset(18% 10% 18% 10%)", "inset(0% 0% 0% 0%)"]);
  const { addToCart, setQuickView } = useStore();
  const [spot, setSpot] = useState<null | "shirt" | "pant">(null);
  const flip = index % 2 === 1;

  return (
    <div ref={ref} className="sticky top-0 h-svh">
      <motion.div style={{ scale }} className="relative h-full origin-top overflow-hidden border-t border-line bg-ink-2">
        <div className={`mx-auto grid h-full max-w-[1500px] grid-rows-[minmax(0,1fr)_auto] gap-6 px-5 pt-20 pb-8 sm:px-8 md:grid-cols-2 md:grid-rows-1 md:items-center md:gap-12 md:pt-24 lg:px-10`}>
          {/* image */}
          <motion.div
            style={{ clipPath: clip }}
            className={`relative flex h-full min-h-0 justify-center bg-[radial-gradient(ellipse_55%_60%_at_50%_55%,rgba(213,54,12,0.13),transparent_72%)] py-4 md:h-[78svh] ${flip ? "md:order-2" : ""}`}
          >
            {/* frame shaped like the figure, so the hotspots stay on the shirt and trousers at any size */}
            <motion.div style={{ y: imgY }} className="relative aspect-[2/5] h-full max-w-full">
              <Image
                src={cutout(p)}
                alt={`${p.name} — full look`}
                fill
                sizes="(min-width:768px) 32vw, 45vw"
                className="object-contain [filter:drop-shadow(0_30px_40px_rgba(16,16,16,0.28))]"
              />
              <Hotspot x={50} y={27} label={`${p.shirt.name} shirt`} open={spot === "shirt"} onToggle={() => setSpot(spot === "shirt" ? null : "shirt")} onView={() => setQuickView(p)} />
              <Hotspot x={50} y={62} label={`${p.pant.name} trousers`} open={spot === "pant"} onToggle={() => setSpot(spot === "pant" ? null : "pant")} onView={() => setQuickView(p)} />
            </motion.div>
          </motion.div>

          {/* copy */}
          <div className={flip ? "md:order-1 md:pl-6" : "md:pr-6"}>
            <div className="flex items-baseline gap-3">
              <span className="display text-[clamp(56px,7vw,116px)] text-gold">{String(index + 1).padStart(2, "0")}</span>
              <span className="label text-white/40">/ {String(total).padStart(2, "0")}</span>
            </div>
            <h3 className="display mt-2 text-[clamp(38px,6vw,96px)]">{p.name}</h3>
            <p className="mt-2 text-[14px] font-bold text-white/60">{p.tagline}</p>
            <p className="mt-6 hidden max-w-md text-[16px] leading-[1.42] text-muted md:block">{p.description}</p>
            <div className="mt-5 space-y-3">
              <ColorPair product={p} size="md" />
              <Price product={p} />
            </div>
            <div className="mt-6 flex flex-wrap gap-3 md:mt-8">
              <Link href={`/product/${p.slug}`} className="btn btn-gold btn-sm md:h-[3.25rem] md:px-7">
                Shop the look <ArrowRight size={14} />
              </Link>
              <button
                className="btn btn-ghost btn-sm md:h-[3.25rem] md:px-7"
                onClick={() => {
                  const s = defaultSize(p);
                  if (s) addToCart(p.id, s, 1);
                }}
              >
                <ShoppingBag size={14} /> Quick add
              </button>
            </div>
          </div>
        </div>
        <motion.div style={{ opacity: dim }} className="pointer-events-none absolute inset-0 bg-black" />
      </motion.div>
    </div>
  );
}

function Hotspot({ x, y, label, open, onToggle, onView }: { x: number; y: number; label: string; open: boolean; onToggle: () => void; onView: () => void }) {
  return (
    <div className="absolute z-10" style={{ left: `${x}%`, top: `${y}%` }}>
      <button onClick={onToggle} aria-label={label} aria-expanded={open} className="relative -translate-x-1/2 -translate-y-1/2">
        <span className="absolute inset-0 animate-ping rounded-full bg-gold/50" />
        <span className={`relative grid h-7 w-7 place-items-center rounded-full bg-gold text-ink transition-transform duration-300 ${open ? "rotate-45" : ""}`}>
          <Plus size={14} />
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }} className="absolute top-1/2 left-6 w-44 -translate-y-1/2 border border-line bg-ink/90 p-3 backdrop-blur-md">
            <p className="text-xs text-white">{label}</p>
            <button onClick={onView} className="label mt-2 text-[0.6rem] text-gold">
              Quick view →
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
