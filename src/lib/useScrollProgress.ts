"use client";

import { useMotionValue, useMotionValueEvent, useScroll } from "framer-motion";
import { useEffect } from "react";

/**
 * Drop-in for `useScroll` that returns a plain (non-accelerated) progress value.
 *
 * Framer Motion tries to hand scroll-linked opacity/transform styles to a native
 * ScrollTimeline. In this setup the accelerated keyframes ignored useTransform's
 * input ranges (opacity drifted with page progress while the canvas — which reads
 * the JS value — stayed correct). Mirroring progress into an ordinary motion value
 * keeps every scroll-linked style in the same JS frame loop as Lenis and the hero
 * canvas, so they can never disagree.
 */
export function useScrollProgress(options: Parameters<typeof useScroll>[0]) {
  const { scrollYProgress: source } = useScroll(options);
  const scrollYProgress = useMotionValue(0);
  useMotionValueEvent(source, "change", (v) => scrollYProgress.set(v));
  useEffect(() => {
    scrollYProgress.set(source.get());
  }, [source, scrollYProgress]);
  return { scrollYProgress };
}
