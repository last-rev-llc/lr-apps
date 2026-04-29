"use client";

import { useEffect } from "react";

export default function AnalyticsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("cc-analytics error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4">
      <div className="text-4xl mb-4">📊</div>
      <h2 className="font-heading text-xl text-accent mb-2">
        Couldn&apos;t load analytics
      </h2>
      <p className="text-muted-foreground text-sm mb-6 max-w-sm">
        {error.message || "The analytics provider returned an error."}
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-lg bg-accent/10 border border-accent/30 text-accent text-sm font-semibold hover:bg-accent/20 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
