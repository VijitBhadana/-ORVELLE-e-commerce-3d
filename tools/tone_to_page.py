#!/usr/bin/env python3
"""Lift the near-black backdrop of the already-built photos to the page colour.

    python tools/tone_to_page.py

build_assets.py now does this on every save; this script applies the same
per-channel max (#101010) in place to public/img/{products,editorial,film} so the
photos don't have to be rebuilt from the source video. Safe to run repeatedly.
Hero frames are handled at draw time in src/lib/frameSequence.ts.
"""

import glob
import os

from PIL import Image, ImageChops

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "img")
PAGE_BLACK = (16, 16, 16)

n = 0
for folder in ("products", "editorial", "film"):
    for path in glob.glob(os.path.join(ROOT, folder, "*.webp")):
        im = Image.open(path)
        im.load()
        if im.mode != "RGB":
            continue
        lifted = ImageChops.lighter(im, Image.new("RGB", im.size, PAGE_BLACK))
        if ImageChops.difference(im, lifted).getbbox() is None:
            continue  # already at the page colour
        lifted.save(path, "WEBP", quality=88, method=6)
        n += 1
print(f"lifted {n} photos to #101010")
