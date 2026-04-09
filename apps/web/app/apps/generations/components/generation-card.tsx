import Link from "next/link";
import { Card, CardContent } from "@repo/ui";
import type { GenerationConfig } from "../lib/types";

interface Props {
  gen: GenerationConfig;
  termCount: number;
}

export function GenerationCard({ gen, termCount }: Props) {
  return (
    <Card
      className="group hover:scale-[1.02] transition-all duration-200 overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${gen.color}15 0%, ${gen.color}06 100%)`,
        borderColor: `${gen.color}30`,
      }}
    >
      <Link href={`/apps/generations/${gen.slug}`} className="block">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <span className="text-3xl">{gen.emoji}</span>
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: gen.color + "20", color: gen.color }}
            >
              {gen.era}
            </span>
          </div>
          <h3 className="font-bold text-lg mb-1 group-hover:text-accent transition-colors">
            {gen.name}
          </h3>
          <p className="text-muted-foreground text-xs mb-3 leading-relaxed">
            {gen.tagline}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {termCount} terms
            </span>
            <span
              className="text-xs font-semibold"
              style={{ color: gen.color }}
            >
              Explore →
            </span>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
