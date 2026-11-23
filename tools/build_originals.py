#!/usr/bin/env python3
"""Assets for the "ORVELLE Originals" section (OriginalsSection.tsx).

    python tools/build_originals.py            # everything
    python tools/build_originals.py title      # just one step: title | model | decor

Sources (brand-source/):
  originals-title.jpg  hand-lettered "THE ORVELLE ORIGINALS" on off-white paper
  originals-model.jpg  seated model on a white studio sweep

Output (public/img/originals/):
  title.webp     lettering with a transparent background (cream fill + black ink kept)
  model.webp     model + chair cut out (BiRefNet via rembg), toned to the mockup's warm grey
  decor-*.webp   paint splatter, spray clouds and torn-paper pieces, generated procedurally
"""

import os
import sys

import cv2
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "brand-source")
OUT = os.path.join(ROOT, "public", "img", "originals")

CREAM = np.array([244, 233, 214], np.float32)  # section cream (circle, splashes, lettering fill)
INK = np.array([20, 18, 16], np.float32)


def save(arr, name, q=88):
    im = Image.fromarray(np.clip(arr, 0, 255).round().astype(np.uint8), "RGBA")
    path = os.path.join(OUT, name)
    im.save(path, "WEBP", quality=q, alpha_quality=92, method=6)
    print(f"  {name}: {im.width}x{im.height}, {os.path.getsize(path) // 1024} KB")
    return im


def crop_to_alpha(rgba, pad=8):
    ys, xs = np.nonzero(rgba[..., 3] > 4)
    y0, y1 = max(ys.min() - pad, 0), min(ys.max() + pad + 1, rgba.shape[0])
    x0, x1 = max(xs.min() - pad, 0), min(xs.max() + pad + 1, rgba.shape[1])
    return rgba[y0:y1, x0:x1]


# --------------------------------------------------------------------------- title
def title():
    """Paper is cool off-white (R-B ~11), the letter fill is warm cream (R-B ~28), ink is dark.
    Fill is found by warmth (not flood fill, so gaps in the hand-drawn outline can't leak).
    Thin slivers of paper trapped between the double outlines are filled solid; only real
    counters (inside O, R, A...) and the outside stay transparent."""
    t = np.asarray(Image.open(os.path.join(SRC, "originals-title.jpg")).convert("RGB")).astype(np.float32)
    lum = t.mean(2)
    warmth = cv2.blur(t[..., 0] - t[..., 2], (7, 7))
    paper_lum = 244.0
    ink_cov = np.clip((paper_lum - lum) / (paper_lum - 40.0), 0, 1)

    fill = (warmth > 19) & (lum > 170)
    fill = cv2.morphologyEx(fill.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)).astype(bool)
    solid = fill | (ink_cov > 0.45)
    paper = (~solid).astype(np.uint8)

    n, labels = cv2.connectedComponents(paper, connectivity=4)
    border = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    exterior = np.isin(labels, border[border > 0]) & (paper > 0)
    interior = (paper > 0) & ~exterior

    def opened(mask, r):
        k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))
        return cv2.morphologyEx(mask.astype(np.uint8), cv2.MORPH_OPEN, k).astype(bool)

    clear = opened(interior, 10) | opened(exterior, 4)
    clear = cv2.dilate(clear.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool) & (paper > 0)

    alpha = np.where(clear, ink_cov, 1.0)
    alpha[alpha < 0.08] = 0
    fill_lum = 238.0
    k = np.clip((fill_lum - lum) / (fill_lum - 40.0), 0, 1)[..., None]
    rgb = np.where(clear[..., None], INK, CREAM * (1 - k) + INK * k)
    rgba = np.concatenate([rgb, alpha[..., None] * 255], axis=-1)
    rgba[..., 3][rgba[..., 3] < 30] = 0
    # drop isolated specks of paper texture (the art's own scratch marks are far bigger)
    n, lab, stats, _ = cv2.connectedComponentsWithStats((rgba[..., 3] > 0).astype(np.uint8), connectivity=8)
    tiny = np.nonzero(stats[:, cv2.CC_STAT_AREA] < 25)[0]
    rgba[..., 3][np.isin(lab, tiny[tiny > 0])] = 0
    rgba = crop_to_alpha(rgba)
    save(rgba, "title.webp")


