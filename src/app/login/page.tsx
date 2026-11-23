"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AuthShell from "@/components/auth/AuthShell";
import { Field, isEmail } from "@/components/ui/Field";
import { useStore } from "@/lib/store";

export default function LoginPage() {
  const { login, user, toast, hydrated } = useStore();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);

  const next = () => {
    const n = new URLSearchParams(window.location.search).get("next");
    return n && n.startsWith("/") && !n.startsWith("//") ? n : "/account";
  };

  useEffect(() => {
    if (hydrated && user) router.replace(next());
  }, [hydrated, user, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const er: typeof errors = {};
    if (!isEmail(email)) er.email = "Enter a valid email address.";
    if (!password) er.password = "Enter your password.";
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    const r = await login(email, password);
    setBusy(false);
    if (!r.ok) return setErrors({ form: r.message });
    toast(r.message);
    router.push(next());
  };

  return (
    <AuthShell eyebrow="Welcome back" title="Sign in">
      <form onSubmit={submit} noValidate className="space-y-5">
        <Field label="Email" name="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
        <Field label="Password" name="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-xs text-muted hover:text-gold">Forgot password?</Link>
        </div>
        {errors.form && <p className="text-sm text-red-400" role="alert">{errors.form}</p>}
        <button disabled={busy} className="btn btn-gold w-full">{busy ? "Signing in…" : "Sign in"}</button>
      </form>
      <p className="mt-8 text-sm text-muted">
        New here? <Link href="/signup" className="text-gold hover:underline">Create an account</Link>
      </p>
    </AuthShell>
  );
}
