"use client";

/**
 * Testimonials as a walk through a 3D hall: six screens alternate left / right and the
 * camera zooms into each in turn as you scroll (left, forward, right, forward, …).
 *
 * - Scene: lib/corridorScene.ts (plain three.js, loaded lazily when the section nears).
 * - Scroll: pinned section; progress → camera pose. Inside it, one gesture = one screen
 *   through the shared step engine (lib/stepScroll), like the hero.
 * - Reduced motion or no WebGL: a plain swipeable row of testimonial cards instead.
 * The canvas is decorative; the testimonials are also in the DOM for screen readers.
 */

import { cancelFrame, frame, motion, useMotionValueEvent, useReducedMotion, useTransform } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { easeInOut, glideRegionTo, registerStepRegion, type StepRegion } from "@/lib/stepScroll";
import { useScrollProgress } from "@/lib/useScrollProgress";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import { useStore } from "@/lib/store";
import { SAMPLE_REVIEWS, TESTIMONIALS, type Testimonial } from "@/lib/testimonials";
import type { CorridorScene } from "@/lib/corridorScene";

const SCREENS = 6;
const POSES = SCREENS + 2; // start, six screens, walk-out (keep in sync with corridorScene)
type Stop = { y: number; exit?: boolean };

function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function TestimonialCorridor() {
  const reduce = useReducedMotion();
  const [mode, setMode] = useState<"3d" | "cards">("3d");
  useEffect(() => {
    if (reduce || !webglAvailable()) setMode("cards");
  }, [reduce]);

  return mode === "3d" ? <Corridor /> : <CardRow />;
}

/* ---------------------------------------------------------------- 3D hall */

