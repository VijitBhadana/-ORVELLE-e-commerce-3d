import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

type Base = { label: string; error?: string; hint?: ReactNode; className?: string };

export function Field({ label, error, hint, className = "", id, ...rest }: Base & InputHTMLAttributes<HTMLInputElement>) {
  const fid = id ?? `f-${rest.name}`;
  return (
    <label htmlFor={fid} className={`block ${className}`}>
      <span className="mb-2 block text-[13px] font-extrabold tracking-[0.08em] uppercase text-muted">{label}</span>
      <input id={fid} aria-invalid={!!error} aria-describedby={error ? `${fid}-err` : undefined} className="field" {...rest} />
      {error ? <span id={`${fid}-err`} className="mt-1.5 block text-xs text-red-400">{error}</span> : hint ? <span className="mt-1.5 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function TextArea({ label, error, className = "", id, ...rest }: Base & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const fid = id ?? `f-${rest.name}`;
  return (
    <label htmlFor={fid} className={`block ${className}`}>
      <span className="mb-2 block text-[13px] font-extrabold tracking-[0.08em] uppercase text-muted">{label}</span>
      <textarea id={fid} aria-invalid={!!error} className="field" {...rest} />
      {error && <span className="mt-1.5 block text-xs text-red-400">{error}</span>}
    </label>
  );
}

export function Select({ label, error, className = "", id, children, ...rest }: Base & SelectHTMLAttributes<HTMLSelectElement>) {
  const fid = id ?? `f-${rest.name}`;
  return (
    <label htmlFor={fid} className={`block ${className}`}>
      <span className="mb-2 block text-[13px] font-extrabold tracking-[0.08em] uppercase text-muted">{label}</span>
      <select id={fid} aria-invalid={!!error} className="field" {...rest}>
        {children}
      </select>
      {error && <span className="mt-1.5 block text-xs text-red-400">{error}</span>}
    </label>
  );
}

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
export const isPhone = (v: string) => /^[6-9]\d{9}$/.test(v.replace(/[\s-]/g, "").replace(/^(\+91|0)/, ""));
export const isPin = (v: string) => /^[1-9]\d{5}$/.test(v.trim());
