"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Tag, X } from "lucide-react";
import { useState } from "react";
import { COUPONS, useStore } from "@/lib/store";
import { formatPrice } from "@/lib/products";
import { BRAND } from "@/lib/brand";

export default function Summary({ checkout }: { checkout?: boolean }) {
  const s = useStore();
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const remaining = BRAND.shipping.freeAbove - (s.subtotal - s.discount);

  return (
    <aside className="h-fit border border-line bg-ink-2 p-6 sm:p-8 lg:sticky lg:top-28">
      <p className="label text-white">Order summary</p>
      {checkout && (
        <ul className="mt-6 space-y-4 border-b border-line pb-6">
          {s.lines.map((l) => (
            <li key={l.key} className="flex gap-4">
              <div className="relative aspect-[4/5] w-14 shrink-0 overflow-hidden bg-card">
                <Image src={l.product.imageSm} alt="" fill sizes="56px" className="object-cover" />
                <span className="absolute top-0 right-0 grid h-5 min-w-5 place-items-center bg-gold px-1 text-[0.6rem] font-bold text-ink">{l.qty}</span>
              </div>
              <div className="flex-1 text-sm">
                <p>{l.product.name}</p>
                <p className="text-xs text-muted">Size {l.size}</p>
              </div>
              <p className="text-sm">{formatPrice(l.lineTotal)}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6">
        {s.coupon ? (
          <div className="flex items-center justify-between border border-gold/50 px-4 py-3 text-sm">
            <span className="flex items-center gap-2 text-gold"><Tag size={14} /> {s.coupon.code}</span>
            <button onClick={() => { s.removeCoupon(); setMsg(null); }} aria-label="Remove coupon" className="text-muted hover:text-white"><X size={14} /></button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const r = s.applyCoupon(code);
              setMsg({ ok: r.ok, text: r.message });
              if (r.ok) setCode("");
            }}
            className="flex"
          >
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Coupon code" aria-label="Coupon code" className="field h-11 uppercase" />
            <button className="btn btn-sm btn-light h-11 shrink-0">Apply</button>
          </form>
        )}
        {msg && <p className={`mt-2 text-xs ${msg.ok ? "text-gold" : "text-red-400"}`}>{msg.text}</p>}
        {!s.coupon && <p className="mt-2 text-xs text-muted">Demo codes: {COUPONS.map((c) => c.code).join(" · ")}</p>}
      </div>

      <dl className="mt-6 space-y-3 text-sm">
        <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatPrice(s.subtotal)}</dd></div>
        {s.discount > 0 && <div className="flex justify-between text-gold"><dt>Discount</dt><dd>−{formatPrice(s.discount)}</dd></div>}
        <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd>{s.shipping === 0 ? "Complimentary" : formatPrice(s.shipping)}</dd></div>
        {s.shipping > 0 && remaining > 0 && <p className="text-xs text-muted">Add {formatPrice(remaining)} more for complimentary shipping.</p>}
        <div className="flex justify-between border-t border-line pt-4 text-base"><dt>Total</dt><dd className="font-semibold">{formatPrice(s.total)}</dd></div>
      </dl>
      {!checkout && (
        <Link href="/checkout" className="btn btn-gold mt-8 w-full">
          Proceed to checkout <ArrowRight size={15} />
        </Link>
      )}
    </aside>
  );
}
