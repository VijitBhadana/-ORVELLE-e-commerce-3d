#!/usr/bin/env python3
"""Build every image the storefront ships from the supplied video + five stills.

    python tools/build_assets.py            # frames + images
    python tools/build_assets.py --images   # images only

Follows the pipeline of ../tools/build_assets.py and ../scripts/extract.py:
ffmpeg -> PNG -> Pillow WebP (the local ffmpeg build has no WebP encoder).

Video  -> public/frames/hero/frame_001.webp ... (1280w, desktop)
          public/frames/hero-sm/frame_001.webp ... (720w, phones)
          + manifest.json in each folder (count + pattern)
Stills -> public/img/products/<slug>.webp (+ -sm, -top, -bottom detail crops)
          public/img/editorial/<slug>.webp (wide, watermark removed)
          public/img/film/<slug>.webp (single frames lifted from the film)

The generator left a small four-point sparkle bottom-right in the video and
in every still: frames are cleaned with ffmpeg delogo, stills with cv2.inpaint.
"""

import json
import os
import subprocess
import sys
import tempfile

import cv2
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# hero film (user-supplied 2026-11-19; replaced Men_fashion_animation_on_dummy_d1eafc6c.mp4).
# Beige studio backdrop with a vignette — flattened to the page's warm ivory, see flatten_backdrop()
VIDEO = os.path.join(ROOT, "men-ecoomerce.mp4")
PAGE_IVORY = np.array([230, 213, 189], np.float32)  # #E6D5BD, --color-ink in globals.css
PUBLIC = os.path.join(ROOT, "public")

# sparkle centre ~ (1160, 600) in the 1280x720 video
DELOGO = "delogo=x=1128:y=568:w=64:h=64"

STILLS = {
    "classic-white-navy": "Mannequin_wearing_shirt_and_pants_47904af3_2K.jpg",
    "sky-blue-beige": "Mannequin_wearing_shirt_and_pants_3b354ef1_2K.jpg",
    "black-grey": "Man_wearing_shirt_and_pants_40f04807_2K.jpg",
    "olive-cream": "Man_wearing_green_shirt_and_3bb15ea6_2K.jpg",
    "pink-charcoal": "Man_wearing_pink_shirt_7e1d9b6a_2K.jpg",
}

# 0-based source frames where each look is fully settled (see src/lib/heroFrames.ts)
FILM_STILLS = {
    "closeup": 2,
    "base": 44,
    "classic-white-navy": 78,
    "sky-blue-beige": 112,
    "black-grey": 146,
    "olive-cream": 184,
    "pink-charcoal": 228,
}


# page background (soft black #101010): photos' near-black backdrops are lifted to it so
# they sit seamlessly on the page instead of showing as darker rectangles
PAGE_BLACK = (16, 16, 16)


def to_page_black(im):
    """per-channel max with the page colour (CSS 'lighten'); idempotent"""
    if im.mode != "RGB":
        return im
    from PIL import ImageChops
    return ImageChops.lighter(im, Image.new("RGB", im.size, PAGE_BLACK))


def webp(im, path, q=84):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    to_page_black(im).save(path, "WEBP", quality=q, method=6)


def write_sequence(pngs, src_dir, name, width, q):
    out = os.path.join(PUBLIC, "frames", name)
    os.makedirs(out, exist_ok=True)
    for f in os.listdir(out):
        os.remove(os.path.join(out, f))
    for i, f in enumerate(pngs):
        im = Image.open(os.path.join(src_dir, f)).convert("RGB")
        if im.width != width:
            im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
        im.save(os.path.join(out, f"frame_{i + 1:03d}.webp"), "WEBP", quality=q, method=4)
    with open(os.path.join(out, "manifest.json"), "w") as fh:
        json.dump({"count": len(pngs), "width": width,
                   "pattern": f"/frames/{name}/frame_%03d.webp"}, fh)
    size = sum(os.path.getsize(os.path.join(out, f)) for f in os.listdir(out)) / 1e6
    print(f"frames/{name}: {len(pngs)} frames, {size:.1f} MB")


def _poly_basis(x, y, deg=4):
    return np.stack([x ** i * y ** j for i in range(deg + 1) for j in range(deg + 1 - i)], -1)


