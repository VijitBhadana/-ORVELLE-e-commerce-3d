"use client";

/**
 * Step scrolling — "one gesture = one step" for pinned, scroll-scrubbed sections.
 *
 * Sections (the hero, the street drop…) register a *region*: a function that
 * returns the next stop for a direction (or null when the gesture isn't theirs)
 * and a function that glides there. One shared engine owns the window listeners
 * and the gesture detection, so a single swipe can never trigger two regions —
 * e.g. the inertia tail of the swipe that leaves the hero can't also advance
 * the next section. Regions are asked in registration (= page) order.
 *
 * Inside a region a wheel flick / swipe / arrow key doesn't scroll freely: it
 * glides to the next stop. A swipe made while a glide plays is queued (one).
 * Only active while Lenis drives the page (SmoothScroll calls setStepScrollEnabled),
 * so reduced-motion users keep plain scrolling.
 */

export type StepStop = { y: number };
export type StepRegion = {
  /** the stop one step away in `dir`, or null when the gesture belongs to the page */
  stopFor: (dir: 1 | -1) => StepStop | null;
  /** glide to `stop`; call `done` exactly once when it has landed */
  glide: (stop: StepStop, done: () => void) => void;
};

const regions = new Set<StepRegion>();
let enabled = false;
let busy = false;
let pending: 0 | 1 | -1 = 0;
let detach: (() => void) | null = null;

export function setStepScrollEnabled(on: boolean) {
  enabled = on;
}

function find(dir: 1 | -1): [StepRegion, StepStop] | null {
  for (const r of regions) {
    const s = r.stopFor(dir);
    if (s) return [r, s];
  }
  return null;
}

function go(r: StepRegion, s: StepStop) {
  busy = true;
  let landed = false;
  r.glide(s, () => {
    if (landed) return;
    landed = true;
    busy = false;
    if (!pending) return;
    const d = pending;
    pending = 0;
    const next = find(d);
    if (next) go(...next);
  });
}

/** run one step (queues it while a glide is playing) */
function step(dir: 1 | -1, hit: [StepRegion, StepStop]) {
  if (busy) pending = dir;
  else go(...hit);
}

/** buttons ("Explore outfits", look dashes): glide a region to a stop through the engine */
export function glideRegionTo(r: StepRegion, s: StepStop) {
  if (busy) return;
  go(r, s);
}

export function isStepScrollBusy() {
  return busy;
}

export function registerStepRegion(r: StepRegion): () => void {
  regions.add(r);
  if (!detach) detach = attach();
  return () => {
    regions.delete(r);
    if (!regions.size && detach) {
      detach();
      detach = null;
    }
  };
}

