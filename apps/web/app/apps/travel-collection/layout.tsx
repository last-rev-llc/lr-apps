import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = {
  title: "Travel Collection — Curated Luxury, Infinite Wanderlust",
  description:
    "Curated luxury properties, private islands, and once-in-a-lifetime escapes. The world's best — researched, verified, and ready to book.",
};

export const viewport = {
  themeColor: "#14B8A6",
};

export default function TravelCollectionLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-surface-border backdrop-blur-md bg-background/85">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/apps/travel-collection"
            className="font-heading text-xl font-bold text-accent hover:opacity-80 transition-opacity"
          >
            🏨 Travel Collection
          </Link>
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