def flatten_backdrop(tmp, pngs):
    """Flat-field the film so its backdrop becomes exactly the page ivory.

    The studio backdrop is beige with a vignette (~#DCCBA9 centre, darker corners),
    so on the #E6D5BD page it would read as a box. We estimate the empty backdrop
    ("plate"): per-pixel median over the dressed part of the film (outfits only pass
    through the sides briefly), fitted with a smooth 2-D polynomial that skips the
    mannequin's column and the watermark corner. Every frame is then multiplied by
    ivory / plate — the backdrop lands on ivory, while the mannequin keeps its own
    shading and floor shadow (a ~5% warm-to-neutral shift, like re-lighting)."""
    def load(i, step=1):
        return np.asarray(Image.open(os.path.join(tmp, pngs[i])).convert("RGB"), np.float32)[::step, ::step]

    med = np.median(np.stack([load(i, 4) for i in range(60, len(pngs), 3)]), 0)
    h, w = med.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    keep = ~((xx * 4 > 430) & (xx * 4 < 850))  # mannequin column (x 481-796 at 1280w)
    keep &= ~((xx * 4 > 1080) & (yy * 4 > 540))  # watermark corner
    basis = _poly_basis(xx / w * 2 - 1, yy / h * 2 - 1)
    coef = [np.linalg.lstsq(basis[keep], med[..., c][keep], rcond=None)[0] for c in range(3)]

    H, W = load(0).shape[:2]
    yy, xx = np.mgrid[0:H, 0:W]
    full = _poly_basis(xx / W * 2 - 1, yy / H * 2 - 1)
    plate = np.stack([full @ coef[c] for c in range(3)], -1)
    gain = PAGE_IVORY / np.maximum(plate, 1)
    print(f"backdrop plate: centre {plate[H // 2, W // 2].round()} corner {plate[4, 4].round()} -> ivory")
    for i, name in enumerate(pngs):
        out = np.clip(load(i) * gain, 0, 255).round().astype(np.uint8)
        Image.fromarray(out).save(os.path.join(tmp, name))


# The film's mannequin has pale blonde hair; the user wants it black (2026-11-19).
# tools/hair_mask.png is the hair of frame HAIR_REF, drawn 4x over the box HAIR_BOX
# (top of the head: SAM with point prompts on the hair vs forehead/backdrop; the thin
# temple/sideburn strips: a band along the BiRefNet head outline, since SAM can't tell
# them from the forehead). The camera zooms out over frames 0..~35 and then holds
# still, so the mask is tracked: head-crop translation from HAIR_STATIC on, chained
# frame-to-frame affine (zoom) before that.
HAIR_REF, HAIR_STATIC = 149, 35
HAIR_BOX, HAIR_K = (560, 0, 720, 110), 4
HAIR_DARK = np.array([20, 17, 16], np.float32)  # deepest strand shadow
HAIR_LITE = np.array([78, 68, 60], np.float32)  # sheen on the brightest strands


def blacken_hair(tmp, pngs):
    from PIL import ImageFilter
    from scipy import ndimage

    m = np.asarray(Image.open(os.path.join(ROOT, "tools", "hair_mask.png")).convert("L")) > 127
    m = ndimage.binary_opening(ndimage.binary_fill_holes(ndimage.binary_closing(m, iterations=6)), iterations=3)
    soft = Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(HAIR_K))
    x0, y0, x1, y1 = HAIR_BOX
    load = lambda i: np.asarray(Image.open(os.path.join(tmp, pngs[i])).convert("RGB"))
    ref = load(HAIR_REF)
    H, W = ref.shape[:2]
    alpha = np.zeros((H, W), np.float32)
    alpha[y0:y1, x0:x1] = np.asarray(soft.resize((x1 - x0, y1 - y0), Image.LANCZOS), np.float32) / 255

    gray = lambda rgb: cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY).astype(np.float32) / 255
    crit = (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 200, 1e-6)
    ecc = lambda tpl, img, mode: cv2.findTransformECC(tpl, img, np.eye(2, 3, dtype=np.float32), mode, crit, None, 5)[1]
    # warps[i] maps reference-frame coordinates to frame i
    warps = [None] * len(pngs)
    hx0, hy0, hx1, hy1 = 540, 0, 740, 130  # head crop: the clothes change, the head doesn't
    g_ref = gray(ref)[hy0:hy1, hx0:hx1]
    for i in range(HAIR_STATIC, len(pngs)):
        warps[i] = ecc(g_ref, gray(load(i))[hy0:hy1, hx0:hx1], cv2.MOTION_TRANSLATION)
    small = lambda i: cv2.resize(gray(load(i)), None, fx=0.5, fy=0.5, interpolation=cv2.INTER_AREA)
    for i in range(HAIR_STATIC - 1, -1, -1):
        w = ecc(small(i + 1), small(i), cv2.MOTION_AFFINE)
        w[:, 2] *= 2
        warps[i] = (np.vstack([w, [0, 0, 1]]) @ np.vstack([warps[i + 1], [0, 0, 1]]))[:2].astype(np.float32)

    luma = np.array([0.299, 0.587, 0.114], np.float32)
    lr = ref.astype(np.float32) @ luma
    lo, hi = np.percentile(lr[alpha > 0.5], 3), np.percentile(lr[alpha > 0.5], 97)
    touched = 0
    for i, name in enumerate(pngs):
        a = cv2.warpAffine(alpha, warps[i], (W, H), flags=cv2.INTER_LINEAR)
        if a.max() < 0.01:
            continue  # head top above the frame (start of the zoom)
        f = load(i).astype(np.float32)
        t = np.clip((f @ luma - lo) / (hi - lo), 0, 1)[..., None] ** 1.4
        new = HAIR_DARK + t * (HAIR_LITE - HAIR_DARK)
        a = a[..., None]
        Image.fromarray(np.clip(a * new + (1 - a) * f, 0, 255).round().astype(np.uint8)).save(os.path.join(tmp, name))
        touched += 1
    print(f"hair: blackened in {touched} frames (zoom at frame 0: x{warps[0][0, 0]:.2f})")


