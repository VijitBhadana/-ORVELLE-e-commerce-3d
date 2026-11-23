"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import { Parallax } from "@/components/ui/Parallax";
import { SplitWords, Stagger, staggerItem } from "@/components/ui/Reveal";
import { useStore } from "@/lib/store";

export default function NewArrivals() {
  const { products } = useStore();
  const fresh = products.filter((p) => p.isNew).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3);
  if (!fresh.length) return null;

  return (
    <section id="new" className="relative bg-ink py-24 sm:py-32">
      <div className="mx-auto max-w-[1500px] px-5 sm:px-8 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">05 — New arrivals</p>
            <h2 className="display mt-5 text-[clamp(46px,5.8vw,100px)]">
              <SplitWords text="Just landed." />
            </h2>
          </div>
          <Link href="/new-arrivals" className="u-line label inline-flex items-center gap-2 text-gold">
            All new arrivals <ArrowRight size={13} />
          </Link>
        </div>
        <Stagger className="mt-16 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {fresh.map((p, i) => (
            <motion.div key={p.id} variants={staggerItem} className={i === 1 ? "lg:mt-24" : ""}>
              <Parallax speed={i === 1 ? -0.08 : 0.04}>
                <ProductCard product={p} />
              </Parallax>
            </motion.div>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
