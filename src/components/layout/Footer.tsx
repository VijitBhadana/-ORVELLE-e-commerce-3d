"use client";

import Link from "next/link";
import { ArrowUp, Mail, MapPin, Phone, Send } from "lucide-react";
import { useState } from "react";
import { BRAND } from "@/lib/brand";
import { useStore } from "@/lib/store";
import { readLS, writeLS } from "@/lib/storage";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import Reveal from "@/components/ui/Reveal";

/*
 * Footer palette: a soft-black panel floating on the warm-ivory page, a burnt-orange
 * newsletter card, ivory type. Remember the token names: `ink` = ivory, `fg` = soft black,
 * `gold` = burnt orange (text-white would be soft black here, so it is not used).
 */

const COLS = [
  {
    title: "Quick links",
    links: [
      ["Home", "/"], ["Shop", "/shop"], ["New Arrivals", "/new-arrivals"], ["About Us", "/about"], ["Contact Us", "/contact"],
    ],
  },
  {
    title: "Shop",
    links: [
      ["The Office Edit", "/collections#office-edit"], ["Weekend Ease", "/collections#weekend-ease"], ["After Hours", "/collections#after-hours"], ["All looks", "/shop"], ["Wishlist", "/wishlist"],
    ],
  },
  {
    title: "Customer care",
    links: [
      ["My account", "/account"], ["Order history", "/account#orders"], ["Shopping bag", "/cart"], ["Delivery & returns", "/contact#help"],
    ],
  },
] as const;

const SOCIAL_PATHS: Record<string, string> = {
  Instagram: "M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm5 5a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6zm5.5-3a1 1 0 100 2 1 1 0 000-2z",
  Pinterest: "M12 2a10 10 0 00-3.6 19.3c-.1-.8-.2-2 0-2.9l1.2-5s-.3-.6-.3-1.5c0-1.4.8-2.5 1.8-2.5.9 0 1.3.7 1.3 1.4 0 .9-.6 2.2-.9 3.4-.2 1 .5 1.9 1.6 1.9 1.9 0 3.3-2 3.3-4.9 0-2.6-1.8-4.4-4.5-4.4-3 0-4.8 2.3-4.8 4.6 0 .9.4 1.9.8 2.4.1.1.1.2.1.3l-.3 1.2c0 .2-.2.2-.4.1-1.4-.6-2.2-2.6-2.2-4.2 0-3.4 2.5-6.6 7.2-6.6 3.8 0 6.7 2.7 6.7 6.3 0 3.8-2.4 6.8-5.7 6.8-1.1 0-2.2-.6-2.5-1.3l-.7 2.6c-.2 1-.9 2.2-1.4 2.9A10 10 0 1012 2z",
  X: "M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L2 3h6.4l4.4 5.8L17.8 3zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5z",
  YouTube: "M23 7.2a3 3 0 00-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 001 7.2 31 31 0 00.5 12a31 31 0 00.5 4.8 3 3 0 002.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 002.1-2.1 31 31 0 00.5-4.8 31 31 0 00-.5-4.8zM9.7 15V9l5.8 3-5.8 3z",
};

