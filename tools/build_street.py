#!/usr/bin/env python3
"""Assets for the "street drop" section that follows the hero (StreetDrop.tsx).

    python tools/build_street.py            # frames + cut-outs
    python tools/build_street.py --frames   # frames only
    python tools/build_street.py --cutouts  # cut-outs only (BiRefNet for the figure, ~1 min)

Video  men-glass-after-hero.mp4 (5 s, 24 fps, 120 frames)
       -> public/frames/street/frame_001.webp ... (1280w) + street-sm (720w) + manifest.json
       Frame 0 is a stray preview of the finished poster, so it is dropped. The sparkle
       watermark is removed with the same delogo box as the hero film, and the paper
       backdrop is flattened to the page ivory (#E6D5BD) using the empty opening frames
       as the plate (blurred, so the paper grain survives but its tint/vignette doesn't).
Stills men-glass.jpg     -> public/img/street/man.webp (transparent figure)
       man-element-2.jpg -> public/img/street/<element>.webp (transparent stickers)
       Used by the phone layout, where a 16:9 film would be too small.
"""

import json
import os
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC = os.path.join(ROOT, "public")
VIDEO = os.path.join(ROOT, "men-glass-after-hero.mp4")
DELOGO = "delogo=x=1128:y=568:w=64:h=64"
IVORY = np.array([230, 213, 189], np.float32)
PAPER = np.array([235, 214, 189], np.float32)  # element sheet backdrop

# boxes on man-element-2.jpg (2752x1536), found by connected components
ELEMENTS = {
    "style-note": (2071, 72, 2705, 815),
    "be-you": (1059, 77, 1948, 788),
    "good-outfits": (149, 685, 760, 1473),
    "smiley": (906, 838, 1382, 1450),
    "crown": (1495, 762, 1894, 1141),
    "globe": (2337, 1120, 2665, 1446),
    "star": (1953, 701, 2126, 868),
    "cross": (905, 611, 1050, 757),
    "brush": (2062, 827, 2362, 1083),
    "splat": (0, 1259, 262, 1536),
    "barcode": (1723, 1125, 2274, 1468),
}


# Story beats in the film (0-based, preview frame already dropped). In the film the
# left-hand stickers start popping in (31) before the man has stopped moving (~40),
# so there's no frame of "just the man". We re-cut it into three clean acts:
#   act 1  0..43   the man slides in and settles — stickers erased (paper painted back)
#   act 2          stickers of 31..43 laid over the settled man (frame 43)
#   act 3  44..    the film as-is: right-hand stickers arrive (all set by 83)
SETTLE, STICKERS_FROM = 43, 31


