"use client";

import { useEffect, useRef, useCallback } from "react";

type ConfettiShape = "circle" | "square" | "strip";

interface ConfettiProps {
  trigger?: boolean;
  particleCount?: number;
  colors?: string[];
  delay?: number;
  autoFire?: boolean;
}

const DEFAULT_COLORS = ["#FDBB30", "#00543C", "#fff", "#007A56"];
const SHAPES: ConfettiShape[] = ["circle", "square", "strip"];

export function Confetti({
  trigger,
  particleCount = 80,
  colors = DEFAULT_COLORS,
  delay = 300,
  autoFire = true,
}: ConfettiProps) {
  const firedRef = useRef(false);

  const fire = useCallback(() => {
    for (let i = 0; i < particleCount; i++) {
      const el = document.createElement("div");
      const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)]!;
      const color = colors[Math.floor(Math.random() * colors.length)]!;
      const size = Math.random() * 8 + 4;

      Object.assign(el.style, {
        position: "fixed",
        zIndex: "9999",
        pointerEvents: "none",
        left: `${Math.random() * 100}vw`,
        top: "-20px",
        width: `${shape === "strip" ? size * 0.4 : size}px`,
        height: `${shape === "strip" ? size * 2 : size}px`,
        background: color,
        borderRadius: shape === "circle" ? "50%" : shape === "strip" ? "2px" : "1px",
        animation: `confetti-fall ${Math.random() * 2 + 2}s ${Math.random() * 0.8}s linear forwards`,
      });

      document.body.appendChild(el);
      el.addEventListener("animationend", () => el.remove(), { once: true });
    }
  }, [particleCount, colors]);

  // Auto-fire on mount
  useEffect(() => {
    if (!autoFire) return;
    const id = setTimeout(fire, delay);
    return () => clearTimeout(id);
  }, [autoFire, delay, fire]);

  // Fire when trigger flips to true
  useEffect(() => {
    if (trigger === true && !firedRef.current) {
      firedRef.current = true;
      fire();
    }
    if (trigger === false) {
      firedRef.current = false;
    }
  }, [trigger, fire]);

  // Renders nothing — side-effect only
  return null;
}
