/**
 * Hero frame mapping — scroll progress (0..1 across the pinned hero) → video frame.
 *
 * Source: men-ecoomerce.mp4 — 10 s, 24 fps, 240 frames (backdrop flattened to the page ivory),
 * extracted by tools/build_assets.py into public/frames/hero(-sm)/frame_001…240.webp.
 *
 * Measured from the film (0-based frame numbers):
 *   0–40    close-up of the upper body, camera pulls back
 *   40–48   full body, base layer (vest + shorts)
 *   48–68   white shirt + navy trousers slide in      (swaps at ~63)
 *   84–104  light-blue shirt + beige trousers         (~99)
 *   120–136 black shirt + light-grey trousers         (~130)
 *   156–176 olive shirt + cream trousers              (~169)
 *   192–210 pink shirt + charcoal trousers            (~205)
 * Between those, each look holds still for ~15–30 frames.
 *
 * `scroll` ranges are configurable: widen a segment to give it more scroll.
 * Inside a segment frames advance linearly, so a look's natural hold frames
 * become a "dwell" where the outfit is fully on screen.
 */
export type HeroSegment = {
  id: string;
  label: string;
  frames: [number, number];
  scroll: [number, number];
  /** product slug for look segments */
  outfit?: string;
  /** the frame at which this look visibly replaces the previous one */
  swapFrame?: number;
};

export const HERO_SEGMENTS: HeroSegment[] = [
  { id: "intro", label: "Opening close-up & zoom-out", frames: [0, 49], scroll: [0.0, 0.17] },
  { id: "look-1", label: "White shirt + navy trousers", outfit: "classic-white-navy", frames: [49, 84], scroll: [0.17, 0.33], swapFrame: 63 },
  { id: "look-2", label: "Light-blue shirt + beige trousers", outfit: "sky-blue-beige", frames: [84, 120], scroll: [0.33, 0.49], swapFrame: 99 },
  { id: "look-3", label: "Black shirt + light-grey trousers", outfit: "black-grey", frames: [120, 155], scroll: [0.49, 0.65], swapFrame: 130 },
  { id: "look-4", label: "Olive shirt + cream trousers", outfit: "olive-cream", frames: [155, 192], scroll: [0.65, 0.81], swapFrame: 169 },
  { id: "look-5", label: "Pink shirt + charcoal trousers", outfit: "pink-charcoal", frames: [192, 239], scroll: [0.81, 0.95], swapFrame: 205 },
  // final look holds while the pinned stage releases
  { id: "outro", label: "Hold on final look", outfit: "pink-charcoal", frames: [239, 239], scroll: [0.95, 1.0] },
];

export const HERO_FRAME_COUNT = 240;

/** Display names for the outfit indicator (01 / 05 …). */
export const HERO_LOOKS = HERO_SEGMENTS.filter((s) => s.swapFrame !== undefined).map((s, i) => ({
  index: i,
  slug: s.outfit!,
  swapFrame: s.swapFrame!,
}));

export function frameForProgress(p: number): number {
  const x = Math.min(1, Math.max(0, p));
  for (const s of HERO_SEGMENTS) {
    if (x <= s.scroll[1]) {
      const t = (x - s.scroll[0]) / Math.max(1e-6, s.scroll[1] - s.scroll[0]);
      return s.frames[0] + (s.frames[1] - s.frames[0]) * Math.min(1, Math.max(0, t));
    }
  }
  return HERO_FRAME_COUNT - 1;
}

/** -1 while the base silhouette is on screen, otherwise 0..4 */
export function lookForFrame(frame: number): number {
  let idx = -1;
  for (const l of HERO_LOOKS) if (frame >= l.swapFrame) idx = l.index;
  return idx;
}

/** scroll progress at which a look is fully settled — used for "jump to look" */
export function progressForLook(index: number): number {
  const seg = HERO_SEGMENTS.filter((s) => s.swapFrame !== undefined)[index];
  if (!seg) return 0;
  const settle = Math.min(seg.frames[1], seg.swapFrame! + 10);
  const t = (settle - seg.frames[0]) / (seg.frames[1] - seg.frames[0]);
  return seg.scroll[0] + (seg.scroll[1] - seg.scroll[0]) * t;
}
