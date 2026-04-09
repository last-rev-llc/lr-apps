import { requireAppLayoutAccess } from "@/lib/require-app-layout-access";
import Link from "next/link";
import type { ReactNode } from "react";
import { Topbar } from "@repo/ui";

export default async function SlangTranslatorLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAppLayoutAccess("slang-translator");

  return (
    <div className="min-h-screen">
      <Topbar title="🗣️ Slang Translator">
        <Link href="/apps/slang-translator" className="text-sm text-muted-foreground hover:text-accent transition-colors">
          App
        </Link>
        <Link href="/apps/slang-translator/about" className="text-sm text-muted-foreground hover:text-accent transition-colors">
          About
        </Link>
        <Link href="/" className="text-sm text-muted-foreground hover:text-accent transition-colors">
          Dashboard
        </Link>
      </Topbar>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
