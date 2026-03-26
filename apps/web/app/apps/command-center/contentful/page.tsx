import { getContentfulHealth } from "./lib/queries";
import { ContentfulApp } from "./components/contentful-app";

export const dynamic = "force-dynamic";

export default async function ContentfulPage() {
  const health = await getContentfulHealth();
  return <ContentfulApp initialHealth={health} />;
}
