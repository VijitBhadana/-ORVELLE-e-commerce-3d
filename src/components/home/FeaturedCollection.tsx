"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import { SplitWords, Stagger, staggerItem } from "@/components/ui/Reveal";
import { useStore } from "@/lib/store";

/*
 * Featured collection: intro copy on the left, an auto-scrolling card carousel on the right.
 * The track holds the cards twice and slides left by exactly one set (-50%), so the loop is
 * seamless. Three cards are in view from lg, two from sm, one (with a peek) on phones.
 * Hovering or focusing a card pauses it; with reduced motion it becomes a swipeable row.
 */

/** card slot width incl. its 1.5rem right gap, sized off the carousel's own width (cqw) */
const SLOT = "w-[calc(82cqw+1.5rem)] sm:w-[calc((100cqw-1.5rem)/2+1.5rem)] lg:w-[calc((100cqw-3rem)/3+1.5rem)]";

export default function FeaturedCollection() {
  const { products } = useStore();
  const featured = products.slice(0, 5);

  return (
    <section id="collection" className="relative scroll-mt-24 bg-ink py-24 sm:py-32">
      <div className="mx-auto max-w-[1500px] px-5 sm:px-8 lg:px-10">
        <Stagger className="grid grid-cols-1 gap-y-14 xl:grid-cols-4 xl:gap-x-6">
          <motion.div variants={staggerItem} className="flex flex-col justify-between gap-8 xl:col-span-1 xl:pr-6">
            <div>
              <p className="eyebrow">01 — Featured collection</p>
              <h2 className="display mt-5 text-[clamp(46px,5.8vw,100px)] xl:text-[clamp(46px,3.6vw,64px)]">
                <SplitWords text="Five looks." />
                <br />
                <SplitWords text="Zero guesswork." delay={0.15} className="text-white/45" />
              </h2>
              <p className="mt-6 max-w-sm text-[16px] leading-[1.42] text-muted">
                Every set pairs a shirt and trousers chosen to work together — colour, weight and proportion already considered.
              </p>
            </div>
            <Link href="/shop" className="u-line label inline-flex items-center gap-2 self-start text-gold">
              View all products <ArrowRight size={13} />
            </Link>
          </motion.div>

          {/* ---- carousel ---- */}
          <motion.div variants={staggerItem} className="min-w-0 xl:col-span-3">
            <div
              className="group/carousel @container overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_3%,#000_97%,transparent)] motion-reduce:snap-x motion-reduce:snap-mandatory motion-reduce:overflow-x-auto"
              role="region"
              aria-label="Featured looks"
            >
              <div className="flex w-max animate-[marquee_34s_linear_infinite] group-hover/carousel:[animation-play-state:paused] group-focus-within/carousel:[animation-play-state:paused] motion-reduce:animate-none">
                {[0, 1].map((copy) =>
                  featured.map((p) => (
                    <div
                      key={`${copy}-${p.id}`}
                      aria-hidden={copy === 1 || undefined}
                      className={`${SLOT} shrink-0 pr-6 motion-reduce:snap-start ${copy === 1 ? "motion-reduce:hidden" : ""}`}
                    >
                      <ProductCard product={p} />
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </Stagger>
      </div>
    </section>
  );
}
