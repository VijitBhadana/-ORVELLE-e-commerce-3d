# ORVELLE — men's fashion storefront (front-end only)

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Framer Motion · Lenis · Lucide.
No backend: cart, wishlist, demo login, checkout and orders live in LocalStorage.

```bash
npm install
npm run dev        # http://localhost:4210
npm run build && npm start
```

## Hero film (scroll-scrubbed, not a video)

`Men_fashion_animation_on_dummy_d1eafc6c.mp4` (10 s, 24 fps) is turned into 240 WebP
frames by `python tools/build_assets.py` → `public/frames/hero/` (1280 px) and
`public/frames/hero-sm/` (720 px, used on data-saver connections). The same script
builds the product crops, editorial images and the five-look lineup from the five
mannequin stills, and removes the generator's sparkle watermark.

- `src/lib/heroFrames.ts` — frame mapping: which frames show the close-up / zoom-out
  and each outfit, and how much scroll each segment gets (`scroll` ranges are editable).
- `src/lib/frameSequence.ts` — progressive loading, sliding decode window,
  ImageBitmap with `<img>` fallback, canvas drawing.
- `src/components/home/HeroScroll.tsx` — pinned stage; the frame is a pure function of
  scroll position, so scrolling up reverses the outfit changes.

## Smooth scrolling

`src/components/providers/SmoothScroll.tsx` runs Lenis inside Framer Motion's frame loop,
so Lenis, the parallax and the hero canvas share one requestAnimationFrame.
`src/lib/useScrollProgress.ts` keeps scroll-linked styles on that JS loop (Framer's native
ScrollTimeline acceleration mapped opacity ranges incorrectly here). Reduced-motion users
get native scrolling and no parallax.

## Where to edit

- Brand name, contact details, site copy, delivery/returns text: `src/lib/brand.ts`
- Products, prices, stock, fabric/care placeholders: `src/lib/products.ts`
- Demo coupons (`WELCOME10`, `STYLE500`, `FREESHIP`): `src/lib/store.tsx`

"ORVELLE", contact details, fabric specs, size-guide measurements and policies are placeholders.