# --------------------------------------------------------------------------- model
def model():
    from rembg import new_session, remove

    im = Image.open(os.path.join(SRC, "originals-model.jpg")).convert("RGB")
    session = new_session("birefnet-general-lite")
    rgba = np.array(remove(im, session=session).convert("RGBA")).astype(np.float32)
    a = rgba[..., 3:4] / 255.0
    a[a < 0.04] = 0
    # un-mix the light studio backdrop from semi-transparent edge pixels (no white halo on orange)
    bg = cv2.GaussianBlur(np.asarray(im).astype(np.float32), (0, 0), 25)
    rgb = rgba[..., :3]
    part = (a > 0) & (a < 1)
    rgb = np.where(part, (rgb - (1 - a) * bg) / np.maximum(a, 0.1), rgb)
    # warm grey duotone like the mockup: luminance mapped from ink to cream
    lum = (0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2])[..., None] / 255.0
    lum = np.clip(lum, 0, 1) ** 1.05
    toned = INK + (CREAM - INK) * lum
    out = np.concatenate([toned, a * 255], axis=-1)
    out = crop_to_alpha(out, pad=4)
    # 2752px source is far more than needed; the figure is shown at most ~700px tall
    im2 = Image.fromarray(np.clip(out, 0, 255).round().astype(np.uint8), "RGBA")
    target_h = 1100
    if im2.height > target_h:
        im2 = im2.resize((round(im2.width * target_h / im2.height), target_h), Image.LANCZOS)
    save(np.asarray(im2).astype(np.float32), "model.webp", q=86)


# --------------------------------------------------------------------------- decor
RNG = np.random.default_rng(7)


def fbm(h, w, octaves=5, base=6):
    """cheap fractal noise in 0..1"""
    out = np.zeros((h, w), np.float32)
    amp, total = 1.0, 0.0
    for o in range(octaves):
        n = base * 2**o
        g = RNG.random((n + 1, int(n * w / h) + 1)).astype(np.float32)
        out += amp * cv2.resize(g, (w, h), interpolation=cv2.INTER_CUBIC)
        total += amp
        amp *= 0.5
    out /= total
    return (out - out.min()) / (out.max() - out.min())


def droplets(h, w, n, rmin, rmax, weight=None, color=CREAM):
    """scattered round paint droplets; `weight` biases where they land"""
    alpha = np.zeros((h, w), np.uint8)
    if weight is not None:
        p = (weight / weight.sum()).ravel()
        idx = RNG.choice(h * w, size=n, p=p)
        ys, xs = np.unravel_index(idx, (h, w))
    else:
        ys, xs = RNG.integers(0, h, n), RNG.integers(0, w, n)
    for y, x in zip(ys, xs):
        r = rmin + (rmax - rmin) * RNG.random() ** 3
        cv2.ellipse(alpha, (int(x), int(y)), (max(1, int(r)), max(1, int(r * (0.75 + 0.5 * RNG.random())))),
                    RNG.random() * 180, 0, 360, 255, -1, cv2.LINE_AA)
    return alpha.astype(np.float32) / 255.0


def to_rgba(alpha, color):
    h, w = alpha.shape
    rgb = np.broadcast_to(color, (h, w, 3))
    return np.concatenate([rgb, alpha[..., None] * 255], axis=-1)


def edge_window(h, w, fade, margin=0.22):
    """1 inside, falling to 0 toward the canvas edges listed in `fade` ("t", "b", "l", "r"),
    so a piece never shows a straight cut where it doesn't touch the section edge"""
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    win = np.ones((h, w), np.float32)
    mh, mw = h * margin, w * margin
    if "t" in fade: win *= np.clip(yy / mh, 0, 1)
    if "b" in fade: win *= np.clip((h - 1 - yy) / mh, 0, 1)
    if "l" in fade: win *= np.clip(xx / mw, 0, 1)
    if "r" in fade: win *= np.clip((w - 1 - xx) / mw, 0, 1)
    return win ** 1.5


