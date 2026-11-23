"use client";

import { useScrollProgress } from "@/lib/useScrollProgress";
import Link from "next/link";
import { motion, useReducedMotion, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useRef } from "react";
import PageHeader from "@/components/ui/PageHeader";
import { Parallax, ParallaxImage } from "@/components/ui/Parallax";
import Reveal, { SplitWords } from "@/components/ui/Reveal";
import { BRAND } from "@/lib/brand";

const PILLARS = [
  { n: "01", title: "Philosophy", text: "A man's wardrobe should make mornings easier. We design complete looks so the decision is already made — and made well." },
  { n: "02", title: "Approach", text: "Colour first, then proportion, then detail. Every shirt is paired with the trousers that flatter it most, then tested as a set." },
  { n: "03", title: "Vision", text: "A small, considered wardrobe that grows season by season — where every new piece works with what you already own." },
];

export default function AboutPage() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScrollProgress({ target: ref, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["0%", "-30%"]);

  return (
    <>
      <PageHeader eyebrow={`About ${BRAND.name}`} title="Menswear, considered." crumbs={[{ label: "About Us" }]} intro={BRAND.description} />

      {/* intro */}
      <section className="mx-auto grid max-w-[1500px] gap-12 px-5 py-24 sm:px-8 md:grid-cols-12 lg:px-10">
        <div className="md:col-span-5">
          <ParallaxImage src="/img/film/base.webp" alt="The mannequin in its base layer, before being dressed" className="aspect-[4/5]" sizes="(min-width:768px) 40vw, 100vw" objectPosition="50% 40%" />
        </div>
        <div className="flex flex-col justify-center md:col-span-6 md:col-start-7">
          <Reveal>
            <p className="eyebrow">Brand introduction</p>
            <h2 className="display mt-5 text-[clamp(46px,5.8vw,100px)]">
              <SplitWords text="We start with the silhouette." />
            </h2>
            <p className="mt-8 text-[16px] leading-[1.42] text-muted">
              {BRAND.name} began with a simple observation: most men don&apos;t shop for shirts or trousers — they shop for how they want to look. So we build outfits, not items. Every look is resolved head to toe, so you can dress with intent in seconds.
            </p>
            <p className="mt-4 text-xs text-white/40">Brand story copy is placeholder — edit in src/app/about/page.tsx or src/lib/brand.ts.</p>
          </Reveal>
        </div>
      </section>

      {/* moving lineup */}
      <section ref={ref} className="overflow-hidden border-y border-line py-16">
        <motion.div style={{ x }} className="flex w-max gap-6 pl-[10vw]">
          {["classic-white-navy", "sky-blue-beige", "black-grey", "olive-cream", "pink-charcoal", "classic-white-navy", "sky-blue-beige"].map((s, i) => (
            <div key={i} className="relative aspect-[4/5] w-[44vw] shrink-0 overflow-hidden bg-card sm:w-[26vw] lg:w-[18vw]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/img/products/${s}-sm.webp`} alt="" loading="lazy" className="h-full w-full object-cover" />
            </div>
          ))}
        </motion.div>
      </section>

      {/* pillars */}
      <section className="mx-auto max-w-[1500px] px-5 py-28 sm:px-8 lg:px-10">
        <div className="grid gap-px bg-line md:grid-cols-3">
          {PILLARS.map((p, i) => (
            <Reveal key={p.n} delay={i * 0.1} className="bg-ink p-8 sm:p-12">
              <span className="display text-[clamp(56px,7vw,116px)] text-gold">{p.n}</span>
              <h3 className="display mt-6 text-[clamp(30px,3vw,50px)]">{p.title}</h3>
              <p className="mt-4 text-[16px] leading-[1.42] text-muted">{p.text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* editorial pair */}
      <section className="mx-auto grid max-w-[1500px] gap-6 px-5 pb-28 sm:px-8 md:grid-cols-2 lg:px-10">
        <Parallax speed={0.05}>
          <ParallaxImage src="/img/products/sky-blue-beige-top.webp" alt="Light-blue shirt detail" className="aspect-[4/5]" sizes="50vw" />
        </Parallax>
        <Parallax speed={-0.06} className="md:mt-32">
          <ParallaxImage src="/img/products/classic-white-navy-bottom.webp" alt="Navy trousers detail" className="aspect-[4/5]" sizes="50vw" />
          <Reveal className="mt-10">
            <p className="text-[clamp(19px,1.9vw,28px)] font-extrabold leading-[1.2] text-white/85">&ldquo;Fashion fades. Presence is what people remember.&rdquo;</p>
            <Link href="/shop" className="btn btn-gold mt-8">
              Discover the looks <ArrowRight size={15} />
            </Link>
          </Reveal>
        </Parallax>
      </section>
    </>
  );
}
