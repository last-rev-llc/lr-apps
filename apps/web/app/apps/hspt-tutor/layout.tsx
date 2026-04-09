import React from "react";
import type { ReactNode } from "react";
import { requireAppLayoutAccess } from "@/lib/require-app-layout-access";

export const metadata = {
  title: "HSPT Tutor",
  description:
    "Adaptive AI tutoring for HSPT prep — dashboard, adaptive quizzing, mastery badges, and topic trend tracking.",
};

export const viewport = {
  themeColor: "#10B981",
};

export default async function HsptTutorLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAppLayoutAccess("hspt-tutor");
  return (
    <div className="min-h-screen bg-background">
      <header className="glass-header sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎯</span>
            <h1 className="font-heading text-lg text-foreground font-semibold">
              HSPT Tutor
            </h1>
          </div>
          <nav className="flex gap-4 text-sm">
            <a
              href="/apps/hspt-tutor"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              App
            </a>
          </nav>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
