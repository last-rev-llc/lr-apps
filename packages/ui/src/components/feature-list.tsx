import * as React from "react";
import { cn } from "../lib/utils";

export interface Feature {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

interface FeatureListProps {
  features: Feature[];
  columns?: 2 | 3 | 4;
  className?: string;
}

const colClass: Record<number, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

export function FeatureList({ features, columns = 3, className }: FeatureListProps) {
  return (
    <div className={cn("grid grid-cols-1 gap-4", colClass[columns], className)}>
      {features.map((feature, i) => (
        <div
          key={i}
          className="glass-sm flex gap-3 rounded-xl border border-white/10 p-5"
        >
          {feature.icon && (
            <span className="mt-0.5 flex-shrink-0 text-xl text-amber-400">
              {feature.icon}
            </span>
          )}
          <div>
            <div className="font-semibold text-white text-sm">{feature.title}</div>
            {feature.description && (
              <div className="mt-1 text-xs text-white/50 leading-relaxed">
                {feature.description}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
