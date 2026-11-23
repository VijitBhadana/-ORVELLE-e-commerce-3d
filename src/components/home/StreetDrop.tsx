"use client";

/**
 * Street drop — the section right after the hero + marquee.
 *
 * Landscape: the supplied film (men-glass-after-hero.mp4, backdrop flattened to
 * the page ivory by tools/build_street.py) scrubbed on a canvas. Each frame comes
 * with its stickers on a separate layer, so wide screens get them spread outwards.
 * Phones / portrait: the same story built from the supplied stills — the figure
 * (men-glass.jpg) and stickers cut from man-element-2.jpg — because a 16:9 film
 * would be a thin strip there.
 *
 * Three gestures, through the shared step engine (lib/stepScroll):
 *   1. the hero's last scroll → as this section rises into view the man slides in
 *      from the left with the orange brush, so he is standing there on arrival
 *   2. next scroll            → left-hand elements come in from the left
 *   3. next scroll            → right-hand elements come in from the right
 * …and the following scroll leaves the section. Scrolling up plays it backwards.
 */

import Image from "next/image";
import Link from "next/link";
import { frame, useMotionValueEvent, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  GraduationCap,
  PackageOpen,
  Truck,
  WalletCards,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
} from "react";
import { FrameSequence } from "@/lib/frameSequence";
import {
  easeInOut,
  registerStepRegion,
  type StepRegion,
  type StepStop,
} from "@/lib/stepScroll";
import { useScrollProgress } from "@/lib/useScrollProgress";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import CategoryBar from "@/components/home/CategoryBar";
import { BRAND } from "@/lib/brand";
import { formatPrice } from "@/lib/products";

/** the black perks strip along the bottom of the section */
const PERKS = [
  {
    Icon: Truck,
    title: "Free shipping",
    text: `On orders over ${formatPrice(BRAND.shipping.freeAbove)}`,
  },
  { Icon: PackageOpen, title: "Easy returns", text: "14 days return policy" },
  { Icon: WalletCards, title: "COD available", text: "Pay on delivery" },
  { Icon: GraduationCap, title: "Student discount", text: "Extra 10% OFF" },
];

/** pinned-range progress (0..1) where the two sticker steps land */
const P_LEFT = 0.4;
const P_RIGHT = 0.85;
/** frames of the re-cut film (tools/build_street.py → recut):
    paper only (2) → man settled, no stickers yet (43, end of act 1)
    → left-hand stickers set (56, end of act 2) → everything set incl. "Shop now" (96) */
const F_PAPER = 2;
const F_MAN = 43;
const F_LEFT = 56;
const F_RIGHT = 96;
const F_END = 105;
const NAV = 80; // navbar height (md:h-20) — the film sits below it
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * The timeline runs on page scroll, not just the pinned range: the man slides in
 * *while the section rises into view* — i.e. during the hero's last glide — so
 * the moment the hero lets go he is already standing there with the orange brush.
 *   enter  section top at the bottom of the viewport → paper only
 *   entry  where the hero lets go (top of the marquee) → man settled
 *   left   first step  → left-hand stickers
 *   right  second step → right-hand stickers + "Shop now"
 */
function measure(el: HTMLElement) {
  const top = el.getBoundingClientRect().top + window.scrollY;
  const range = el.offsetHeight - window.innerHeight;
  const prev = el.previousElementSibling;
  const entry = prev ? prev.getBoundingClientRect().top + window.scrollY : top;
  const enter = top - window.innerHeight;
  const left = top + range * P_LEFT;
  const right = top + range * P_RIGHT;
  const end = top + el.offsetHeight;
  const keys: [number, number][] = [
    [enter, F_PAPER],
    [entry, F_MAN],
    [left, F_LEFT],
    [right, F_RIGHT],
    [top + range, F_END],
  ];
  const frameAt = (y: number) => {
    if (y <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      const [y0, f0] = keys[i - 1];
      const [y1, f1] = keys[i];
      if (y <= y1) return f0 + (f1 - f0) * ((y - y0) / Math.max(1, y1 - y0));
    }
    return F_END;
  };
  return { top, range, enter, entry, left, right, end, frameAt };
}

type Stop = StepStop & { edge?: "entry" | "exit" };

