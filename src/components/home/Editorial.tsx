"use client";

import { useScrollProgress } from "@/lib/useScrollProgress";
import Image from "next/image";
import { motion, useReducedMotion, useTransform } from "framer-motion";
import { useRef } from "react";
import { SplitWords } from "@/components/ui/Reveal";
import { useStore } from "@/lib/store";

export default function Editorial() {
  const { content } = useStore();
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScrollProgress({ target: ref, offset: ["start end", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-14%", "14%"]);
  const bgScale = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [1.18, 1.04]);
  const textY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [120, -120]);
  const wordX = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["8%", "-18%"]);

  return (
    <section id="editorial" className="relative overflow-hidden bg-ink">
      {/* full-bleed layered banner */}
      <div ref={ref} className="relative h-[110svh] min-h-[640px] overflow-hidden">
        <motion.div style={{ y: bgY, scale: bgScale }} className="absolute -inset-y-[14%] inset-x-0 will-change-transform">
          <Image src="/img/film/closeup.webp" alt="Close-up of the mannequin's shoulders in a white vest" fill sizes="100vw" className="object-cover object-[50%_30%] opacity-90" />
        </motion.div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#e6d5bd_0%,rgba(230,213,189,0.25)_30%,rgba(230,213,189,0.35)_65%,#e6d5bd_100%)]" />
        <motion.p style={{ x: wordX }} aria-hidden className="display pointer-events-none absolute top-[12%] left-0 text-[24vw] leading-none whitespace-nowrap text-white/[0.05]">
          Presence · Presence
        </motion.p>
        <motion.div style={{ y: textY }} className="relative mx-auto flex h-full max-w-[1500px] flex-col justify-center px-5 sm:px-8 lg:px-10">
          <p className="eyebrow">02 — The editorial</p>
          <h2 className="display mt-6 max-w-5xl text-[clamp(38px,6vw,96px)]">
            <SplitWords text={content.editorialHeading} />
          </h2>
        </motion.div>
      </div>

    </section>
  );
}
