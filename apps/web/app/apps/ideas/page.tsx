import { getIdeas } from "./lib/queries";
import { IdeasApp } from "./components/ideas-app";

export const dynamic = "force-dynamic";

export default async function IdeasPage() {
  const ideas = await getIdeas();

  return <IdeasApp initialIdeas={ideas} />;
}
