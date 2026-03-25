"use client";

import { useRef, useEffect, useState } from "react";
import { cn } from "../lib/utils";

interface StatCounterProps {
  value: string | number;
  label?: string;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}

export function StatCounter({
  value,
  label,
  suffix = "",
  prefix = "",
  duration = 1500,
  className,
}: StatCounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const animatedRef = useRef(false);
  const [display, setDisplay] = useState("0");

  const valueStr = String(value);
  const numTarget = parseFloat(valueStr);
  const isFloat = valueStr.includes(".");
  const isNumeric = !isNaN(numTarget);

  useEffect(() => {
    if (!isNumeric) {
      setDisplay(valueStr);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !animatedRef.current) {
            animatedRef.current = true;
            const start = performance.now();

            const tick = (now: number) => {
              const progress = Math.min((now - start) / duration, 1);
              // Ease-out cubic
              const eased = 1 - Math.pow(1 - progress, 3);
              const val = numTarget * eased;

              if (progress < 1) {
                setDisplay(isFloat ? val.toFixed(2) : String(Math.round(val)));
                requestAnimationFrame(tick);
              } else {
                setDisplay(valueStr);
              }
            };

            requestAnimationFrame(tick);
          }
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [isNumeric, valueStr, numTarget, isFloat, duration]);

  return (
    <div ref={ref} className={cn("block text-center", className)}>
      <div className="text-4xl font-extrabold leading-none font-serif">
        {prefix}{display}{suffix}
      </div>
      {label && (
        <div className="text-xs uppercase tracking-widest mt-1.5 text-muted-foreground">
          {label}
        </div>
      )}
    </div>
  );
}
