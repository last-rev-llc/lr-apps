import { requireAccess } from "@repo/auth/server";
import type { ReactNode } from "react";

export default async function SlangTranslatorLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAccess("slang");

  return (
    <div className="min-h-screen">
      <header className="border-b border-surface-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="font-heading text-xl text-accent">
              🗣️ Slang Translator
            </h1>
            <nav className="flex gap-4 text-sm">
              <a
                href="/apps/slang-translator"
                className="text-foreground hover:text-accent"
              >
                App
              </a>
              <a
                href="/apps/slang-translator/about"
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
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
