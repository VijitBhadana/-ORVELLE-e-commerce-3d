"use client";

import { motion } from "framer-motion";
import { Clock4, Gem, Layers, Repeat2, Sparkles } from "lucide-react";
import { Stagger, staggerItem } from "@/components/ui/Reveal";
import { BRAND } from "@/lib/brand";

const FEATURES = [
  { icon: Layers, title: "Curated outfit combinations", text: "Shirt and trousers chosen together, so every set is already resolved." },
  { icon: Sparkles, title: "Modern men's fashion", text: "Clean silhouettes and honest colours that feel current without chasing trends." },
  { icon: Clock4, title: "Timeless styling", text: "Pieces designed to look right this season and the ones after it." },
  { icon: Repeat2, title: "Everyday versatility", text: "Mix the sets across looks — every shirt works with more than one pair of trousers." },
  { icon: Gem, title: "Premium shopping experience", text: "Considered packaging, easy sizing and a bag that remembers you." },
];

export default function WhyChooseUs() {
  return (
    <section className="relative overflow-hidden border-t border-line bg-ink py-24 sm:py-32">
      <div className="pointer-events-none absolute top-0 right-0 h-[30rem] w-[30rem] translate-x-1/3 -translate-y-1/3 rounded-full bg-gold/[0.07] blur-3xl" />
      <div className="relative mx-auto max-w-[1500px] px-5 sm:px-8 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-2 lg:items-end">
          <div>
            <p className="eyebrow">03 — Why {BRAND.name}</p>
            <h2 className="display mt-5 text-[clamp(46px,5.8vw,100px)]">
              Fewer decisions. <br />
              <em className="text-white/45">Better outfits.</em>
            </h2>
          </div>
          <p className="max-w-md text-[16px] leading-[1.42] text-muted lg:justify-self-end">
            We built the store around how men actually get dressed: by outfit, not by item.
          </p>
        </div>

        <Stagger className="mt-16 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              variants={staggerItem}
              onPointerMove={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
                e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
              }}
              className={`group relative overflow-hidden bg-ink p-8 transition-colors duration-500 hover:bg-ink-2 ${i === 4 ? "sm:col-span-2 lg:col-span-1" : ""}`}
            >
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 [background:radial-gradient(260px_circle_at_var(--mx)_var(--my),rgba(213,54,12,0.12),transparent_70%)]" />
              <motion.div
                className="relative grid h-14 w-14 place-items-center rounded-full border border-gold/40 text-gold"
                initial={{ rotate: -30, scale: 0.6, opacity: 0 }}
                whileInView={{ rotate: 0, scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 160, damping: 14, delay: 0.15 + i * 0.08 }}
              >
                <f.icon size={22} strokeWidth={1.4} className="transition-transform duration-700 group-hover:scale-110 group-hover:rotate-12" />
              </motion.div>
              <p className="label relative mt-10 text-white/40">{String(i + 1).padStart(2, "0")}</p>
              <h3 className="display relative mt-3 text-[clamp(22px,2.2vw,34px)]">{f.title}</h3>
              <p className="relative mt-3 text-[16px] leading-[1.42] text-muted">{f.text}</p>
            </motion.div>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
