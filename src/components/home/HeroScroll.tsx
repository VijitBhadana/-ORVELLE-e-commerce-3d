"use client";

import { useScrollProgress } from "@/lib/useScrollProgress";
/**
 * Pinned hero: the supplied 10 s mannequin film, extracted to 240 WebP frames,
 * scrubbed on a <canvas> by scroll position. No <video>, no timers — the frame
 * on screen is a pure function of scroll progress (see lib/heroFrames.ts), so
 * scrolling up plays the outfit changes in reverse.
 *
 * One loop: Lenis and useScroll both run inside Framer Motion's frame loop, and
 * painting is queued with frame.render(), so each animation frame does at most
 * one canvas draw. React only re-renders when the active look changes.
 */

import Link from "next/link";
import { AnimatePresence, frame, motion, useMotionValueEvent, useReducedMotion, useTransform } from "framer-motion";
import { ArrowRight, ArrowDown } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { easeInOut, glideRegionTo, registerStepRegion, type StepRegion } from "@/lib/stepScroll";
import { FrameSequence } from "@/lib/frameSequence";
import { HERO_FRAME_COUNT, HERO_LOOKS, HERO_SEGMENTS, frameForProgress, lookForFrame, progressForLook } from "@/lib/heroFrames";
import { formatPrice } from "@/lib/products";
import { useStore } from "@/lib/store";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";

const INTRO_END = HERO_SEGMENTS[0].scroll[1];
/** desktop frame inset in CSS px — navbar is 80px tall (md:h-20); keep in sync with the poster's classes */
const HERO_TOP = 96;
const HERO_BOTTOM = 12;
const EASE = [0.22, 1, 0.36, 1] as const;
type Stop = { y: number; frame: number; exit?: boolean };

