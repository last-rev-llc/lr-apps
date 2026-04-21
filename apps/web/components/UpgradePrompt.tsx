import Link from "next/link";

interface UpgradePromptProps {
  requiredTier: "pro" | "enterprise";
}

export default function UpgradePrompt({ requiredTier }: UpgradePromptProps) {
  const tierLabel = requiredTier === "enterprise" ? "Enterprise" : "Pro";

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-6 py-12 text-center space-y-6 bg-surface-raised rounded-2xl border border-surface-border">
        <div className="text-4xl">🔒</div>
        <h1 className="font-heading text-2xl text-foreground">
          {tierLabel} Plan Required
        </h1>
        <p className="text-muted-foreground">
          This app requires a{" "}
          <span className="text-accent font-semibold">{tierLabel}</span>{" "}
          subscription. Upgrade your plan to unlock access.
        </p>
        <Link
          href="/pricing"
          className="inline-block px-6 py-3 bg-accent text-accent-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity"
        >
          View Pricing
        </Link>
      </div>
    </div>
  );
}
