import type { ReactNode } from "react";

export const metadata = {
  title: "Soccer Training",
  description:
    "Video-guided soccer drills for speed, dribbling, finishing, strength, and recovery.",
};

export const viewport = {
  themeColor: "#22c55e",
};

export default function SoccerTrainingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-white/10 backdrop-blur-sm sticky top-0 z-10 bg-background/80">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚽</span>
            <h1 className="font-heading text-lg text-green-400 font-semibold">
              Soccer Training
            </h1>
          </div>
          <nav className="flex gap-4 text-sm">
            <a
              href="/apps/soccer-training"
              className="text-muted-foreground hover:text-green-400 transition-colors"
            >
              Drills
            </a>
            <a
              href="/"
              className="text-muted-foreground hover:text-green-400 transition-colors"
            >
              Dashboard
            </a>
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
