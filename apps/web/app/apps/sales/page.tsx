import { Card, CardContent } from "@repo/ui";

export const metadata = {
  title: "Sales Dashboard — Last Rev",
  description: "Sales leads dashboard — coming soon.",
};

export default function SalesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          💰 Sales Dashboard
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Leads pipeline and deal tracking for Last Rev.
        </p>
      </div>

      <Card className="bg-surface-card border-surface-border">
        <CardContent className="py-16 text-center space-y-4">
          <div className="text-5xl">💰</div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Sales Dashboard — Coming Soon
            </h2>
            <p className="text-muted-foreground text-sm mt-2 max-w-md mx-auto">
              The full leads pipeline will be wired up here once the
              command-center module (Phase 6) is migrated to Next.js.
            </p>
          </div>
          <div className="pt-2 text-xs text-muted-foreground space-y-1">
            <p>Powered by the <span className="text-accent font-medium">cc-leads</span> module</p>
            <p>Features: lead cards, status filters, pipeline stages, contact details</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
