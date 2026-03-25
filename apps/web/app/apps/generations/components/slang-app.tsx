"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@repo/ui";
import type { SlangTerm, GenerationConfig } from "../lib/types";
import { SlangDictionary } from "./slang-dictionary";
import { SlangTranslator } from "./slang-translator";
import { SlangQuiz } from "./slang-quiz";

interface Props {
  terms: SlangTerm[];
  gen: GenerationConfig;
}

export function SlangApp({ terms, gen }: Props) {
  // Top-10 trending = highest vibe scores
  const trending = [...terms]
    .sort((a, b) => b.vibeScore - a.vibeScore)
    .slice(0, 20);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className="rounded-2xl p-6 border"
        style={{
          background: `linear-gradient(135deg, ${gen.color}18 0%, ${gen.color}08 100%)`,
          borderColor: `${gen.color}40`,
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-4xl">{gen.emoji}</span>
          <div>
            <h1 className="font-heading text-2xl font-bold">{gen.name} Slang</h1>
            <p className="text-muted-foreground text-sm">
              {gen.era} · {terms.length} terms · {gen.tagline}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="dictionary">
        <TabsList className="mb-4">
          <TabsTrigger value="dictionary">📖 Dictionary</TabsTrigger>
          <TabsTrigger value="translator">🔄 Translator</TabsTrigger>
          <TabsTrigger value="quiz">🎯 Quiz</TabsTrigger>
          <TabsTrigger value="trending">🔥 Trending</TabsTrigger>
        </TabsList>

        <TabsContent value="dictionary">
          <SlangDictionary terms={terms} gen={gen} />
        </TabsContent>

        <TabsContent value="translator">
          <SlangTranslator terms={terms} gen={gen} />
        </TabsContent>

        <TabsContent value="quiz">
          <SlangQuiz terms={terms} gen={gen} />
        </TabsContent>

        <TabsContent value="trending">
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="font-heading text-xl font-bold">
                🔥 Trending Wall
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Top {gen.name} slang ranked by vibe score
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {trending.map((term, i) => (
                <div
                  key={term.id}
                  className="relative p-4 rounded-2xl border border-surface-border bg-surface-card hover:border-opacity-60 transition-all text-center overflow-hidden cursor-default group"
                  title={term.definition}
                >
                  <span
                    className="absolute top-2 right-3 text-2xl font-black opacity-[0.12] group-hover:opacity-20 transition-opacity select-none"
                    aria-hidden
                  >
                    {term.vibeScore}
                  </span>
                  <p className="text-[10px] text-muted-foreground mb-1">
                    #{i + 1}
                  </p>
                  <p className="font-bold text-sm leading-tight">{term.term}</p>
                  <span
                    className="inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize"
                    style={{
                      background: gen.color + "20",
                      color: gen.color,
                    }}
                  >
                    {term.category}
                  </span>
                  <div
                    className="mt-3 h-1 rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${gen.color}, transparent)`,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
