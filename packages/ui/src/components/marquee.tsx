import * as React from "react";
import { cn } from "../lib/utils";

export interface MarqueeProps {
  speed?: "slow" | "normal" | "fast";
  direction?: "left" | "right";
  pauseOnHover?: boolean;
  gap?: number;
  children: React.ReactNode;
  className?: string;
}

const SPEED_MAP: Record<string, string> = {
  slow: "40s",
  normal: "25s",
  fast: "12s",
};

export function Marquee({
  speed = "normal",
  direction = "left",
  pauseOnHover = false,
  gap = 24,
  children,
  className,
}: MarqueeProps) {
  const duration = SPEED_MAP[speed] ?? SPEED_MAP.normal;
  const animDirection = direction === "right" ? "reverse" : "normal";

  return (
    <>
      <style>{`
        .marquee-track {
          display: flex;
          width: max-content;
          animation: marquee-scroll var(--marquee-dur) linear infinite;
          animation-direction: var(--marquee-dir);
        }
        .marquee-track.pause-on-hover:hover {
          animation-play-state: paused;
        }
        .marquee-inner {
          display: flex;
          align-items: center;
        }
      `}</style>
      <div
        className={cn("block overflow-hidden", className)}
        aria-label="Scrolling content"
      >
        <div
          className={cn("marquee-track", pauseOnHover && "pause-on-hover")}
          style={
            {
              "--marquee-dur": duration,
              "--marquee-dir": animDirection,
            } as React.CSSProperties
          }
        >
          <div
            className="marquee-inner"
            style={{ gap: `${gap}px`, paddingRight: `${gap}px` }}
            aria-hidden="false"
          >
            {children}
          </div>
          <div
            className="marquee-inner"
            style={{ gap: `${gap}px`, paddingRight: `${gap}px` }}
            aria-hidden="true"
          >
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
