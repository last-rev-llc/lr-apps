import { getMediaItems } from "./lib/queries";
import { GalleryApp } from "./components/gallery-app";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const items = await getMediaItems();

  return <GalleryApp initialItems={items} />;
}
