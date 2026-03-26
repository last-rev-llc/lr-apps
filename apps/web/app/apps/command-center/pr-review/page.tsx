import { getPRs } from "./lib/queries";
import { PrApp } from "./components/pr-app";

export const dynamic = "force-dynamic";

export default async function PrReviewPage() {
  const prs = await getPRs();

  return <PrApp initialPRs={prs} />;
}
