import React from "react";
import type { ReactNode } from "react";
import { requireAppLayoutAccess } from "@/lib/require-app-layout-access";

export const metadata = {
  title: "Soccer Training",
  description:
    "Video-guided soccer drills for speed, dribbling, finishing, strength, and recovery.",
};

export const viewport = {
  themeColor: "#22c55e",
};

export default async function SoccerTrainingLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAppLayoutAccess("soccer-training");

  return (
    <div className="min-h-screen">
      <header className="glass-header sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚽</span>
            <h1 className="font-heading text-lg text-green font-semibold">
              Soccer Training
            </h1>
          </div>
          <nav className="flex gap-4 text-sm">
            <a
              href="/apps/soccer-training"
              className="text-muted-foreground hover:text-green transition-colors"
            >
              Drills
            </a>
            <a
              href="/"
              className="text-muted-foreground hover:text-green transition-colors"
            >
              Dashboard
            </a>
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
