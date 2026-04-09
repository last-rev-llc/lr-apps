import { cn } from "@repo/ui";

const moodColors: Record<string, string> = {
  positive: "bg-green/20 text-green",
  excited: "bg-pill-0/20 text-pill-0",
  neutral: "bg-muted text-muted-foreground",
  frustrated: "bg-orange/20 text-orange",
  blocked: "bg-red/20 text-red",
};

export function MoodBadge({ mood }: { mood: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        moodColors[mood] ?? moodColors.neutral,
      )}
    >
      {mood}
    </span>
  );
}
