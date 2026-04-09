"use client";

import { useState, useCallback } from "react";
import type {
  CalculatorSlug,
  BuildingsData,
  ResearchData,
  TroopsData,
  FightersData,
  MechsData,
  EquipmentData,
  ResultItem,
} from "../lib/types";
import {
  calcBuildings,
  calcResearch,
  calcTroops,
  calcFighters,
  calcMechs,
  calcEquipment,
  calcTime,
} from "../lib/calculators";

// ─── Shared UI primitives ─────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
      {children}
    </label>
  );
}

function Input({
  id,
  type = "number",
  value,
  onChange,
  min,
  max,
  placeholder,
}: {
  id?: string;
  type?: string;
  value: string | number;
  onChange: (v: string) => void;
  min?: number;
  max?: number;
  placeholder?: string;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      min={min}
      max={max}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-lg border border-surface-border bg-surface-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
    />
  );
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-lg border border-surface-border bg-surface-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
    >
      {children}
    </select>
  );
}

function CheckboxField({
  id,
  checked,
  onChange,
  label,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label
      htmlFor={id}
      className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-surface-border accent-accent"
      />
      {label}
    </label>
  );
}

function CalcButton({ onClick, color }: { onClick: () => void; color: string }) {
  return (
    <button
      onClick={onClick}
      className="px-5 py-2.5 rounded-lg text-sm font-semibold text-black transition-all hover:opacity-90 active:scale-95"
      style={{ background: color }}
    >
      Calculate
    </button>
  );
}

function ResultGrid({ items }: { items: ResultItem[] }) {
  if (!items.length) return null;
  return (
    <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className={`rounded-xl p-3 border ${
            item.highlight
              ? "border-accent/40 bg-accent/10"
              : "border-surface-border bg-surface-card"
          }`}
        >
          <div className="text-base font-bold font-heading leading-tight">
            {item.value}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

function FormGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
      {children}
    </div>
  );
}

// ─── Buildings calculator ─────────────────────────────────────────────────────

