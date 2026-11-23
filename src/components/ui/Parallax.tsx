"use client";

import { useScrollProgress } from "@/lib/useScrollProgress";
import Image from "next/image";
import { motion, useReducedMotion, useTransform } from "framer-motion";
import { useRef, type ReactNode } from "react";

/**
 * Translates its children vertically as the element crosses the viewport.
 * speed > 0 moves slower than the page (sinks), < 0 moves faster (floats up).
 * Transform-only → composited on the GPU, no layout work per frame.
 */
export function Parallax({ children, speed = 0.15, className = "" }: { children: ReactNode; speed?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScrollProgress({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [-speed * 200, speed * 200]);
  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }} className="will-change-transform">
        {children}
      </motion.div>
    </div>
  );
}

/**
 * Image inside a clipped frame: the photo is oversized and drifts against the
 * scroll (background-layer parallax) with an optional slow zoom.
 */
export function ParallaxImage({
  src, alt, className = "", strength = 12, zoom = true, sizes = "100vw", priority, objectPosition = "center", imgClassName = "",
}: {
  src: string; alt: string; className?: string; strength?: number; zoom?: boolean; sizes?: string; priority?: boolean; objectPosition?: string; imgClassName?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScrollProgress({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : [`-${strength}%`, `${strength}%`]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], reduce || !zoom ? [1, 1, 1] : [1.12, 1.04, 1.12]);
  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div style={{ y, scale }} className="absolute -inset-y-[16%] inset-x-0 will-change-transform">
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={`object-cover ${imgClassName}`} style={{ objectPosition }} />
      </motion.div>
    </div>
  );
}
