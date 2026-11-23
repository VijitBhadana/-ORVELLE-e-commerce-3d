"use client";

import { useScrollProgress } from "@/lib/useScrollProgress";
import Link from "next/link";
import { motion, useReducedMotion, useTransform } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { SplitWords } from "./Reveal";

export default function PageHeader({
  eyebrow, title, intro, crumbs = [], children, compact,
}: {
  eyebrow?: string; title: string; intro?: ReactNode; crumbs?: { label: string; href?: string }[]; children?: ReactNode; compact?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScrollProgress({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, 90]);
  const opacity = useTransform(scrollYProgress, [0, 0.9], [1, 0.2]);

  return (
    <header ref={ref} className={`relative overflow-hidden border-b border-line ${compact ? "pt-32 pb-10 md:pt-40" : "pt-36 pb-14 md:pt-48 md:pb-20"}`}>
      <div className="pointer-events-none absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-gold/[0.07] blur-3xl" />
      <motion.div style={{ y, opacity }} className="relative mx-auto max-w-[1500px] px-5 sm:px-8 lg:px-10">
        {crumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-xs text-muted">
            <Link href="/" className="hover:text-white">Home</Link>
            {crumbs.map((c) => (
              <span key={c.label} className="flex items-center gap-2">
                <span className="text-line">/</span>
                {c.href ? <Link href={c.href} className="hover:text-white">{c.label}</Link> : <span className="text-white/80">{c.label}</span>}
              </span>
            ))}
          </nav>
        )}
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className={`display mt-4 ${compact ? "text-[clamp(46px,5.8vw,100px)]" : "text-[clamp(50px,9.4vw,170px)]"}`}>
          <SplitWords text={title} />
        </h1>
        {intro && <div className="mt-6 max-w-xl text-[16px] leading-[1.42] text-muted sm:text-base">{intro}</div>}
        {children}
      </motion.div>
    </header>
  );
}
