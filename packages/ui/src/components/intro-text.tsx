import * as React from "react";
import { cn } from "../lib/utils";

interface IntroTextProps {
  children: React.ReactNode;
  className?: string;
}

export function IntroText({ children, className }: IntroTextProps) {
  return (
    <p
      className={cn(
        "mx-auto max-w-2xl text-center text-lg leading-relaxed text-white/60",
        className,
      )}
    >
      {children}
    </p>
  );
}
