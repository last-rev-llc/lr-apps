"use client";

export default function CommandCenterError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4">
      <div className="text-4xl mb-4">⚡</div>
      <h2 className="font-heading text-xl text-accent mb-2">
        Command Center Error
      </h2>
      <p className="text-muted-foreground text-sm mb-6 max-w-sm">
        {error.message || "Something went wrong loading Command Center."}
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
