import { cn } from "@repo/ui";

interface HealthScoreRingProps {
  score: number;
  size?: number;
  className?: string;
}

function scoreTone(score: number): string {
  if (score >= 80) return "text-green";
  if (score >= 60) return "text-yellow";
  return "text-red";
}

export function HealthScoreRing({
  score,
  size = 64,
  className,
}: HealthScoreRingProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={4}
          fill="none"
          className="text-surface-border"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={4}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn("transition-all", scoreTone(clamped))}
        />
      </svg>
      <span
        className={cn(
          "absolute inset-0 grid place-items-center font-bold tabular-nums",
          scoreTone(clamped),
        )}
        style={{ fontSize: size * 0.28 }}
      >
        {clamped}
      </span>
    </div>
  );
}
