import { Card, CardContent, LoadingSkeleton } from "@repo/ui";

export default function CrmLoading() {
  return (
    <div className="space-y-4">
      <div>
        <LoadingSkeleton className="h-8 w-32 mb-2" />
        <LoadingSkeleton className="h-4 w-64" />
      </div>
      <div className="flex flex-wrap gap-3">
        <LoadingSkeleton className="h-9 flex-1 min-w-[200px]" />
        <LoadingSkeleton className="h-9 w-40" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <LoadingSkeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <LoadingSkeleton className="h-4 w-3/4" />
                  <LoadingSkeleton className="h-3 w-1/2" />
                </div>
              </div>
              <LoadingSkeleton className="h-3 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
