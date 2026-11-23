"use client";

import { Minus, Plus } from "lucide-react";
import { SIZES, discountPct, formatPrice, type Product, type Size } from "@/lib/products";

export function Price({ product, className = "" }: { product: Product; className?: string }) {
  const off = discountPct(product);
  return (
    <span className={`flex items-baseline gap-2.5 ${className}`}>
      <span className="font-semibold text-white">{formatPrice(product.price)}</span>
      {off > 0 && (
        <>
          <span className="text-sm text-muted line-through">{formatPrice(product.compareAt!)}</span>
          <span className="text-xs font-semibold text-gold">{off}% off</span>
        </>
      )}
    </span>
  );
}

export function ColorPair({ product, size = "sm" }: { product: Product; size?: "sm" | "md" }) {
  const dot = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  return (
    <span className="flex items-center gap-3 text-xs text-muted">
      <span className="flex items-center gap-1.5">
        <span className={`${dot} rounded-full ring-1 ring-white/25`} style={{ background: product.shirt.hex }} />
        {product.shirt.name} shirt
      </span>
      <span className="text-line">/</span>
      <span className="flex items-center gap-1.5">
        <span className={`${dot} rounded-full ring-1 ring-white/25`} style={{ background: product.pant.hex }} />
        {product.pant.name} trousers
      </span>
    </span>
  );
}

export function SizePicker({
  product, value, onChange, compact,
}: {
  product: Product; value: Size | null; onChange: (s: Size) => void; compact?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Size">
      {SIZES.map((s) => {
        const out = (product.stock[s] ?? 0) <= 0;
        const active = value === s;
        return (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={out}
            onClick={() => onChange(s)}
            title={out ? `${s} — out of stock` : `Size ${s}`}
            className={`relative ${compact ? "h-9 min-w-10 text-[0.7rem]" : "h-11 min-w-13 text-xs"} border px-3 font-semibold tracking-wider transition-colors duration-300 ${
              active ? "border-gold bg-gold text-ink" : "border-line text-white hover:border-white/60"
            } ${out ? "cursor-not-allowed text-white/25 line-through hover:border-line" : ""}`}
          >
            {s}
          </button>
        );
      })}
    </div>
  );
}

export function QtyStepper({ value, onChange, max = 10, small }: { value: number; onChange: (n: number) => void; max?: number; small?: boolean }) {
  const h = small ? "h-9" : "h-11";
  return (
    <div className={`inline-flex ${h} items-center border border-line`}>
      <button type="button" aria-label="Decrease quantity" className={`grid ${h} w-9 place-items-center text-muted hover:text-white disabled:opacity-30`} disabled={value <= 1} onClick={() => onChange(value - 1)}>
        <Minus size={13} />
      </button>
      <span className="w-8 text-center text-sm tabular-nums" aria-live="polite">
        {value}
      </span>
      <button type="button" aria-label="Increase quantity" className={`grid ${h} w-9 place-items-center text-muted hover:text-white disabled:opacity-30`} disabled={value >= max} onClick={() => onChange(value + 1)}>
        <Plus size={13} />
      </button>
    </div>
  );
}

/** first in-stock size, preferring M/L */
export function defaultSize(p: Product): Size | null {
  for (const s of ["M", "L", "S", "XL", "XXL"] as Size[]) if ((p.stock[s] ?? 0) > 0) return s;
  return null;
}
