"use client";

import { useRef, useEffect, useState, type ReactNode } from "react";
import { cn } from "../lib/utils";

type RevealDirection = "left" | "right" | "top" | "bottom" | "center";

interface RevealProps {
  direction?: RevealDirection;
  duration?: number;
  delay?: number;
  easing?: string;
  threshold?: number;
  className?: string;
  children: ReactNode;
}

const getInitialClipPath = (direction: RevealDirection): string => {
  switch (direction) {
    case "left":   return "inset(0 100% 0 0)";
    case "right":  return "inset(0 0 0 100%)";
    case "top":    return "inset(0 0 100% 0)";
    case "bottom": return "inset(100% 0 0 0)";
    case "center": return "inset(50% 50% 50% 50%)";
  }
};

export function Reveal({
  direction = "bottom",
  duration = 800,
  delay = 0,
  easing = "cubic-bezier(0.65, 0, 0.35, 1)",
  threshold = 0.15,
  className,
  children,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setRevealed(true);
            observer.unobserve(el);
          }
        });
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  const initialClipPath = getInitialClipPath(direction);

  return (
    <div
      ref={ref}
      className={cn(className)}
      style={{
        clipPath: revealed ? "inset(0 0 0 0)" : initialClipPath,
        transitionProperty: "clip-path",
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: easing,
      }}
    >
      {children}
    </div>
  );
}
