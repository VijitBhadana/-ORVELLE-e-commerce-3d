const ITEMS = ["Curated combinations", "Five complete looks", "Tailored essentials", "Sizes S – XXL", "Complimentary shipping above ₹2,999", "Considered colour"];

export default function Marquee() {
  const row = (
    <div className="flex shrink-0 items-center" aria-hidden>
      {ITEMS.map((t) => (
        <span key={t} className="flex items-center">
          <span className="display px-8 text-[clamp(26px,3vw,44px)] whitespace-nowrap text-white/80">{t}</span>
          <span className="h-1.5 w-1.5 rotate-45 bg-gold" />
        </span>
      ))}
    </div>
  );
  return (
    <div className="fade-x relative overflow-hidden border-y border-line bg-ink py-7" role="marquee" aria-label={ITEMS.join(", ")}>
      <div className="marquee flex w-max">
        {row}
        {row}
      </div>
    </div>
  );
}
