import { LOGO_MARK, LOGO_ORANGE, LOGO_WORD } from "@/lib/logoPaths";

/*
 * ORVELLE logo, traced from brand-source/orvelle-logo.jpg (see tools/trace_logo.py).
 * The orange swoosh is the fixed brand colour; every black part is drawn in currentColor,
 * so set a text colour (text-fg on ivory, text-ink on black) and the logo follows it.
 */

type SvgProps = { className?: string; title?: string };

/** the monogram alone; size it by height (e.g. h-9 w-auto) */
export function LogoMark({ className = "", title }: SvgProps) {
  return (
    <svg
      viewBox={`0 0 ${LOGO_MARK.width} ${LOGO_MARK.height}`}
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      fillRule="evenodd"
    >
      <path d={LOGO_MARK.orange} fill={LOGO_ORANGE} />
      <path d={LOGO_MARK.dark} fill="currentColor" />
    </svg>
  );
}

/** the ORVELLE lettering alone; size it by height or width */
export function LogoWordmark({ className = "", title }: SvgProps) {
  return (
    <svg
      viewBox={`0 0 ${LOGO_WORD.width} ${LOGO_WORD.height}`}
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      fillRule="evenodd"
    >
      <path d={LOGO_WORD.dark} fill="currentColor" />
    </svg>
  );
}

/**
 * Horizontal lockup: monogram + lettering. `size` scales both together.
 * Decorative by default; the surrounding link carries the accessible name.
 */
export default function Logo({ className = "", size = "md" }: { className?: string; size?: "md" | "lg" }) {
  const mark = size === "lg" ? "h-11" : "h-7 sm:h-8 md:h-10";
  const word = size === "lg" ? "h-[19px]" : "h-[11px] sm:h-[13px] md:h-4";
  return (
    <span className={`flex items-center gap-2 sm:gap-2.5 md:gap-3 ${className}`}>
      <LogoMark className={`${mark} w-auto shrink-0`} />
      <LogoWordmark className={`${word} w-auto shrink-0`} />
    </span>
  );
}