function attach() {
  const active = () => enabled && !document.documentElement.classList.contains("scroll-locked");
  const outside = (t: EventTarget | null) => !!(t as Element | null)?.closest?.("[data-lenis-prevent],[role=dialog],input,textarea,select,[contenteditable]");
  const swallow = (e: Event) => {
    e.preventDefault();
    e.stopImmediatePropagation(); // keep Lenis from also scrolling
  };

  /* One step per *swipe*. A trackpad swipe = finger push (deltas rise) + inertia
     tail (deltas decay smoothly for a second or more, with no gaps). So a new
     swipe is either a pause (>150 ms without events) or, while a tail is still
     running, a clear surge after the tail has started decaying. */
  const w = { last: 0, lastRaw: 0, lastRate: 0, firedAt: -1e9, samples: [] as { t: number; d: number }[], armed: true, sawDecay: false, acc: 0, dir: 0 };
  /** scroll speed (px per 16 ms) over the window [now-from, now-to). Summing over
      time absorbs Chrome's coalescing: per frame it merges 2 or 3 OS ticks into one
      event, so single-event deltas jitter (11, 32, 10, 29…) even in a smooth fling. */
  const speed = (now: number, from: number, to: number) => {
    let s = 0;
    for (const x of w.samples) if (x.t > now - from && x.t <= now - to) s += x.d;
    return (s / (from - to)) * 16;
  };
  const onWheel = (e: WheelEvent) => {
    if (e.ctrlKey || !active() || outside(e.target)) return;
    const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY;
    if (Math.abs(e.deltaX) > Math.abs(dy) || dy === 0) return;
    const dir = dy > 0 ? 1 : -1;
    const now = e.timeStamp || performance.now();
    const gap = now - w.last;
    const raw = Math.abs(dy);
    const rate = (raw / Math.max(gap, 4)) * 16;

    // --- gesture tracking (runs for every event, even ones we let through) ---
    // a pause starts a new swipe — unless the tail was still moving and simply
    // carries on at the same speed after a main-thread stall (not the user lifting off)
    const stalled =
      !w.armed && dir === w.dir && gap < 600 && ((w.lastRaw > 3 && raw <= w.lastRaw * 1.3) || rate <= w.lastRate * 1.3 + 1.5);
    w.lastRaw = raw;
    w.lastRate = rate;
    let fresh = false;
    if (gap > 150 && !stalled) {
      w.samples = [];
      w.armed = true;
      w.sawDecay = false;
      w.acc = 0;
      fresh = true;
    }
    w.last = now;
    if (!fresh && gap > 24 && w.samples.length) {
      // a merged event (the page was busy, e.g. decoding film frames) carries the
      // scroll of the whole gap: spread it back over that time, or the speed check
      // below would read a fading tail as a fresh push
      const n = Math.min(40, Math.round(gap / 16));
      for (let k = 1; k <= n; k++) w.samples.push({ t: now - gap + (gap * k) / n, d: raw / n });
    } else w.samples.push({ t: now, d: raw });
    while (w.samples.length && w.samples[0].t < now - 300) w.samples.shift();
    if (!w.armed) {
      if (dir !== w.dir && raw > 4) {
        w.armed = true; // reversed direction mid-tail: that's a new intent
        w.acc = 0;
      } else if (now - w.firedAt > 200) {
        const recent = speed(now, 60, 0);
        const older = speed(now, 240, 60);
        if (recent < older * 0.7) w.sawDecay = true;
        else if (w.sawDecay && recent > Math.max(older * 1.5, 6)) {
          w.armed = true; // fresh push on top of a fading tail
          w.sawDecay = false;
          w.acc = 0;
        }
      }
    }

    const hit = find(dir);
    if (!hit && !busy) return; // gesture belongs to the page
    swallow(e);
    if (!w.armed) return;
    if (Math.sign(w.acc) !== dir) w.acc = 0;
    w.acc += dy;
    if (Math.abs(w.acc) < 30) return; // ignore the faintest nudges
    w.armed = false;
    w.sawDecay = false;
    w.acc = 0;
    w.dir = dir;
    w.firedAt = now;
    if (hit) step(dir, hit);
    else if (busy) pending = dir;
  };

  // touch — the first move decides; a 30px swipe advances one step
  const t = { x0: 0, y0: 0, on: false, decided: false };
  const onTouchStart = (e: TouchEvent) => {
    t.on = e.touches.length === 1 && active() && !outside(e.target);
    t.decided = false;
    if (t.on) {
      t.x0 = e.touches[0].clientX;
      t.y0 = e.touches[0].clientY;
    }
  };
  const onTouchMove = (e: TouchEvent) => {
    if (!t.on) return;
    if (busy) return swallow(e);
    const dy = t.y0 - e.touches[0].clientY;
    const dx = t.x0 - e.touches[0].clientX;
    if (!t.decided) {
      t.decided = true;
      if (Math.abs(dx) > Math.abs(dy)) return void (t.on = false);
      if (!find(dy >= 0 ? 1 : -1)) return void (t.on = false);
    }
    if (e.cancelable) swallow(e);
  };
  const onTouchEnd = (e: TouchEvent) => {
    if (!t.on || busy) return;
    t.on = false;
    const dy = t.y0 - e.changedTouches[0].clientY;
    if (Math.abs(dy) <= 30) return;
    const hit = find(dy > 0 ? 1 : -1);
    if (hit) go(...hit);
  };

  // keyboard
  const onKey = (e: KeyboardEvent) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || !active() || outside(e.target)) return;
    const k = e.key;
    const isSpace = k === " " || k === "Spacebar";
    if (isSpace && (e.target as Element | null)?.closest?.("button,a,summary")) return;
    const dir = k === "ArrowDown" || k === "PageDown" || (isSpace && !e.shiftKey) ? 1 : k === "ArrowUp" || k === "PageUp" || (isSpace && e.shiftKey) ? -1 : 0;
    if (!dir) return;
    const hit = find(dir);
    if (!hit) return;
    e.preventDefault();
    step(dir, hit);
  };

  const cap = { capture: true, passive: false } as const;
  window.addEventListener("wheel", onWheel, cap);
  window.addEventListener("touchstart", onTouchStart, { capture: true, passive: true });
  window.addEventListener("touchmove", onTouchMove, cap);
  window.addEventListener("touchend", onTouchEnd, { capture: true, passive: true });
  window.addEventListener("keydown", onKey, true);
  return () => {
    window.removeEventListener("wheel", onWheel, cap);
    window.removeEventListener("touchstart", onTouchStart, { capture: true });
    window.removeEventListener("touchmove", onTouchMove, cap);
    window.removeEventListener("touchend", onTouchEnd, { capture: true });
    window.removeEventListener("keydown", onKey, true);
  };
}

/** gentle start and landing, so each step plays like a cut of the film */
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
