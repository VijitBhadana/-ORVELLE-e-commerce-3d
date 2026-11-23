/**
 * Scroll-scrubbed WebP frame sequence, adapted from ../assets/useFrameSequence.ts.
 *
 * - Compressed blobs (a few MB total) are fetched progressively: frame 1 first,
 *   then a small worker pool always picks the unfetched frame nearest the playhead.
 * - Decoded frames live only in a sliding window around the playhead (ImageBitmap,
 *   with an HTMLImageElement fallback — createImageBitmap throws in hidden tabs
 *   and some webviews, so the fallback must stay).
 * - draw() never blocks: if the exact frame isn't decoded yet it paints the
 *   nearest decoded one and calls onFrame() once the exact frame lands.
 */

type Frame =
  | { kind: "bitmap"; img: ImageBitmap }
  | { kind: "element"; img: HTMLImageElement; url: string };

async function decodeBlob(blob: Blob): Promise<Frame> {
  try {
    if (typeof createImageBitmap !== "function") throw new Error("no bitmap");
    const img = await createImageBitmap(blob);
    return { kind: "bitmap", img };
  } catch {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("img decode failed"));
      img.src = url;
    });
    return { kind: "element", img, url };
  }
}

function release(f: Frame) {
  if (f.kind === "bitmap") f.img.close();
  else URL.revokeObjectURL(f.url);
}

export type DrawLayout = {
  /** fraction of canvas height the frame occupies (1 = full height) */
  heightFrac: number;
  /** vertical centre of the frame as a fraction of canvas height */
  centerY: number;
  /** extra camera zoom */
  zoom: number;
  /** stacked frames only: push the sticker layer's left half left and its right
      half right by this fraction of the drawn frame width (fills wide screens) */
  spread?: number;
};

/** page background (warm ivory) — keep in sync with --color-ink in globals.css */
const PAGE_BG = "#E6D5BD";
const AHEAD = 14;
const KEEP = 36;
const WORKERS = 6;

export class FrameSequence {
  count = 0;
  /** each image is the film (top half) over its transparent sticker layer (bottom half) */
  stacked = false;
  private pattern = "";
  private blobs: (Blob | null)[] = [];
  private fetching = new Set<number>();
  private frames = new Map<number, Frame>();
  private decoding = new Set<number>();
  private center = 0;
  private alive = true;
  private fetched = 0;
  private lastDrawn = -1;

  onFrame?: () => void;
  onProgress?: (loaded: number, total: number) => void;

  constructor(private manifestUrl: string) {}

  async start() {
    const m = await fetch(this.manifestUrl).then((r) => r.json());
    if (!this.alive) return;
    this.count = m.count;
    this.pattern = m.pattern;
    this.stacked = !!m.stacked;
    this.blobs = new Array(this.count).fill(null);
    await this.fetchOne(0);
    this.decode(0);
    for (let w = 0; w < WORKERS; w++) void this.worker();
  }

  dispose() {
    this.alive = false;
    this.frames.forEach(release);
    this.frames.clear();
  }

  private url(i: number) {
    return this.pattern.replace("%03d", String(i + 1).padStart(3, "0"));
  }

  private async fetchOne(i: number) {
    if (this.blobs[i] || this.fetching.has(i)) return;
    this.fetching.add(i);
    try {
      const res = await fetch(this.url(i));
      if (!res.ok) throw new Error(String(res.status));
      const b = await res.blob();
      if (!this.alive) return;
      this.blobs[i] = b;
      this.fetched++;
      this.onProgress?.(this.fetched, this.count);
      // a frame near the playhead just arrived → let the window decode it
      if (Math.abs(i - this.center) <= AHEAD) this.decode(i);
    } catch {
      /* retried by a worker on its next pass */
    } finally {
      this.fetching.delete(i);
    }
  }

