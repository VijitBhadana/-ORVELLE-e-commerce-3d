"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Banknote, CreditCard, Lock, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import { Field, Select, isEmail, isPhone, isPin } from "@/components/ui/Field";
import { useStore, type Customer } from "@/lib/store";
import { formatPrice } from "@/lib/products";
import Summary from "@/components/cart/Summary";

const STATES = ["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Lakshadweep"];

const PAYMENTS = [
  { id: "cod", label: "Cash on Delivery (demo)", icon: Banknote },
  { id: "upi", label: "UPI (simulated)", icon: Smartphone },
  { id: "card", label: "Card (simulated)", icon: CreditCard },
];

const EMPTY: Customer = { name: "", email: "", phone: "", address: "", city: "", state: "", pin: "" };

export default function CheckoutPage() {
  const s = useStore();
  const router = useRouter();
  const [form, setForm] = useState<Customer>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Customer, string>>>({});
  const [payment, setPayment] = useState("cod");
  const [placing, setPlacing] = useState(false);

  // prefill from the signed-in user and any saved draft
  useEffect(() => {
    if (!s.hydrated) return;
    setForm((f) => ({ ...EMPTY, ...s.checkoutDraft, ...(s.user ? { name: f.name || s.user.name, email: f.email || s.user.email } : {}) } as Customer));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.hydrated]);

  const set = (k: keyof Customer) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const v = e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  const validate = () => {
    const e: Partial<Record<keyof Customer, string>> = {};
    if (form.name.trim().length < 2) e.name = "Enter your full name.";
    if (!isEmail(form.email)) e.email = "Enter a valid email address.";
    if (!isPhone(form.phone)) e.phone = "Enter a valid 10-digit mobile number.";
    if (form.address.trim().length < 8) e.address = "Enter your full street address.";
    if (form.city.trim().length < 2) e.city = "Enter your city.";
    if (!form.state) e.state = "Select your state.";
    if (!isPin(form.pin)) e.pin = "Enter a valid 6-digit PIN code.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) {
      document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
      return;
    }
    setPlacing(true);
    s.setCheckoutDraft(form);
    // simulate a short processing delay — no payment is taken
    window.setTimeout(() => {
      const id = s.placeOrder(form, PAYMENTS.find((p) => p.id === payment)!.label);
      if (id) router.push(`/orders/${id}`);
      else setPlacing(false);
    }, 1100);
  };

  if (s.hydrated && s.lines.length === 0 && !placing) {
    return (
      <>
        <PageHeader eyebrow="Checkout" title="Checkout" compact />
        <div className="mx-auto max-w-xl px-5 py-24 text-center">
          <p className="display text-[clamp(30px,3vw,50px)]">Your bag is empty.</p>
          <Link href="/shop" className="btn btn-gold mt-8">Shop the looks</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader eyebrow="Secure checkout · demo" title="Checkout" crumbs={[{ label: "Bag", href: "/cart" }, { label: "Checkout" }]} compact />
      <div className="mx-auto grid max-w-[1500px] gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[1fr_420px] lg:px-10">
        <form onSubmit={submit} noValidate className="space-y-12">
          <fieldset>
            <legend className="label mb-6 text-white">01 — Contact</legend>
            {!s.user && (
              <p className="mb-5 text-xs text-muted">
                Have an account? <Link href="/login?next=/checkout" className="text-gold underline-offset-4 hover:underline">Sign in</Link> for faster checkout.
              </p>
            )}
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Full name" name="name" autoComplete="name" value={form.name} onChange={set("name")} error={errors.name} className="sm:col-span-2" />
              <Field label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={set("email")} error={errors.email} />
              <Field label="Mobile" name="phone" type="tel" inputMode="numeric" autoComplete="tel" placeholder="10-digit mobile" value={form.phone} onChange={set("phone")} error={errors.phone} />
            </div>
          </fieldset>
          <fieldset>
            <legend className="label mb-6 text-white">02 — Delivery address</legend>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Address" name="address" autoComplete="street-address" placeholder="House / flat, street, area" value={form.address} onChange={set("address")} error={errors.address} className="sm:col-span-2" />
              <Field label="City" name="city" autoComplete="address-level2" value={form.city} onChange={set("city")} error={errors.city} />
              <Select label="State" name="state" value={form.state} onChange={set("state")} error={errors.state}>
                <option value="">Select state</option>
                {STATES.map((x) => <option key={x}>{x}</option>)}
              </Select>
              <Field label="PIN code" name="pin" inputMode="numeric" maxLength={6} autoComplete="postal-code" value={form.pin} onChange={set("pin")} error={errors.pin} />
            </div>
          </fieldset>
          <fieldset>
            <legend className="label mb-6 text-white">03 — Payment</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {PAYMENTS.map((p) => (
                <label key={p.id} className={`flex cursor-pointer items-center gap-3 border p-4 text-sm transition-colors ${payment === p.id ? "border-gold bg-gold/5" : "border-line hover:border-white/40"}`}>
                  <input type="radio" name="payment" value={p.id} checked={payment === p.id} onChange={() => setPayment(p.id)} className="accent-gold" />
                  <p.icon size={16} className="text-gold" />
                  {p.label}
                </label>
              ))}
            </div>
            <p className="mt-4 flex items-start gap-2 text-xs text-muted">
              <Lock size={13} className="mt-0.5 shrink-0" /> Front-end demo: no payment is collected and no card details are requested. Placing an order only saves it in this browser.
            </p>
          </fieldset>
          <button disabled={placing} className="btn btn-gold w-full sm:w-auto sm:min-w-72">
            {placing ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink border-t-transparent" /> Placing order…
              </>
            ) : (
              <>Place order · {formatPrice(s.total)}</>
            )}
          </button>
        </form>
        <Summary checkout />
      </div>
    </>
  );
}
