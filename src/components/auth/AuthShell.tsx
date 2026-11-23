"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

/** Split layout for login / signup / reset: editorial image left, form right. */
export default function AuthShell({ eyebrow, title, children, image = "/img/products/classic-white-navy.webp" }: { eyebrow: string; title: string; children: ReactNode; image?: string }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <motion.div initial={{ scale: 1.12 }} animate={{ scale: 1 }} transition={{ duration: 2.2, ease: [0.22, 1, 0.36, 1] }} className="absolute inset-0">
          <Image src={image} alt="" fill sizes="50vw" className="object-cover" priority />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent from-70% to-ink" />
      </div>
      <div className="flex items-center px-5 pt-32 pb-20 sm:px-10 lg:pt-28">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} className="mx-auto w-full max-w-md">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="display mt-4 text-[clamp(46px,5.8vw,100px)]">{title}</h1>
          <div className="mt-10">{children}</div>
          <p className="mt-10 border-t border-line pt-5 text-xs leading-relaxed text-muted">
            Demo authentication: accounts are stored in this browser&apos;s LocalStorage only. Do not use a real password.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
