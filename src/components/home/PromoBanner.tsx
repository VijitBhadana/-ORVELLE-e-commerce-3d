"use client";

import { useScrollProgress } from "@/lib/useScrollProgress";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, useTransform } from "framer-motion";
import { ArrowRight, Check, Copy } from "lucide-react";
import { useRef, useState } from "react";
import { SplitWords } from "@/components/ui/Reveal";
import { useStore } from "@/lib/store";

export default function PromoBanner() {
  const { content, toast } = useStore();
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScrollProgress({ target: ref, offset: ["start end", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-18%", "18%"]);
  const bgX = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["4%", "-4%"]);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(content.promoCode);
    } catch {
      /* clipboard blocked — still show the code */
    }
    setCopied(true);
    toast(`Code ${content.promoCode} copied`);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section ref={ref} className="relative overflow-hidden bg-ink">
      <div className="relative h-[90svh] min-h-[600px]">
        <motion.div style={{ y: bgY, x: bgX }} className="absolute -inset-y-[18%] -inset-x-[6%] will-change-transform">
          <Image src="/img/editorial/lineup.webp" alt="All five looks side by side" fill sizes="110vw" className="object-cover opacity-55" />
        </motion.div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(230,213,189,0.55)_0%,rgba(230,213,189,0.92)_75%)]" />
        <div className="relative mx-auto flex h-full max-w-4xl flex-col items-center justify-center px-5 text-center">
          <motion.p className="eyebrow" initial={{ opacity: 0, letterSpacing: "0.6em" }} whileInView={{ opacity: 1, letterSpacing: "0.32em" }} viewport={{ once: true }} transition={{ duration: 1.4 }}>
            Limited introduction
          </motion.p>
          <h2 className="display mt-6 text-[clamp(50px,9.4vw,170px)]">
            <SplitWords text={content.promoHeading} />
          </h2>
          <motion.p className="mt-6 max-w-lg text-base text-white/70" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4, duration: 1 }}>
            {content.promoText}
          </motion.p>
          <motion.div className="mt-10 flex flex-wrap items-center justify-center gap-3" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.6, duration: 1, ease: [0.22, 1, 0.36, 1] }}>
            <Link href="/shop" className="btn btn-gold">
              Shop the edit <ArrowRight size={15} />
            </Link>
            <button onClick={copy} className="btn btn-ghost" aria-label={`Copy code ${content.promoCode}`}>
              {copied ? <Check size={15} /> : <Copy size={15} />} {content.promoCode}
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