def build_frames():
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", VIDEO, "-an",
                        "-vf", DELOGO, os.path.join(tmp, "f_%04d.png")], check=True)
        pngs = sorted(os.listdir(tmp))
        flatten_backdrop(tmp, pngs)
        blacken_hair(tmp, pngs)
        write_sequence(pngs, tmp, "hero", 1280, 82)
        write_sequence(pngs, tmp, "hero-sm", 720, 76)
        film = os.path.join(PUBLIC, "img", "film")
        for slug, idx in FILM_STILLS.items():
            webp(Image.open(os.path.join(tmp, pngs[idx])).convert("RGB"),
                 os.path.join(film, f"{slug}.webp"), 86)


def remove_sparkle(rgb):
    """Inpaint the small bright sparkle in the bottom-right corner of a still."""
    h, w = rgb.shape[:2]
    y0, x0 = int(h * 0.80), int(w * 0.88)
    region = cv2.cvtColor(rgb[y0:, x0:], cv2.COLOR_RGB2GRAY)
    bg = np.median(region)
    mask = (region > bg + 18).astype(np.uint8)
    n, labels, stats, _ = cv2.connectedComponentsWithStats(mask)
    full = np.zeros((h, w), np.uint8)
    for i in range(1, n):
        x, y, bw, bh, area = stats[i]
        if 40 < area < 6000 and bw < 120 and bh < 120:
            full[y0 + y:y0 + y + bh, x0 + x:x0 + x + bw] = 1
    if full.any():
        full = cv2.dilate(full, np.ones((15, 15), np.uint8))
        rgb = cv2.inpaint(rgb, full * 255, 9, cv2.INPAINT_TELEA)
    return rgb


def mannequin_box(rgb):
    """Bounding box of the figure: bright-ish pixels, ignoring the floor glow rows."""
    g = cv2.GaussianBlur(cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY), (0, 0), 3)
    h, w = g.shape
    mask = g > 45
    cols = mask[: int(h * 0.85)].sum(0)
    xs = np.flatnonzero(cols > h * 0.05)
    rows = mask[:, xs.min():xs.max() + 1].sum(1) if len(xs) else mask.sum(1)
    ys = np.flatnonzero(rows > 4)
    cx = int(np.average(np.arange(w), weights=cols + 1e-6))
    return cx, int(ys.min()), int(ys.max())