def _sticker_tools(flat):
    """Split a frame into the man+brush (the biggest connected shape) and the stickers
    (separate shapes near where the stickers end up in the finished poster)."""
    from scipy import ndimage

    def shapes(fr, T=40):
        m = ndimage.binary_closing(np.sqrt(((fr.astype(np.float32) - IVORY) ** 2).sum(-1)) > T, iterations=2)
        lab, n = ndimage.label(m)
        if not n:
            return m, lab, np.zeros_like(m)
        sizes = ndimage.sum(m, lab, range(1, n + 1))
        return m, lab, lab == (1 + int(np.argmax(sizes)))

    m, _, big = shapes(flat[83])
    near = ndimage.binary_dilation(m & ~ndimage.binary_dilation(big, iterations=2), iterations=25)
    W = flat[0].shape[1]
    near[:, W // 2:] = False  # act 1/2 only concern the left-hand stickers

    def stickers(fr):
        m, lab, big = shapes(fr)
        cand = m & ~ndimage.binary_dilation(big, iterations=3)
        ids = np.unique(lab[cand & near])
        return ndimage.binary_dilation(np.isin(lab, ids[ids > 0]) & cand, iterations=3)

    return stickers


def recut(flat):
    stickers = _sticker_tools(flat)
    paper = flat[2]  # empty paper (same grain as every frame)

    def clean(fr):
        out = fr.copy()
        e = stickers(fr)
        out[e] = paper[e]
        return out

    settled = clean(flat[SETTLE])
    act1 = list(flat[:30]) + [clean(flat[i]) for i in range(30, SETTLE + 1)]
    act2 = []
    for j in range(STICKERS_FROM, SETTLE + 1):
        out = settled.copy()
        e = stickers(flat[j])
        out[e] = flat[j][e]
        act2.append(out)
    act3 = list(flat[SETTLE + 1:])
    print(f"re-cut: act1 0..{len(act1) - 1}, act2 ..{len(act1) + len(act2) - 1}, act3 ..{len(act1) + len(act2) + len(act3) - 1}")
    return act1 + act2 + act3


def layered(seq):
    """Split each frame into the man + brush (top half, opaque) and the stickers
    (bottom half, transparent), so the page can push the left-hand stickers left
    and the right-hand ones right on wide screens instead of leaving the sides
    empty (StreetDrop → FrameSequence `spread`). From the settled frame on, the
    man is frozen on that frame (the raw film keeps wobbling slightly) and the
    stickers are whatever differs from it, un-mixed from it at soft edges."""
    from scipy import ndimage

    B = seq[SETTLE].astype(np.float32)
    H, W = B.shape[:2]
    m = ndimage.binary_closing(np.sqrt(((B - IVORY) ** 2).sum(-1)) > 40, iterations=2)
    lab, n = ndimage.label(m)
    man = lab == 1 + int(np.argmax(ndimage.sum(m, lab, range(1, n + 1))))
    man = ndimage.binary_fill_holes(man)
    manD = ndimage.binary_dilation(man, iterations=5)
    band = ndimage.binary_dilation(man, iterations=30)
    LEFT_SET = SETTLE + (SETTLE - STICKERS_FROM + 1)  # last frame of act 2
    ALL_SET = 97  # every sticker incl. "Shop now" has landed (StreetDrop F_RIGHT = 96)
    lo, hi = 20, 48
    out = []
    for i, fr in enumerate(seq):
        layer = np.zeros((H, W, 4), np.uint8)
        if i <= SETTLE:  # act 1: no stickers yet
            out.append((fr, layer))
            continue
        C = fr.astype(np.float32)
        d = np.sqrt(((C - B) ** 2).sum(-1))
        # outside the man: any change is a sticker; over the man/brush only solid
        # changes thicker than the film's own wobble (thin edge slivers) count
        over = ndimage.binary_opening((d > 55) & manD, iterations=2)
        st = ((d > lo) & ~manD) | over
        st = ndimage.binary_closing(st, iterations=2) & (d > lo * 0.6)
        lab, n = ndimage.label(ndimage.binary_dilation(st, iterations=1))
        if n:
            ids = np.arange(1, n + 1)
            size = ndimage.sum(st, lab, ids)
            outside = ndimage.sum(st & ~manD, lab, ids)
            keep = ids[(size >= 24) & (outside >= 12)]  # specks and wobble blobs inside the man go
            if i > LEFT_SET:
                # the raw film's brush frays a little past the frozen one: orange shapes
                # hugging the brush are brush, not stickers (the landed left-hand
                # stickers, which include an orange underline, are restored below)
                orange = (C[..., 0] - C[..., 2] > 80) & (C[..., 0] > 120)
                frag = [k for k in keep
                        if ndimage.sum(orange & st, lab, k) > 0.3 * size[k - 1]
                        and ndimage.sum(band & st, lab, k) > 0.6 * size[k - 1]]
                keep = np.setdiff1d(keep, frag)
            st = np.isin(lab, keep) & st
        # solid stickers (the "Shop now" pill, the tape) that cross the orange brush:
        # where their orange matches the brush nothing "changed", so fill them out to
        # their convex shape there — otherwise they'd keep a bite when pushed aside
        solid = np.zeros_like(st)
        from skimage.morphology import convex_hull_image
        lab2, n2 = ndimage.label(ndimage.binary_closing(st, iterations=3))
        for k in range(1, n2 + 1):
            c = lab2 == k
            if c.sum() < 2000 or not (c & manD).any():
                continue
            ys, xs = np.nonzero(c)
            y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
            hull = convex_hull_image(c[y0:y1, x0:x1])
            if c[y0:y1, x0:x1].sum() / max(1, hull.sum()) > 0.8:
                solid[y0:y1, x0:x1] |= ndimage.binary_erosion(hull, iterations=1) & manD[y0:y1, x0:x1]
        a = np.clip((d - lo) / (hi - lo), 0, 1)
        a = np.where(solid, 1.0, a * st)[..., None]
        F = np.where(a > 0, (C - (1 - a) * B) / np.maximum(a, 0.08), 0)
        layer[..., :3] = np.clip(F, 0, 255).round()
        layer[..., 3] = (a[..., 0] * 255).round()
        if i == LEFT_SET:
            # wide enough to also wipe the raw film's copy of them, which drifts a pixel or two
            held, hold = layer.copy(), ndimage.binary_dilation(st, iterations=8)
        elif i > LEFT_SET:
            layer[hold] = held[hold]  # the landed left-hand stickers stay put (no flicker)
        if i == ALL_SET:
            final = layer.copy()
        elif i > ALL_SET:
            layer = final  # everything has landed: hold the poster still
        out.append((seq[SETTLE], layer))
    # one-frame flashes (a fray of brush read as a sticker for a single frame) go:
    # sticker pixels that are in neither the previous nor the next frame
    seen = [lay[..., 3] > 0 for _, lay in out]
    for i in range(LEFT_SET + 1, ALL_SET):
        flash = seen[i] & ~ndimage.binary_dilation(seen[i - 1] | seen[i + 1], iterations=2)
        out[i][1][flash] = 0
    return out


def frames():
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", VIDEO, "-an", "-vf", DELOGO,
                        os.path.join(tmp, "f_%04d.png")], check=True)
        pngs = sorted(os.listdir(tmp))[1:]  # drop the stray preview frame
        load = lambda f: np.asarray(Image.open(os.path.join(tmp, f)).convert("RGB"), np.float32)
        plate = np.median(np.stack([load(f) for f in pngs[1:9]]), 0)  # empty paper
        plate = np.asarray(Image.fromarray(plate.round().astype(np.uint8)).filter(ImageFilter.GaussianBlur(6)), np.float32)
        gain = IVORY / np.maximum(plate, 1)
        flat = [np.clip(load(f) * gain, 0, 255).round().astype(np.uint8) for f in pngs]
        seq = layered(recut(flat))
        for name, width, q in (("street", 1280, 84), ("street-sm", 720, 78)):
            out = os.path.join(PUBLIC, "frames", name)
            os.makedirs(out, exist_ok=True)
            for f in os.listdir(out):
                os.remove(os.path.join(out, f))
            for i, (fr, layer) in enumerate(seq):
                # stacked: film (opaque) on top, its stickers (transparent) below
                top = Image.fromarray(fr).convert("RGBA")
                bot = Image.fromarray(layer, "RGBA")
                im = Image.new("RGBA", (top.width, top.height * 2))
                im.paste(top, (0, 0))
                im.paste(bot, (0, top.height))
                if im.width != width:
                    im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
                im.save(os.path.join(out, f"frame_{i + 1:03d}.webp"), "WEBP", quality=q, alpha_quality=90, method=4)
            with open(os.path.join(out, "manifest.json"), "w") as fh:
                json.dump({"count": len(seq), "width": width, "stacked": True, "pattern": f"/frames/{name}/frame_%03d.webp"}, fh)
            size = sum(os.path.getsize(os.path.join(out, f)) for f in os.listdir(out)) / 1e6
            print(f"frames/{name}: {len(seq)} frames, {size:.1f} MB")


