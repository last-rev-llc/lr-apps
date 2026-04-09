import { requireAppLayoutAccess } from "@/lib/require-app-layout-access";
import Link from "next/link";
import type { ReactNode } from "react";
import { Topbar, AppNav } from "@repo/ui";
import { GENERATIONS } from "./lib/generations";

export default async function GenerationsLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAppLayoutAccess("generations");

  const navItems = GENERATIONS.map((gen) => ({
    label: `${gen.emoji} ${gen.name}`,
    href: `/apps/generations/${gen.slug}`,
  }));

  return (
    <div className="min-h-screen">
      <Topbar title="🕰️ Generations" className="border-surface-border">
        <Link
          href="/"
          className="text-xs text-muted-foreground hover:text-accent transition-colors"
        >
          ← Dashboard
        </Link>
      </Topbar>
      <AppNav
        items={navItems}
        className="hidden md:flex border-surface-border"
      />
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
