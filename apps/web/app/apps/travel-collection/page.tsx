import { getProperties } from "./lib/queries";
import { TravelApp } from "./components/travel-app";

export const dynamic = "force-dynamic";

export default async function TravelCollectionPage() {
  const properties = await getProperties();

  return <TravelApp initialProperties={properties} />;
}
