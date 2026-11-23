"use client";

import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import ProductCard from "@/components/product/ProductCard";
import { Parallax } from "@/components/ui/Parallax";
import Reveal from "@/components/ui/Reveal";
import { useStore } from "@/lib/store";

export default function NewArrivalsPage() {
  const { products } = useStore();
  const fresh = products.filter((p) => p.isNew).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const rest = products.filter((p) => !p.isNew);

  return (
    <>
      <PageHeader eyebrow="Just landed" title="New arrivals" crumbs={[{ label: "New Arrivals" }]} intro="The latest combinations to join the wardrobe — darker contrasts, earthier tones and a confident shot of colour." />
      <div className="mx-auto max-w-[1500px] px-5 py-16 sm:px-8 lg:px-10">
        <div className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {fresh.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.08} className={i % 3 === 1 ? "lg:mt-20" : ""}>
              <Parallax speed={i % 3 === 1 ? -0.06 : 0.03}>
                <ProductCard product={p} priority={i < 3} />
              </Parallax>
            </Reveal>
          ))}
        </div>
        {fresh.length === 0 && <p className="text-muted">No new arrivals right now — check back soon.</p>}

        {rest.length > 0 && (
          <div className="mt-28 border-t border-line pt-16">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="display text-[clamp(30px,3.4vw,54px)]">The core looks</h2>
              <Link href="/shop" className="u-line label text-gold">Shop all →</Link>
            </div>
            <div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              {rest.map((p) => (
                <Reveal key={p.id}>
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
