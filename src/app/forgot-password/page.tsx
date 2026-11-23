"use client";

import Link from "next/link";
import { useState } from "react";
import { MailCheck } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { Field, isEmail } from "@/components/ui/Field";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <AuthShell eyebrow="Account help" title="Reset password" image="/img/products/sky-blue-beige.webp">
      {sent ? (
        <div>
          <MailCheck className="text-gold" size={36} strokeWidth={1.3} />
          <p className="mt-5 text-[16px] leading-[1.42] text-muted">
            If an account exists for <span className="text-white">{email}</span>, a reset link would be sent. This is a front-end demo, so no email is actually sent.
          </p>
          <Link href="/login" className="btn btn-gold mt-8">Back to sign in</Link>
        </div>
      ) : (
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (!isEmail(email)) return setError("Enter a valid email address.");
            setError("");
            setSent(true);
          }}
          className="space-y-5"
        >
          <p className="text-sm text-muted">Enter the email you signed up with and we&apos;ll send a reset link.</p>
          <Field label="Email" name="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} />
          <button className="btn btn-gold w-full">Send reset link</button>
          <Link href="/login" className="block text-center text-xs text-muted hover:text-gold">Back to sign in</Link>
        </form>
      )}
    </AuthShell>
  );
}
