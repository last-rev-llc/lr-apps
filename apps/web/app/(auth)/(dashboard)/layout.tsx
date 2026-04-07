import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen p-8 max-w-5xl mx-auto">
      {children}
    </main>
  );
}
