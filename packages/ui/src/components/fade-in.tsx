"use client";

import { useRef, useEffect, useState, type ReactNode } from "react";
import { cn } from "../lib/utils";

type Direction = "up" | "down" | "left" | "right";

interface FadeInProps {
  delay?: number;
  duration?: number;
  direction?: Direction;
  distance?: number;
  threshold?: number;
  className?: string;
  children: ReactNode;
}

const getInitialTransform = (direction: Direction, distance: number): string => {
  switch (direction) {
    case "up":    return `translateY(${distance}px)`;
    case "down":  return `translateY(-${distance}px)`;
    case "left":  return `translateX(${distance}px)`;
    case "right": return `translateX(-${distance}px)`;
  }
};

export function FadeIn({
  delay = 0,
  duration = 700,
  direction = "up",
  distance = 30,
  threshold = 0.15,
  className,
  children,
}: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(el);
          }
        });
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  const initialTransform = getInitialTransform(direction, distance);

  return (
    <div
      ref={ref}
      className={cn(className)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translate(0, 0)" : initialTransform,
        transitionProperty: "opacity, transform",
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: "ease",
      }}
    >
      {children}
    </div>
  );
}