function Corridor() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<CorridorScene | null>(null);
  const [active, setActive] = useState(-1);
  const activeRef = useRef(-1);
  const { getProduct } = useStore();
  const { scrollTo, isSmooth } = useSmoothScroll();
  const { scrollYProgress } = useScrollProgress({ target: sectionRef, offset: ["start start", "end end"] });
  const testimonials = TESTIMONIALS.slice(0, SCREENS);

  // build the scene once the section is within ~1.5 screens; render only while it is on screen
  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return;
    let disposed = false;
    let visible = false;
    let ro: ResizeObserver | null = null;

    const tick = () => sceneRef.current?.render();
    const setVisible = (v: boolean) => {
      if (v === visible) return;
      visible = v;
      if (v) frame.render(tick, true);
      else cancelFrame(tick);
    };

    const boot = async () => {
      const [{ CorridorScene }] = await Promise.all([import("@/lib/corridorScene"), document.fonts?.ready]);
      const root = getComputedStyle(document.documentElement);
      const fonts = {
        display: root.getPropertyValue("--font-anton").trim() || "Impact, sans-serif",
        body: root.getPropertyValue("--font-archivo").trim() || "system-ui, sans-serif",
      };
      await Promise.all([document.fonts?.load(`400 54px ${fonts.display}`), document.fonts?.load(`600 58px ${fonts.body}`)]).catch(() => {});
      if (disposed) return;
      const scene = new CorridorScene(canvas, {
        testimonials,
        lookName: (slug) => getProduct(slug)?.name ?? "",
        sample: SAMPLE_REVIEWS,
        fonts,
        maxDpr: window.innerWidth < 768 ? 1.5 : 1.75,
      });
      sceneRef.current = scene;
      scene.setProgress(scrollYProgress.get());
      ro = new ResizeObserver(() => scene.resize(canvas.clientWidth, canvas.clientHeight));
      ro.observe(canvas);
      scene.resize(canvas.clientWidth, canvas.clientHeight);
      scene.render();
    };

    let booted = false;
    const near = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !booted) {
          booted = true;
          boot().catch(() => {});
        }
      },
      { rootMargin: "150% 0px" }
    );
    const onScreen = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    near.observe(section);
    onScreen.observe(section);

    return () => {
      disposed = true;
      near.disconnect();
      onScreen.disconnect();
      ro?.disconnect();
      cancelFrame(tick);
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
    // the scene is built once; testimonials/getProduct are static for its lifetime
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollYProgress]);

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    sceneRef.current?.setProgress(p);
    // which screen is in focus (nearest pose that is a screen)
    const pose = Math.round(p * (POSES - 1));
    const a = pose >= 1 && pose <= SCREENS ? pose - 1 : -1;
    if (a !== activeRef.current) {
      activeRef.current = a;
      setActive(a);
    }
  });

  /* ---------- one gesture = one screen (shared step engine) ---------- */
  const getStops = useCallback(() => {
    const el = sectionRef.current;
    if (!el) return null;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const range = el.offsetHeight - window.innerHeight;
    const end = top + el.offsetHeight;
    const stops: Stop[] = Array.from({ length: SCREENS + 1 }, (_, k) => ({ y: top + (range * k) / (POSES - 1) }));
    stops.push({ y: end, exit: true });
    return { top, end, stops };
  }, []);

  const glide = useCallback(
    (to: Stop, onDone: () => void) => {
      const duration = to.exit ? 1.5 : 1.7;
      let timer = 0;
      const release = () => {
        window.clearTimeout(timer);
        onDone();
      };
      timer = window.setTimeout(release, duration * 1000 + 300);
      scrollTo(to.y, { duration, easing: easeInOut, lock: true, onComplete: release });
    },
    [scrollTo]
  );

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

  const region = useMemo<StepRegion>(() => ({ stopFor, glide: (s, done) => glide(s as Stop, done) }), [stopFor, glide]);
  useEffect(() => registerStepRegion(region), [region]);

  const goTo = (i: number) => {
    const stop = getStops()?.stops[i + 1];
    if (!stop) return;
    if (!isSmooth()) scrollTo(stop.y, { duration: 1.6 });
    else glideRegionTo(region, stop);
  };

  // intro title fades as the walk begins; HUD fades in with the first screen
  const introOpacity = useTransform(scrollYProgress, [0, 0.5 / (POSES - 1)], [1, 0]);
  const hudOpacity = useTransform(scrollYProgress, [0.4 / (POSES - 1), 0.9 / (POSES - 1), (POSES - 1.6) / (POSES - 1), (POSES - 1.1) / (POSES - 1)], [0, 1, 1, 0]);
  const current: Testimonial | null = active >= 0 ? testimonials[active] : null;

  return (
    <section ref={sectionRef} id="testimonials" className="relative h-[620vh] bg-ink" aria-labelledby="testimonials-title">
      <div className="sticky top-0 h-svh overflow-hidden">
        <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full" />

        {/* intro title over the hall entrance */}
        {/* intro title — ivory type set against the hall's black ceiling */}
        <motion.div style={{ opacity: introOpacity }} className="pointer-events-none absolute inset-x-0 top-[15%] px-5 text-center">
          <p className="eyebrow">Testimonials</p>
          <h2 id="testimonials-title" className="display mt-4 text-[clamp(46px,7vw,120px)] text-ink">
            In their <em className="text-gold">words.</em>
          </h2>
          <p className="label mt-5 text-ink/60">Scroll to walk the hall</p>
        </motion.div>

        {/* HUD: counter + name, jump dashes */}
        <motion.div style={{ opacity: hudOpacity }} className="absolute inset-x-0 bottom-0 px-5 pb-6 sm:px-8 sm:pb-8 lg:px-10">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3 sm:items-end">
            <div className="flex items-center gap-3 rounded-full bg-fg/90 px-4 py-2.5 text-ink backdrop-blur-sm sm:block sm:rounded-2xl sm:px-5 sm:py-4">
              <div className="flex items-baseline gap-2">
                <span className="display text-[26px] leading-none text-gold tabular-nums sm:text-[40px]">{String(Math.max(active, 0) + 1).padStart(2, "0")}</span>
                <span className="label text-ink/50">/ {String(SCREENS).padStart(2, "0")}</span>
              </div>
              <p className="label mt-2 hidden text-ink/80 sm:block" aria-live="polite">
                {current ? `${current.name} · ${current.city}` : " "}
              </p>
            </div>
            <div className="flex gap-1 rounded-full bg-fg/90 px-3 py-2.5 backdrop-blur-sm sm:gap-1.5 sm:px-4 sm:py-3" role="tablist" aria-label="Jump to testimonial">
              {testimonials.map((t, i) => (
                <button key={i} role="tab" aria-selected={active === i} aria-label={`Testimonial ${i + 1}`} onClick={() => goTo(i)} className="group py-1.5">
                  <span className={`block h-[3px] w-5 rounded-full transition-colors duration-500 sm:w-8 ${active >= i ? "bg-gold" : "bg-ink/25 group-hover:bg-ink/60"}`} />
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* the same testimonials as text, for screen readers */}
      <ol className="sr-only">
        {testimonials.map((t, i) => (
          <li key={i}>
            <blockquote>{t.quote}</blockquote>
            <p>
              {t.name}, {t.city} — {getProduct(t.look)?.name}. Rated {t.rating} out of 5.{SAMPLE_REVIEWS ? " Sample review." : ""}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ------------------------------------------------- fallback: card row */

function CardRow() {
  const { getProduct } = useStore();
  const testimonials = TESTIMONIALS.slice(0, SCREENS);
  return (
    <section id="testimonials" className="bg-ink py-24 sm:py-32" aria-labelledby="testimonials-title">
      <div className="mx-auto max-w-[1500px] px-5 sm:px-8 lg:px-10">
        <p className="eyebrow">Testimonials</p>
        <h2 id="testimonials-title" className="display mt-4 text-[clamp(46px,5.8vw,100px)]">
          In their <em className="text-gold">words.</em>
        </h2>
        <ul className="-mx-5 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 sm:-mx-8 sm:px-8 lg:mx-0 lg:px-0">
          {testimonials.map((t, i) => (
            <li key={i} className="flex w-[85%] shrink-0 snap-start flex-col rounded-[20px] bg-fg p-7 text-ink sm:w-[46%] lg:w-[31.5%]">
              <div className="flex items-center justify-between">
                <span className="label text-gold">Customer story</span>
                {SAMPLE_REVIEWS && <span className="label rounded border border-ink/30 px-2 py-1 text-[10px] text-ink/70">Sample review</span>}
              </div>
              <p className="display mt-4 text-6xl leading-none text-gold" aria-hidden>
                &ldquo;
              </p>
              <blockquote className="mt-2 pb-6 text-lg leading-snug text-ink">{t.quote}</blockquote>
              <div className="mt-auto flex items-end justify-between gap-3 border-t border-ink/15 pt-5">
                <div>
                  <p className="display text-2xl">{t.name}</p>
                  <p className="text-sm text-ink/60">
                    {t.city} · {getProduct(t.look)?.name}
                  </p>
                </div>
                <p className="text-gold" aria-label={`Rated ${t.rating} out of 5`}>
                  {"★".repeat(t.rating)}
                  <span className="text-ink/25">{"★".repeat(5 - t.rating)}</span>
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
