import { notFound } from "next/navigation";
import { GENERATIONS, getGeneration } from "../lib/generations";
import type { SlangTerm } from "../lib/types";
import { SlangApp } from "../components/slang-app";

interface Props {
  params: Promise<{ gen: string }>;
}

export async function generateStaticParams() {
  return GENERATIONS.map((g) => ({ gen: g.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { gen: slug } = await params;
  const gen = getGeneration(slug);
  if (!gen) return {};
  return {
    title: `${gen.emoji} ${gen.name} Slang Dictionary`,
    description: `${gen.name} (${gen.era}) slang dictionary, translator, and quiz. ${gen.tagline}.`,
  };
}

export default async function GenPage({ params }: Props) {
  const { gen: slug } = await params;
  const gen = getGeneration(slug);

  if (!gen) notFound();

  // Load data from JSON (static import at build time)
  const data = (await import(`../data/${slug}.json`)) as { default: SlangTerm[] };
  const terms: SlangTerm[] = data.default;

  return <SlangApp terms={terms} gen={gen} />;
}
