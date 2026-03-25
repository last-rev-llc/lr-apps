import type { ReactNode } from "react";

export default function AiCalculatorLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <h1 className="text-xl font-bold">AI ROI Calculator</h1>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
