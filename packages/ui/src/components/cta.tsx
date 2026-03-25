import * as React from "react";
import { cn } from "../lib/utils";

interface CTAProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function CTA({ title, description, children, className }: CTAProps) {
  return (
    <div
      className={cn(
        "glass rounded-2xl border border-white/10 px-6 py-10 text-center",
        className,
      )}
    >
      <h3 className="text-2xl font-bold text-white">{title}</h3>
      {description && (
        <p className="mt-2 text-base text-white/60 leading-relaxed">{description}</p>
      )}
      {children && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {children}
        </div>
      )}
    </div>
  );
}
