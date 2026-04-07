// ─── Building data ────────────────────────────────────────────────────────────

export interface BuildingLevel {
  level: string; // e.g. "0-1", "1-2"
  food: number;
  iron: number;
  batteries: number;
  nuApeCaps: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalPower: number;
  powerDelta: number;
}

export interface Building {
  name: string;
  levels: BuildingLevel[];
}

export type BuildingsData = Record<string, Building>;

// ─── Research data ────────────────────────────────────────────────────────────

export interface ResearchItem {
  name: string;
  maxLevel: number;
  basePower: number[];
}

export interface ResearchCategory {
  name: string;
  items: Record<string, ResearchItem>;
}

export interface ResearchData {
  categories: Record<string, ResearchCategory>;
}

// ─── Troops data ─────────────────────────────────────────────────────────────

export interface TroopTier {
  name: string;
  power: number;
  food: number;
  iron: number;
  nuApeCaps: number;
  trainTime: number; // seconds per troop
}

export interface TroopsData {
  types: string[];
  tiers: Record<string, TroopTier>;
}

// ─── Fighters data ────────────────────────────────────────────────────────────

export interface FighterXPEntry {
  level: number;
  xp: number;
  cumulative: number;
}

export interface FighterMedals {
  skill1: number;
  skill2: number;
  skill3: number;
  skill4: number;
  total: number;
  leap: number;
}

export interface FightersData {
  experience: Record<string, FighterXPEntry[]>;
  medals: Record<string, FighterMedals>;
  types: Record<string, string[]>;
}

// ─── Mechs data ───────────────────────────────────────────────────────────────

export interface MechForce {
  maxLevel: number;
  chipsPerLevel: number[];
  coresPerLevel: number[];
  powerPerLevel: number[];
}

export interface MechSkills {
  maxLevel: number;
  manualsPerLevel: number[];
}

export interface MechRarity {
  force: MechForce;
  skills: MechSkills;
}

export type MechsData = Record<string, MechRarity>;

// ─── Equipment data ───────────────────────────────────────────────────────────

export interface EquipmentRarity {
  maxLevel: number;
  materialsPerLevel: Record<string, number[]>;
}

export interface EquipmentData {
  slots: string[];
  rarities: Record<string, EquipmentRarity>;
}

// ─── Calculator config ────────────────────────────────────────────────────────

export type CalculatorSlug =
  | "buildings"
  | "research"
  | "troops"
  | "fighters"
  | "mechs"
  | "equipment"
  | "time";

export interface CalculatorConfig {
  slug: CalculatorSlug;
  label: string;
  description: string;
  icon: string;
  color: string;
}

// ─── Calculation results ──────────────────────────────────────────────────────

export interface ResultItem {
  label: string;
  value: string;
  highlight?: boolean;
}
