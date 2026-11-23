"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useInView, useReducedMotion, type Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/*
 * "The ORVELLE Originals" — a burnt-orange poster panel right after the outfit deck.
 *
 * The orange ground, paint splatter, torn paper, side copy and the "Good vibes only" tag
 * are on screen from the start. When the section comes into view the hand-lettered title
 * stamps in, then the seated model rises into place over it (as in the mockup, the model
 * covers the middle of the lettering).
 *
 * Desktop (lg+): everything sits on a 2:1 "stage" sized to fit the screen; positions and
 * type use container units (cqw = 1% of the stage width) so the poster scales as one piece.
 * Below lg: the art (circle, title, model) keeps the same arrangement on a full-width box
 * and the copy flows underneath.
 *
 * Assets: public/img/originals/, built by tools/build_originals.py from brand-source/.
 */

const CREAM = "#F4E9D6"; // matches CREAM in tools/build_originals.py

// fine paper grain over the orange
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.6 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const TITLE_DELAY = 0.25;
const MODEL_DELAY = 1.15;

const title: Variants = {
  hidden: { opacity: 0, scale: 0.55, rotate: -7, y: "6%", filter: "blur(14px)" },
  shown: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    y: "0%",
    filter: "blur(0px)",
    transition: {
      type: "spring",
      stiffness: 150,
      damping: 13,
      mass: 0.9,
      delay: TITLE_DELAY,
      opacity: { duration: 0.35, delay: TITLE_DELAY },
      filter: { duration: 0.55, delay: TITLE_DELAY },
    },
  },
};

const model: Variants = {
  hidden: { opacity: 0, y: "18%", scale: 0.92 },
  shown: {
    opacity: 1,
    y: "0%",
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 120,
      damping: 17,
      delay: MODEL_DELAY,
      opacity: { duration: 0.45, delay: MODEL_DELAY },
    },
  },
};

const shadow: Variants = {
  hidden: { opacity: 0, scaleX: 0.35 },
  shown: { opacity: 1, scaleX: 1, transition: { duration: 0.8, delay: MODEL_DELAY + 0.1, ease: [0.22, 1, 0.36, 1] } },
};

