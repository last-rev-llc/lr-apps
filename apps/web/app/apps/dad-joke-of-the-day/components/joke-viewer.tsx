"use client";

import { useState, useCallback } from "react";
import { Button } from "@repo/ui";
import { Badge } from "@repo/ui";
import { Card, CardContent } from "@repo/ui";
import { createClient } from "@repo/db/client";
import { RATINGS, RATING_MAP } from "../lib/types";
import type { DadJoke } from "../lib/types";

interface JokeViewerProps {
  jokes: DadJoke[];
  initialJoke: DadJoke;
  categories: string[];
}

export function JokeViewer({ jokes, initialJoke, categories }: JokeViewerProps) {
  const [currentJoke, setCurrentJoke] = useState<DadJoke>(initialJoke);
  const [punchlineRevealed, setPunchlineRevealed] = useState(false);
  const [ratedKey, setRatedKey] = useState<string | null>(null);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [mode, setMode] = useState<"jotd" | "random">("jotd");

  const filteredJokes =
    selectedCategory === "all"
      ? jokes
      : jokes.filter((j) => j.category === selectedCategory);

  const trackShown = useCallback(async (jokeId: number) => {
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;
      const { data: joke } = await db
        .from("dad_jokes")
        .select("times_shown")
        .eq("id", jokeId)
        .single();
      if (joke) {
        await db
          .from("dad_jokes")
          .update({ times_shown: (joke.times_shown ?? 0) + 1 })
          .eq("id", jokeId);
      }
    } catch {
      // silent — tracking is best-effort
    }
  }, []);

  const showJoke = useCallback(
    (joke: DadJoke, newMode: "jotd" | "random") => {
      setCurrentJoke(joke);
      setPunchlineRevealed(false);
      setRatedKey(null);
      setMode(newMode);
      trackShown(joke.id);
    },
    [trackShown],
  );

  const showRandom = useCallback(() => {
    const pool = filteredJokes.length > 1 ? filteredJokes : jokes;
    const candidates = pool.filter((j) => j.id !== currentJoke.id);
    const source = candidates.length ? candidates : pool;
    const pick = source[Math.floor(Math.random() * source.length)];
    if (pick) showJoke(pick, "random");
  }, [filteredJokes, jokes, currentJoke.id, showJoke]);

  const showJOTD = useCallback(() => {
    const today = new Date();
    const seed =
      today.getFullYear() * 10000 +
      (today.getMonth() + 1) * 100 +
      today.getDate();
    const pool = filteredJokes.length ? filteredJokes : jokes;
    const pick = pool[seed % pool.length];
    if (pick) showJoke(pick, "jotd");
  }, [filteredJokes, jokes, showJoke]);

  const rateJoke = useCallback(
    async (ratingKey: string) => {
      if (ratedKey || ratingSubmitting) return;
      setRatedKey(ratingKey);
      setRatingSubmitting(true);
      try {
        const supabase = createClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const db = supabase as any;
        const { data: joke } = await db
          .from("dad_jokes")
          .select("rating, times_rated")
          .eq("id", currentJoke.id)
          .single();
        if (joke) {
          const timesRated = (joke.times_rated ?? 0) + 1;
          const numericRating = RATING_MAP[ratingKey] ?? 2;
          const newRating =
            (((joke.rating ?? 0) * (timesRated - 1)) + numericRating) /
            timesRated;
          await db
            .from("dad_jokes")
            .update({
              rating: Math.round(newRating * 100) / 100,
              times_rated: timesRated,
            })
            .eq("id", currentJoke.id);
        }
      } catch {
        // silent
      } finally {
        setRatingSubmitting(false);
      }
    },
    [ratedKey, ratingSubmitting, currentJoke.id],
  );

  const handleCategoryChange = useCallback(
    (cat: string) => {
      setSelectedCategory(cat);
      // After switching category, show JOTD from new pool
      const today = new Date();
      const seed =
        today.getFullYear() * 10000 +
        (today.getMonth() + 1) * 100 +
        today.getDate();
      const pool =
        cat === "all" ? jokes : jokes.filter((j) => j.category === cat);
      if (pool.length) {
        const pick = pool[seed % pool.length];
        if (pick) showJoke(pick, "jotd");
      }
    },
    [jokes, showJoke],
  );

  const statsLabel =
    (currentJoke.times_rated ?? 0) > 0
      ? `⭐ ${currentJoke.rating?.toFixed(1) ?? "—"} (${currentJoke.times_rated} ratings)`
      : null;

  return (
    <div className="space-y-6">
      {/* Category filter */}
      <div className="flex flex-wrap gap-2 justify-center">
        <Badge
          variant="outline"
          onClick={() => handleCategoryChange("all")}
          className={[
            "cursor-pointer rounded-full transition-colors",
            selectedCategory === "all"
              ? "border-amber-400 bg-amber-400/10 text-amber-400"
              : "border-white/10 text-muted-foreground hover:border-white/30",
          ].join(" ")}
        >
          All
        </Badge>
        {categories.map((cat) => (
          <Badge
            key={cat}
            variant="outline"
            onClick={() => handleCategoryChange(cat)}
            className={[
              "cursor-pointer rounded-full transition-colors",
              selectedCategory === cat
                ? "border-amber-400 bg-amber-400/10 text-amber-400"
                : "border-white/10 text-muted-foreground hover:border-white/30",
            ].join(" ")}
          >
            {cat}
          </Badge>
        ))}
      </div>

      {/* Joke card */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardContent className="p-8 text-center space-y-6">
          {/* Mode badge */}
          <div>
            <Badge
              variant="outline"
              className="border-amber-400/40 text-amber-400 bg-amber-400/10"
            >
              {mode === "jotd" ? "🗓️ Joke of the Day" : "🎲 Random Joke"}
            </Badge>
          </div>

          {/* Setup */}
          <p className="text-2xl md:text-3xl font-serif leading-snug text-foreground">
            {currentJoke.setup}
          </p>

          {/* Punchline / reveal */}
          {punchlineRevealed ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              <p className="text-xl text-amber-400 font-medium">
                {currentJoke.punchline}
              </p>

              {/* Rating buttons */}
              {!ratedKey ? (
                <div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Rate this joke:
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {RATINGS.map(({ key, emoji, label }) => (
                      <Button
                        key={key}
                        variant="outline"
                        size="icon"
                        title={label}
                        onClick={() => rateJoke(key)}
                        disabled={ratingSubmitting}
                        className="text-2xl h-11 w-11 rounded-xl border-2 border-white/10 bg-white/5 hover:border-amber-400 hover:scale-110 transition-all"
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Rated{" "}
                  {RATINGS.find((r) => r.key === ratedKey)?.emoji ?? ""} —
                  thanks!
                </p>
              )}
            </div>
          ) : (
            <Button
              onClick={() => setPunchlineRevealed(true)}
              className="bg-amber-500 hover:bg-amber-400 text-black font-semibold"
            >
              👇 Reveal Punchline
            </Button>
          )}

          {/* Category + stats */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className="border-white/20 text-muted-foreground"
            >
              {currentJoke.category}
            </Badge>
            {statsLabel && (
              <span className="text-xs text-muted-foreground">{statsLabel}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex gap-3 justify-center flex-wrap">
        <Button
          onClick={showRandom}
          className="bg-blue-600 hover:bg-blue-500 text-white"
        >
          🎲 Random Joke
        </Button>
        <Button
          onClick={showJOTD}
          variant="outline"
          className="border-white/20 hover:border-white/40 text-foreground"
        >
          🗓️ Joke of the Day
        </Button>
      </div>

      {/* Pool count */}
      {selectedCategory !== "all" && (
        <p className="text-center text-xs text-muted-foreground">
          {filteredJokes.length} joke{filteredJokes.length !== 1 ? "s" : ""} in{" "}
          {selectedCategory}
        </p>
      )}
    </div>
  );
}
