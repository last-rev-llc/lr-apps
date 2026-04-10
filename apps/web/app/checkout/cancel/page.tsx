import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout Cancelled — LR Apps",
};

export default function CheckoutCancelPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-base px-4">
      <div className="glass max-w-md rounded-2xl border border-white/10 p-10 text-center">
        <div className="mb-4 text-5xl">↩</div>
        <h1 className="font-heading text-2xl font-bold text-white">
          Checkout cancelled
        </h1>
        <p className="mt-3 text-white/60">
          No charges were made. You can upgrade whenever you&apos;re ready.
        </p>
        <Link
          href="/pricing"
          className="mt-8 inline-flex items-center justify-center rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90"
        >
          Back to Pricing
        </Link>
      </div>
    </div>
  );
}
