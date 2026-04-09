import { StatusBadge } from "@repo/ui";
import type { StatusBadgeProps } from "@repo/ui";

const moodToVariant: Record<string, StatusBadgeProps["variant"]> = {
  positive: "success",
  excited: "info",
  neutral: "neutral",
  frustrated: "warning",
  blocked: "error",
};

export function MoodBadge({ mood }: { mood: string }) {
  return (
    <StatusBadge variant={moodToVariant[mood] ?? "neutral"} className="capitalize">
      {mood}
    </StatusBadge>
  );
}