  private nextToFetch(): number {
    let best = -1;
    let bestD = Infinity;
    for (let i = 0; i < this.count; i++) {
      if (this.blobs[i] || this.fetching.has(i)) continue;
      // bias forward: users mostly scroll down
      const d = i >= this.center ? i - this.center : (this.center - i) * 1.5;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  }

  private async worker() {
    let misses = 0;
    while (this.alive) {
      const i = this.nextToFetch();
      if (i < 0) return;
      const before = this.fetched;
      await this.fetchOne(i);
      misses = this.fetched === before ? misses + 1 : 0;
      if (misses > 20) return; // network is down — stop hammering
    }
  }

  private decode(i: number) {
    if (this.frames.has(i) || this.decoding.has(i) || !this.blobs[i]) return;
    this.decoding.add(i);
    decodeBlob(this.blobs[i]!)
      .then((f) => {
        if (!this.alive) return release(f);
        this.frames.set(i, f);
        if (i === this.center || this.lastDrawn !== this.center) this.onFrame?.();
      })
      .catch(() => {})
      .finally(() => this.decoding.delete(i));
  }

  private manageWindow(center: number) {
    for (let d = 0; d <= AHEAD; d++) {
      if (center + d < this.count) this.decode(center + d);
      if (center - d >= 0) this.decode(center - d);
    }
    if (this.frames.size > KEEP * 2) {
      for (const [idx, f] of this.frames) {
        if (Math.abs(idx - center) > KEEP) {
          release(f);
          this.frames.delete(idx);
        }
      }
    }
  }

  private nearest(i: number): [number, Frame] | null {
    if (this.frames.has(i)) return [i, this.frames.get(i)!];
    for (let d = 1; d < this.count; d++) {
      if (this.frames.has(i - d)) return [i - d, this.frames.get(i - d)!];
      if (this.frames.has(i + d)) return [i + d, this.frames.get(i + d)!];
    }
    return null;
  }

  /** Paint frame `index` onto the canvas. Returns true once something was drawn. */
  draw(canvas: HTMLCanvasElement, index: number, layout: DrawLayout): boolean {
    if (!this.count) return false;
    const i = Math.min(this.count - 1, Math.max(0, Math.round(index)));
    this.center = i;
    this.manageWindow(i);
    const hit = this.nearest(i);
    if (!hit) return false;
    const [drawnIdx, frame] = hit;
    this.lastDrawn = drawnIdx;
    const src = frame.img;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return false;
    const cw = canvas.width;
    const ch = canvas.height;
    ctx.fillStyle = PAGE_BG;
    ctx.fillRect(0, 0, cw, ch);
    const sw = src.width;
    const sh = this.stacked ? src.height / 2 : src.height;
    const s = ((ch * layout.heightFrac) / sh) * layout.zoom;
    const w = sw * s;
    const h = sh * s;
    ctx.imageSmoothingQuality = "high";
    const x = (cw - w) / 2;
    const y = ch * layout.centerY - h / 2;
    // frames are transparent cut-outs (tools/matte_assets.py): the mannequin stands on the ivory fill
    ctx.drawImage(src, 0, 0, sw, sh, x, y, w, h);
    // feather the frame's edges into the page background so the smaller frame has no visible border
    const f = Math.min(w, h) * 0.06;
    const edge = (x0: number, y0: number, x1: number, y1: number, rx: number, ry: number, rw: number, rh: number) => {
      const g = ctx.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, "rgba(230,213,189,1)");
      g.addColorStop(1, "rgba(230,213,189,0)");
      ctx.fillStyle = g;
      ctx.fillRect(rx, ry, rw, rh);
    };
    if (x > 0) {
      edge(x, 0, x + f, 0, x, y, f, h);
      edge(x + w, 0, x + w - f, 0, x + w - f, y, f, h);
    }
    if (y > 0) edge(0, y, 0, y + f, x, y, w, f);
    if (y + h < ch) edge(0, y + h, 0, y + h - f, x, y + h - f, w, f);
    if (this.stacked) {
      // stickers go on top of the feathered film, split at the middle and pushed apart
      const d = (layout.spread ?? 0) * w;
      ctx.drawImage(src, 0, sh, sw / 2, sh, x - d, y, w / 2, h);
      ctx.drawImage(src, sw / 2, sh, sw / 2, sh, x + w / 2 + d, y, w / 2, h);
    }
    return true;
  }
}
