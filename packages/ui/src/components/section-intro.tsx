import * as React from "react";
import { cn } from "../lib/utils";

interface SectionIntroProps {
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionIntro({ title, description, align = "center", className }: SectionIntroProps) {
  return (
    <div
      className={cn(
        "mb-10 max-w-2xl",
        align === "center" && "mx-auto text-center",
        align === "left" && "text-left",
        className,
      )}
    >
      <h2 className="font-serif text-[clamp(28px,4vw,44px)] font-bold leading-tight tracking-tight text-white">
        {title}
      </h2>
      {description && (
        <p className="mt-3 text-lg text-white/50 leading-relaxed">{description}</p>
      )}
    </div>
  );
}
