import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[80svh] max-w-xl flex-col items-center justify-center px-5 pt-24 text-center">
      <p className="display text-[clamp(120px,15vw,260px)] leading-none text-gold/80">404</p>
      <h1 className="display mt-4 text-[clamp(30px,3vw,50px)]">This page is out of stock.</h1>
      <p className="mt-3 text-sm text-muted">The link may be old, or the look has moved.</p>
      <Link href="/" className="btn btn-gold mt-8">Back home</Link>
    </div>
  );
}
