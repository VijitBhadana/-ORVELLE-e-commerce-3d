"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, X } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import ProductCard from "@/components/product/ProductCard";
import { defaultSize } from "@/components/product/bits";
import { useStore } from "@/lib/store";

export default function WishlistPage() {
  const { wishlist, products, toggleWishlist, addToCart, hydrated } = useStore();
  const items = products.filter((p) => wishlist.includes(p.id));

  return (
    <>
      <PageHeader eyebrow="Saved for later" title="Wishlist" crumbs={[{ label: "Wishlist" }]} intro={hydrated ? `${items.length} saved look${items.length === 1 ? "" : "s"}` : undefined} compact />
      <div className="mx-auto max-w-[1500px] px-5 py-14 sm:px-8 lg:px-10">
        {hydrated && items.length === 0 ? (
          <div className="border border-line py-24 text-center">
            <p className="display text-[clamp(30px,3vw,50px)]">Nothing saved yet.</p>
            <p className="mt-3 text-sm text-muted">Tap the heart on any look to keep it here.</p>
            <Link href="/shop" className="btn btn-gold mt-8">Explore the looks</Link>
          </div>
        ) : (
          <div className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence>
              {items.map((p) => (
                <motion.div key={p.id} layout exit={{ opacity: 0, scale: 0.95 }}>
                  <ProductCard product={p} />
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      className="btn btn-gold btn-sm"
                      onClick={() => {
                        const s = defaultSize(p);
                        if (s && addToCart(p.id, s, 1)) toggleWishlist(p.id);
                      }}
                    >
                      <ShoppingBag size={13} /> Move to bag
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => toggleWishlist(p.id)}>
                      <X size={13} /> Remove
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </>
  );
}
