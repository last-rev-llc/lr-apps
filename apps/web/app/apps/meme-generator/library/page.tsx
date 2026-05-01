import Link from "next/link";
import { Button, EmptyState, PageHeader } from "@repo/ui";
import { listMyMemes } from "../actions";
import { LibraryGrid } from "./components/library-grid";

export default async function MemeLibraryPage() {
  const memes = await listMyMemes();

  return (
    <div className="space-y-4">
      <PageHeader
        title="My Memes"
        subtitle="Browse, rename, and re-load any meme you've saved."
      />
      {memes.length === 0 ? (
        <EmptyState
          icon="🖼️"
          title="No saved memes yet"
          description="Build one in the editor and it'll show up here."
          action={
            <Button asChild>
              <Link href="/apps/meme-generator">Open the editor</Link>
            </Button>
          }
        />
      ) : (
        <LibraryGrid memes={memes} />
      )}
    </div>
  );
}
