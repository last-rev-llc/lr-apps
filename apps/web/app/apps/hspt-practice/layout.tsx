import type { ReactNode } from "react";

export const metadata = {
  title: "HSPT Practice",
  description:
    "Timed HSPT practice exams with per-section scoring — Verbal, Quantitative, Reading, Math, and Language.",
};

export const viewport = {
  themeColor: "#4F46E5",
};

export default function HsptPracticeLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-white/10 backdrop-blur-sm sticky top-0 z-10 bg-background/80">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📝</span>
            <h1 className="font-heading text-lg text-foreground font-semibold">
              HSPT Practice
            </h1>
          </div>
          <nav className="flex gap-4 text-sm">
            <a
              href="/apps/hspt-practice"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              App
            </a>
          </nav>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