export default function Footer() {
  const { toast } = useStore();
  const { scrollTo } = useSmoothScroll();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const subscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    const list = readLS<string[]>("newsletter", []);
    if (!list.includes(email.trim().toLowerCase())) writeLS("newsletter", [...list, email.trim().toLowerCase()]);
    setError("");
    setEmail("");
    toast("You're on the list. Welcome to the edit.");
  };

  return (
    <footer className="bg-ink px-3 pb-3 pt-6 sm:px-4 sm:pb-4 sm:pt-8">
      <div className="relative isolate overflow-hidden rounded-[22px] bg-fg text-ink sm:rounded-[30px]">
        {/* warm glow in the corner */}
        <div className="pointer-events-none absolute -right-40 -top-40 -z-10 h-[30rem] w-[30rem] rounded-full bg-gold/20 blur-3xl" />

        <div className="mx-auto max-w-[1500px] px-5 pt-5 sm:px-8 sm:pt-6 lg:px-8 lg:pt-8">
          {/* ---- top: newsletter card + brand block ---- */}
          <Reveal className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-6">
            <div className="relative flex flex-col overflow-hidden rounded-[18px] bg-gold p-5 sm:rounded-[24px] sm:p-7">
              <Send
                aria-hidden
                strokeWidth={1.3}
                className="pointer-events-none absolute right-5 top-5 h-10 w-10 -rotate-12 text-ink/90 sm:right-7 sm:top-7 sm:h-12 sm:w-12"
              />
              <p className="label text-ink/80">The newsletter</p>
              <h2 className="display mt-2 pr-14 text-[clamp(28px,2.6vw,40px)] text-ink">
                First look at <em className="text-fg">every</em> edit.
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-snug text-ink/85">
                New arrivals, early drops and styling notes. No noise — unsubscribe anytime.
              </p>
              <form onSubmit={subscribe} noValidate className="mt-auto pt-5">
                <div className="flex items-center gap-2 rounded-full bg-ink p-1.5 pl-5 ring-fg/40 transition-shadow focus-within:ring-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    aria-label="Email address"
                    aria-invalid={!!error}
                    className="h-10 min-w-0 flex-1 bg-transparent text-[15px] text-fg outline-none placeholder:text-fg/45"
                  />
                  <button
                    type="submit"
                    className="label h-10 shrink-0 rounded-full bg-fg px-5 text-ink transition-colors duration-300 hover:bg-gold sm:px-7"
                  >
                    Subscribe
                  </button>
                </div>
                {error && <p className="mt-2 pl-5 text-xs font-bold text-fg">{error}</p>}
              </form>
            </div>

            <div className="flex flex-col justify-between gap-5 rounded-[18px] border border-ink/10 p-5 sm:rounded-[24px] sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div>
                  <span className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-gold font-display text-xl leading-none text-ink">{BRAND.mark}</span>
                    <span className="font-display text-[28px] uppercase tracking-[0.04em] text-ink">{BRAND.name}</span>
                  </span>
                  <p className="mt-3 max-w-sm text-sm leading-[1.5] text-ink/60">{BRAND.description}</p>
                </div>

                {/* hand-set tagline stamp */}
                <div aria-hidden className="relative ml-auto mr-2 hidden -rotate-6 select-none sm:block">
                  <p className="display text-[clamp(30px,2.8vw,44px)] leading-[0.92] text-ink">
                    Menswear,
                    <br />
                    <span className="text-gold">considered.</span>
                  </p>
                  <svg viewBox="0 0 240 28" className="mt-1 h-4 w-full text-gold" fill="none" stroke="currentColor" strokeLinecap="round">
                    <path d="M6 18 C 70 6, 150 4, 234 12" strokeWidth="5" />
                    <path d="M40 25 C 100 17, 160 16, 214 21" strokeWidth="3" opacity="0.6" />
                  </svg>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="label text-ink/50">Follow us</p>
                <div className="flex gap-2.5">
                  {BRAND.social.map((s, i) => (
                    <a
                      key={s.label}
                      href={s.href}
                      aria-label={s.label}
                      className={`grid h-10 w-10 place-items-center rounded-full transition-all duration-300 hover:-translate-y-1 ${
                        i === BRAND.social.length - 1 ? "bg-gold text-ink hover:bg-ink hover:text-fg" : "bg-ink text-fg hover:bg-gold hover:text-ink"
                      }`}
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
                        <path d={SOCIAL_PATHS[s.label]} />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* ---- links, with the brand word as their background ---- */}
        <div className="mx-auto max-w-[1500px] px-5 sm:px-8 lg:px-8">
          <div className="relative">
            {/* brand word: its baseline sits just above the bottom bar's hairline */}
            <p
              aria-hidden
              className="display pointer-events-none absolute bottom-[calc(12px-0.09em)] left-1/2 -z-10 w-screen -translate-x-1/2 text-center text-[26vw] sm:text-[21.4vw] whitespace-nowrap text-ink/[0.07] select-none"
            >
              {BRAND.name}
            </p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-9 pt-10 pb-16 sm:pt-12 sm:pb-20 lg:grid-cols-4 lg:gap-12 lg:pt-14 lg:pb-24">
              {COLS.map((c) => (
                <div key={c.title}>
                  <p className="label text-gold">{c.title}</p>
                  <ul className="mt-4 space-y-2.5">
                    {c.links.map(([label, href]) => (
                      <li key={label}>
                        <Link href={href} className="u-line text-[15px] text-ink/70 transition-colors hover:text-ink">
                          {label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <div className="col-span-2 sm:col-span-1">
                <p className="label text-gold">Contact</p>
                <ul className="mt-4 space-y-2.5 text-[15px] text-ink/70">
                  <li className="flex gap-3"><Mail size={16} className="mt-0.5 shrink-0 text-gold" />{BRAND.contact.email}</li>
                  <li className="flex gap-3"><Phone size={16} className="mt-0.5 shrink-0 text-gold" />{BRAND.contact.phone}</li>
                  <li className="flex gap-3"><MapPin size={16} className="mt-0.5 shrink-0 text-gold" />{BRAND.contact.address}</li>
                  <li className="pl-7 text-xs text-ink/50">{BRAND.contact.hours}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* ---- bottom bar ---- */}
          <div className="flex flex-col gap-4 border-t border-ink/15 pt-5 pb-6 text-xs text-ink/50 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} {BRAND.name}. All rights reserved. Front-end demonstration store — no real payments are processed.</p>
            <button
              onClick={() => scrollTo(0, { duration: 2 })}
              className="label inline-flex items-center gap-2 self-start rounded-full border border-ink/20 px-4 py-2 text-ink/80 transition-colors duration-300 hover:border-gold hover:bg-gold hover:text-ink"
            >
              Back to top <ArrowUp size={13} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
