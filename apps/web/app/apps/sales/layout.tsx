import { requireAccess } from "@repo/auth/server";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = {
  title: "Sales — Last Rev",
  description: "Sales leads dashboard.",
};

export default async function SalesLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAccess("sales");

  return (
    <div className="min-h-screen">
      <header className="border-b border-surface-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-heading text-xl text-accent">💰 Sales</h1>
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
