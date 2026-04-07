import { requireAppLayoutAccess } from "@/lib/require-app-layout-access";
import type { ReactNode } from "react";

export default async function AccountsLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAppLayoutAccess("accounts");

  return (
    <div className="min-h-screen">
      <header className="border-b border-surface-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <span className="text-xl">👥</span>
          <h1 className="font-heading text-xl text-accent">Accounts</h1>
          <span className="text-xs text-muted-foreground ml-1">
            Client Intelligence Hub
          </span>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
