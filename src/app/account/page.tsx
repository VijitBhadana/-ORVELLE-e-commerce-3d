"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, LogOut, Package, ShoppingBag, User } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { useStore } from "@/lib/store";
import { formatPrice } from "@/lib/products";

export default function AccountPage() {
  const { user, orders, wishlist, cartCount, logout, hydrated } = useStore();

  if (!hydrated) return <div className="min-h-screen" />;
  if (!user)
    return (
      <>
        <PageHeader eyebrow="My account" title="Your account" compact />
        <div className="mx-auto max-w-xl px-5 py-24 text-center">
          <User className="mx-auto text-gold" size={40} strokeWidth={1.2} />
          <p className="display mt-6 text-[clamp(30px,3vw,50px)]">Sign in to see your orders.</p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/login" className="btn btn-gold">Sign in</Link>
            <Link href="/signup" className="btn btn-ghost">Create account</Link>
          </div>
        </div>
      </>
    );

  const mine = orders.filter((o) => (o.userEmail ?? o.customer.email).toLowerCase() === user.email);

  return (
    <>
      <PageHeader eyebrow="My account" title={`Hello, ${user.name.split(" ")[0]}.`} crumbs={[{ label: "Account" }]} intro={`Signed in as ${user.email}`} compact />
      <div className="mx-auto grid max-w-[1500px] gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[280px_1fr] lg:px-10">
        <aside className="space-y-3">
          {[
            { icon: Package, label: "Orders", value: mine.length, href: "#orders" },
            { icon: Heart, label: "Wishlist", value: wishlist.length, href: "/wishlist" },
            { icon: ShoppingBag, label: "In your bag", value: cartCount, href: "/cart" },
          ].map((x) => (
            <Link key={x.label} href={x.href} className="flex items-center justify-between border border-line p-5 transition-colors hover:border-gold/60">
              <span className="flex items-center gap-3 text-sm"><x.icon size={16} className="text-gold" /> {x.label}</span>
              <span className="display text-[clamp(22px,2.2vw,34px)]">{x.value}</span>
            </Link>
          ))}
          <div className="border border-line p-5 text-sm">
            <p className="label mb-3 text-muted">Profile</p>
            <p>{user.name}</p>
            <p className="text-muted">{user.email}</p>
            <p className="mt-2 text-xs text-muted">Member since {new Date(user.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</p>
          </div>
          <button onClick={logout} className="btn btn-ghost btn-sm w-full">
            <LogOut size={14} /> Sign out
          </button>
        </aside>

        <section id="orders" className="scroll-mt-28">
          <p className="label mb-6 text-white">Order history</p>
          {mine.length === 0 ? (
            <div className="border border-line py-16 text-center">
              <p className="display text-[clamp(30px,3vw,50px)]">No orders yet.</p>
              <Link href="/shop" className="btn btn-gold btn-sm mt-6">Shop the looks</Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {mine.map((o) => (
                <li key={o.id} className="border border-line">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 text-sm">
                    <span><span className="text-muted">Order</span> {o.id}</span>
                    <span className="text-muted">{new Date(o.date).toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>
                    <span className="border border-gold/50 px-2.5 py-1 text-[0.65rem] tracking-widest text-gold uppercase">{o.status}</span>
                    <span className="font-semibold">{formatPrice(o.total)}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 px-5 py-4">
                    {o.items.map((i) => (
                      <div key={i.productId + i.size} className="relative aspect-[4/5] w-14 overflow-hidden bg-card" title={`${i.name} · ${i.size} × ${i.qty}`}>
                        <Image src={i.image} alt={i.name} fill sizes="56px" className="object-cover" />
                      </div>
                    ))}
                    <Link href={`/orders/${o.id}`} className="u-line label ml-auto text-gold">View details</Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
