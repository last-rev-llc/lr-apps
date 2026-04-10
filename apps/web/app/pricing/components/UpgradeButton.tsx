"use client";

import { useState } from "react";
import { Button } from "@repo/ui";

interface UpgradeButtonProps {
  priceId: string;
  isCurrent: boolean;
}

export function UpgradeButton({ priceId, isCurrent }: UpgradeButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isCurrent) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-accent/40 px-4 py-2 text-sm font-medium text-accent">
        Current Plan
      </div>
    );
  }

  async function handleUpgrade() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to create checkout session");
      }
      const data = (await res.json()) as { checkoutUrl?: string };
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        className="w-full"
        onClick={handleUpgrade}
        disabled={loading}
      >
        {loading ? "Redirecting…" : "Upgrade"}
      </Button>
      {error && <p className="text-center text-xs text-red-400">{error}</p>}
    </div>
  );
}
