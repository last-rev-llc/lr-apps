import { notFound } from "next/navigation";
import Link from "next/link";
import { CALCULATORS, getCalculator, isValidCalculatorSlug } from "../lib/calculators";
import { CalculatorApp } from "../components/calculator-app";

// Static data imports — all resolved at build/request time on the server
import buildingsData from "../data/buildings.json";
import fightersData from "../data/fighters.json";
import troopsData from "../data/troops.json";
import researchData from "../data/research.json";
import mechsData from "../data/mechs.json";
import equipmentData from "../data/equipment.json";

import type {
  BuildingsData,
  FightersData,
  TroopsData,
  ResearchData,
  MechsData,
  EquipmentData,
} from "../lib/types";

// Tell Next.js all valid slugs at build time
export function generateStaticParams() {
  return CALCULATORS.map((calc) => ({ calculator: calc.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ calculator: string }>;
}) {
  const { calculator } = await params;
  const calc = getCalculator(calculator);
  if (!calc) return {};
  return {
    title: `${calc.icon} ${calc.label} Calculator — Age of Apes Guide`,
    description: calc.description,
  };
}

export default async function CalculatorPage({
  params,
}: {
  params: Promise<{ calculator: string }>;
}) {
  const { calculator } = await params;

  if (!isValidCalculatorSlug(calculator)) {
    notFound();
  }

  const calc = getCalculator(calculator)!;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/apps/age-of-apes" className="hover:text-foreground transition-colors">
          🦍 Age of Apes
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">
          {calc.icon} {calc.label}
        </span>
      </nav>

      {/* Description */}
      <div>
        <p className="text-muted-foreground text-sm max-w-2xl">{calc.description}</p>
      </div>

      {/* Calculator — client component with all data passed as props */}
      <CalculatorApp
        slug={calc.slug}
        label={calc.label}
        color={calc.color}
        buildings={buildingsData as BuildingsData}
        research={researchData as ResearchData}
        troops={troopsData as TroopsData}
        fighters={fightersData as FightersData}
        mechs={mechsData as MechsData}
        equipment={equipmentData as EquipmentData}
      />

      {/* Other calculators */}
      <section className="border-t border-surface-border pt-6">
        <h3 className="font-heading text-sm font-semibold text-muted-foreground mb-3">
          Other Calculators
        </h3>
        <div className="flex flex-wrap gap-2">
          {CALCULATORS.filter((c) => c.slug !== calculator).map((c) => (
            <Link
              key={c.slug}
              href={`/apps/age-of-apes/${c.slug}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all hover:scale-105"
              style={{
                background: c.color + "15",
                borderColor: c.color + "40",
                color: c.color,
              }}
            >
              {c.icon} {c.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
