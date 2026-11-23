"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Heart, Search, ShoppingBag, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import Modal from "@/components/ui/Modal";
import { Price, ColorPair, QtyStepper, SizePicker, defaultSize } from "@/components/product/bits";
import { useStore } from "@/lib/store";
import { BRAND } from "@/lib/brand";
import { formatPrice, type Size } from "@/lib/products";

export default function Overlays() {
  return (
    <>
      <SearchOverlay />
      <CartDrawer />
      <QuickView />
      <Toaster />
    </>
  );
}

function SearchOverlay() {
  const { searchOpen, setSearchOpen, products } = useStore();
  const [q, setQ] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (searchOpen) window.setTimeout(() => input.current?.focus(), 250);
    else setQ("");
  }, [searchOpen]);

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return products.slice(0, 5);
    return products.filter((p) => [p.name, p.tagline, p.shirt.name, p.pant.name, p.shirt.family, p.pant.family].join(" ").toLowerCase().includes(t));
  }, [q, products]);

  const close = () => setSearchOpen(false);

  return (
    <Modal open={searchOpen} onClose={close} side="top" label="Search">
      <div className="mx-auto max-w-5xl px-5 pt-16 pb-10 sm:px-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            close();
            router.push(`/shop?q=${encodeURIComponent(q)}`);
          }}
          className="flex items-center gap-4 border-b border-line pb-4"
        >
          <Search className="text-gold" size={22} strokeWidth={1.5} />
          <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search shirts, colours, looks…" className="display w-full bg-transparent text-[clamp(30px,3.4vw,54px)] outline-none placeholder:text-white/25" aria-label="Search products" />
        </form>
        <p className="label mt-6 text-muted">{q ? `${results.length} result${results.length === 1 ? "" : "s"}` : "Popular looks"}</p>
        <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {results.map((p) => (
            <li key={p.id}>
              <Link href={`/product/${p.slug}`} onClick={close} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden bg-card">
                  <Image src={p.imageSm} alt={p.name} fill sizes="200px" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <p className="mt-2 text-sm">{p.name}</p>
                <p className="text-xs text-muted">{formatPrice(p.price)}</p>
              </Link>
            </li>
          ))}
          {!results.length && <li className="col-span-full text-muted">Nothing matches “{q}”. Try “olive”, “navy” or “pink”.</li>}
        </ul>
      </div>
    </Modal>
  );
}

