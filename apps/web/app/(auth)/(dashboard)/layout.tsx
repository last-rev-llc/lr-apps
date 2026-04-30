import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen p-8 max-w-lp-xl mx-auto">
      {children}
    </main>
  );
}
