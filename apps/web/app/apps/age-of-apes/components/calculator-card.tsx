import Link from "next/link";
import { Card, CardContent } from "@repo/ui";
import type { CalculatorConfig } from "../lib/types";

interface CalculatorCardProps {
  calc: CalculatorConfig;
}

export function CalculatorCard({ calc }: CalculatorCardProps) {
  return (
    <Link
      href={`/apps/age-of-apes/${calc.slug}`}
      className="group block transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
    >
      <Card
        className="rounded-2xl shadow-none"
        style={{
          background: `linear-gradient(135deg, ${calc.color}18 0%, ${calc.color}08 100%)`,
          borderColor: `${calc.color}40`,
        }}
      >
        <CardContent className="p-5 pt-5">
          <div className="text-3xl mb-3">{calc.icon}</div>
          <h3
            className="font-heading text-base font-bold mb-1.5 transition-opacity group-hover:opacity-80"
            style={{ color: calc.color }}
          >
            {calc.label}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{calc.description}</p>
          <div
            className="mt-4 text-xs font-semibold transition-opacity group-hover:opacity-80"
            style={{ color: calc.color }}
          >
            Open Calculator →
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
