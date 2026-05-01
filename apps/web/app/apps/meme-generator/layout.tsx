import type { ReactNode } from "react";
import Link from "next/link";
import { requireAppLayoutAccess } from "@/lib/require-app-layout-access";

export const metadata = {
  title: "Meme Generator",
};

export default async function MemeGeneratorLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAppLayoutAccess("meme-generator");
  return (
    <div className="min-h-screen">
      <header className="border-b border-surface-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-heading text-xl text-accent">Meme Generator</h1>
          <nav className="flex gap-4 text-sm" aria-label="Meme Generator">
            <Link
              href="/apps/meme-generator"
              className="text-foreground hover:text-accent"
            >
              Editor
            </Link>
            <Link
              href="/apps/meme-generator/library"
              className="text-muted-foreground hover:text-accent"
            >
              My Memes
            </Link>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
