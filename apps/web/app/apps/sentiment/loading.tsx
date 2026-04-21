import { Card, CardContent } from "@repo/ui";

export default function SentimentLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-48 bg-muted rounded animate-pulse mb-2" />
        <div className="h-4 w-80 bg-muted rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="glass-sm">
            <CardContent className="p-4">
              <div className="h-8 w-12 bg-muted rounded animate-pulse mx-auto mb-2" />
              <div className="h-3 w-16 bg-muted rounded animate-pulse mx-auto" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="glass-sm">
        <CardContent className="p-4 h-64 animate-pulse" />
      </Card>
    </div>
  );
}
