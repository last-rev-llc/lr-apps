import Link from "next/link";
import type { ReactNode } from "react";
import { requireAppLayoutAccess } from "@/lib/require-app-layout-access";
import peopleData from "./data/people.json";

export const metadata = {
  title: "Superstars — Celebrate the People Who Matter",
  description:
    "A personal showcase celebrating athletes and notable individuals.",
};

export const viewport = {
  themeColor: "#FDBB30",
};

export default async function SuperstarsLayout({ children }: { children: ReactNode }) {
  await requireAppLayoutAccess("superstars");
  const people = peopleData as Array<{ id: string; name: string }>;

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      {/* Fixed header */}
      <header className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-md bg-[rgba(10,14,26,0.85)]">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link
            href="/apps/superstars"
            className="font-heading text-xl font-bold text-[#FDBB30] hover:opacity-80 transition-opacity shrink-0"
          >
            ⭐ Superstars
          </Link>

          {/* People nav */}
          {people.length > 1 && (
            <nav className="flex gap-2 flex-wrap">
              {people.map((p) => (
                <Link
                  key={p.id}
                  href={`/apps/superstars/${p.id}`}
                  className="px-4 py-1.5 rounded-full text-xs font-semibold text-white bg-white/6 border border-white/10 hover:bg-[#00543C] hover:border-[#FDBB30] hover:text-[#FDBB30] transition-all duration-300"
                >
                  {p.name}
                </Link>
              ))}
            </nav>
          )}

          <Link
            href="/"
            className="text-xs text-white/50 hover:text-[#FDBB30] transition-colors shrink-0"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
