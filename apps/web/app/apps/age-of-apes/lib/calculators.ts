import type {
  CalculatorConfig,
  CalculatorSlug,
  ResultItem,
  BuildingsData,
  ResearchData,
  TroopsData,
  FightersData,
  MechsData,
  EquipmentData,
} from "./types";
import { fmtNum, fmtExact, fmtTime, toSeconds, applySpeed, camelToLabel } from "./format";

// ─── Calculator registry ──────────────────────────────────────────────────────

export const CALCULATORS: CalculatorConfig[] = [
  {
    slug: "buildings",
    label: "Buildings",
    description: "Multi-level upgrade costs and time with speed buffs, Architect and Rise & Soar bonuses.",
    icon: "🏗️",
    color: "var(--color-accent)",
  },
  {
    slug: "research",
    label: "Research",
    description: "All four research trees — Civil, Military, Electronic, Weapons Technology.",
    icon: "🔬",
    color: "var(--color-pill-8)",
  },
  {
    slug: "troops",
    label: "Troops",
    description: "Resource costs and training time for all troop types, T1 through T6.",
    icon: "🛡️",
    color: "var(--color-pill-1)",
  },
  {
    slug: "fighters",
    label: "Fighters",
    description: "XP requirements for Rare, Epic, and Legendary fighters up to level 50.",
    icon: "⭐",
    color: "var(--color-green)",
  },
  {
    slug: "mechs",
    label: "Mechs",
    description: "Chips, cores, manuals, and estimated USD cost for mech upgrades.",
    icon: "🤖",
    color: "var(--color-pill-6)",
  },
  {
    slug: "equipment",
    label: "Equipment",
    description: "Material costs to upgrade equipment across all rarities and levels.",
    icon: "⚙️",
    color: "var(--color-pill-7)",
  },
  {
    slug: "time",
    label: "Time",
    description: "Convert any duration with a speed bonus to see actual and saved time.",
    icon: "⏱️",
    color: "var(--color-orange)",
  },
];

export function getCalculator(slug: string): CalculatorConfig | undefined {
  return CALCULATORS.find((c) => c.slug === slug);
}

// ─── Buildings calculation ────────────────────────────────────────────────────

export interface BuildingsInput {
  buildingKey: string;
  startLevel: number;
  endLevel: number;
  speedPercent: number;
  architect: boolean;
  riseAndSoar: boolean;
}

export function calcBuildings(data: BuildingsData, input: BuildingsInput): ResultItem[] {
  const building = data[input.buildingKey];
  if (!building) return [{ label: "Error", value: "Building not found" }];

  let totalSpeed = input.speedPercent;
  if (input.architect) totalSpeed += 3;
  if (input.riseAndSoar) totalSpeed += 10;

  let food = 0, iron = 0, batteries = 0, nuApeCaps = 0, totalSec = 0, power = 0;

  for (const lvl of building.levels) {
    const [fromStr, toStr] = lvl.level.split("-");
    const from = Number(fromStr);
    const to = Number(toStr);
    if (from >= input.startLevel && to <= input.endLevel) {
      food += lvl.food;
      iron += lvl.iron;
      batteries += lvl.batteries;
      nuApeCaps += lvl.nuApeCaps;
      totalSec += toSeconds(lvl.days, lvl.hours, lvl.minutes, lvl.seconds);
      power += lvl.powerDelta;
    }
  }

  const actualSec = applySpeed(totalSec, totalSpeed);

  return [
    { label: "Original Time", value: fmtTime(totalSec) },
    { label: "Actual Time", value: fmtTime(actualSec), highlight: true },
    { label: "Time Saved", value: fmtTime(totalSec - actualSec) },
    { label: "Power Gained", value: fmtExact(power), highlight: true },
    { label: "Food", value: fmtNum(food) },
    { label: "Iron", value: fmtNum(iron) },
    { label: "Batteries", value: fmtExact(batteries) },
    { label: "Nu-Ape Caps", value: fmtNum(nuApeCaps) },
  ];
}

// ─── Research calculation ─────────────────────────────────────────────────────

export interface ResearchInput {
  categoryKey: string;
  itemKey: string;
  startLevel: number;
  endLevel: number;
  speedPercent: number;
}

export function calcResearch(data: ResearchData, input: ResearchInput): ResultItem[] {
  const cat = data.categories[input.categoryKey];
  if (!cat) return [{ label: "Error", value: "Category not found" }];
  const item = cat.items[input.itemKey];
  if (!item) return [{ label: "Error", value: "Research item not found" }];

  const end = Math.min(input.endLevel, item.maxLevel);
  let power = 0;
  for (let i = input.startLevel; i < end; i++) {
    power += item.basePower[i] ?? 0;
  }

  // Simplified time estimate: power * 2 seconds (same as original)
  const estSec = power * 2;
  const actualSec = applySpeed(estSec, input.speedPercent);

  return [
    { label: "Research", value: item.name },
    { label: "Levels", value: `${input.startLevel} → ${end}` },
    { label: "Power Gained", value: fmtExact(power), highlight: true },
    { label: "Est. Time", value: fmtTime(estSec) },
    { label: "Actual Time", value: fmtTime(actualSec), highlight: true },
  ];
}

// ─── Troops calculation ───────────────────────────────────────────────────────

export interface TroopsInput {
  tierKey: string;
  quantity: number;
  speedPercent: number;
}

