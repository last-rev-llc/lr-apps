"use client";

import { Button, Card, CardContent } from "@repo/ui";

export default function SentimentError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <Card className="glass max-w-md">
        <CardContent className="p-8 text-center">
          <h2 className="font-heading text-xl text-accent mb-2">Something went wrong</h2>
          <p className="text-muted-foreground text-sm mb-4">
            {error.message || "Failed to load sentiment data."}
          </p>
          <Button onClick={reset}>Try again</Button>
        </CardContent>
      </Card>
    </div>
  );
}
