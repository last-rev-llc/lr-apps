import type { ReactNode } from "react";

export default function FormsLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="glass w-full max-w-md p-8">{children}</div>
    </main>
  );
}
