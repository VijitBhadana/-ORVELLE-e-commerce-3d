"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { QtyStepper } from "@/components/product/bits";
import { useStore } from "@/lib/store";
import Summary from "@/components/cart/Summary";
import { SIZES, formatPrice } from "@/lib/products";

export default function CartPage() {
  const s = useStore();
  return (
    <>
      <PageHeader eyebrow="Shopping bag" title="Your bag" crumbs={[{ label: "Bag" }]} compact />
      <div className="mx-auto max-w-[1500px] px-5 py-14 sm:px-8 lg:px-10">
        {!s.hydrated ? (
          <div className="h-60" />
        ) : s.lines.length === 0 ? (
          <div className="border border-line py-24 text-center">
            <p className="display text-[clamp(30px,3vw,50px)]">Your bag is empty.</p>
            <p className="mt-3 text-sm text-muted">Five complete looks are one click away.</p>
            <Link href="/shop" className="btn btn-gold mt-8">Start shopping</Link>
          </div>
        ) : (
          <div className="grid gap-12 lg:grid-cols-[1fr_400px]">
            <div>
              <div className="label hidden grid-cols-[1fr_120px_140px_110px] gap-6 border-b border-line pb-4 text-muted md:grid">
                <span>Product</span><span>Size</span><span>Quantity</span><span className="text-right">Total</span>
              </div>
              <ul>
                <AnimatePresence initial={false}>
                  {s.lines.map((l) => (
                    <motion.li key={l.key} layout exit={{ opacity: 0, height: 0 }} className="grid grid-cols-[88px_1fr] gap-x-5 gap-y-4 border-b border-line py-6 md:grid-cols-[1fr_120px_140px_110px] md:items-center md:gap-6">
                      <div className="contents md:flex md:items-center md:gap-5">
                        <Link href={`/product/${l.product.slug}`} className="relative row-span-3 aspect-[4/5] w-22 shrink-0 overflow-hidden bg-card md:row-span-1">
                          <Image src={l.product.imageSm} alt={l.product.name} fill sizes="88px" className="object-cover" />
                        </Link>
                        <div>
                          <Link href={`/product/${l.product.slug}`} className="hover:text-gold">{l.product.name}</Link>
                          <p className="mt-1 text-xs text-muted">{l.product.shirt.name} / {l.product.pant.name} · {formatPrice(l.product.price)}</p>
                          <button onClick={() => s.removeFromCart(l.key)} className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted hover:text-white">
                            <Trash2 size={13} /> Remove
                          </button>
                        </div>
                      </div>
                      <select value={l.size} onChange={(e) => s.changeSize(l.key, e.target.value as (typeof SIZES)[number])} aria-label="Change size" className="field h-10 w-28 text-xs">
                        {SIZES.map((sz) => (
                          <option key={sz} value={sz} disabled={(l.product.stock[sz] ?? 0) <= 0}>
                            {sz}{(l.product.stock[sz] ?? 0) <= 0 ? " — sold out" : ""}
                          </option>
                        ))}
                      </select>
                      <QtyStepper small value={l.qty} max={l.product.stock[l.size]} onChange={(n) => s.updateQty(l.key, n)} />
                      <p className="col-start-2 md:col-start-auto md:text-right">{formatPrice(l.lineTotal)}</p>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
              <div className="mt-6 flex justify-between">
                <Link href="/shop" className="u-line label text-white/70 hover:text-white">← Continue shopping</Link>
                <button onClick={s.clearCart} className="label text-muted hover:text-white">Clear bag</button>
              </div>
            </div>
            <Summary />
          </div>
        )}
      </div>
    </>
  );
}