def trim(im, pad=12):
    box = im.split()[3].point(lambda v: 255 if v > 8 else 0).getbbox()
    if not box:
        return im
    x0, y0, x1, y1 = box
    return im.crop((max(0, x0 - pad), max(0, y0 - pad), min(im.width, x1 + pad), min(im.height, y1 + pad)))


def key_out(rgb, bg, lo=16, hi=46):
    """alpha from colour distance to the flat paper, then un-mix the paper from soft edges"""
    a = np.clip((np.sqrt(((rgb - bg) ** 2).sum(-1, keepdims=True)) - lo) / (hi - lo), 0, 1)
    fixed = (rgb - (1 - a) * bg) / np.maximum(a, 0.1)
    rgb = np.where((a > 0) & (a < 1), fixed, rgb)
    return Image.fromarray(np.concatenate([np.clip(rgb, 0, 255), a * 255], -1).round().astype(np.uint8), "RGBA")


def drop_specks(im, keep=0.06):
    """remove neighbouring stickers' fragments that fell inside a box: keep alpha
    components at least `keep` x the largest one"""
    from scipy import ndimage
    a = np.asarray(im.split()[3]) > 24
    lab, n = ndimage.label(ndimage.binary_dilation(a, iterations=6))
    if n < 2:
        return im
    sizes = ndimage.sum(a, lab, range(1, n + 1))
    good = np.isin(lab, 1 + np.flatnonzero(sizes >= sizes.max() * keep))
    arr = np.asarray(im).copy()
    arr[..., 3] = np.where(good, arr[..., 3], 0)
    return Image.fromarray(arr, "RGBA")


def cutouts():
    out = os.path.join(PUBLIC, "img", "street")
    os.makedirs(out, exist_ok=True)
    sheet = np.asarray(Image.open(os.path.join(ROOT, "man-element-2.jpg")).convert("RGB"), np.float32)
    for name, (x0, y0, x1, y1) in ELEMENTS.items():
        el = trim(drop_specks(key_out(sheet[y0:y1, x0:x1], PAPER), 0.15 if name in ('be-you', 'style-note') else 0.06))
        el.thumbnail((640, 640), Image.LANCZOS)
        el.save(os.path.join(out, f"{name}.webp"), "WEBP", quality=88, alpha_quality=92, method=6)
        print(f"img/street/{name}.webp {el.size}")

    from rembg import new_session, remove
    photo = Image.open(os.path.join(ROOT, "men-glass.jpg")).convert("RGB")
    s = photo.height  # square crop around the figure keeps BiRefNet from squashing it
    x0 = max(0, min(photo.width // 2 - s // 2 + 120, photo.width - s))
    man = remove(photo.crop((x0, 0, x0 + s, s)), session=new_session("birefnet-general-lite")).convert("RGBA")
    man = trim(man, pad=4)
    man.thumbnail((1100, 1100), Image.LANCZOS)
    man.save(os.path.join(out, "man.webp"), "WEBP", quality=88, alpha_quality=92, method=6)
    print(f"img/street/man.webp {man.size}")


if __name__ == "__main__":
    args = sys.argv[1:]
    if not args or "--frames" in args:
        frames()
    if not args or "--cutouts" in args:
        cutouts()
