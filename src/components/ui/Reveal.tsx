"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Fade + rise once when the element enters the viewport. */
export default function Reveal({
  children, className = "", delay = 0, y = 28, as = "div", amount = 0.25,
}: {
  children: ReactNode; className?: string; delay?: number; y?: number; as?: "div" | "section" | "li" | "article" | "span"; amount?: number;
}) {
  const reduce = useReducedMotion();
  const M = motion[as];
  return (
    <M
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: 1, delay, ease: EASE }}
    >
      {children}
    </M>
  );
}

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.09 } } };
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 36 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } },
};

/** Parent that staggers children using `staggerItem` variants. */
export function Stagger({ children, className = "", amount = 0.15 }: { children: ReactNode; className?: string; amount?: number }) {
  return (
    <motion.div className={className} variants={container} initial="hidden" whileInView="show" viewport={{ once: true, amount }}>
      {children}
    </motion.div>
  );
}

/** Headline whose words rise out of a mask one after another. */
export function SplitWords({ text, className = "", delay = 0 }: { text: string; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  // The observed element must be the visible wrapper: the words start translated
  // outside their overflow-hidden masks, and IntersectionObserver clips by them.
  const word: Variants = {
    hidden: reduce ? { opacity: 0 } : { y: "105%" },
    show: (i: number) => ({ ...(reduce ? { opacity: 1 } : { y: 0 }), transition: { duration: 1.1, delay: delay + i * 0.06, ease: EASE } }),
  };
  return (
    <motion.span className={className} aria-label={text} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }}>
      {text.split(" ").map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-bottom" aria-hidden>
          <motion.span className="inline-block" variants={word} custom={i}>
            {w}&nbsp;
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}
