import { getConcerts } from "./lib/queries";
import { ConcertsApp } from "./components/concerts-app";

export const dynamic = "force-dynamic";

export default async function ConcertsPage() {
  const concerts = await getConcerts();
  return <ConcertsApp initialConcerts={concerts} />;
}
