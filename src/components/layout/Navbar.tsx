"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { BRAND, NAV_LINKS } from "@/lib/brand";
import { useStore } from "@/lib/store";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import Logo from "./Logo";

/*
 * Navbar palette, by area: warm ivory ~45% (logo + links), soft black ~30% (the slanted
 * utility panel), burnt orange ~25% (announcement strip + bag button).
 * Token names: `ink` = ivory, `fg` = soft black, `gold` = burnt orange.
 * Height: 28px strip + 64px bar (80px from md) at the top of the page; once scrolled the bar
 * slides up over the strip so only the 64px / 80px bar shows — sticky offsets elsewhere
 * (shop filter bar: top-16 / md:top-20) match the scrolled height.
 */

/** the black panel's left edge leans in by this much */
const SLANT = "[clip-path:polygon(28px_0,100%_0,100%_100%,0_100%)] md:[clip-path:polygon(40px_0,100%_0,100%_100%,0_100%)]";

export default function Navbar() {
  const pathname = usePathname();
  const { cartCount, wishlist, user, setCartOpen, setSearchOpen, content, hydrated } = useStore();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { lock } = useSmoothScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    const s = y > 40;
    if (s !== scrolled) setScrolled(s);
  });

  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    lock(true);
    return () => lock(false);
  }, [menuOpen, lock]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const bagCount = hydrated ? cartCount : 0;

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50">
        {/* ---- orange announcement strip: sits still behind the bar; on scroll the bar slides up over it ---- */}
        <div aria-hidden={scrolled} className="absolute inset-x-0 top-0 z-0 flex h-7 items-center overflow-hidden bg-gold text-ink">
          <p className="hidden w-full truncate px-6 text-center text-[11px] font-bold uppercase tracking-[0.18em] md:block">{content.announcement}</p>
          <div className="flex w-max md:hidden" aria-label={content.announcement}>
            <div aria-hidden className="marquee flex shrink-0 motion-reduce:animate-none">
              {[0, 1].map((k) => (
                <span key={k} className="shrink-0 whitespace-nowrap pr-10 text-[10px] font-bold uppercase tracking-[0.18em]">
                  {content.announcement} <span className="px-3">✦</span> {content.announcement} <span className="pl-3">✦</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ---- main bar: ivory left, black slanted right; starts below the strip, slides up over it on scroll ---- */}
        <motion.nav
          initial={false}
          animate={{ y: scrolled ? 0 : 28 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className={`relative z-10 flex h-16 border-b border-fg/15 bg-ink transition-shadow duration-500 md:h-20 ${scrolled ? "shadow-[0_14px_30px_-20px_rgba(16,16,16,0.55)]" : ""}`}
          aria-label="Main"
        >
          <div className="flex min-w-0 flex-1 items-center gap-10 pl-3 pr-4 sm:pl-6 xl:pl-10 2xl:gap-14">
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                className="grid h-10 w-10 place-items-center rounded-full text-fg transition-colors hover:bg-fg hover:text-ink xl:hidden"
                onClick={() => setMenuOpen((o) => !o)}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
              >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <Link href="/" aria-label={`${BRAND.name} home`}>
                <Logo className="text-fg" />
              </Link>
            </div>

            <ul className="hidden items-center gap-6 xl:flex 2xl:gap-9">
              {NAV_LINKS.map((l) => {
                const active = isActive(l.href);
                return (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      aria-current={active ? "page" : undefined}
                      className={`label relative whitespace-nowrap py-2 transition-colors duration-300 hover:text-gold ${active ? "text-gold" : "text-fg/75"}`}
                    >
                      {l.label}
                      {/* active marker: a small orange bar under the label */}
                      <span
                        className={`absolute -bottom-0.5 left-0 h-[3px] rounded-full bg-gold transition-all duration-500 ${active ? "w-full opacity-100" : "w-0 opacity-0"}`}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div
            className={`flex w-[44%] shrink-0 items-center justify-end gap-0.5 bg-fg pl-9 pr-3 text-ink sm:w-[42%] sm:gap-1.5 sm:pr-5 md:pl-14 xl:w-[34%] xl:pr-8 2xl:w-[38%] 2xl:pr-10 ${SLANT}`}
          >
            {/* search: a field on wide screens, an icon on small ones */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="mr-auto hidden h-10 min-w-0 flex-1 items-center gap-3 rounded-full border border-ink/20 px-4 text-left text-sm text-ink/55 transition-colors hover:border-gold hover:text-ink md:flex md:max-w-[340px]"
            >
              <Search size={16} strokeWidth={1.8} className="shrink-0 text-gold" />
              <span className="truncate 2xl:hidden">Search</span>
              <span className="hidden truncate 2xl:inline">Search looks, colours…</span>
            </button>
            <IconBtn label="Search" onClick={() => setSearchOpen(true)} display="inline-flex md:hidden">
              <Search size={18} strokeWidth={1.7} />
            </IconBtn>
            {/* account + wishlist live in the menu on phones */}
            <IconBtn label={user ? "My account" : "Sign in"} href={user ? "/account" : "/login"} display="hidden sm:inline-flex">
              <User size={18} strokeWidth={1.7} />
            </IconBtn>
            <IconBtn label="Wishlist" href="/wishlist" count={hydrated ? wishlist.length : 0} display="hidden sm:inline-flex">
              <Heart size={18} strokeWidth={1.7} />
            </IconBtn>

            {/* orange bag button */}
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label={`Shopping bag${bagCount ? `, ${bagCount} item${bagCount === 1 ? "" : "s"}` : ""}`}
              className="ml-1 inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-gold px-3.5 text-ink transition-colors duration-300 hover:bg-ink hover:text-fg sm:ml-2 sm:px-5"
            >
              <motion.span
                key={bagCount}
                initial={bagCount ? { scale: 1.35 } : false}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 14 }}
                className="inline-flex"
              >
                <ShoppingBag size={17} strokeWidth={1.8} />
              </motion.span>
              <span className="label hidden sm:inline">Bag</span>
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-fg px-1 text-[0.65rem] font-bold text-ink">{bagCount}</span>
            </button>
          </div>
        </motion.nav>
      </header>

      {/* ---- mobile / tablet menu: black sheet, ivory type, orange active ---- */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-40 flex flex-col bg-fg px-6 pt-32 pb-10 text-ink md:pt-36 xl:hidden"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <ul className="flex flex-col gap-1">
              {NAV_LINKS.map((l, i) => (
                <motion.li key={l.href} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
                  <Link
                    href={l.href}
                    className={`display flex items-center gap-4 py-1.5 text-[clamp(40px,7vw,80px)] transition-colors hover:text-gold ${isActive(l.href) ? "text-gold" : "text-ink"}`}
                  >
                    {isActive(l.href) && <span className="h-3 w-3 shrink-0 rounded-full bg-gold" />}
                    {l.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
            <div className="mt-auto grid grid-cols-2 gap-3 border-t border-ink/15 pt-6">
              <Link
                href={user ? "/account" : "/login"}
                className="label inline-flex h-11 items-center justify-center gap-2 rounded-full border border-ink/25 text-ink transition-colors hover:border-gold hover:text-gold"
              >
                <User size={14} /> {user ? "Account" : "Sign in"}
              </Link>
              <Link
                href="/wishlist"
                className="label inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gold text-ink transition-colors hover:bg-ink hover:text-fg"
              >
                <Heart size={14} /> Wishlist
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/** ivory icon on the black panel; orange count badge */
function IconBtn({
  children, label, href, onClick, count = 0, display = "inline-flex",
}: {
  children: React.ReactNode; label: string; href?: string; onClick?: () => void; count?: number;
  /** display classes, passed whole so `hidden` never competes with a default `inline-flex` */
  display?: string;
}) {
  const inner = (
    <>
      {children}
      {count > 0 && (
        <span className="absolute top-0.5 right-0 grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[0.6rem] font-bold text-ink">{count}</span>
      )}
    </>
  );
  const cls = `relative ${display} h-10 w-10 items-center justify-center rounded-full text-ink/85 transition-colors hover:bg-ink/10 hover:text-gold`;
  return href ? (
    <Link href={href} aria-label={label} className={cls}>
      {inner}
    </Link>
  ) : (
    <button type="button" aria-label={label} onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}