def spray(h, w, cx, cy, rx, ry, density=1.0, grain=0.55, fade="tblr"):
    """spray-paint cloud: solid core, speckled falloff, a few heavier drops at the rim"""
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.sqrt(((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2)
    n = fbm(h, w, base=4)
    field = np.clip(1.15 - d + (n - 0.5) * 0.9, 0, 1) * density * edge_window(h, w, fade)
    speck = RNG.random((h, w)).astype(np.float32)
    a = np.clip((field - speck * grain) * 3.0, 0, 1)
    a = np.maximum(a, (field > 0.62).astype(np.float32))
    a = cv2.GaussianBlur(a, (0, 0), 0.6)
    rim = np.clip(1 - np.abs(d - 1.0) * 2.5, 0, 1) * (n > 0.45) * edge_window(h, w, fade, 0.3)
    a = np.maximum(a, droplets(h, w, int(w * h / 9000), 1, 7, weight=rim + 1e-6))
    return a


def torn_strip(h, w, side, seed=0):
    """vertical paper scrap with a ragged inner edge"""
    rng = np.random.default_rng(seed)
    a = np.zeros((h, w), np.uint8)
    edge = np.cumsum(rng.normal(0, 2.2, h)).astype(np.float32)
    edge = cv2.GaussianBlur(edge.reshape(-1, 1), (0, 0), 3).ravel()
    edge = (edge - edge.min()) / (np.ptp(edge) + 1e-6) * w * 0.35 + w * 0.5
    edge += cv2.GaussianBlur(rng.normal(0, 1.0, h).astype(np.float32).reshape(-1, 1), (0, 0), 1.2).ravel()
    for y in range(h):
        x = int(edge[y])
        if side == "left":
            a[y, :x] = 255
        else:
            a[y, w - x:] = 255
    # ragged, diagonal-ish top and bottom ends
    xs = np.arange(w)
    for end, slope in (("top", 1), ("bottom", -1)):
        jag = cv2.GaussianBlur(rng.normal(0, 4, w).astype(np.float32).reshape(1, -1), (0, 0), 1.5).ravel()
        cut = (18 + slope * (xs - w / 2) * 0.5 + jag).clip(2, 60).astype(int)
        for x in xs:
            if end == "top":
                a[: cut[x], x] = 0
            else:
                a[h - cut[x]:, x] = 0
    a = cv2.GaussianBlur(a.astype(np.float32) / 255, (0, 0), 0.7)
    paper = fbm(h, w, base=8)
    rgb = CREAM[None, None, :] * (0.94 + 0.06 * paper[..., None])
    return np.concatenate([rgb, a[..., None] * 255], axis=-1)


def decor():
    # black flicks, top-left corner
    h, w = 520, 640
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    corner = np.exp(-((xx / 260) ** 2 + (yy / 240) ** 2))
    a = droplets(h, w, 120, 1, 8, weight=corner * edge_window(h, w, "br") + 1e-4)
    a = np.maximum(a, droplets(h, w, 700, 0.6, 2.2, weight=corner * edge_window(h, w, "br") + 1e-4))
    save(to_rgba(a, INK), "decor-ink-tl.webp")

    # cream speckles scattered over the whole panel (2:1, stretched to cover)
    h, w = 900, 1800
    n = fbm(h, w, base=3)
    weight = np.clip(n - 0.35, 0, 1) ** 2 + 0.002
    a = droplets(h, w, 420, 0.7, 5, weight=weight)
    save(to_rgba(a, CREAM), "decor-speckle.webp")

    # big spray cloud, bottom-right corner
    h, w = 620, 1100
    a = spray(h, w, cx=w * 0.88, cy=h * 1.0, rx=w * 0.5, ry=h * 0.58, fade="tl")
    a = np.maximum(a, spray(h, w, cx=w * 1.0, cy=h * 1.0, rx=w * 0.42, ry=h * 0.7, density=1.3, fade="tl"))
    a = np.maximum(a, spray(h, w, cx=w * 0.4, cy=h * 1.1, rx=w * 0.28, ry=h * 0.25, density=0.9, fade="tl"))
    save(to_rgba(a, CREAM), "decor-spray-br.webp")

    # smaller spray, bottom-left corner
    h, w = 380, 620
    a = spray(h, w, cx=w * 0.1, cy=h * 1.05, rx=w * 0.45, ry=h * 0.5, fade="tr")
    save(to_rgba(a, CREAM), "decor-spray-bl.webp")

    # light-orange splat behind "GOOD VIBES ONLY"
    h, w = 520, 520
    a = spray(h, w, cx=w * 0.5, cy=h * 0.5, rx=w * 0.3, ry=h * 0.26, grain=0.75)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    around = np.exp(-((xx - w / 2) ** 2 + (yy - h / 2) ** 2) / (2 * 150.0**2))
    a = np.maximum(a, droplets(h, w, 120, 1, 10, weight=around))
    save(to_rgba(a, np.array([236, 120, 62], np.float32)), "decor-splat-orange.webp")

    # torn paper scraps for the side edges
    save(torn_strip(420, 70, "left", seed=3), "decor-torn-left.webp")
    save(torn_strip(260, 60, "right", seed=5), "decor-torn-right.webp")


def main():
    os.makedirs(OUT, exist_ok=True)
    steps = {"title": title, "model": model, "decor": decor}
    todo = sys.argv[1:] or list(steps)
    for s in todo:
        print(s)
        steps[s]()


if __name__ == "__main__":
    main()
