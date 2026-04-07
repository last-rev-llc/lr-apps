"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface SlideDeckProps {
  slides: React.ReactNode[];
  autoPlay?: boolean;
  interval?: number;
  loop?: boolean;
  transition?: "slide" | "fade" | "zoom";
  showProgress?: boolean;
  showCounter?: boolean;
  className?: string;
}

export function SlideDeck({
  slides,
  autoPlay = false,
  interval = 4000,
  loop = false,
  transition = "slide",
  showProgress = true,
  showCounter = true,
  className,
}: SlideDeckProps) {
  const [current, setCurrent] = React.useState(0);
  const [exiting, setExiting] = React.useState<number | null>(null);
  const total = slides.length;

  const goto = React.useCallback(
    (n: number) => {
      if (total === 0) return;
      let next = n;
      if (next < 0) next = loop ? total - 1 : 0;
      if (next >= total) next = loop ? 0 : total - 1;
      if (next === current) return;

      setExiting(current);
      setTimeout(() => setExiting(null), 500);
      setCurrent(next);
    },
    [current, total, loop],
  );

  const next = React.useCallback(() => goto(current + 1), [goto, current]);
  const prev = React.useCallback(() => goto(current - 1), [goto, current]);

  // Keyboard navigation
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); next(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
      if (e.key === "Home") goto(0);
      if (e.key === "End") goto(total - 1);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [next, prev, goto, total]);

  // Auto-play
  React.useEffect(() => {
    if (!autoPlay) return;
    const timer = setInterval(next, interval);
    return () => clearInterval(timer);
  }, [autoPlay, interval, next]);

  // Touch swipe
  const touchStartX = React.useRef(0);
  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) dx > 0 ? prev() : next();
  }

  const slideBase = cn(
    "absolute inset-0 flex flex-col items-center justify-center px-20 py-16 text-center overflow-y-auto",
    "opacity-0 pointer-events-none transition-[opacity,transform] duration-500",
  );

  function slideClass(i: number) {
    const isActive = i === current;
    const isExiting = i === exiting;

    if (transition === "fade") {
      return cn(slideBase, isActive && "opacity-100 pointer-events-auto");
    }
    if (transition === "zoom") {
      return cn(
        slideBase,
        "scale-90",
        isActive && "opacity-100 pointer-events-auto scale-100",
        isExiting && "scale-110",
      );
    }
    // slide (default)
    return cn(
      slideBase,
      "translate-x-10",
      isActive && "opacity-100 pointer-events-auto translate-x-0",
      isExiting && "-translate-x-10",
    );
  }

  if (total === 0) return null;

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden",
        className,
      )}
      style={{ height: "100vh" }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Progress bar */}
      {showProgress && (
        <div className="absolute inset-x-0 top-0 z-20 h-[3px] bg-transparent">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-[width] duration-400"
            style={{ width: `${((current + 1) / total) * 100}%` }}
          />
        </div>
      )}

      {/* Slides */}
      {slides.map((slide, i) => (
        <div key={i} className={slideClass(i)}>
          {slide}
        </div>
      ))}

      {/* Counter */}
      {showCounter && (
        <div className="absolute bottom-5 right-7 z-10 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs text-white/50 backdrop-blur-sm">
          {current + 1} / {total}
        </div>
      )}

      {/* Nav hint */}
      <div className="absolute bottom-5 left-7 z-10 text-xs text-white/25">
        ← → or click to navigate
      </div>

      {/* Click navigation */}
      <div
        className="absolute inset-0 z-10 cursor-pointer"
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest("a, button, input, select, textarea")) return;
          if (e.clientX > window.innerWidth / 2) next();
          else prev();
        }}
      />
    </div>
  );
}