export function calcTroops(data: TroopsData, input: TroopsInput): ResultItem[] {
  const tier = data.tiers[input.tierKey];
  if (!tier) return [{ label: "Error", value: "Tier not found" }];

  const qty = input.quantity;
  const food = tier.food * qty;
  const iron = tier.iron * qty;
  const caps = tier.nuApeCaps * qty;
  const power = tier.power * qty;
  const totalSec = tier.trainTime * qty;
  const actualSec = applySpeed(totalSec, input.speedPercent);

  return [
    { label: "Power", value: fmtNum(power), highlight: true },
    { label: "Food", value: fmtNum(food) },
    { label: "Iron", value: fmtNum(iron) },
    { label: "Nu-Ape Caps", value: fmtNum(caps) },
    { label: "Train Time", value: fmtTime(totalSec) },
    { label: "Actual Time", value: fmtTime(actualSec), highlight: true },
  ];
}

// ─── Fighters calculation ─────────────────────────────────────────────────────

export interface FightersInput {
  rarity: string;
  startLevel: number;
  endLevel: number;
}

export function calcFighters(data: FightersData, input: FightersInput): ResultItem[] {
  const xpTable = data.experience[input.rarity];
  if (!xpTable) return [{ label: "Error", value: "Rarity not found" }];

  const startEntry = xpTable.find((d) => d.level === input.startLevel);
  const endEntry = xpTable.find((d) => d.level === input.endLevel);

  const startXP = startEntry?.cumulative ?? 0;
  const endXP = endEntry?.cumulative ?? 0;
  const needed = Math.max(0, endXP - startXP);

  const rarityLabel = input.rarity.charAt(0).toUpperCase() + input.rarity.slice(1);

  return [
    { label: "Rarity", value: rarityLabel },
    { label: "Levels", value: `${input.startLevel} → ${input.endLevel}` },
    { label: "XP Needed", value: fmtNum(needed), highlight: true },
    { label: "Start Cumulative", value: fmtNum(startXP) },
    { label: "End Cumulative", value: fmtNum(endXP) },
  ];
}

// ─── Mechs calculation ────────────────────────────────────────────────────────

export interface MechsInput {
  rarity: string;
  forceStart: number;
  forceEnd: number;
  skillStart: number;
  skillEnd: number;
}

export function calcMechs(data: MechsData, input: MechsInput): ResultItem[] {
  const mech = data[input.rarity];
  if (!mech) return [{ label: "Error", value: "Rarity not found" }];

  // Levels are 1-indexed; array is 0-indexed
  const fs = input.forceStart - 1;
  const fe = input.forceEnd - 1;
  const ss = input.skillStart - 1;
  const se = input.skillEnd - 1;

  let chips = 0, cores = 0, power = 0, manuals = 0;

  for (let i = fs; i <= fe; i++) {
    chips += mech.force.chipsPerLevel[i] ?? 0;
    cores += mech.force.coresPerLevel[i] ?? 0;
    power += mech.force.powerPerLevel[i] ?? 0;
  }

  for (let i = ss; i <= se; i++) {
    manuals += mech.skills.manualsPerLevel[i] ?? 0;
  }

  // Estimated USD: same formula as original
  const estUSD = Math.round((chips / 10000 + cores / 100 + manuals / 500) * 0.99);

  return [
    { label: "Chips", value: fmtNum(chips), highlight: true },
    { label: "Cores", value: fmtNum(cores), highlight: true },
    { label: "Power", value: fmtNum(power) },
    { label: "Manuals", value: fmtNum(manuals), highlight: true },
    { label: "Est. USD", value: `$${fmtExact(estUSD)}` },
  ];
}

// ─── Equipment calculation ────────────────────────────────────────────────────

export interface EquipmentInput {
  rarity: string;
  startLevel: number;
  endLevel: number;
  slots: number;
}

export function calcEquipment(data: EquipmentData, input: EquipmentInput): ResultItem[] {
  const eqData = data.rarities[input.rarity];
  if (!eqData) return [{ label: "Error", value: "Rarity not found" }];

  const start = input.startLevel - 1;
  const end = Math.min(input.endLevel, eqData.maxLevel) - 1;

  const results: ResultItem[] = [];

  for (const [matName, levels] of Object.entries(eqData.materialsPerLevel)) {
    let total = 0;
    for (let i = start; i <= end; i++) {
      total += levels[i] ?? 0;
    }
    total *= input.slots;
    results.push({ label: camelToLabel(matName), value: fmtNum(total) });
  }

  return results;
}

// ─── Time calculation ─────────────────────────────────────────────────────────

export interface TimeInput {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  speedPercent: number;
}

export function calcTime(input: TimeInput): ResultItem[] {
  const totalSec = toSeconds(input.days, input.hours, input.minutes, input.seconds);
  const actualSec = applySpeed(totalSec, input.speedPercent);
  const saved = totalSec - actualSec;

  return [
    { label: "Original Time", value: fmtTime(totalSec) },
    { label: "Actual Time", value: fmtTime(actualSec), highlight: true },
    { label: "Time Saved", value: fmtTime(saved), highlight: true },
    { label: "Speed Bonus", value: `${input.speedPercent}%` },
  ];
}

// ─── Slug guard ───────────────────────────────────────────────────────────────

export function isValidCalculatorSlug(slug: string): slug is CalculatorSlug {
  return CALCULATORS.some((c) => c.slug === slug);
}
