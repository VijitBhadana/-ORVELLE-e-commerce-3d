#!/usr/bin/env python3
"""Light theme: cut the mannequin out of every photo / film frame so it stands
directly on the warm-ivory page instead of inside a black studio box.

    python tools/matte_assets.py          # product + editorial stills, BiRefNet (~20 min on CPU)

Run build_assets.py --images first (it produces the dark-backdrop originals); this
overwrites them with transparent WebPs. The hero film needs no cut-out: its backdrop
is already beige and build_assets.py flattens it to the page ivory.

Edges: the studio backdrop is near-black, so semi-transparent edge pixels carry
a dark fringe. They are "un-mixed" from black (C = (C - (1-a)·B) / a) so the
outline doesn't show as a dark halo on the light page.
"""

import glob
import os

import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public")


def decontaminate(rgba, bg=12):
    a = rgba[..., 3:4].astype(np.float32) / 255.0
    a[a < 0.035] = 0.0  # faint backdrop noise → fully clear
    rgb = rgba[..., :3].astype(np.float32)
    part = (a > 0) & (a < 1)
    fixed = (rgb - (1 - a) * bg) / np.maximum(a, 0.08)
    rgb = np.where(part, fixed, rgb)
    out = np.concatenate([np.clip(rgb, 0, 255), a * 255], axis=-1)
    return Image.fromarray(out.round().astype(np.uint8), "RGBA")


def cut(im, session, bg=12, erode=3):
    """matte → pull the edge in ~1px (the film has a dark rim light around the figure)
    → soften → un-mix the black backdrop from the remaining edge pixels"""
    from PIL import ImageFilter
    from rembg import remove
    rgba = remove(im.convert("RGB"), session=session).convert("RGBA")
    alpha = rgba.split()[3]
    if erode:
        alpha = alpha.filter(ImageFilter.MinFilter(erode)).filter(ImageFilter.GaussianBlur(0.7))
    rgba.putalpha(alpha)
    return decontaminate(np.array(rgba), bg)


def save(im, path, q=86):
    im.save(path, "WEBP", quality=q, alpha_quality=90, method=5)


def photos():
    from rembg import new_session
    fine = new_session("birefnet-general-lite")  # cleanest edges, ~40 s an image on CPU

    img = os.path.join(ROOT, "img")
    jobs = []
    for f in sorted(glob.glob(os.path.join(img, "products", "*.webp"))):
        if f.endswith("-sm.webp"):
            continue  # derived from the full-size cut below
        jobs.append((f, fine))  # isnet faded light trousers in the detail crops
    jobs += [(f, fine) for f in sorted(glob.glob(os.path.join(img, "editorial", "*.webp")))]
    for n, (f, session) in enumerate(jobs, 1):
        im = Image.open(f)
        im.load()
        if im.mode == "RGBA":
            print(f"skip (already cut) {os.path.relpath(f, img)}", flush=True)
            continue
        out = cut(im, session, bg=16)  # stills were lifted to #101010 earlier
        save(out, f)
        if "products" in f and not f.endswith(("-top.webp", "-bottom.webp")):
            sm = out.resize((540, round(out.height * 540 / out.width)), Image.LANCZOS)
            save(sm, f.replace(".webp", "-sm.webp"), 82)
        print(f"photos {n}/{len(jobs)} {os.path.relpath(f, img)}", flush=True)


if __name__ == "__main__":
    photos()