export default function StreetDrop() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layersRef = useRef<HTMLDivElement>(null);
  const shopRef = useRef<HTMLAnchorElement>(null);
  const seqRef = useRef<FrameSequence | null>(null);
  const layoutRef = useRef({
    heightFrac: 1,
    centerY: 0.5,
    spread: 0,
    x: 0,
    y: 0,
    w: 0,
    h: 0,
  });
  const reduce = useReducedMotion();
  const { scrollTo } = useSmoothScroll();
  // "start end": changes from the moment the section's top enters the viewport
  const { scrollYProgress } = useScrollProgress({
    target: sectionRef,
    offset: ["start end", "end end"],
  });

  /* ---------- drawing ---------- */
  const paint = useCallback(() => {
    const el = sectionRef.current;
    if (!el) return;
    const t = measure(el);
    const y = window.scrollY;
    // phone collage: three CSS variables drive the layers
    const layers = layersRef.current;
    if (layers) {
      layers.style.setProperty(
        "--m",
        ease(clamp((y - t.enter) / Math.max(1, t.entry - t.enter))).toFixed(4),
      );
      layers.style.setProperty(
        "--l",
        ease(clamp((y - t.entry) / Math.max(1, t.left - t.entry))).toFixed(4),
      );
      layers.style.setProperty(
        "--r",
        ease(clamp((y - t.left) / Math.max(1, t.right - t.left))).toFixed(4),
      );
    }
    // the film's own "Shop now" button becomes a real link once it has arrived
    const shop = shopRef.current;
    if (shop) {
      const on = y > t.right - t.range * 0.04;
      shop.style.opacity = on ? "1" : "0";
      shop.style.pointerEvents = on ? "auto" : "none";
      shop.tabIndex = on ? 0 : -1;
    }
    const canvas = canvasRef.current;
    const seq = seqRef.current;
    const L = layoutRef.current;
    if (canvas && seq)
      seq.draw(canvas, Math.round(t.frameAt(y)), {
        heightFrac: L.heightFrac,
        centerY: L.centerY,
        spread: L.spread,
        zoom: 1,
      });
  }, []);
  const schedulePaint = useCallback(() => frame.render(paint), [paint]);
  useMotionValueEvent(scrollYProgress, "change", schedulePaint);

  // load the film only in landscape, and only once the section is near
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const landscape = window.matchMedia("(orientation: landscape)");
    let seq: FrameSequence | null = null;
    const start = () => {
      if (seq || !landscape.matches) return;
      const conn = (
        navigator as Navigator & {
          connection?: { saveData?: boolean; effectiveType?: string };
        }
      ).connection;
      const light =
        !!conn?.saveData ||
        /(^|-)2g|3g/.test(conn?.effectiveType ?? "") ||
        window.innerWidth < 900;
      seq = new FrameSequence(
        light
          ? "/frames/street-sm/manifest.json"
          : "/frames/street/manifest.json",
      );
      seqRef.current = seq;
      seq.onFrame = schedulePaint;
      seq.start().catch(() => {});
    };
    // start early: act 1 plays during the hero's last glide
    const io = new IntersectionObserver(
      (es) => es.some((e) => e.isIntersecting) && start(),
      { rootMargin: "300% 0px" },
    );
    io.observe(el);
    landscape.addEventListener("change", start);
    return () => {
      io.disconnect();
      landscape.removeEventListener("change", start);
      seq?.dispose();
      seqRef.current = null;
    };
  }, [schedulePaint]);

  // size the canvas; the 16:9 film fits below the navbar. On screens wider than
  // 16:9 the film's stickers are pushed out sideways (`spread`) to fill the width,
  // the man and his brush stay in the middle
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h) return;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      const fh = Math.min(h - NAV, (w * 9) / 16); // its faded foot may tuck under the category tabs
      const fw = (fh * 16) / 9;
      const cy = NAV + (h - NAV) / 2;
      const side = (w - fw) / 2;
      const push = clamp(side - Math.max(90, w * 0.1), 0, fw * 0.22);
      layoutRef.current = {
        heightFrac: fh / h,
        centerY: cy / h,
        spread: push / fw,
        x: (w - fw) / 2,
        y: cy - fh / 2,
        w: fw,
        h: fh,
      };
      // the film's "Shop now" pill sits at (8.4%, 75.1%) of the frame, 20.9% x 10.3% big (measured on the last frames)
      const shop = shopRef.current;
      if (shop) {
        const L = layoutRef.current;
        Object.assign(shop.style, {
          left: `${L.x + L.w * 0.084 - push}px`,
          top: `${L.y + L.h * 0.751}px`,
          width: `${L.w * 0.209}px`,
          height: `${L.h * 0.103}px`,
        });
      }
      schedulePaint();
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [schedulePaint]);

  /* ---------- steps ---------- */
  // entry = where the hero's last glide lands (man already standing), then the
  // two sticker steps, then out of the section
  const getStops = useCallback(() => {
    const el = sectionRef.current;
    if (!el) return null;
    const t = measure(el);
    const stops: Stop[] = [
      { y: t.entry, edge: "entry" },
      { y: t.left },
      { y: t.right },
      { y: t.end, edge: "exit" },
    ];
    return { ...t, stops };
  }, []);

  const stopFor = useCallback(
    (dir: 1 | -1): Stop | null => {
      const s = getStops();
      if (!s) return null;
      const y = window.scrollY;
      const EPS = 4;
      if (dir > 0) {
        if (y < s.entry - EPS || y >= s.end - EPS) return null;
        return s.stops.find((p) => p.y > y + EPS) ?? null;
      }
      if (y <= s.entry + EPS || y > s.end + EPS) return null;
      return [...s.stops].reverse().find((p) => p.y < y - EPS) ?? null;
    },
    [getStops],
  );

  const glide = useCallback(
    (to: Stop, done: () => void) => {
      const s = getStops();
      if (!s) return done();
      const frames = Math.abs(s.frameAt(to.y) - s.frameAt(window.scrollY));
      const duration =
        to.edge === "exit"
          ? 1.15
          : Math.min(2.2, Math.max(1, 0.6 + frames * 0.03));
      const timer = window.setTimeout(done, duration * 1000 + 300);
      scrollTo(to.y, {
        duration,
        easing: easeInOut,
        lock: true,
        onComplete: () => {
          window.clearTimeout(timer);
          done();
        },
      });
    },
    [getStops, scrollTo],
  );

  const region = useMemo<StepRegion>(
    () => ({ stopFor, glide: (s, done) => glide(s as Stop, done) }),
    [stopFor, glide],
  );
  useEffect(
    () => (reduce ? undefined : registerStepRegion(region)),
    [region, reduce],
  );

  const slide = (
    v: "--m" | "--l" | "--r",
    from: -1 | 1,
    extra = "",
  ): CSSProperties => ({
    transform: `translateX(calc((1 - var(${v})) * ${from * 120}vw)) ${extra}`,
    opacity: `calc(var(${v}) * 1.6 - 0.3)`,
  });

  return (
    <section
      ref={sectionRef}
      id="street"
      aria-label="Express your style — the new collection"
      className="relative h-[300vh]"
    >
      <div className="sticky top-0 flex h-svh flex-col overflow-hidden bg-ink">
        <h2 className="sr-only">
          Express your style. New collection — be you, be bold, be swag.
        </h2>

        {/* the film / collage takes the height above the perks strip */}
        <div className="relative min-h-0 flex-1">
          {/* landscape: the film */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full portrait:hidden"
            aria-hidden
          />
          <Link
            ref={shopRef}
            href="/shop"
            aria-label="Shop now"
            tabIndex={-1}
            className="absolute z-10 rounded-full opacity-0 outline-offset-4 transition-opacity duration-300 portrait:hidden"
            style={{ pointerEvents: "none" }}
          />

          {/* portrait: the same story as a collage of the supplied stills */}
          <div
            ref={layersRef}
            className="absolute inset-0 hidden pt-16 landscape:hidden portrait:block"
            style={{ "--m": 0, "--l": 0, "--r": 0 } as CSSProperties}
          >
            <div className="relative h-full w-full">
              {/* man + the orange brush stroke behind him: from the left */}
              <div
                className="absolute inset-x-0 bottom-0 h-[62%]"
                style={slide("--m", -1)}
              >
                <div className="absolute top-[4%] left-1/2 w-[86%] -translate-x-1/2 -rotate-12">
                  <Image
                    src="/img/street/brush.webp"
                    alt=""
                    width={300}
                    height={255}
                    className="h-auto w-full"
                  />
                </div>
                <Image
                  src="/img/street/man.webp"
                  alt="Model in sunglasses and a black SWAG tee"
                  fill
                  sizes="96vw"
                  className="object-contain object-bottom"
                  priority={false}
                />
              </div>

              {/* left-hand elements: from the left */}
              <div className="absolute inset-0" style={slide("--l", -1)}>
                <span className="absolute top-[3%] left-[5%] rounded-full bg-gold px-3.5 py-1.5 text-[11px] font-extrabold tracking-[0.08em] text-ink uppercase">
                  New collection
                </span>
                <p className="display absolute top-[8%] left-[5%] text-[clamp(34px,10vw,52px)] leading-[0.95]">
                  Express.
                  <br />
                  <span className="text-gold">Your style.</span>
                </p>
                <div className="absolute top-[27%] left-[5%] w-[20%]">
                  <Image
                    src="/img/street/crown.webp"
                    alt=""
                    width={395}
                    height={376}
                    className="h-auto w-full"
                  />
                </div>
                <div className="absolute top-[39%] left-[2%] w-[31%] -rotate-3">
                  <Image
                    src="/img/street/good-outfits.webp"
                    alt="Good outfits, better days"
                    width={496}
                    height={640}
                    className="h-auto w-full"
                  />
                </div>
                <Link
                  href="/shop"
                  className="absolute bottom-[4%] left-[5%] z-10 flex items-center gap-3 rounded-full bg-fg py-1.5 pr-1.5 pl-5 text-[12px] font-extrabold tracking-[0.08em] text-ink uppercase"
                >
                  Shop now
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-gold">
                    <ArrowRight size={15} />
                  </span>
                </Link>
              </div>

              {/* right-hand elements: from the right */}
              <div className="absolute inset-0" style={slide("--r", 1)}>
                <div className="absolute top-[3%] right-[4%] w-[42%] rotate-3">
                  <Image
                    src="/img/street/be-you.webp"
                    alt="Be you, be bold, be swag"
                    width={640}
                    height={511}
                    className="h-auto w-full"
                  />
                </div>
                <div className="absolute top-[24%] right-[5%] w-[22%]">
                  <Image
                    src="/img/street/smiley.webp"
                    alt=""
                    width={476}
                    height={611}
                    className="h-auto w-full"
                  />
                </div>
                <div className="absolute top-[41%] right-[3%] w-[27%] rotate-6">
                  <Image
                    src="/img/street/style-note.webp"
                    alt="Style has no limits"
                    width={546}
                    height={640}
                    className="h-auto w-full"
                  />
                </div>
                <div className="absolute top-[30%] right-[31%] w-[9%]">
                  <Image
                    src="/img/street/star.webp"
                    alt=""
                    width={170}
                    height={164}
                    className="h-auto w-full"
                  />
                </div>
                <div className="absolute right-[5%] bottom-[5%] w-[15%]">
                  <Image
                    src="/img/street/globe.webp"
                    alt=""
                    width={327}
                    height={323}
                    className="h-auto w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* category tabs rising out of the black perks strip (overlap the film's faded foot a little) */}
        <div className="relative z-10 mx-auto -mt-5 w-full max-w-[1500px] shrink-0 px-4 pb-3 sm:px-8 md:pb-4 lg:px-10">
          <CategoryBar />
          <ul className="grid grid-cols-2 gap-y-3 rounded-2xl bg-fg px-3 py-3.5 text-ink md:grid-cols-4 md:px-4 md:py-4">
            {PERKS.map(({ Icon, title, text }, i) => (
              <li
                key={title}
                className={`flex items-center gap-2.5 px-2 md:justify-center md:gap-4 ${i ? "md:border-l md:border-ink/15" : ""}`}
              >
                <Icon
                  className="h-6 w-6 shrink-0 text-gold md:h-8 md:w-8"
                  strokeWidth={1.6}
                  aria-hidden
                />
                <div className="min-w-0 leading-tight">
                  <p className="text-[10.5px] font-extrabold tracking-[0.06em] uppercase md:text-[13px]">
                    {title}
                  </p>
                  <p className="mt-0.5 text-[10.5px] font-medium text-ink/60 md:text-xs">
                    {text}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
