"use client";

import { useRef, useEffect, useState, Children, cloneElement, isValidElement, type ReactNode, type CSSProperties } from "react";
import { cn } from "../lib/utils";

type StaggerAnimation = "fade-up" | "fade-down" | "fade-left" | "fade-right" | "scale" | "blur";

interface StaggerProps {
  staggerDelay?: number;
  duration?: number;
  animation?: StaggerAnimation;
  distance?: number;
  threshold?: number;
  once?: boolean;
  className?: string;
  children: ReactNode;
}

const getInitialTransform = (animation: StaggerAnimation, distance: number): string => {
  switch (animation) {
    case "fade-up":    return `translateY(${distance}px)`;
    case "fade-down":  return `translateY(-${distance}px)`;
    case "fade-left":  return `translateX(${distance}px)`;
    case "fade-right": return `translateX(-${distance}px)`;
    case "scale":      return "scale(0.85)";
    case "blur":       return "translateY(8px)";
  }
};

export function Stagger({
  staggerDelay = 100,
  duration = 500,
  animation = "fade-up",
  distance = 24,
  threshold = 0.1,
  once = true,
  className,
  children,
}: StaggerProps) {
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
            if (once) observer.unobserve(el);
          } else if (!once) {
            setVisible(false);
          }
        });
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, once]);

  const initialTransform = getInitialTransform(animation, distance);
  const childArray = Children.toArray(children);

  return (
    <div ref={ref} className={cn(className)}>
      {childArray.map((child, i) => {
        const childStyle: CSSProperties = {
          opacity: visible ? 1 : 0,
          transform: visible ? "none" : initialTransform,
          filter: visible ? "none" : animation === "blur" ? "blur(4px)" : "none",
          transitionProperty: "opacity, transform, filter",
          transitionDuration: `${duration}ms`,
          transitionDelay: `${i * staggerDelay}ms`,
          transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        };

        if (isValidElement(child)) {
          return cloneElement(child as React.ReactElement<{ style?: CSSProperties }>, {
            style: { ...childStyle, ...(child.props as { style?: CSSProperties }).style },
          });
        }

        return (
          <div key={i} style={childStyle}>
            {child}
          </div>
        );
      })}
    </div>
  );
}
