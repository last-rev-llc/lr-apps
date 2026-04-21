import React from "react";
import type { ReactNode } from "react";
import { requireAppLayoutAccess } from "@/lib/require-app-layout-access";

export const metadata = {
  title: "Proper Wine Pour",
  description: "Pour calculator, rip-off meter, restaurant ratings & community wall",
};

export const viewport = {
  themeColor: "#722F37",
};

export default async function ProperWinePourLayout({ children }: { children: ReactNode }) {
  await requireAppLayoutAccess("proper-wine-pour");
  return (
    <div className="min-h-screen">
      <header className="border-b border-surface-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="font-heading text-xl" style={{ color: "var(--color-pill-6)" }}>
              🍷 Proper Wine Pour
            </h1>
            <nav className="flex gap-4 text-sm">
              <a
                href="/apps/proper-wine-pour"
                className="text-foreground hover:text-accent"
              >
                App
              </a>
              <a
                href="/apps/proper-wine-pour/about"
                className="text-muted-foreground hover:text-accent"
              >
                About
              </a>
              <a
                href="/"
                className="text-muted-foreground hover:text-accent"
              >
                Dashboard
              </a>
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
