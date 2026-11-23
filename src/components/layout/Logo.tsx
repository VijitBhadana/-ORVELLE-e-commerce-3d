import { BRAND } from "@/lib/brand";

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <span className="grid h-8 w-8 place-items-center rounded-full border border-gold/60 font-display text-lg leading-none text-gold">{BRAND.mark}</span>
      <span className="font-display text-[22px] uppercase tracking-[0.04em] text-white">{BRAND.name}</span>
    </span>
  );
}
