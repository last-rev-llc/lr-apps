import Link from "next/link";
import { Card, CardHeader, CardContent, Badge } from "@repo/ui";
import type { GenerationConfig } from "../lib/types";

interface Props {
  gen: GenerationConfig;
  termCount: number;
}

export function GenerationCard({ gen, termCount }: Props) {
  return (
    <Link
      href={`/apps/generations/${gen.slug}`}
      className="group block"
    >
      <Card
        className="hover:scale-[1.02] transition-all duration-200 border-surface-border bg-surface-card"
        style={{
          background: `linear-gradient(135deg, ${gen.color}15 0%, ${gen.color}06 100%)`,
          borderColor: `${gen.color}30`,
        }}
      >
        <CardHeader className="p-5 pb-0">
          <div className="flex items-start justify-between mb-3">
            <span className="text-3xl">{gen.emoji}</span>
            <Badge
              variant="secondary"
              className="text-xs font-semibold rounded-full"
              style={{ background: gen.color + "20", color: gen.color }}
            >
              {gen.era}
            </Badge>
          </div>
          <h3 className="font-bold text-lg mb-1 group-hover:text-accent transition-colors">
            {gen.name}
          </h3>
        </CardHeader>
        <CardContent className="p-5 pt-0">
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
      </Card>
    </Link>
  );
}
