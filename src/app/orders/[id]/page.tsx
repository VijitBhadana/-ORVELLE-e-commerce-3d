"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatPrice } from "@/lib/products";

export default function OrderPage() {
  const { id } = useParams<{ id: string }>();
  const { orders, hydrated, user } = useStore();
  const order = orders.find((o) => o.id === id);

  if (!hydrated) return <div className="min-h-screen" />;
  if (!order)
    return (
      <div className="mx-auto flex min-h-[70svh] max-w-xl flex-col items-center justify-center px-5 pt-24 text-center">
        <h1 className="display text-[clamp(46px,5.8vw,100px)]">Order not found</h1>
        <p className="mt-3 text-sm text-muted">Orders are stored in this browser only.</p>
        <Link href="/shop" className="btn btn-gold mt-8">Back to shop</Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-3xl px-5 pt-36 pb-28 sm:px-8 md:pt-44">
      <motion.div initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200, damping: 14 }} className="grid h-16 w-16 place-items-center rounded-full bg-gold text-ink">
        <Check size={28} />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.9 }}>
        <p className="eyebrow mt-8">Order confirmed</p>
        <h1 className="display mt-4 text-[clamp(46px,5.8vw,100px)]">Thank you, {order.customer.name.split(" ")[0]}.</h1>
        <p className="mt-4 text-sm text-muted">
          Order <span className="text-white">{order.id}</span> was placed on {new Date(order.date).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}. This is a demo — no payment was taken and nothing will ship.
        </p>
      </motion.div>

      <div className="mt-12 border border-line">
        <ul className="divide-y divide-line">
          {order.items.map((i) => (
            <li key={i.productId + i.size} className="flex items-center gap-4 p-5">
              <div className="relative aspect-[4/5] w-16 shrink-0 overflow-hidden bg-card">
                <Image src={i.image} alt="" fill sizes="64px" className="object-cover" />
              </div>
              <div className="flex-1 text-sm">
                <p>{i.name}</p>
                <p className="text-xs text-muted">Size {i.size} · Qty {i.qty}</p>
              </div>
              <p className="text-sm">{formatPrice(i.price * i.qty)}</p>
            </li>
          ))}
        </ul>
        <dl className="space-y-2 border-t border-line p-5 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
          {order.discount > 0 && <div className="flex justify-between text-gold"><dt>Discount {order.coupon && `(${order.coupon})`}</dt><dd>−{formatPrice(order.discount)}</dd></div>}
          <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd>{order.shipping ? formatPrice(order.shipping) : "Complimentary"}</dd></div>
          <div className="flex justify-between border-t border-line pt-3 text-base"><dt>Total</dt><dd className="font-semibold">{formatPrice(order.total)}</dd></div>
        </dl>
      </div>

      <div className="mt-8 grid gap-6 text-sm sm:grid-cols-2">
        <div>
          <p className="label mb-3 text-muted">Delivering to</p>
          <p>{order.customer.name}</p>
          <p className="text-muted">{order.customer.address}, {order.customer.city}, {order.customer.state} {order.customer.pin}</p>
          <p className="text-muted">{order.customer.phone}</p>
        </div>
        <div>
          <p className="label mb-3 text-muted">Payment</p>
          <p>{order.payment}</p>
          <p className="label mt-4 mb-1 text-muted">Status</p>
          <p className="text-gold">{order.status}</p>
        </div>
      </div>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link href="/shop" className="btn btn-gold">Continue shopping</Link>
        <Link href={user ? "/account#orders" : "/signup"} className="btn btn-ghost">{user ? "View order history" : "Create an account"}</Link>
      </div>
    </div>
  );
}
