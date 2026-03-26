import { getCrons } from "./lib/queries";
import { CronsApp } from "./components/crons-app";

export const dynamic = "force-dynamic";

export default async function CronsPage() {
  const crons = await getCrons();

  return <CronsApp initialCrons={crons} />;
}