export default function OriginalsSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { amount: 0.45, once: true });
  const reduce = useReducedMotion();
  const [titleReady, setTitleReady] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  // wait for both images so the sequence never plays on an empty box; give up waiting after 2s
  useEffect(() => {
    if (!inView) return;
    const t = setTimeout(() => setTimedOut(true), 2000);
    return () => clearTimeout(t);
  }, [inView]);

  const play = reduce || (inView && ((titleReady && modelReady) || timedOut));
  const state = play ? "shown" : "hidden";
  const initial = reduce ? false : "hidden";

  return (
    <section
      ref={ref}
      id="originals"
      aria-labelledby="originals-title"
      className="relative mt-20 overflow-hidden bg-gold pt-20 text-fg sm:mt-28 lg:mt-32 lg:flex lg:h-svh lg:min-h-[600px] lg:items-center lg:justify-center lg:pt-16 xl:pt-20"
    >
      {/* ---- ground: splatter, spray, torn paper, grain (static) ---- */}
      <div aria-hidden className="pointer-events-none absolute inset-0 select-none">
        <div className="absolute inset-0 bg-[radial-gradient(110%_85%_at_50%_30%,rgba(255,236,214,0.08),transparent_65%)]" />
        {/* speckles tile instead of stretching, so they keep their size on tall phone layouts */}
        <div className="absolute inset-0 bg-[url(/img/originals/decor-speckle.webp)] bg-[length:max(100vw,1100px)_auto] bg-repeat" />
        <Image src="/img/originals/decor-ink-tl.webp" alt="" width={640} height={520} sizes="40vw" className="absolute top-0 left-0 w-[46vw] max-w-[560px] lg:w-[30vw]" />
        <Image src="/img/originals/decor-spray-bl.webp" alt="" width={620} height={380} sizes="50vw" className="absolute bottom-0 left-0 w-[48vw] lg:w-[24vw]" />
        <Image src="/img/originals/decor-spray-br.webp" alt="" width={1100} height={620} sizes="(min-width:1024px) 50vw, 100vw" className="absolute right-0 bottom-0 w-[82vw] lg:w-[50vw]" />
        <Image src="/img/originals/decor-torn-left.webp" alt="" width={70} height={420} className="absolute top-[56%] left-0 h-[24%] w-auto" />
        <Image src="/img/originals/decor-torn-right.webp" alt="" width={60} height={260} className="absolute top-0 right-0 h-[13%] w-auto" />
        <Image src="/img/originals/decor-torn-right.webp" alt="" width={60} height={260} className="absolute top-[50%] right-0 h-[6%] w-auto -scale-y-100" />
        <div className="absolute inset-0 opacity-30 mix-blend-multiply" style={{ backgroundImage: GRAIN }} />
      </div>

      {/* ---- stage ---- */}
      <div className="relative mx-auto w-full [container-type:inline-size] lg:aspect-[2/1] lg:w-[min(100vw,calc((100svh-5rem)*2))]">
        {/* art: circle → title → model (+ floor shadow) */}
        <div className="relative h-[72cqw] lg:absolute lg:inset-0 lg:h-auto">
          <div
            aria-hidden
            className="absolute top-[4cqw] left-[20cqw] aspect-square w-[60cqw] rounded-full lg:top-[1.75cqw] lg:left-[33.9cqw] lg:w-[29.6cqw]"
            style={{ background: CREAM }}
          />

          <motion.h2
            id="originals-title"
            variants={title}
            initial={initial}
            animate={state}
            className="absolute top-[7cqw] left-[4cqw] w-[92cqw] origin-[45%_60%] lg:top-[3.45cqw] lg:left-[17.8cqw] lg:w-[65.7cqw]"
          >
            <Image
              src="/img/originals/title.webp"
              alt="The ORVELLE Originals"
              width={1812}
              height={944}
              sizes="(min-width:1024px) 66vw, 92vw"
              className="h-auto w-full"
              onLoad={() => setTitleReady(true)}
            />
          </motion.h2>

          <motion.div
            aria-hidden
            variants={shadow}
            initial={initial}
            animate={state}
            className="absolute top-[61.5cqw] left-[38cqw] h-[4.2cqw] w-[42cqw] rounded-[50%] bg-fg/45 blur-[1.6cqw] lg:top-[42.5cqw] lg:left-[42cqw] lg:h-[3cqw] lg:w-[30cqw] lg:blur-[1.1cqw]"
          />

          <motion.div
            variants={model}
            initial={initial}
            animate={state}
            className="absolute top-[13.7cqw] left-[34.5cqw] w-[47.6cqw] origin-bottom lg:top-[8.25cqw] lg:left-[39.6cqw] lg:w-[34cqw]"
          >
            <Image
              src="/img/originals/model.webp"
              alt=""
              width={944}
              height={1039}
              sizes="(min-width:1024px) 34vw, 48vw"
              className="h-auto w-full"
              onLoad={() => setModelReady(true)}
            />
          </motion.div>
        </div>

        {/* left copy + CTA */}
        <div className="relative z-10 px-5 sm:px-8 lg:absolute lg:top-[17.8cqw] lg:left-[4.4cqw] lg:p-0">
          <p className="text-[clamp(20px,5.4cqw,28px)] leading-[1.1] font-extrabold uppercase lg:text-[max(13px,1.13cqw)]">
            Ideas, visions,
            <br />
            and stories
            <br />
            for a brighter
            <br />
            tomorrow
          </p>
          <Link
            href="/collections"
            className="group mt-5 inline-flex items-center gap-3 rounded-full bg-fg py-3.5 pr-5 pl-6 text-left text-[13px] leading-[1.2] font-bold tracking-[0.04em] uppercase transition-transform duration-300 hover:-translate-y-0.5 lg:mt-[2.2cqw] lg:gap-[0.9cqw] lg:py-[0.95cqw] lg:pr-[1.3cqw] lg:pl-[1.6cqw] lg:text-[max(11px,0.95cqw)]"
            style={{ color: CREAM }}
          >
            <span>
              Explore
              <br />
              the originals
            </span>
            <ArrowRight className="h-4 w-4 text-gold transition-transform duration-300 group-hover:translate-x-1 lg:h-[max(14px,1.2cqw)] lg:w-[max(14px,1.2cqw)]" strokeWidth={2.4} />
          </Link>
        </div>

        {/* right copy */}
        <p className="relative z-10 mt-7 max-w-[340px] px-5 text-[15px] leading-[1.45] font-medium sm:px-8 lg:absolute lg:top-[20.5cqw] lg:left-[83.1cqw] lg:mt-0 lg:w-[14.4cqw] lg:max-w-none lg:p-0 lg:text-[max(12px,0.87cqw)]">
          A space for curious minds, creative souls, and people who see the world differently.
        </p>

        {/* "Good vibes only" tag on its orange splat */}
        <div className="relative z-10 mt-6 mr-8 mb-16 ml-auto w-max sm:mr-12 lg:absolute lg:top-[35.5cqw] lg:left-[92.5cqw] lg:m-0 lg:-translate-x-1/2 lg:-translate-y-1/2">
          <Image
            src="/img/originals/decor-splat-orange.webp"
            alt=""
            aria-hidden
            width={520}
            height={520}
            sizes="200px"
            className="pointer-events-none absolute top-1/2 left-1/2 w-[165%] max-w-none lg:w-[200%] -translate-x-1/2 -translate-y-1/2 select-none"
          />
          <div className="relative -rotate-[9deg]">
            <p className="font-marker text-[clamp(30px,9cqw,44px)] leading-[0.98] uppercase lg:text-[3.2cqw]">
              Good
              <br />
              vibes
              <br />
              only
            </p>
            <svg aria-hidden viewBox="0 0 120 14" preserveAspectRatio="none" className="absolute top-[96%] left-[2%] h-[0.32em] w-[96%] text-[clamp(30px,9cqw,44px)] lg:text-[3.2cqw]" fill="none" stroke="currentColor" strokeLinecap="round">
              <path d="M4 9 C 40 3, 82 2, 116 6" strokeWidth="3.2" />
            </svg>
          </div>
        </div>

        {/* slide counter, as in the mockup */}
        <div aria-hidden className="hidden items-center gap-[1cqw] text-[max(11px,0.8cqw)] font-bold tracking-[0.12em] lg:absolute lg:top-[45.75cqw] lg:right-[2.5cqw] lg:flex">
          <span className="h-px w-[5.2cqw] bg-fg/70" />
          01 / 03
        </div>
      </div>
    </section>
  );
}
