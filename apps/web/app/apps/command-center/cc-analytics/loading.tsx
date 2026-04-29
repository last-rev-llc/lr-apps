import { Card, CardContent, LoadingSkeleton, PageHeader } from "@repo/ui";

export default function Loading() {
  return (
    <div className="space-y-4">
      <PageHeader title="📊 Analytics" subtitle="Loading…" />
      <Card className="p-4">
        <CardContent className="p-0 space-y-3">
          <LoadingSkeleton className="h-4 w-1/3" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <LoadingSkeleton key={i} className="h-16" />
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="p-4">
        <CardContent className="p-0 space-y-3">
          <LoadingSkeleton className="h-4 w-1/4" />
          <LoadingSkeleton className="h-60 w-full" />
        </CardContent>
      </Card>
      <Card className="p-4">
        <CardContent className="p-0 space-y-3">
          <LoadingSkeleton className="h-4 w-1/5" />
          {Array.from({ length: 5 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-6 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
