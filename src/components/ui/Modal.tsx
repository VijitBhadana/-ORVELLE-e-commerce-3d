"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";

/** Shared overlay shell: scroll lock (Lenis + native), Escape to close, focus-friendly close button. */
export default function Modal({
  open, onClose, children, side = "center", label, className = "",
}: {
  open: boolean; onClose: () => void; children: ReactNode; side?: "center" | "right" | "top"; label: string; className?: string;
}) {
  const { lock } = useSmoothScroll();

  useEffect(() => {
    if (!open) return;
    lock(true);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      lock(false);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, lock]);

  const panel =
    side === "right"
      ? { initial: { x: "100%" }, animate: { x: 0 }, exit: { x: "100%" } }
      : side === "top"
        ? { initial: { y: "-100%" }, animate: { y: 0 }, exit: { y: "-100%" } }
        : { initial: { opacity: 0, y: 30, scale: 0.98 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 20, scale: 0.98 } };

  const pos =
    side === "right"
      ? "right-0 top-0 h-full w-full max-w-[440px] border-l"
      : side === "top"
        ? "inset-x-0 top-0 max-h-[90svh] border-b"
        : "left-1/2 top-1/2 max-h-[92svh] w-[calc(100%-2rem)] max-w-5xl -translate-x-1/2 -translate-y-1/2 border";

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label={label}>
          <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <div className={side === "center" ? `absolute ${pos}` : "contents"}>
            <motion.div
              {...panel}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className={`${side === "center" ? "h-full max-h-[92svh] w-full" : `absolute ${pos}`} overflow-y-auto overscroll-contain border-line bg-ink-2 ${className}`}
              data-lenis-prevent
            >
              <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 z-10 grid h-10 w-10 place-items-center text-white/70 transition-colors hover:text-gold">
                <X size={20} />
              </button>
              {children}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
