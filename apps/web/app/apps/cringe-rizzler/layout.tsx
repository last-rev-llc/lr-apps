import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = {
  title: "Cringe Rizzler — Embarrass Gen Alpha",
  description:
    "AI-powered cringe phrases that weaponize Gen Alpha slang for maximum parental embarrassment. No cap fr fr.",
};

export const viewport = {
  themeColor: "#ec4899",
};

export default function CringeRizzlerLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen relative"
      style={{ background: "linear-gradient(135deg, #0d0d1a 0%, #12091e 50%, #0a0d1a 100%)" }}
    >
      {/* Ambient glow blobs */}
      <div
        className="fixed inset-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #ec4899, transparent)" }}
        />
        <div
          className="absolute top-1/3 -right-40 w-80 h-80 rounded-full opacity-15 blur-3xl"
          style={{ background: "radial-gradient(circle, #a855f7, transparent)" }}
        />
        <div
          className="absolute bottom-20 left-1/4 w-72 h-72 rounded-full opacity-10 blur-3xl"
          style={{ background: "radial-gradient(circle, #f59e0b, transparent)" }}
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-surface-border backdrop-blur-md bg-surface">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link
            href="/apps/cringe-rizzler"
            className="font-heading text-xl font-black hover:opacity-80 transition-opacity shrink-0"
            style={{
              background: "linear-gradient(135deg, #ec4899, #a855f7)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            💀 Cringe Rizzler
          </Link>

          <nav className="flex gap-3 text-sm">
            <Link
              href="/apps/cringe-rizzler"
              className="text-muted-foreground hover:text-pink-400 transition-colors"
            >
              App
            </Link>
            <Link
              href="/apps/cringe-rizzler/about"
              className="text-muted-foreground hover:text-pink-400 transition-colors"
            >
              About
            </Link>
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Dashboard
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
