import * as React from "react";
import { cn } from "../lib/utils";

export interface PlaceholderProps {
  icon?: string;
  seed?: string;
  ratio?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
  className?: string;
}

const GRADIENTS: Array<[string, string]> = [
  ["#0f172a", "#1e3a5f"],
  ["#1a0a2e", "#2d1b69"],
  ["#0a2318", "#134e29"],
  ["#2a1a0a", "#5c3a1e"],
  ["#1a1a2e", "#0f2b46"],
  ["#0a1a2a", "#1a3a5a"],
  ["#1e0a2a", "#3a1a5a"],
  ["#0a2a1a", "#1a5a3a"],
  ["#2a0a1a", "#5a1a3a"],
  ["#1a2a0a", "#3a5a1a"],
];

function hashIdx(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h) % GRADIENTS.length;
}

export function Placeholder({
  icon,
  seed = "default",
  ratio = "16/10",
  width,
  height,
  rounded = false,
  className,
}: PlaceholderProps) {
  const [from, to] = GRADIENTS[hashIdx(seed)];

  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden text-5xl text-white/15",
        "w-full",
        rounded && "rounded-full",
        className,
      )}
      style={{
        aspectRatio: width || height ? undefined : ratio,
        background: `linear-gradient(135deg, ${from}, ${to})`,
        width: width !== undefined ? (typeof width === "number" ? `${width}px` : width) : undefined,
        height: height !== undefined ? (typeof height === "number" ? `${height}px` : height) : undefined,
      }}
      role="img"
      aria-label={icon ? `${seed} placeholder` : "Loading placeholder"}
    >
      {icon && <span>{icon}</span>}
    </div>
  );
}