function CartDrawer() {
  const { cartOpen, setCartOpen, lines, subtotal, removeFromCart, updateQty, cartCount } = useStore();
  const close = () => setCartOpen(false);
  const remaining = BRAND.shipping.freeAbove - subtotal;
  return (
    <Modal open={cartOpen} onClose={close} side="right" label="Shopping bag">
      <div className="flex min-h-full flex-col">
        <div className="border-b border-line px-6 pt-6 pb-5">
          <p className="eyebrow">Your bag</p>
          <h2 className="display mt-2 text-[clamp(30px,3vw,50px)]">{cartCount ? `${cartCount} item${cartCount > 1 ? "s" : ""}` : "Empty, for now"}</h2>
          {subtotal > 0 && (
            <div className="mt-4">
              <p className="text-xs text-muted">{remaining > 0 ? `${formatPrice(remaining)} away from complimentary shipping` : "You've unlocked complimentary shipping"}</p>
              <div className="mt-2 h-px bg-line">
                <motion.div className="h-px origin-left bg-gold" animate={{ scaleX: Math.min(1, subtotal / BRAND.shipping.freeAbove) }} transition={{ duration: 0.6 }} />
              </div>
            </div>
          )}
        </div>
        <ul className="flex-1 divide-y divide-line px-6">
          <AnimatePresence initial={false}>
            {lines.map((l) => (
              <motion.li key={l.key} layout initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30, height: 0 }} className="flex gap-4 py-5">
                <Link href={`/product/${l.product.slug}`} onClick={close} className="relative h-28 w-22 shrink-0 overflow-hidden bg-card">
                  <Image src={l.product.imageSm} alt={l.product.name} fill sizes="88px" className="object-cover" />
                </Link>
                <div className="flex flex-1 flex-col">
                  <div className="flex justify-between gap-2">
                    <p className="text-sm leading-snug">{l.product.name}</p>
                    <button aria-label={`Remove ${l.product.name}`} onClick={() => removeFromCart(l.key)} className="text-muted hover:text-white">
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-muted">Size {l.size}</p>
                  <div className="mt-auto flex items-center justify-between">
                    <QtyStepper small value={l.qty} max={l.product.stock[l.size]} onChange={(n) => updateQty(l.key, n)} />
                    <span className="text-sm">{formatPrice(l.lineTotal)}</span>
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
          {!lines.length && (
            <li className="py-12 text-center">
              <ShoppingBag className="mx-auto text-line" size={40} strokeWidth={1} />
              <p className="mt-4 text-sm text-muted">Five complete looks are waiting.</p>
              <Link href="/shop" onClick={close} className="btn btn-ghost btn-sm mt-6">
                Shop the collection
              </Link>
            </li>
          )}
        </ul>
        {lines.length > 0 && (
          <div className="sticky bottom-0 border-t border-line bg-ink-2 px-6 py-5">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <p className="mt-1 text-xs text-muted">Shipping and offers calculated at checkout.</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link href="/cart" onClick={close} className="btn btn-ghost btn-sm">
                View bag
              </Link>
              <Link href="/checkout" onClick={close} className="btn btn-gold btn-sm">
                Checkout
              </Link>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function QuickView() {
  const { quickView, setQuickView, addToCart, isWishlisted, toggleWishlist, setCartOpen } = useStore();
  const [size, setSize] = useState<Size | null>(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const p = quickView;

  useEffect(() => {
    if (p) {
      setSize(defaultSize(p));
      setQty(1);
      setAdded(false);
    }
  }, [p]);

  return (
    <Modal open={!!p} onClose={() => setQuickView(null)} label={p ? `Quick view: ${p.name}` : "Quick view"}>
      {p && (
        <div className="grid md:grid-cols-2">
          <div className="relative aspect-[4/5] bg-ink md:aspect-auto md:min-h-[560px]">
            <Image src={p.image} alt={p.name} fill sizes="(min-width: 768px) 500px, 100vw" className="object-cover" priority />
          </div>
          <div className="flex flex-col p-6 sm:p-10">
            <p className="eyebrow">{p.tagline}</p>
            <h2 className="display mt-3 text-[clamp(30px,3.4vw,54px)]">{p.name}</h2>
            <Price product={p} className="mt-4 text-lg" />
            <div className="mt-4">
              <ColorPair product={p} />
            </div>
            <p className="mt-6 text-[16px] leading-[1.42] text-muted">{p.description}</p>
            <p className="label mt-8 mb-3 text-muted">Select size</p>
            <SizePicker product={p} value={size} onChange={setSize} />
            <div className="mt-6 flex items-center gap-3">
              <QtyStepper value={qty} onChange={setQty} max={size ? p.stock[size] : 1} />
              <button
                className="btn btn-gold flex-1"
                disabled={!size}
                onClick={() => {
                  if (size && addToCart(p.id, size, qty)) {
                    setAdded(true);
                    window.setTimeout(() => {
                      setQuickView(null);
                      setCartOpen(true);
                    }, 650);
                  }
                }}
              >
                {added ? (
                  <>
                    <Check size={15} /> Added
                  </>
                ) : (
                  <>
                    <ShoppingBag size={15} /> Add to cart
                  </>
                )}
              </button>
              <button aria-label="Toggle wishlist" onClick={() => toggleWishlist(p.id)} className={`grid h-13 w-13 shrink-0 place-items-center border transition-colors ${isWishlisted(p.id) ? "border-gold text-gold" : "border-line text-white hover:border-white/60"}`}>
                <Heart size={17} fill={isWishlisted(p.id) ? "currentColor" : "none"} />
              </button>
            </div>
            <Link href={`/product/${p.slug}`} onClick={() => setQuickView(null)} className="u-line label mt-8 inline-flex items-center gap-2 self-start text-white/80 hover:text-gold">
              Full details <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Toaster() {
  const { toasts } = useStore();
  return (
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-[90] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div key={t.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="flex items-center gap-3 border border-line bg-card/95 px-4 py-3 text-sm shadow-2xl backdrop-blur">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
