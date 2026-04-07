import * as React from "react";
import { cn } from "../lib/utils";

interface PricingProps {
  title: string;
  price: number | string;
  period?: string;
  features: string[];
  cta?: React.ReactNode;
  highlighted?: boolean;
  className?: string;
}

export function Pricing({
  title,
  price,
  period,
  features,
  cta,
  highlighted = false,
  className,
}: PricingProps) {
  const priceDisplay =
    typeof price === "number"
      ? price === 0
        ? "$0"
        : `$${price}`
      : price;

  return (
    <div
      className={cn(
        "glass relative flex flex-col rounded-2xl border p-8 transition-transform hover:-translate-y-0.5",
        highlighted
          ? "border-amber-400/60 shadow-[0_0_24px_rgba(245,158,11,0.15)]"
          : "border-white/10",
        className,
      )}
    >
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-4 py-0.5 text-xs font-bold text-black">
          Most Popular
        </div>
      )}

      <h3 className="text-lg font-semibold text-white">{title}</h3>

      <div className="my-4 flex items-baseline gap-1">
        <span className="text-4xl font-extrabold text-white">{priceDisplay}</span>
        {period && <span className="text-sm text-white/50">/{period}</span>}
      </div>

      <ul className="mb-6 flex-1 space-y-2">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-white/70">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#22c55e"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {feature}
          </li>
        ))}
      </ul>

      {cta && <div className="mt-auto">{cta}</div>}
    </div>
  );
}
