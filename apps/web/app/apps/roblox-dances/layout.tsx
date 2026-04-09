import React from "react";
import type { ReactNode } from "react";
import { requireAppLayoutAccess } from "@/lib/require-app-layout-access";

export const metadata = {
  title: "Roblox Dance Marketplace",
  description: "Animated dance moves for Roblox — browse, submit, and generate Motor6D Luau scripts.",
};

export const viewport = {
  themeColor: "#EC4899",
};

export default async function RobloxDancesLayout({ children }: { children: ReactNode }) {
  await requireAppLayoutAccess("roblox-dances");
  return (
    <div className="min-h-screen">
      <header className="glass-header sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="font-heading text-xl text-pill-6">
              🕺 Roblox Dance Marketplace
            </h1>
            <nav className="flex gap-4 text-sm">
              <a
                href="/apps/roblox-dances"
                className="text-foreground hover:text-pill-6 transition-colors"
              >
                App
              </a>
              <a
                href="/"
                className="text-muted-foreground hover:text-pill-6 transition-colors"
              >
                Dashboard
              </a>
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
