"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Heart, Ruler, ShoppingBag, Truck, ZoomIn } from "lucide-react";
import { useEffect, useState } from "react";
import ProductCard from "@/components/product/ProductCard";
import { ColorPair, Price, QtyStepper, SizePicker, defaultSize } from "@/components/product/bits";
import Modal from "@/components/ui/Modal";
import Reveal from "@/components/ui/Reveal";
import { useStore } from "@/lib/store";
import { SIZES, totalStock, type Size } from "@/lib/products";

export default function ProductDetail({ slug }: { slug: string }) {
  const { getProduct, products, addToCart, isWishlisted, toggleWishlist, setCartOpen, content, hydrated } = useStore();
  const p = getProduct(slug);
  const router = useRouter();
  const [active, setActive] = useState(0);
  const [size, setSize] = useState<Size | null>(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [sizeGuide, setSizeGuide] = useState(false);
  const [sizeError, setSizeError] = useState(false);

  useEffect(() => {
    if (p) setSize((s) => s ?? defaultSize(p));
  }, [p]);

  if (!p) {
    return (
      <div className="mx-auto flex min-h-[70svh] max-w-xl flex-col items-center justify-center px-5 pt-24 text-center">
        {hydrated ? (
          <>
            <p className="eyebrow">Not found</p>
            <h1 className="display mt-4 text-[clamp(46px,5.8vw,100px)]">This look has moved on.</h1>
            <Link href="/shop" className="btn btn-gold mt-8">Back to the shop</Link>
          </>
        ) : (
          <div className="h-8 w-8 animate-spin rounded-full border border-gold border-t-transparent" />
        )}
      </div>
    );
  }

  const soldOut = totalStock(p) === 0;
  const maxQty = size ? Math.max(1, p.stock[size]) : 1;
  const related = products.filter((x) => x.id !== p.id).slice(0, 4);
  const labels = ["Full look", "Shirt detail", "Trouser detail", "From the film"];

  const add = () => {
    if (!size) {
      setSizeError(true);
      return false;
    }
    const ok = addToCart(p.id, size, qty);
    if (ok) {
      setAdded(true);
      window.setTimeout(() => setAdded(false), 1800);
    }
    return ok;
  };

  return (
    <div className="pt-24 md:pt-28">
      <div className="mx-auto max-w-[1500px] px-5 sm:px-8 lg:px-10">
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap gap-2 text-xs text-muted">
          <Link href="/" className="hover:text-white">Home</Link>/<Link href="/shop" className="hover:text-white">Shop</Link>/<span className="text-white/80">{p.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
          {/* gallery */}
          <div className="grid gap-4 md:grid-cols-[84px_1fr]">
            <div className="no-scrollbar order-2 flex gap-3 overflow-x-auto md:order-1 md:flex-col">
              {p.gallery.map((src, i) => (
                <button key={src} onClick={() => setActive(i)} aria-label={`Show ${labels[i] ?? `image ${i + 1}`}`} className={`relative aspect-[4/5] w-20 shrink-0 overflow-hidden border transition-colors md:w-full ${active === i ? "border-gold" : "border-line opacity-60 hover:opacity-100"}`}>
                  <Image src={src} alt="" fill sizes="84px" className="object-cover" />
                </button>
              ))}
            </div>
            <div className="order-1 md:order-2">
              <ZoomImage key={p.gallery[active]} src={p.gallery[active]} alt={`${p.name} — ${labels[active] ?? ""}`} />
              <p className="label mt-3 text-muted">{labels[active]}</p>
            </div>
          </div>

          {/* info */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="eyebrow">{p.tagline}</p>
            <h1 className="display mt-3 text-[clamp(46px,5.8vw,100px)]">{p.name}</h1>
            <Price product={p} className="mt-5 text-xl" />
            <p className="mt-1 text-xs text-muted">Inclusive of all taxes (placeholder — confirm tax display)</p>

            <div className="mt-8 border-y border-line py-6">
              <p className="label mb-3 text-muted">Colour combination</p>
              <ColorPair product={p} size="md" />
            </div>

            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between">
                <p className={`label ${sizeError ? "text-red-400" : "text-muted"}`}>{sizeError ? "Please select a size" : `Size${size ? ` — ${size}` : ""}`}</p>
                <button onClick={() => setSizeGuide(true)} className="u-line label inline-flex items-center gap-1.5 text-white/70 hover:text-gold">
                  <Ruler size={13} /> Size guide
                </button>
              </div>
              <SizePicker product={p} value={size} onChange={(s) => { setSize(s); setSizeError(false); setQty(1); }} />
              {size && p.stock[size] > 0 && p.stock[size] <= 3 && <p className="mt-3 text-xs text-gold">Only {p.stock[size]} left in {size}</p>}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <QtyStepper value={qty} onChange={setQty} max={maxQty} />
              <button onClick={add} disabled={soldOut} className="btn btn-light min-w-48 flex-1">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span key={String(added)} className="flex items-center gap-2" initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }}>
                    {added ? <Check size={15} /> : <ShoppingBag size={15} />} {soldOut ? "Sold out" : added ? "Added to bag" : "Add to cart"}
                  </motion.span>
                </AnimatePresence>
              </button>
              <button onClick={() => toggleWishlist(p.id)} aria-label="Toggle wishlist" aria-pressed={isWishlisted(p.id)} className={`grid h-[3.25rem] w-[3.25rem] place-items-center border transition-colors ${isWishlisted(p.id) ? "border-gold text-gold" : "border-line hover:border-white/60"}`}>
                <Heart size={18} fill={isWishlisted(p.id) ? "currentColor" : "none"} />
              </button>
            </div>
            <button
              disabled={soldOut}
              onClick={() => {
                if (add()) router.push("/checkout");
              }}
              className="btn btn-gold mt-3 w-full"
            >
              Buy now
            </button>
            {added && (
              <button onClick={() => setCartOpen(true)} className="u-line label mt-4 text-gold">
                View bag →
              </button>
            )}

            <div className="mt-8 flex items-center gap-3 text-xs text-muted">
              <Truck size={16} className="text-gold" /> Complimentary shipping on orders above ₹2,999
            </div>

            <div className="mt-8 border-t border-line">
              <Accordion title="Product description" defaultOpen>
                <p>{p.description}</p>
              </Accordion>
              <Accordion title="Fabric details">
                <ul className="list-disc space-y-1 pl-5">{p.fabric.map((x) => <li key={x}>{x}</li>)}</ul>
                <p className="mt-3 text-xs text-white/40">Placeholder specification — update in src/lib/products.ts.</p>
              </Accordion>
              <Accordion title="Fit information">
                <p>{p.fit}</p>
              </Accordion>
              <Accordion title="Washing instructions">
                <ul className="list-disc space-y-1 pl-5">{p.care.map((x) => <li key={x}>{x}</li>)}</ul>
              </Accordion>
              <Accordion title="Delivery & returns">
                <p>{content.deliveryInfo}</p>
                <p className="mt-3">{content.returnsInfo}</p>
              </Accordion>
            </div>
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-[1500px] px-5 py-28 sm:px-8 lg:px-10">
        <Reveal>
          <p className="eyebrow">Complete the wardrobe</p>
          <h2 className="display mt-4 text-[clamp(46px,5.8vw,100px)]">You may also like</h2>
        </Reveal>
        <div className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {related.map((r) => (
            <Reveal key={r.id}>
              <ProductCard product={r} />
            </Reveal>
          ))}
        </div>
      </section>

      <Modal open={sizeGuide} onClose={() => setSizeGuide(false)} label="Size guide">
        <div className="p-6 sm:p-10">
          <p className="eyebrow">Size guide</p>
          <h2 className="display mt-3 text-[clamp(30px,3vw,50px)]">Find your fit</h2>
          <p className="mt-3 text-sm text-muted">Indicative placeholder measurements — replace with the brand&apos;s final size chart.</p>
          <div className="mt-8 overflow-x-auto" data-lenis-prevent>
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="label text-muted">
                <tr className="border-b border-line">
                  <th className="py-3">Size</th><th>Chest (in)</th><th>Waist (in)</th><th>Shirt length (in)</th>
                </tr>
              </thead>
              <tbody>
                {SIZES.map((s, i) => (
                  <tr key={s} className="border-b border-line/60">
                    <td className="py-3 font-semibold">{s}</td>
                    <td>{38 + i * 2}</td>
                    <td>{30 + i * 2}</td>
                    <td>{28.5 + i * 0.5}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ZoomImage({ src, alt }: { src: string; alt: string }) {
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`group relative aspect-[4/5] overflow-hidden bg-card ${zoom ? "cursor-zoom-out" : "cursor-zoom-in"}`}
      onClick={() => setZoom((z) => !z)}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
      }}
      onPointerLeave={() => setZoom(false)}
    >
      <Image src={src} alt={alt} fill priority sizes="(min-width:1024px) 50vw, 100vw" className="object-cover transition-transform duration-500 ease-out" style={{ transform: zoom ? "scale(2.1)" : "scale(1)", transformOrigin: origin }} />
      <span className="pointer-events-none absolute right-4 bottom-4 flex items-center gap-2 bg-ink/60 px-3 py-2 text-[0.6rem] tracking-widest uppercase backdrop-blur-sm transition-opacity group-hover:opacity-100 md:opacity-0">
        <ZoomIn size={13} /> {zoom ? "Click to reset" : "Click to zoom"}
      </span>
    </motion.div>
  );
}

function Accordion({ title, children, defaultOpen }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="border-b border-line">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center justify-between py-5 text-left">
        <span className="label text-white">{title}</span>
        <ChevronDown size={16} className={`text-muted transition-transform duration-500 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
            <div className="pb-6 text-[16px] leading-[1.42] text-muted">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
