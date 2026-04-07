import { requireAppLayoutAccess } from "@/lib/require-app-layout-access";
import Link from "next/link";
import type { ReactNode } from "react";
import { GENERATIONS } from "./lib/generations";

export default async function GenerationsLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAppLayoutAccess("generations");

  return (
    <div className="min-h-screen">
      <header className="border-b border-surface-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href="/apps/generations"
              className="font-heading text-xl text-accent hover:opacity-80 transition-opacity"
            >
              🕰️ Generations
            </Link>
            <nav className="hidden md:flex gap-1 text-sm flex-wrap">
              {GENERATIONS.map((gen) => (
                <Link
                  key={gen.slug}
                  href={`/apps/generations/${gen.slug}`}
                  className="px-2.5 py-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-all"
                  style={{ ["--gen-color" as string]: gen.color }}
                >
                  <span>{gen.emoji}</span>{" "}
                  <span className="hidden lg:inline">{gen.name}</span>
                </Link>
              ))}
            </nav>
          </div>
          <Link
            href="/"
            className="text-xs text-muted-foreground hover:text-accent transition-colors"
          >
            ← Dashboard
          </Link>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
