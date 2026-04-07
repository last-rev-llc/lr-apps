"use client";

import { useRef, useEffect, useState, type ReactNode } from "react";
import { cn } from "../lib/utils";

type SlideDirection = "left" | "right" | "top" | "bottom";

interface SlideInProps {
  delay?: number;
  duration?: number;
  direction?: SlideDirection;
  distance?: number;
  easing?: string;
  threshold?: number;
  once?: boolean;
  className?: string;
  children: ReactNode;
}

const getInitialTransform = (direction: SlideDirection, distance: number): string => {
  switch (direction) {
    case "left":   return `translateX(-${distance}px)`;
    case "right":  return `translateX(${distance}px)`;
    case "top":    return `translateY(-${distance}px)`;
    case "bottom": return `translateY(${distance}px)`;
  }
};

export function SlideIn({
  delay = 0,
  duration = 600,
  direction = "left",
  distance = 60,
  easing = "cubic-bezier(0.16, 1, 0.3, 1)",
  threshold = 0.1,
  once = true,
  className,
  children,
}: SlideInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [slid, setSlid] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setSlid(true);
            if (once) observer.unobserve(el);
          } else if (!once) {
            setSlid(false);
          }
        });
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, once]);

  const initialTransform = getInitialTransform(direction, distance);

  return (
    <div
      ref={ref}
      className={cn(className)}
      style={{
        transform: slid ? "translate(0, 0)" : initialTransform,
        transitionProperty: "transform",
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: easing,
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
}
