"use client";

/**
 * Lenis smooth scroll, adapted from ../assets/SmoothScroll.tsx.
 * The original drives Lenis from gsap.ticker; this site animates with Framer
 * Motion, so Lenis is driven from Motion's own frame loop instead. Lenis,
 * every useScroll() and the hero canvas therefore run in ONE requestAnimationFrame
 * — scroll-linked animation can't drift from the real scroll position.
 */

import Lenis from "lenis";
import { cancelFrame, frame } from "framer-motion";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, type ReactNode } from "react";
import { setStepScrollEnabled } from "@/lib/stepScroll";

type ScrollOpts = {
  offset?: number;
  immediate?: boolean;
  duration?: number;
  easing?: (t: number) => number;
  /** block user scrolling until the animation finishes */
  lock?: boolean;
  onComplete?: () => void;
};
type ScrollApi = {
  scrollTo: (target: number | string | HTMLElement, opts?: ScrollOpts) => void;
  /** true when Lenis is driving the page (false for reduced-motion users) */
  isSmooth: () => boolean;
  lock: (locked: boolean) => void;
};

const ScrollCtx = createContext<ScrollApi>({ scrollTo: () => {}, isSmooth: () => false, lock: () => {} });
export const useSmoothScroll = () => useContext(ScrollCtx);

export default function SmoothScroll({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const locks = useRef(0);
  const pathname = usePathname();

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return; // native scrolling for reduced-motion users

    const lenis = new Lenis({
      lerp: 0.09,
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.1,
      anchors: { offset: -80 },
      autoRaf: false,
    });
    lenisRef.current = lenis;
    const update = ({ timestamp }: { timestamp: number }) => lenis.raf(timestamp);
    frame.update(update, true);
    setStepScrollEnabled(true); // pinned sections step one gesture at a time (lib/stepScroll)

    return () => {
      setStepScrollEnabled(false);
      cancelFrame(update);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // new page → start at the top, without a smooth glide from the old position
  useEffect(() => {
    if (window.location.hash) return;
    lenisRef.current?.scrollTo(0, { immediate: true, force: true });
    window.scrollTo(0, 0);
  }, [pathname]);

  const scrollTo = useCallback<ScrollApi["scrollTo"]>((target, opts = {}) => {
    const lenis = lenisRef.current;
    if (lenis) {
      lenis.scrollTo(target, {
        offset: opts.offset ?? 0,
        immediate: opts.immediate,
        duration: opts.duration ?? 1.4,
        easing: opts.easing,
        lock: opts.lock,
        force: true,
        onComplete: opts.onComplete ? () => opts.onComplete?.() : undefined,
      });
      return;
    }
    if (opts.onComplete) window.setTimeout(opts.onComplete, opts.immediate ? 0 : 700);
    let y = 0;
    if (typeof target === "number") y = target;
    else {
      const el = typeof target === "string" ? document.querySelector(target) : target;
      if (!el) return;
      y = el.getBoundingClientRect().top + window.scrollY;
    }
    window.scrollTo({ top: y + (opts.offset ?? 0), behavior: opts.immediate ? "auto" : "smooth" });
  }, []);

  /** modals/drawers call lock(true) so the page underneath doesn't scroll */
  const lock = useCallback((locked: boolean) => {
    locks.current = Math.max(0, locks.current + (locked ? 1 : -1));
    const on = locks.current > 0;
    if (on) lenisRef.current?.stop();
    else lenisRef.current?.start();
    document.documentElement.classList.toggle("scroll-locked", on);
  }, []);

  const isSmooth = useCallback(() => !!lenisRef.current, []);

  return <ScrollCtx.Provider value={{ scrollTo, isSmooth, lock }}>{children}</ScrollCtx.Provider>;
}
