import { getAllJokes, getJokeOfTheDay, getCategories } from "./lib/queries";
import { JokeViewer } from "./components/joke-viewer";
import { EmptyState } from "@repo/ui";

export const dynamic = "force-dynamic";

export default async function DadJokePage() {
  const jokes = await getAllJokes();
  const jokeOfTheDay = getJokeOfTheDay(jokes);
  const categories = getCategories(jokes);

  if (!jokeOfTheDay || jokes.length === 0) {
    return <EmptyState icon="😢" title="No jokes found. Check back later!" className="py-24" />;
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">
          One Groan Per Day.
        </h2>
        <p className="text-muted-foreground">
          {jokes.length} jokes across {categories.length} categories
        </p>
      </div>

      <JokeViewer
        jokes={jokes}
        initialJoke={jokeOfTheDay}
        categories={categories}
      />
    </div>
  );
}
