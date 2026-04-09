import { cn } from "@repo/ui";

const moodStyles: Record<string, string> = {
  excited: "bg-pill-0/20 text-foreground border-pill-0/30",
  positive: "bg-green/20 text-green border-green/30",
  neutral: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
  frustrated: "bg-orange/20 text-orange border-orange/30",
  blocked: "bg-red/20 text-red border-red/30",
};

export function MoodBadge({ mood }: { mood: string }) {
  const style = moodStyles[mood] ?? "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize",
        style,
      )}
    >
      {mood}
    </span>
  );
}
