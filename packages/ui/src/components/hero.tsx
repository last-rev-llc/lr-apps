import * as React from "react";
import { cn } from "../lib/utils";

interface HeroProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
}

export function Hero({ title, subtitle, children, className }: HeroProps) {
  return (
    <section
      className={cn(
        "relative flex min-h-[50vh] flex-col items-center justify-center px-6 py-16 text-center",
        className,
      )}
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-amber-400/10 blur-[80px]"
        aria-hidden
      />
      <div className="relative z-10 max-w-3xl">
        <h1 className="text-[clamp(2rem,5vw,3.5rem)] font-extrabold leading-tight text-white">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-4 text-lg text-white/60 leading-relaxed">{subtitle}</p>
        )}
        {children && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {children}
          </div>
        )}
      </div>
    </section>
  );
}
