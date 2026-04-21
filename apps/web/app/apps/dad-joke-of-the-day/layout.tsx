import React from "react";
import type { ReactNode } from "react";
import { requireAppLayoutAccess } from "@/lib/require-app-layout-access";

export const metadata = {
  title: "Dad Joke of the Day",
  description:
    "A fresh dad joke every day — punchline reveals, ratings, and 55+ jokes to keep you cringing.",
};

export const viewport = {
  themeColor: "#f59e0b",
};

export default async function DadJokeLayout({ children }: { children: ReactNode }) {
  await requireAppLayoutAccess("dad-joke-of-the-day");
  return (
    <div className="min-h-screen bg-background">
      <header className="glass-header sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🤣</span>
            <h1 className="font-heading text-lg text-foreground font-semibold">
              Dad Joke of the Day
            </h1>
          </div>
          <nav className="flex gap-4 text-sm">
            <a
              href="/apps/dad-joke-of-the-day"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              App
            </a>
            <a
              href="/apps/dad-joke-of-the-day/about"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              About
            </a>
          </nav>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