def crop_box(cx, cy, cw, ch, w, h):
    left = min(max(cx - cw // 2, 0), w - cw)
    top = min(max(cy - ch // 2, 0), h - ch)
    return (left, top, left + cw, top + ch)


def build_images():
    for slug, src in STILLS.items():
        rgb = np.array(Image.open(os.path.join(ROOT, src)).convert("RGB"))
        rgb = remove_sparkle(rgb)
        im = Image.fromarray(rgb)
        w, h = im.size
        cx, top, bottom = mannequin_box(rgb)
        fig = bottom - top
        print(f"{slug}: centre x={cx}, figure y={top}-{bottom}")

        # product card / PDP main: 4:5 portrait, full height
        ch = h
        cw = int(ch * 0.8)
        portrait = im.crop(crop_box(cx, h // 2, cw, ch, w, h))
        webp(portrait.resize((1080, 1350), Image.LANCZOS), f"{PUBLIC}/img/products/{slug}.webp", 86)
        webp(portrait.resize((540, 675), Image.LANCZOS), f"{PUBLIC}/img/products/{slug}-sm.webp", 82)

        # detail crops for the gallery (4:5)
        dh = int(fig * 0.42)
        dw = int(dh * 0.8)
        top_crop = im.crop(crop_box(cx, top + int(fig * 0.33), dw, dh, w, h))
        webp(top_crop.resize((1080, 1350), Image.LANCZOS), f"{PUBLIC}/img/products/{slug}-top.webp", 86)
        bot_crop = im.crop(crop_box(cx, top + int(fig * 0.70), dw, dh, w, h))
        webp(bot_crop.resize((1080, 1350), Image.LANCZOS), f"{PUBLIC}/img/products/{slug}-bottom.webp", 86)

        # wide editorial (whole still, cleaned) — mannequin sits wherever the shoot placed it
        wide = im.resize((1920, round(h * 1920 / w)), Image.LANCZOS)
        webp(wide, f"{PUBLIC}/img/editorial/{slug}.webp", 84)
        with open(f"{PUBLIC}/img/editorial/{slug}.json", "w") as fh:
            json.dump({"focusX": round(cx / w, 3)}, fh)

    # all five looks in a row — the black backdrops join seamlessly
    tiles = [Image.open(f"{PUBLIC}/img/products/{slug}.webp").resize((640, 800), Image.LANCZOS) for slug in STILLS]
    lineup = Image.new("RGB", (640 * len(tiles), 800))
    for i, t in enumerate(tiles):
        lineup.paste(t, (i * 640, 0))
    webp(lineup, f"{PUBLIC}/img/editorial/lineup.webp", 84)

    total = 0
    for dp, _, fs in os.walk(os.path.join(PUBLIC, "img")):
        total += sum(os.path.getsize(os.path.join(dp, f)) for f in fs)
    print(f"images: {total / 1e6:.1f} MB")


CUTOUT_SRC = os.path.join(ROOT, "cutouts-source")


def generate_cutout(slug):
    """Fallback when no supplied cutout exists: BiRefNet on a square crop of the
    cleaned still (a square keeps the model from squashing the figure, which is
    what left background trapped between arms and torso with isnet)."""
    from rembg import new_session, remove

    rgb = remove_sparkle(np.array(Image.open(os.path.join(ROOT, STILLS[slug])).convert("RGB")))
    cx, _, _ = mannequin_box(rgb)
    x0 = max(0, min(cx - 768, rgb.shape[1] - 1536))
    cut = remove(Image.fromarray(rgb[:, x0:x0 + 1536]), session=new_session("birefnet-general-lite"))
    cut.save(os.path.join(CUTOUT_SRC, f"{slug}.generated.png"))
    return cut


def build_cutouts():
    """Transparent mannequin cutouts for the outfit deck.

    Source order per look: cutouts-source/<slug>.png (supplied by the client),
    then cutouts-source/<slug>.generated.png, then a fresh BiRefNet cutout.
    Each is trimmed to the figure so the deck can contain-fit it.
    """
    out_dir = os.path.join(PUBLIC, "img", "cutouts")
    os.makedirs(out_dir, exist_ok=True)
    os.makedirs(CUTOUT_SRC, exist_ok=True)
    for slug in STILLS:
        supplied = os.path.join(CUTOUT_SRC, f"{slug}.png")
        generated = os.path.join(CUTOUT_SRC, f"{slug}.generated.png")
        if os.path.exists(supplied):
            cut, origin = Image.open(supplied).convert("RGBA"), "supplied"
        elif os.path.exists(generated):
            cut, origin = Image.open(generated).convert("RGBA"), "generated"
        else:
            cut, origin = generate_cutout(slug), "generated (new)"
        # drop stray specks that aren't attached to the figure or its stand
        alpha = np.array(cut.getchannel("A"))
        n, labels, stats, _ = cv2.connectedComponentsWithStats((alpha > 24).astype(np.uint8))
        if n > 2:
            biggest = stats[1:, cv2.CC_STAT_AREA].max()
            keep = np.isin(labels, [i for i in range(1, n) if stats[i, cv2.CC_STAT_AREA] >= biggest * 0.01])
            keep = cv2.dilate(keep.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)
            cut.putalpha(Image.fromarray(np.where(keep, alpha, 0).astype(np.uint8)))
        x0, y0, x1, y1 = cut.getbbox()
        pad = 24
        cut = cut.crop((max(0, x0 - pad), max(0, y0 - pad), min(cut.width, x1 + pad), min(cut.height, y1 + pad)))
        big = cut.copy()
        big.thumbnail((1000, 1400), Image.LANCZOS)
        big.save(os.path.join(out_dir, f"{slug}.webp"), "WEBP", quality=88, alpha_quality=95, method=6)
        sm = cut.copy()
        sm.thumbnail((360, 520), Image.LANCZOS)
        sm.save(os.path.join(out_dir, f"{slug}-sm.webp"), "WEBP", quality=84, alpha_quality=92, method=6)
        print(f"cutout {slug}: {big.size} ({origin})")


if __name__ == "__main__":
    if "--cutouts" in sys.argv:
        build_cutouts()
        sys.exit()
    if "--frames" in sys.argv:
        build_frames()
        sys.exit()
    if "--images" not in sys.argv:
        build_frames()
    build_images()
    build_cutouts()
