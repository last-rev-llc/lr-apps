"use client";

import { Button, Card, CardContent } from "@repo/ui";

export default function CrmError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <Card className="max-w-md">
        <CardContent className="p-8 text-center">
          <h2 className="font-heading text-xl text-accent mb-2">
            Couldn&apos;t load CRM
          </h2>
          <p className="text-muted-foreground text-sm mb-4">
            {error.message || "Failed to load contacts."}
          </p>
          <Button onClick={reset}>Try again</Button>
        </CardContent>
      </Card>
    </div>
  );
}