export default function HeroScroll() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const seqRef = useRef<FrameSequence | null>(null);
  const layoutRef = useRef({ heightFrac: 1, centerY: 0.5 });
  const lookRef = useRef(-1);
  const readyRef = useRef(false);
  const [look, setLook] = useState(-1);
  const [ready, setReady] = useState(false);
  const [loadPct, setLoadPct] = useState(0);
  const { content, getProduct } = useStore();
  const { scrollTo, isSmooth } = useSmoothScroll();
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScrollProgress({ target: sectionRef, offset: ["start start", "end end"] });

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    const seq = seqRef.current;
    if (!canvas || !seq) return;
    const p = scrollYProgress.get();
    // subtle scroll-linked camera move layered on top of the film's own zoom-out
    const zoom = reduce ? 1 : p < INTRO_END ? 1.07 - 0.07 * (p / INTRO_END) : p > 0.95 ? 1 - 0.05 * ((p - 0.95) / 0.05) : 1;
    const drawn = seq.draw(canvas, frameForProgress(p), { ...layoutRef.current, zoom });
    if (drawn && !readyRef.current) {
      readyRef.current = true;
      setReady(true);
    }
  }, [scrollYProgress, reduce]);

  const schedulePaint = useCallback(() => frame.render(paint), [paint]);

  // load the frame sequence
  useEffect(() => {
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    const light = !!conn?.saveData || /(^|-)2g|3g/.test(conn?.effectiveType ?? "");
    const seq = new FrameSequence(light ? "/frames/hero-sm/manifest.json" : "/frames/hero/manifest.json");
    seqRef.current = seq;
    seq.onFrame = schedulePaint;
    seq.onProgress = (n, total) => {
      const pct = Math.round((n / total) * 100);
      if (pct % 5 === 0 || n === total) setLoadPct(pct);
    };
    seq.start().catch(() => {});
    return () => {
      seq.dispose();
      seqRef.current = null;
    };
  }, [schedulePaint]);

  // size the canvas backing store to the stage (DPR capped at 2)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      const portrait = w / h < 1;
      if (portrait) {
        layoutRef.current = { heightFrac: 0.64, centerY: 0.53 };
      } else {
        // keep the whole figure below the fixed navbar: frame starts at HERO_TOP, ends HERO_BOTTOM above the fold
        const frameH = h - HERO_TOP - HERO_BOTTOM;
        layoutRef.current = { heightFrac: frameH / h, centerY: (HERO_TOP + frameH / 2) / h };
      }
      schedulePaint();
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [schedulePaint]);

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    schedulePaint();
    const l = lookForFrame(frameForProgress(p));
    if (l !== lookRef.current) {
      lookRef.current = l;
      setLook(l);
    }
  });

  /* ---------- one gesture = one outfit ----------
     Inside the hero, a wheel flick / swipe / arrow key doesn't scroll freely:
     it glides to the next (or previous) stop — intro, look 1…5, then out of the
     hero. The frame is still a function of scroll, so the glide plays the film's
     outfit change forwards (or backwards) smoothly. */
  const getStops = useCallback(() => {
    const el = sectionRef.current;
    if (!el) return null;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const range = el.offsetHeight - window.innerHeight;
    const end = top + el.offsetHeight;
    const progs = [0, ...HERO_LOOKS.map((l) => progressForLook(l.index))];
    const stops: Stop[] = progs.map((p) => ({ y: top + range * p, frame: frameForProgress(p) }));
    stops.push({ y: end, frame: HERO_FRAME_COUNT - 1, exit: true });
    return { top, range, end, stops };
  }, []);

  const glide = useCallback(
    (to: Stop, onDone: () => void) => {
      const s = getStops();
      if (!s) return;
      const from = frameForProgress(Math.min(1, Math.max(0, (window.scrollY - s.top) / s.range)));
      // duration follows how much film plays: ~1.3 s per outfit change, ~2 s for the opening zoom-out
      const duration = to.exit ? 1.1 : Math.min(2.4, Math.max(0.9, 0.55 + Math.abs(to.frame - from) * 0.021));
      let timer = 0;
      const release = () => {
        window.clearTimeout(timer);
        onDone(); // the step engine ignores repeat calls
      };
      timer = window.setTimeout(release, duration * 1000 + 300);
      scrollTo(to.y, { duration, easing: easeInOut, lock: true, onComplete: release });
    },
    [getStops, scrollTo]
  );

  /** the stop one step away in `dir`, or null when the gesture belongs to the page, not the hero */
  const stopFor = useCallback(
    (dir: 1 | -1): Stop | null => {
      const s = getStops();
      if (!s) return null;
      const y = window.scrollY;
      const EPS = 4;
      if (dir > 0) {
        if (y < s.top - EPS || y >= s.end - EPS) return null;
        return s.stops.find((p) => p.y > y + EPS) ?? null;
      }
      if (y <= s.top + EPS || y > s.end + EPS) return null;
      return [...s.stops].reverse().find((p) => p.y < y - EPS) ?? null;
    },
    [getStops]
  );

  // register with the shared step engine (lib/stepScroll), which owns the gestures
  const region = useMemo<StepRegion>(() => ({ stopFor, glide: (s, done) => glide(s as Stop, done) }), [stopFor, glide]);
  useEffect(() => (reduce ? undefined : registerStepRegion(region)), [region, reduce]);

  /** jump to a look (indicator dashes, "Explore outfits") — same glide as scrolling */
  const goToLook = (i: number) => {
    const s = getStops();
    const stop = s?.stops[i + 1];
    if (!stop) return;
    if (reduce || !isSmooth()) scrollTo(stop.y, { duration: 1.8 });
    else glideRegionTo(region, stop);
  };

  // background glow drifts down; the headline copy stays fixed in place while scrolling
  const glowY = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-10%", "22%"]);
  const glowOpacity = useTransform(scrollYProgress, [0, INTRO_END, 1], [0.35, 0.9, 0.7]);
  const introOut = useTransform(scrollYProgress, [INTRO_END * 0.55, INTRO_END * 0.95], [1, 0]);
  const looksIn = useTransform(scrollYProgress, [INTRO_END * 0.7, INTRO_END * 1.05], [0, 1]);
  const progressScale = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const exitFade = useTransform(scrollYProgress, [0.965, 1], [1, 0.0]);
  const introPointer = useTransform(introOut, (v) => (v < 0.1 ? "none" : "auto"));

  const current = look >= 0 ? getProduct(HERO_LOOKS[look].slug) : null;
  const num = String(look + 1).padStart(2, "0");

  return (
    <section ref={sectionRef} id="hero" className="relative h-[620vh] md:h-[700vh]" aria-label="Scroll through five outfits">
      <div className="sticky top-0 h-svh overflow-hidden bg-ink">
        {/* background layer — slower */}
        <motion.div style={{ y: glowY, opacity: glowOpacity }} className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute top-[18%] left-1/2 h-[70vh] w-[70vh] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(213,54,12,0.13),transparent_65%)]" />
        </motion.div>

        {/* first frame as a server-rendered poster until the canvas paints */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/frames/hero/frame_001.webp"
          alt=""
          aria-hidden
          fetchPriority="high"
          className={`pointer-events-none absolute top-[96px] left-1/2 h-[calc(100%-108px)] w-auto max-w-none -translate-x-1/2 scale-[1.07] transition-opacity duration-700 portrait:top-[53%] portrait:h-[64%] portrait:-translate-y-1/2 ${ready ? "opacity-0" : "opacity-100"}`}
        />
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}
          role="img"
          aria-label={current ? `Mannequin wearing the ${current.name}` : "Close-up of a mannequin, camera pulling back"}
        />

        {/* legibility scrims */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(230,213,189,0.85)_0%,rgba(230,213,189,0.35)_32%,transparent_48%)] max-md:bg-[linear-gradient(180deg,rgba(230,213,189,0.8)_0%,transparent_30%,transparent_68%,rgba(230,213,189,0.9)_100%)]" />
        <div className="grain pointer-events-none absolute inset-0 overflow-hidden" />

        <motion.div style={{ opacity: exitFade }} className="relative mx-auto flex h-full max-w-[1500px] flex-col px-5 pt-28 pb-6 sm:px-8 md:pt-32 md:pb-10 lg:px-10">
          {/* headline — fixed: it does not move with scroll */}
          <div className="max-w-[30rem] lg:max-w-[34rem]">
            <motion.div style={{ opacity: introOut }} className="md:opacity-100!">
              <motion.p className="eyebrow" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 1, ease: EASE }}>
                The Essentials Edit — Five looks
              </motion.p>
              <h1 className="display mt-4 text-[clamp(46px,6.4vw,110px)]">
                {content.heroHeading.split(" ").map((w, i) => (
                  <span key={i} className="inline-block overflow-hidden align-bottom">
                    <motion.span className="inline-block" initial={{ y: "110%" }} animate={{ y: 0 }} transition={{ delay: 0.35 + i * 0.08, duration: 1.2, ease: EASE }}>
                      {i === 2 ? <em className="text-gold">{w}</em> : w}&nbsp;
                    </motion.span>
                  </span>
                ))}
              </h1>
              <motion.p className="mt-6 max-w-sm text-[16px] leading-[1.42] text-white/70 sm:text-base" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 1.2 }}>
                {content.heroSubheading}
              </motion.p>
            </motion.div>
            <motion.div className="mt-9 hidden gap-3 md:flex" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 1, ease: EASE }}>
              <Link href="/shop" className="btn btn-gold">
                Shop collection <ArrowRight size={15} />
              </Link>
              <button onClick={() => goToLook(0)} className="btn btn-ghost">
                Explore outfits
              </button>
            </motion.div>
          </div>

          {/* right rail: current look (desktop) */}
          <motion.aside style={{ opacity: looksIn }} className="absolute top-1/2 right-8 hidden w-64 -translate-y-1/2 md:block lg:right-10" aria-live="polite">
            <LookPanel look={look} num={num} current={current} goToLook={goToLook} />
          </motion.aside>

          {/* mobile bottom: CTAs during intro, then the look indicator */}
          <div className="relative mt-auto md:hidden">
            <motion.div style={{ opacity: introOut, pointerEvents: introPointer }} className="absolute inset-x-0 bottom-0 flex gap-2.5">
              <Link href="/shop" className="btn btn-gold btn-sm flex-1">
                Shop collection
              </Link>
              <button onClick={() => goToLook(0)} className="btn btn-ghost btn-sm flex-1">
                Explore outfits
              </button>
            </motion.div>
            <motion.div style={{ opacity: looksIn }} aria-live="polite">
              <LookPanel compact look={look} num={num} current={current} goToLook={goToLook} />
            </motion.div>
          </div>

          {/* scroll guidance */}
          <motion.div style={{ opacity: introOut }} className="pointer-events-none absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 md:flex">
            <span className="label text-white/60">Scroll to dress the look</span>
            <span className="relative h-12 w-px overflow-hidden bg-white/15">
              <motion.span className="absolute inset-x-0 top-0 h-1/2 bg-gold" animate={reduce ? {} : { y: ["-100%", "200%"] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }} />
            </span>
          </motion.div>

          {!ready || loadPct < 100 ? (
            <p className="label pointer-events-none absolute bottom-8 left-10 hidden text-white/35 lg:block">Loading film · {loadPct}%</p>
          ) : null}
        </motion.div>

        {/* overall progress */}
        <motion.div style={{ scaleX: progressScale }} className="absolute inset-x-0 bottom-0 h-px origin-left bg-gold/70" />
      </div>
    </section>
  );
}

