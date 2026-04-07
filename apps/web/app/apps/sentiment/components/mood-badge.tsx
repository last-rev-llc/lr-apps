import { cn } from "@repo/ui";

const moodColors: Record<string, string> = {
  positive: "bg-green-500/20 text-green-400",
  excited: "bg-purple-500/20 text-purple-400",
  neutral: "bg-muted text-muted-foreground",
  frustrated: "bg-orange-500/20 text-orange-400",
  blocked: "bg-red-500/20 text-red-400",
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
