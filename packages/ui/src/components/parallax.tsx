"use client";

import { useRef, useEffect, type ReactNode } from "react";
import { cn } from "../lib/utils";

interface ParallaxProps {
  speed?: number;
  height?: string;
  bgImage?: string;
  bgColor?: string;
  overlay?: string;
  align?: "top" | "center" | "bottom";
  className?: string;
  children?: ReactNode;
}

export function Parallax({
  speed = 0.3,
  height = "100vh",
  bgImage,
  bgColor,
  overlay = "rgba(0,0,0,0.5)",
  align = "center",
  className,
  children,
}: ParallaxProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (speed <= 0) return;

    const container = containerRef.current;
    const bg = bgRef.current;
    if (!container || !bg) return;

    const onScroll = () => {
      const rect = container.getBoundingClientRect();
      const scrolled = -rect.top * speed;
      bg.style.transform = `translate3d(0, ${scrolled}px, 0)`;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => window.removeEventListener("scroll", onScroll);
  }, [speed]);

  const alignJustify = align === "top" ? "flex-start" : align === "bottom" ? "flex-end" : "center";

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden w-full", className)}
      style={{ height, minHeight: height }}
    >
      {/* Parallax background layer */}
      <div
        ref={bgRef}
        style={{
          position: "absolute",
          inset: "-20% 0",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundImage: bgImage ? `url(${bgImage})` : undefined,
          background: bgColor ?? undefined,
          willChange: "transform",
          zIndex: 0,
        }}
      />

      {/* Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: overlay,
          zIndex: 1,
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          justifyContent: alignJustify,
          padding: "48px 32px",
          width: "100%",
          maxWidth: "960px",
          margin: "0 auto",
          minHeight: height,
        }}
      >
        {children}
      </div>
    </div>
  );
}
