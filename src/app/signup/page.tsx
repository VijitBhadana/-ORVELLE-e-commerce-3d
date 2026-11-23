"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthShell from "@/components/auth/AuthShell";
import { Field, isEmail } from "@/components/ui/Field";
import { useStore } from "@/lib/store";

export default function SignupPage() {
  const { signup, toast } = useStore();
  const router = useRouter();
  const [f, setF] = useState({ name: "", email: "", password: "", confirm: "" });
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((x) => ({ ...x, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (f.name.trim().length < 2) er.name = "Enter your name.";
    if (!isEmail(f.email)) er.email = "Enter a valid email address.";
    if (f.password.length < 8) er.password = "Use at least 8 characters.";
    else if (!/\d/.test(f.password) || !/[a-zA-Z]/.test(f.password)) er.password = "Use letters and at least one number.";
    if (f.confirm !== f.password) er.confirm = "Passwords don't match.";
    if (!agree) er.agree = "Please accept the demo terms.";
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    const r = await signup(f.name, f.email, f.password);
    setBusy(false);
    if (!r.ok) return setErrors({ form: r.message });
    toast(r.message);
    router.push("/account");
  };

  return (
    <AuthShell eyebrow="Join the edit" title="Create account" image="/img/products/olive-cream.webp">
      <form onSubmit={submit} noValidate className="space-y-5">
        <Field label="Full name" name="name" autoComplete="name" value={f.name} onChange={set("name")} error={errors.name} />
        <Field label="Email" name="email" type="email" autoComplete="email" value={f.email} onChange={set("email")} error={errors.email} />
        <Field label="Password" name="password" type="password" autoComplete="new-password" value={f.password} onChange={set("password")} error={errors.password} hint="At least 8 characters with a number." />
        <Field label="Confirm password" name="confirm" type="password" autoComplete="new-password" value={f.confirm} onChange={set("confirm")} error={errors.confirm} />
        <label className="flex items-start gap-3 text-xs text-muted">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 accent-gold" />
          I understand this is a front-end demo and my details are stored only in this browser.
        </label>
        {errors.agree && <p className="text-xs text-red-400">{errors.agree}</p>}
        {errors.form && <p className="text-sm text-red-400" role="alert">{errors.form}</p>}
        <button disabled={busy} className="btn btn-gold w-full">{busy ? "Creating…" : "Create account"}</button>
      </form>
      <p className="mt-8 text-sm text-muted">
        Already have an account? <Link href="/login" className="text-gold hover:underline">Sign in</Link>
      </p>
    </AuthShell>
  );
}
