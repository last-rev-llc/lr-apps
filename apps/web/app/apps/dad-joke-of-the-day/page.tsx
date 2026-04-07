import { getAllJokes, getJokeOfTheDay, getCategories } from "./lib/queries";
import { JokeViewer } from "./components/joke-viewer";

export const dynamic = "force-dynamic";

export default async function DadJokePage() {
  const jokes = await getAllJokes();
  const jokeOfTheDay = getJokeOfTheDay(jokes);
  const categories = getCategories(jokes);

  if (!jokeOfTheDay || jokes.length === 0) {
    return (
      <div className="text-center py-24 text-muted-foreground">
        <div className="text-5xl mb-4">😢</div>
        <p className="text-lg">No jokes found. Check back later!</p>
      </div>
    );
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