function BuildingsCalc({
  data,
  color,
}: {
  data: BuildingsData;
  color: string;
}) {
  const buildingKeys = Object.keys(data);
  const [building, setBuilding] = useState(buildingKeys[0] ?? "");
  const [startLevel, setStartLevel] = useState("1");
  const [endLevel, setEndLevel] = useState("30");
  const [speed, setSpeed] = useState("0");
  const [architect, setArchitect] = useState(false);
  const [riseAndSoar, setRiseAndSoar] = useState(false);
  const [results, setResults] = useState<ResultItem[]>([]);

  const calculate = useCallback(() => {
    setResults(
      calcBuildings(data, {
        buildingKey: building,
        startLevel: parseInt(startLevel) || 0,
        endLevel: parseInt(endLevel) || 1,
        speedPercent: parseFloat(speed) || 0,
        architect,
        riseAndSoar,
      })
    );
  }, [data, building, startLevel, endLevel, speed, architect, riseAndSoar]);

  return (
    <div>
      <FormGrid>
        <div>
          <Label>Building</Label>
          <Select value={building} onChange={setBuilding}>
            {buildingKeys.map((k) => (
              <option key={k} value={k}>
                {data[k]?.name ?? k}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Start Level</Label>
          <Input value={startLevel} onChange={setStartLevel} min={0} />
        </div>
        <div>
          <Label>End Level</Label>
          <Input value={endLevel} onChange={setEndLevel} min={1} />
        </div>
        <div>
          <Label>Speed %</Label>
          <Input value={speed} onChange={setSpeed} min={0} placeholder="0" />
        </div>
      </FormGrid>
      <div className="flex flex-wrap gap-4 mb-4">
        <CheckboxField
          id="bc-architect"
          checked={architect}
          onChange={setArchitect}
          label="Architect (+3%)"
        />
        <CheckboxField
          id="bc-rise"
          checked={riseAndSoar}
          onChange={setRiseAndSoar}
          label="Rise & Soar (+10%)"
        />
      </div>
      <CalcButton onClick={calculate} color={color} />
      <ResultGrid items={results} />
    </div>
  );
}

// ─── Research calculator ──────────────────────────────────────────────────────

function ResearchCalc({
  data,
  color,
}: {
  data: ResearchData;
  color: string;
}) {
  const catKeys = Object.keys(data.categories);
  const [catKey, setCatKey] = useState(catKeys[0] ?? "");
  const cat = data.categories[catKey];
  const itemKeys = cat ? Object.keys(cat.items) : [];
  const [itemKey, setItemKey] = useState(itemKeys[0] ?? "");
  const [startLevel, setStartLevel] = useState("0");
  const [endLevel, setEndLevel] = useState("10");
  const [speed, setSpeed] = useState("0");
  const [results, setResults] = useState<ResultItem[]>([]);

  // When category changes, reset item to first in new category
  const handleCatChange = (k: string) => {
    setCatKey(k);
    const newCat = data.categories[k];
    const newKeys = newCat ? Object.keys(newCat.items) : [];
    setItemKey(newKeys[0] ?? "");
  };

  const currentCat = data.categories[catKey];
  const currentItemKeys = currentCat ? Object.keys(currentCat.items) : [];

  const calculate = useCallback(() => {
    setResults(
      calcResearch(data, {
        categoryKey: catKey,
        itemKey,
        startLevel: parseInt(startLevel) || 0,
        endLevel: parseInt(endLevel) || 1,
        speedPercent: parseFloat(speed) || 0,
      })
    );
  }, [data, catKey, itemKey, startLevel, endLevel, speed]);

  return (
    <div>
      <FormGrid>
        <div>
          <Label>Category</Label>
          <Select value={catKey} onChange={handleCatChange}>
            {catKeys.map((k) => (
              <option key={k} value={k}>
                {data.categories[k]?.name ?? k}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Research Item</Label>
          <Select value={itemKey} onChange={setItemKey}>
            {currentItemKeys.map((k) => (
              <option key={k} value={k}>
                {currentCat?.items[k]?.name ?? k}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Start Level</Label>
          <Input value={startLevel} onChange={setStartLevel} min={0} />
        </div>
        <div>
          <Label>End Level</Label>
          <Input value={endLevel} onChange={setEndLevel} min={1} />
        </div>
        <div>
          <Label>Speed %</Label>
          <Input value={speed} onChange={setSpeed} min={0} placeholder="0" />
        </div>
      </FormGrid>
      <CalcButton onClick={calculate} color={color} />
      <ResultGrid items={results} />
    </div>
  );
}

// ─── Troops calculator ────────────────────────────────────────────────────────

function TroopsCalc({
  data,
  color,
}: {
  data: TroopsData;
  color: string;
}) {
  const tierKeys = Object.keys(data.tiers);
  const [tierKey, setTierKey] = useState(tierKeys[0] ?? "");
  const [quantity, setQuantity] = useState("1000");
  const [speed, setSpeed] = useState("0");
  const [results, setResults] = useState<ResultItem[]>([]);

  const calculate = useCallback(() => {
    setResults(
      calcTroops(data, {
        tierKey,
        quantity: parseInt(quantity) || 1,
        speedPercent: parseFloat(speed) || 0,
      })
    );
  }, [data, tierKey, quantity, speed]);

  return (
    <div>
      <FormGrid>
        <div>
          <Label>Tier</Label>
          <Select value={tierKey} onChange={setTierKey}>
            {tierKeys.map((k) => (
              <option key={k} value={k}>
                {k} — {data.tiers[k]?.name ?? k}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Quantity</Label>
          <Input value={quantity} onChange={setQuantity} min={1} />
        </div>
        <div>
          <Label>Training Speed %</Label>
          <Input value={speed} onChange={setSpeed} min={0} placeholder="0" />
        </div>
      </FormGrid>
      <CalcButton onClick={calculate} color={color} />
      <ResultGrid items={results} />
    </div>
  );
}

// ─── Fighters calculator ──────────────────────────────────────────────────────

function FightersCalc({
  data,
  color,
}: {
  data: FightersData;
  color: string;
}) {
  const [rarity, setRarity] = useState("rare");
  const [startLevel, setStartLevel] = useState("1");
  const [endLevel, setEndLevel] = useState("50");
  const [results, setResults] = useState<ResultItem[]>([]);

  const calculate = useCallback(() => {
    setResults(
      calcFighters(data, {
        rarity,
        startLevel: parseInt(startLevel) || 1,
        endLevel: parseInt(endLevel) || 50,
      })
    );
  }, [data, rarity, startLevel, endLevel]);

  return (
    <div>
      <FormGrid>
        <div>
          <Label>Rarity</Label>
          <Select value={rarity} onChange={setRarity}>
            <option value="rare">Rare</option>
            <option value="epic">Epic</option>
            <option value="legendary">Legendary</option>
          </Select>
        </div>
        <div>
          <Label>Current Level</Label>
          <Input value={startLevel} onChange={setStartLevel} min={1} max={50} />
        </div>
        <div>
          <Label>Target Level</Label>
          <Input value={endLevel} onChange={setEndLevel} min={1} max={50} />
        </div>
      </FormGrid>
      <CalcButton onClick={calculate} color={color} />
      <ResultGrid items={results} />
    </div>
  );
}

// ─── Mechs calculator ─────────────────────────────────────────────────────────

function MechsCalc({
  data,
  color,
}: {
  data: MechsData;
  color: string;
}) {
  const [rarity, setRarity] = useState("epic");
  const [forceStart, setForceStart] = useState("1");
  const [forceEnd, setForceEnd] = useState("60");
  const [skillStart, setSkillStart] = useState("1");
  const [skillEnd, setSkillEnd] = useState("30");
  const [results, setResults] = useState<ResultItem[]>([]);

  const calculate = useCallback(() => {
    setResults(
      calcMechs(data, {
        rarity,
        forceStart: parseInt(forceStart) || 1,
        forceEnd: parseInt(forceEnd) || 60,
        skillStart: parseInt(skillStart) || 1,
        skillEnd: parseInt(skillEnd) || 30,
      })
    );
  }, [data, rarity, forceStart, forceEnd, skillStart, skillEnd]);

  return (
    <div>
      <FormGrid>
        <div>
          <Label>Rarity</Label>
          <Select value={rarity} onChange={setRarity}>
            <option value="epic">Epic</option>
            <option value="legendary">Legendary</option>
          </Select>
        </div>
        <div>
          <Label>Force Start Level</Label>
          <Input value={forceStart} onChange={setForceStart} min={1} max={60} />
        </div>
        <div>
          <Label>Force End Level</Label>
          <Input value={forceEnd} onChange={setForceEnd} min={1} max={60} />
        </div>
        <div>
          <Label>Skill Start Level</Label>
          <Input value={skillStart} onChange={setSkillStart} min={1} max={30} />
        </div>
        <div>
          <Label>Skill End Level</Label>
          <Input value={skillEnd} onChange={setSkillEnd} min={1} max={30} />
        </div>
      </FormGrid>
      <CalcButton onClick={calculate} color={color} />
      <ResultGrid items={results} />
    </div>
  );
}

// ─── Equipment calculator ─────────────────────────────────────────────────────

function EquipmentCalc({
  data,
  color,
}: {
  data: EquipmentData;
  color: string;
}) {
  const rarityKeys = Object.keys(data.rarities);
  const [rarity, setRarity] = useState(rarityKeys[0] ?? "rare");
  const [startLevel, setStartLevel] = useState("1");
  const [endLevel, setEndLevel] = useState("30");
  const [slots, setSlots] = useState("4");
  const [results, setResults] = useState<ResultItem[]>([]);

  const calculate = useCallback(() => {
    setResults(
      calcEquipment(data, {
        rarity,
        startLevel: parseInt(startLevel) || 1,
        endLevel: parseInt(endLevel) || 30,
        slots: parseInt(slots) || 1,
      })
    );
  }, [data, rarity, startLevel, endLevel, slots]);

  return (
    <div>
      <FormGrid>
        <div>
          <Label>Rarity</Label>
          <Select value={rarity} onChange={setRarity}>
            {rarityKeys.map((k) => (
              <option key={k} value={k}>
                {k.charAt(0).toUpperCase() + k.slice(1)}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Start Level</Label>
          <Input value={startLevel} onChange={setStartLevel} min={1} />
        </div>
        <div>
          <Label>End Level</Label>
          <Input value={endLevel} onChange={setEndLevel} min={1} />
        </div>
        <div>
          <Label>Number of Slots (max 4)</Label>
          <Input value={slots} onChange={setSlots} min={1} max={4} />
        </div>
      </FormGrid>
      <CalcButton onClick={calculate} color={color} />
      <ResultGrid items={results} />
    </div>
  );
}

// ─── Time calculator ──────────────────────────────────────────────────────────

function TimeCalc({ color }: { color: string }) {
  const [days, setDays] = useState("0");
  const [hours, setHours] = useState("0");
  const [minutes, setMinutes] = useState("0");
  const [seconds, setSeconds] = useState("0");
  const [speed, setSpeed] = useState("50");
  const [results, setResults] = useState<ResultItem[]>([]);

  const calculate = useCallback(() => {
    setResults(
      calcTime({
        days: parseInt(days) || 0,
        hours: parseInt(hours) || 0,
        minutes: parseInt(minutes) || 0,
        seconds: parseInt(seconds) || 0,
        speedPercent: parseFloat(speed) || 0,
      })
    );
  }, [days, hours, minutes, seconds, speed]);

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
        <div>
          <Label>Days</Label>
          <Input value={days} onChange={setDays} min={0} />
        </div>
        <div>
          <Label>Hours</Label>
          <Input value={hours} onChange={setHours} min={0} />
        </div>
        <div>
          <Label>Minutes</Label>
          <Input value={minutes} onChange={setMinutes} min={0} />
        </div>
        <div>
          <Label>Seconds</Label>
          <Input value={seconds} onChange={setSeconds} min={0} />
        </div>
        <div>
          <Label>Speed %</Label>
          <Input value={speed} onChange={setSpeed} min={0} placeholder="50" />
        </div>
      </div>
      <CalcButton onClick={calculate} color={color} />
      <ResultGrid items={results} />
    </div>
  );
}

// ─── Main calculator app ──────────────────────────────────────────────────────

interface CalculatorAppProps {
  slug: CalculatorSlug;
  label: string;
  color: string;
  buildings: BuildingsData;
  research: ResearchData;
  troops: TroopsData;
  fighters: FightersData;
  mechs: MechsData;
  equipment: EquipmentData;
}

export function CalculatorApp({
  slug,
  label,
  color,
  buildings,
  research,
  troops,
  fighters,
  mechs,
  equipment,
}: CalculatorAppProps) {
  const renderCalc = () => {
    switch (slug) {
      case "buildings":
        return <BuildingsCalc data={buildings} color={color} />;
      case "research":
        return <ResearchCalc data={research} color={color} />;
      case "troops":
        return <TroopsCalc data={troops} color={color} />;
      case "fighters":
        return <FightersCalc data={fighters} color={color} />;
      case "mechs":
        return <MechsCalc data={mechs} color={color} />;
      case "equipment":
        return <EquipmentCalc data={equipment} color={color} />;
      case "time":
        return <TimeCalc color={color} />;
      default:
        return <p className="text-muted-foreground">Unknown calculator.</p>;
    }
  };

  return (
    <div
      className="rounded-2xl border p-6"
      style={{
        borderColor: `${color}40`,
        background: `linear-gradient(135deg, ${color}10 0%, ${color}04 100%)`,
      }}
    >
      <h2
        className="font-heading text-xl font-bold mb-5"
        style={{ color }}
      >
        {label} Calculator
      </h2>
      {renderCalc()}
    </div>
  );
}