function LookPanel({
  look, num, current, goToLook, compact,
}: {
  look: number;
  num: string;
  current: ReturnType<ReturnType<typeof useStore>["getProduct"]> | null;
  goToLook: (i: number) => void;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "" : "border-l border-white/15 pl-6"}>
      <div className="flex items-baseline gap-2">
        <span className="display text-[clamp(40px,3.6vw,60px)] text-gold tabular-nums">{look >= 0 ? num : "00"}</span>
        <span className="label text-white/50">/ 05</span>
      </div>
      <div className="relative mt-2 h-[3.2rem] overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div key={look} initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "-100%", opacity: 0 }} transition={{ duration: 0.6, ease: EASE }} className="absolute inset-0">
            <p className="label text-white">{current ? current.name.replace(" Set", "").toUpperCase() : "THE FOUNDATION"}</p>
            {current ? (
              <p className="mt-2 flex items-center gap-3 text-xs text-muted">
                <span className="h-3 w-3 rounded-full ring-1 ring-white/30" style={{ background: current.shirt.hex }} />
                {current.shirt.name}
                <span className="h-3 w-3 rounded-full ring-1 ring-white/30" style={{ background: current.pant.hex }} />
                {current.pant.name}
              </p>
            ) : (
              <p className="mt-2 text-xs text-muted">Keep scrolling to dress the silhouette</p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-3 flex gap-1.5" role="tablist" aria-label="Jump to outfit">
        {HERO_LOOKS.map((l) => (
          <button
            key={l.slug}
            role="tab"
            aria-selected={look === l.index}
            aria-label={`Outfit ${l.index + 1}`}
            onClick={() => goToLook(l.index)}
            className="group flex-1 py-2"
          >
            <span className={`block h-[2px] transition-colors duration-500 ${look >= l.index ? "bg-gold" : "bg-white/20 group-hover:bg-white/50"}`} />
          </button>
        ))}
      </div>

      <div className={`mt-3 flex items-center justify-between ${current ? "" : "invisible"}`}>
        <span className="text-sm text-white">{current ? formatPrice(current.price) : "—"}</span>
        {current && (
          <Link href={`/product/${current.slug}`} className="u-line label inline-flex items-center gap-1.5 text-gold">
            View look <ArrowRight size={12} />
          </Link>
        )}
      </div>
      {!compact && (
        <div className="mt-6 hidden items-center gap-2 text-white/40 lg:flex">
          <ArrowDown size={12} />
          <span className="label">Scroll · up to reverse</span>
        </div>
      )}
    </div>
  );
}
