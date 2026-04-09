import Link from "next/link";
import type { ReactNode } from "react";
import { CALCULATORS } from "./lib/calculators";

export const metadata = {
  title: "Age of Apes Guide — Calculators & Database",
  description:
    "Seven calculators for Age of Apes: buildings, research, troops, fighters, mechs, equipment, and time — with speed buffs and full game data.",
};

export const viewport = {
  themeColor: "#F59E0B",
};

export default function AgeOfApesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      {/* Sticky header */}
      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Link
              href="/apps/age-of-apes"
              className="font-heading text-xl font-bold text-accent hover:opacity-80 transition-opacity shrink-0"
            >
              🦍 Age of Apes
            </Link>

            {/* Calculator nav (hidden on small screens) */}
            <nav className="hidden md:flex gap-1 flex-wrap">
              {CALCULATORS.map((calc) => (
                <Link
                  key={calc.slug}
                  href={`/apps/age-of-apes/${calc.slug}`}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-all"
                >
                  {calc.icon} <span className="hidden lg:inline">{calc.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          <Link
            href="/"
            className="text-xs text-muted-foreground hover:text-accent transition-colors shrink-0"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
