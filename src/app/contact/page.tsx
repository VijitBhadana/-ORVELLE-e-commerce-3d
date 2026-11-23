"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Clock, Mail, MapPin, Phone } from "lucide-react";
import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import { Field, Select, TextArea, isEmail, isPhone } from "@/components/ui/Field";
import Reveal from "@/components/ui/Reveal";
import { BRAND } from "@/lib/brand";
import { useStore } from "@/lib/store";
import { readLS, writeLS } from "@/lib/storage";

const EMPTY = { name: "", email: "", phone: "", subject: "", message: "" };

export default function ContactPage() {
  const { content } = useStore();
  const [f, setF] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setF((x) => ({ ...x, [k]: e.target.value }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: "" }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (f.name.trim().length < 2) er.name = "Enter your name.";
    if (!isEmail(f.email)) er.email = "Enter a valid email address.";
    if (f.phone && !isPhone(f.phone)) er.phone = "Enter a valid 10-digit mobile number.";
    if (!f.subject) er.subject = "Choose a subject.";
    if (f.message.trim().length < 10) er.message = "Tell us a little more (10+ characters).";
    setErrors(er);
    if (Object.keys(er).length) return;
    setState("sending");
    window.setTimeout(() => {
      writeLS("messages", [...readLS<unknown[]>("messages", []), { ...f, date: new Date().toISOString() }]);
      setState("sent");
      setF(EMPTY);
    }, 1000);
  };

  return (
    <>
      <PageHeader eyebrow="Contact us" title="We're listening" crumbs={[{ label: "Contact Us" }]} intro="Styling questions, sizing help or an order query — send a note and the team will get back to you." />
      <div className="mx-auto grid max-w-[1500px] gap-16 px-5 py-20 sm:px-8 lg:grid-cols-[1fr_1.3fr] lg:px-10">
        <Reveal className="space-y-8">
          {[
            { icon: Mail, label: "Email", value: BRAND.contact.email },
            { icon: Phone, label: "Phone", value: BRAND.contact.phone },
            { icon: MapPin, label: "Studio", value: BRAND.contact.address },
            { icon: Clock, label: "Hours", value: BRAND.contact.hours },
          ].map((x) => (
            <div key={x.label} className="flex gap-5 border-b border-line pb-6">
              <x.icon className="mt-1 shrink-0 text-gold" size={18} strokeWidth={1.5} />
              <div>
                <p className="label text-muted">{x.label}</p>
                <p className="mt-2 text-lg">{x.value}</p>
              </div>
            </div>
          ))}
          <p className="text-xs text-white/40">Contact details are placeholders — set them in src/lib/brand.ts.</p>
        </Reveal>

        <div className="relative">
          <AnimatePresence mode="wait">
            {state === "sent" ? (
              <motion.div key="ok" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="border border-line p-10 text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gold text-ink"><Check size={24} /></span>
                <p className="display mt-6 text-[clamp(30px,3vw,50px)]">Message received.</p>
                <p className="mt-3 text-sm text-muted">Thanks for reaching out. (Demo: your message was saved in this browser — nothing was sent.)</p>
                <button onClick={() => setState("idle")} className="btn btn-ghost btn-sm mt-8">Send another</button>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={submit} noValidate initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid gap-5 sm:grid-cols-2">
                <Field label="Name" name="name" autoComplete="name" value={f.name} onChange={set("name")} error={errors.name} />
                <Field label="Email" name="email" type="email" autoComplete="email" value={f.email} onChange={set("email")} error={errors.email} />
                <Field label="Phone (optional)" name="phone" type="tel" autoComplete="tel" value={f.phone} onChange={set("phone")} error={errors.phone} />
                <Select label="Subject" name="subject" value={f.subject} onChange={set("subject")} error={errors.subject}>
                  <option value="">Choose a subject</option>
                  <option>Styling advice</option>
                  <option>Sizing help</option>
                  <option>Order query</option>
                  <option>Returns &amp; exchanges</option>
                  <option>Something else</option>
                </Select>
                <TextArea label="Message" name="message" rows={6} value={f.message} onChange={set("message")} error={errors.message} className="sm:col-span-2" />
                <button disabled={state === "sending"} className="btn btn-gold sm:col-span-2 sm:justify-self-start">
                  {state === "sending" ? "Sending…" : "Send message"}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>

      <section id="help" className="scroll-mt-24 border-t border-line">
        <div className="mx-auto grid max-w-[1500px] gap-10 px-5 py-20 sm:px-8 md:grid-cols-2 lg:px-10">
          <Reveal>
            <p className="eyebrow">Delivery</p>
            <p className="mt-4 text-[16px] leading-[1.42] text-muted">{content.deliveryInfo}</p>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="eyebrow">Returns</p>
            <p className="mt-4 text-[16px] leading-[1.42] text-muted">{content.returnsInfo}</p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
