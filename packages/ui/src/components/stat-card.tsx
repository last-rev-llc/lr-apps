"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface StatCardProps {
  value: string | number;
  label: string;
  icon?: string;
  trend?: "up" | "down" | "neutral";
  size?: "sm" | "md" | "lg";
  href?: string;
  className?: string;
}

const ACCENT_PALETTES = [
  { grad: "linear-gradient(135deg, #f59e0b, #f97316)", glow: "rgba(245,158,11,.15)", border: "rgba(245,158,11,.3)" },
  { grad: "linear-gradient(135deg, #a855f7, #7c3aed)", glow: "rgba(168,85,247,.15)", border: "rgba(168,85,247,.3)" },
  { grad: "linear-gradient(135deg, #3b82f6, #6366f1)", glow: "rgba(59,130,246,.15)", border: "rgba(59,130,246,.3)" },
  { grad: "linear-gradient(135deg, #22c55e, #10b981)", glow: "rgba(34,197,94,.15)", border: "rgba(34,197,94,.3)" },
  { grad: "linear-gradient(135deg, #ec4899, #f43f5e)", glow: "rgba(236,72,153,.15)", border: "rgba(236,72,153,.3)" },
  { grad: "linear-gradient(135deg, #06b6d4, #0ea5e9)", glow: "rgba(6,182,212,.15)", border: "rgba(6,182,212,.3)" },
];

const TREND_ICONS = {
  up: "↑",
  down: "↓",
  neutral: "→",
};

const TREND_COLORS = {
  up: "text-emerald-400",
  down: "text-red-400",
  neutral: "text-white/40",
};

const SIZE_STYLES = {
  sm: { value: "text-[1.8rem]", label: "text-xs", padding: "p-4" },
  md: { value: "text-[2.4rem]", label: "text-sm", padding: "p-6" },
  lg: { value: "text-[3.2rem]", label: "text-base", padding: "p-8" },
};

// Whether the browser supports IntersectionObserver (false in SSR/test environments)
const hasIntersectionObserver =
  typeof window !== "undefined" && typeof IntersectionObserver !== "undefined";

function useCountUp(target: number, active: boolean, duration = 1200) {
  // When active from the start (no IntersectionObserver), display the final value immediately
  const mountedActive = React.useRef(active);
  const [display, setDisplay] = React.useState(() => (active ? target : 0));

  React.useEffect(() => {
    if (!active) return;
    if (mountedActive.current) {
      // Active from mount (SSR/test): skip animation, just ensure value is correct
      setDisplay(target);
      return;
    }
    const start = performance.now();
    const isFloat = String(target).includes(".");
    const decimals = isFloat ? (String(target).split(".")[1] ?? "").length : 0;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * target;
      setDisplay(isFloat ? parseFloat(current.toFixed(decimals)) : Math.round(current));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [target, active, duration]);

  return display;
}

export function StatCard({
  value,
  label,
  icon,
  trend,
  size = "md",
  href,
  className,
}: StatCardProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState(!hasIntersectionObserver);

  // Intersection observer — trigger animation when 20% from viewport bottom
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!hasIntersectionObserver) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -20% 0px", threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Parse numeric value for count-up
  const rawStr = String(value);
  const numMatch = rawStr.match(/^[~]?(\d+(?:\.\d+)?)/);
  const isNumeric = !!numMatch;
  const targetNum = isNumeric ? parseFloat(numMatch![1]) : 0;
  const prefix = isNumeric ? rawStr.slice(0, rawStr.indexOf(numMatch![1])) : "";
  const suffix = isNumeric ? rawStr.slice(rawStr.indexOf(numMatch![1]) + numMatch![1].length) : "";

  // When IntersectionObserver is unavailable (SSR/test), skip animation and render raw value
  const counted = useCountUp(targetNum, hasIntersectionObserver && visible && isNumeric);
  const displayValue = !hasIntersectionObserver
    ? rawStr
    : isNumeric
      ? `${prefix}${String(targetNum).includes(".") ? counted.toFixed((String(targetNum).split(".")[1] ?? "").length) : counted}${suffix}`
      : rawStr;

  // Pick palette based on index — use a ref trick (won't always be accurate in SSR, but fine for display)
  const paletteIdx = React.useRef(Math.floor(Math.random() * ACCENT_PALETTES.length)).current;
  const palette = ACCENT_PALETTES[paletteIdx];
  const s = SIZE_STYLES[size];

  const inner = (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl border text-center backdrop-blur-md",
        "transition-all duration-250",
        "hover:-translate-y-0.5",
        s.padding,
        className,
      )}
      style={{
        background: palette.glow,
        borderColor: palette.border,
      }}
    >
      <div
        className={cn("font-extrabold leading-tight", s.value)}
        style={{
          background: palette.grad,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {icon && <span style={{ WebkitTextFillColor: "initial" }}>{icon} </span>}
        {displayValue}
      </div>
      <div className={cn("mt-1 text-white/50", s.label)}>{label}</div>
      {trend && (
        <div className={cn("mt-1 text-xs font-medium", TREND_COLORS[trend])}>
          {TREND_ICONS[trend]}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block">
        {inner}
      </a>
    );
  }

  return inner;
}
