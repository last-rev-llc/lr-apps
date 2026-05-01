import Link from "next/link";
import { PageHeader } from "@repo/ui";
import { AISummaryPanel } from "../../client-health/components/ai-summary-panel";

export const dynamic = "force-dynamic";

interface ClientDetailPageProps {
  params: Promise<{ clientId: string }>;
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { clientId } = await params;
  return (
    <div className="space-y-4">
      <PageHeader
        title={`Client: ${clientId}`}
        subtitle="AI-generated health summary"
      />
      <Link
        href="/apps/command-center/client-health"
        className="text-xs text-muted-foreground hover:text-accent transition-colors"
      >
        ← Back to Client Health
      </Link>
      <AISummaryPanel clientId={clientId} />
    </div>
  );
}
