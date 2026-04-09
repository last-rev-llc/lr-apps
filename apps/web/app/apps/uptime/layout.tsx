import { requireAppLayoutAccess } from "@/lib/require-app-layout-access";
import { Topbar } from "@repo/ui";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = {
  title: "Uptime Status — Last Rev",
  description: "Site availability monitoring dashboard.",
};

export default async function UptimeLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAppLayoutAccess("uptime");

  return (
    <div className="min-h-screen">
      <Topbar title="📡 Uptime Status">
        <Link
          href="/"
          className="text-xs text-muted-foreground hover:text-accent transition-colors"
        >
          ← Dashboard
        </Link>
      </Topbar>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
