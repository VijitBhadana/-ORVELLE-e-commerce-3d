"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Eye, Heart, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { SIZES, discountPct, totalStock, type Product } from "@/lib/products";
import { useStore } from "@/lib/store";
import { ColorPair, Price, defaultSize } from "./bits";

export default function ProductCard({ product: p, priority, layout = "grid" }: { product: Product; priority?: boolean; layout?: "grid" | "list" }) {
  const { addToCart, isWishlisted, toggleWishlist, setQuickView, setCartOpen } = useStore();
  const [added, setAdded] = useState(false);
  const off = discountPct(p);
  const soldOut = totalStock(p) === 0;
  const wished = isWishlisted(p.id);

  const quickAdd = () => {
    const s = defaultSize(p);
    if (!s) return;
    if (addToCart(p.id, s, 1)) {
      setAdded(true);
      window.setTimeout(() => setAdded(false), 1600);
    }
  };

  const media = (
    <div className={`group/img relative overflow-hidden bg-card ${layout === "list" ? "aspect-[4/5] w-40 shrink-0 sm:w-56" : "aspect-[4/5]"}`}>
      <Link href={`/product/${p.slug}`} aria-label={p.name} className="absolute inset-0">
        <Image src={p.image} alt={`${p.name} on a mannequin`} fill priority={priority} sizes="(min-width:1280px) 25vw, (min-width:640px) 45vw, 92vw" className="object-cover transition-[transform,opacity] duration-[1200ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.07]" />
        <Image src={p.gallery[1]} alt="" aria-hidden fill sizes="(min-width:1280px) 25vw, 45vw" className="object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
      </Link>

      <div className="pointer-events-none absolute top-3 left-3 flex flex-col gap-1.5">
        {off > 0 && <span className="bg-gold px-2 py-1 text-[0.6rem] font-bold tracking-widest text-ink">−{off}%</span>}
        {p.isNew && <span className="border border-white/40 bg-ink/50 px-2 py-1 text-[0.6rem] font-bold tracking-widest backdrop-blur-sm">NEW</span>}
        {soldOut && <span className="bg-white/90 px-2 py-1 text-[0.6rem] font-bold tracking-widest text-ink">SOLD OUT</span>}
      </div>

      <button
        onClick={() => toggleWishlist(p.id)}
        aria-label={wished ? `Remove ${p.name} from wishlist` : `Add ${p.name} to wishlist`}
        aria-pressed={wished}
        className="absolute top-3 right-3 grid h-10 w-10 place-items-center rounded-full bg-ink/40 backdrop-blur-sm transition-colors hover:bg-ink/70"
      >
        <motion.span key={String(wished)} initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 15 }}>
          <Heart size={16} className={wished ? "text-gold" : "text-white"} fill={wished ? "currentColor" : "none"} />
        </motion.span>
      </button>

      {/* hover actions (always visible on touch screens) */}
      <div className="absolute inset-x-3 bottom-3 grid grid-cols-2 gap-2 transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)] [@media(hover:hover)]:translate-y-3 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-hover:opacity-100">
        <button onClick={() => setQuickView(p)} className="btn btn-sm bg-ink/75 px-2 text-white backdrop-blur-md hover:bg-ink">
          <Eye size={14} /> <span className="max-sm:hidden lg:inline xl:inline">Quick view</span>
        </button>
        <button onClick={quickAdd} disabled={soldOut} className="btn btn-sm btn-light px-2">
          <AnimatePresence mode="wait" initial={false}>
            {added ? (
              <motion.span key="ok" className="flex items-center gap-1.5" initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0 }}>
                <Check size={14} /> Added
              </motion.span>
            ) : (
              <motion.span key="add" className="flex items-center gap-1.5" initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0 }}>
                <ShoppingBag size={14} /> Add
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </div>
  );

  const info = (
    <div className={layout === "list" ? "flex flex-1 flex-col justify-center gap-3 py-2" : "mt-4 space-y-2"}>
      <div className="flex items-start justify-between gap-3">
        <Link href={`/product/${p.slug}`} className="text-[0.95rem] leading-snug text-white transition-colors hover:text-gold">
          {p.name}
        </Link>
      </div>
      <ColorPair product={p} />
      <Price product={p} className="text-sm" />
      <div className="flex gap-1.5 pt-1" aria-label="Available sizes">
        {SIZES.map((s) => (
          <span key={s} className={`text-[0.65rem] tracking-wider ${p.stock[s] > 0 ? "text-white/60" : "text-white/20 line-through"}`}>
            {s}
          </span>
        ))}
      </div>
      {layout === "list" && (
        <>
          <p className="max-w-md text-[16px] leading-[1.42] text-muted max-sm:hidden">{p.description}</p>
          <div className="flex gap-2">
            <button onClick={quickAdd} disabled={soldOut} className="btn btn-gold btn-sm">
              {added ? <Check size={14} /> : <ShoppingBag size={14} />} {added ? "Added" : "Add to cart"}
            </button>
            <button onClick={() => setCartOpen(true)} className="btn btn-ghost btn-sm max-sm:hidden">
              View bag
            </button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <motion.article whileHover={{ y: -6 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className={`group ${layout === "list" ? "flex gap-5 border-b border-line pb-5 sm:gap-8" : ""}`}>
      {media}
      {info}
    </motion.article>
  );
}
