"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import ProductCard from "@/components/product/ProductCard";
import { ParallaxImage } from "@/components/ui/Parallax";
import Reveal from "@/components/ui/Reveal";
import { COLLECTIONS } from "@/lib/products";
import { useStore } from "@/lib/store";

export default function CollectionsPage() {
  const { products } = useStore();
  return (
    <>
      <PageHeader eyebrow="Collections" title="Edits for every hour" crumbs={[{ label: "Collections" }]} intro="Three ways into the wardrobe. Each collection groups the looks by when you'll wear them." />
      {COLLECTIONS.map((c, i) => {
        const items = products.filter((p) => p.collections.includes(c.id));
        return (
          <section key={c.id} id={c.id} className="scroll-mt-20 border-b border-line">
            <div className="relative">
              <ParallaxImage src={c.cover} alt={c.name} className="h-[70svh] min-h-[460px]" strength={14} />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1500px] px-5 pb-12 sm:px-8 lg:px-10">
                <Reveal>
                  <p className="eyebrow">Collection {String(i + 1).padStart(2, "0")}</p>
                  <h2 className="display mt-4 text-[clamp(50px,9.4vw,170px)]">{c.name}</h2>
                  <p className="mt-4 max-w-md text-white/70">{c.blurb}</p>
                </Reveal>
              </div>
            </div>
            <div className="mx-auto max-w-[1500px] px-5 py-16 sm:px-8 lg:px-10">
              <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((p) => (
                  <Reveal key={p.id}>
                    <ProductCard product={p} />
                  </Reveal>
                ))}
              </div>
              <Link href={`/shop?collection=${c.id}`} className="u-line label mt-12 inline-flex items-center gap-2 text-gold">
                Shop {c.name} <ArrowRight size={13} />
              </Link>
            </div>
          </section>
        );
      })}
    </>
  );
}
