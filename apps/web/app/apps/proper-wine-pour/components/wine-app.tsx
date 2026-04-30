"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@repo/db/client";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Card,
  CardContent,
  Input,
  Button,
  Badge,
} from "@repo/ui";
import type { Restaurant, WinePour, WallPost, PourRating, WallPostType } from "../lib/types";
import pourSizesData from "../data/pour-sizes.json";

interface PourSizeConfig {
  fill: number;
  label: string;
  size: string;
  note: string;
  color: string;
  noteColor: string;
}

interface GlassTypeConfig {
  fill: number;
  label: string;
  sublabel: string;
  note: string;
  color: string;
}

const POUR_SIZES = pourSizesData.pourSizes as PourSizeConfig[];
const GLASS_TYPES = pourSizesData.glassTypes as GlassTypeConfig[];

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "guide" | "calculator" | "tracker" | "knowledge" | "wall";

interface Props {
  restaurants: Restaurant[];
  initialPourLogs: WinePour[];
  initialWallPosts: WallPost[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const POUR_RATING_BADGE: Record<PourRating, { variant: "secondary" | "destructive" | "outline"; className: string }> = {
  generous: { variant: "secondary", className: "bg-green/15 text-green border-green/30" },
  standard: { variant: "secondary", className: "" },
  stingy: { variant: "outline", className: "bg-orange/15 text-orange border-orange/30" },
  criminal: { variant: "destructive", className: "" },
};

// ─── Wine Glass SVG ───────────────────────────────────────────────────────────

function WineGlass({
  fillPct,
  size,
  id,
  color = "var(--color-red)",
}: {
  fillPct: number;
  size: number;
  id: string;
  color?: string;
}) {
  const bowlH = 80;
  const fillH = bowlH * fillPct;
  const y = 30 + bowlH - fillH;
  return (
    <svg viewBox="0 0 80 160" width={size} className="inline-block">
      <ellipse cx="40" cy="30" rx="28" ry="8" fill="none" stroke="var(--color-slate-dim)" strokeWidth="1.5" />
      <path d="M12,30 Q12,110 30,115 L30,140 L50,140 L50,115 Q68,110 68,30" fill="none" stroke="var(--color-slate-dim)" strokeWidth="1.5" />
      <rect
        x="12"
        y={y}
        width="56"
        height={fillH}
        fill={color}
        opacity="0.6"
        rx="2"
        clipPath={`url(#bowl-clip-${id})`}
      />
      <defs>
        <clipPath id={`bowl-clip-${id}`}>
          <path d="M12,30 Q12,110 30,115 L50,115 Q68,110 68,30 Z" />
        </clipPath>
      </defs>
      <line x1="20" y1="140" x2="60" y2="140" stroke="var(--color-slate-dim)" strokeWidth="2" />
      <ellipse cx="40" cy="142" rx="22" ry="5" fill="none" stroke="var(--color-slate-dim)" strokeWidth="1.5" />
    </svg>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function GuideTab() {
  const t = useTranslations("proper-wine-pour.guide");
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="font-heading text-2xl mb-1">{t("heading")}</h2>
        <p className="text-muted-foreground text-sm">{t("subheading")}</p>
      </div>

      {/* Pour size cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {POUR_SIZES.map((g) => (
          <div key={g.label} className="glass text-center p-4 rounded-xl">
            <div className="flex justify-center mb-3">
              <WineGlass fillPct={g.fill} size={70} id={g.label.replace(/\s/g, "")} color={g.color} />
            </div>
            <h4 className="font-semibold text-sm mb-0.5">{g.label}</h4>
            <p className="text-muted-foreground text-xs">{g.size}</p>
            <p className={`text-xs mt-1 ${g.noteColor}`}>{g.note}</p>
          </div>
        ))}
      </div>

      {/* Golden rule */}
      <div className="border border-red rounded-xl p-5 text-center" style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--color-red) 30%, transparent), color-mix(in srgb, var(--color-red) 20%, transparent))" }}>
        <h3 className="font-heading text-xl mb-2" style={{ color: "var(--color-pill-6)" }}>{t("goldenRuleHeading")}</h3>
        <p className="text-sm font-semibold mb-1">{t("goldenRuleLine1")}</p>
        <p className="text-muted-foreground text-xs">{t("goldenRuleLine2")}</p>
        <p className="text-muted-foreground text-xs mt-1">{t("goldenRuleLine3")}</p>
      </div>

      {/* Glass types */}
      <div>
        <h3 className="font-heading text-lg mb-4">{t("glassTypesHeading")}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {GLASS_TYPES.map((g) => (
            <div key={g.label} className="glass text-center p-4 rounded-xl">
              <div className="flex justify-center mb-3">
                <WineGlass fillPct={g.fill} size={60} id={`type-${g.label.replace(/\s/g, "")}`} color={g.color} />
              </div>
              <h4 className="font-semibold text-xs mb-0.5">{g.label}</h4>
              <p className="text-muted-foreground text-xs">{g.sublabel}</p>
              <p className="text-muted-foreground text-[10px] mt-0.5">{g.note}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CalculatorTab() {
  const t = useTranslations("proper-wine-pour.calculator");
  const [bottlePrice, setBottlePrice] = useState(45);
  const [pourSize, setPourSize] = useState(5);
  const [glassPrice, setGlassPrice] = useState(18);

  const glassesPerBottle = 750 / (pourSize * 29.5735);
  const costPerGlass = (bottlePrice / glassesPerBottle).toFixed(2);
  const costPerOz = (bottlePrice / 25.36).toFixed(2);
  const markup = glassPrice / parseFloat(costPerGlass);
  const ripOff = Math.min(100, Math.max(0, ((markup - 1) / 4) * 100));

  let ripLabel = t("ripFair");
  if (ripOff > 75) ripLabel = t("ripRobbery");
  else if (ripOff > 55) ripLabel = t("ripOutrageous");
  else if (ripOff > 35) ripLabel = t("ripSteep");
  else if (ripOff > 15) ripLabel = t("ripNormal");

  const markupPct = (markup * 100).toFixed(0);
  const markupColor = ripOff > 55 ? "var(--color-red)" : ripOff > 30 ? "var(--color-orange)" : "var(--color-green)";

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="font-heading text-2xl mb-1">{t("heading")}</h2>
        <p className="text-muted-foreground text-sm">{t("subheading")}</p>
      </div>

      <Card className="glass border-surface-border">
        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="wine-bottle-price"
                className="block text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-1"
              >
                {t("labelBottlePrice")}
              </label>
              <Input
                id="wine-bottle-price"
                type="number"
                value={bottlePrice}
                min={5}
                max={500}
                onChange={(e) => setBottlePrice(parseFloat(e.target.value) || 0)}
                className="glass-input focus-visible:ring-accent"
              />
            </div>
            <div>
              <label
                htmlFor="wine-pour-size"
                className="block text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-1"
              >
                {t("labelPourSize")}
              </label>
              <Input
                id="wine-pour-size"
                type="number"
                value={pourSize}
                min={1}
                max={10}
                step={0.5}
                onChange={(e) => setPourSize(parseFloat(e.target.value) || 0)}
                className="glass-input focus-visible:ring-accent"
              />
            </div>
            <div>
              <label
                htmlFor="wine-glass-price"
                className="block text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-1"
              >
                {t("labelGlassPrice")}
              </label>
              <Input
                id="wine-glass-price"
                type="number"
                value={glassPrice}
                min={5}
                max={200}
                onChange={(e) => setGlassPrice(parseFloat(e.target.value) || 0)}
                className="glass-input focus-visible:ring-accent"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card className="glass border-surface-border">
        <CardContent className="p-5 space-y-3">
          {[
            { key: "costPerGlass", label: t("rowCostPerGlass"), value: `$${costPerGlass}` },
            { key: "costPerOz", label: t("rowCostPerOz"), value: `$${costPerOz}` },
            { key: "restaurantPrice", label: t("rowRestaurantPrice"), value: `$${glassPrice.toFixed(2)}` },
            { key: "markup", label: t("rowMarkup"), value: `${markupPct}%` },
            { key: "glassesPerBottle", label: t("rowGlassesPerBottle"), value: glassesPerBottle.toFixed(1) },
          ].map((row) => (
            <div key={row.key} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
              <span className="text-muted-foreground text-sm">{row.label}</span>
              <span
                className="font-bold text-base"
                style={row.key === "markup" ? { color: markupColor } : undefined}
              >
                {row.value}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Rip-off meter */}
      <Card className="glass border-surface-border">
        <CardContent className="p-5">
          <h4 className="font-heading text-center mb-3">
            {t("ripOffHeading")}{" "}
            <span style={{ color: markupColor }}>{ripLabel}</span>
          </h4>
          <div
            className="h-6 rounded-full relative overflow-hidden"
            style={{ background: "linear-gradient(90deg, var(--color-green), var(--color-yellow), var(--color-orange), var(--color-red), oklch(from var(--color-red) calc(l - 0.2) c h))" }}
          >
            <div
              className="absolute top-[-4px] w-1 h-8 bg-white rounded-sm shadow-[0_0_8px_oklch(100%_0_0/0.8)] transition-all duration-500"
              style={{ left: `calc(${ripOff}% - 2px)` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
            <span>{t("scaleFair")}</span>
            <span>{t("scaleNormal")}</span>
            <span>{t("scaleSteep")}</span>
            <span>{t("scaleOutrageous")}</span>
            <span>{t("scaleRobbery")}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TrackerTab({ restaurants, pourLogs, onAddPour }: {
  restaurants: Restaurant[];
  pourLogs: WinePour[];
  onAddPour: (pour: Omit<WinePour, "id" | "created_at">) => Promise<void>;
}) {
  const t = useTranslations("proper-wine-pour.tracker");
  const [filterRating, setFilterRating] = useState<PourRating | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    restaurant_name: "",
    wine_name: "",
    pour_rating: "standard" as PourRating,
    price_paid: "",
    notes: "",
    user_name: "",
  });

  const RATING_ORDER: Record<PourRating, number> = { generous: 0, standard: 1, stingy: 2, criminal: 3 };

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return [...restaurants]
      .sort((a, b) => RATING_ORDER[a.pour_rating] - RATING_ORDER[b.pour_rating])
      .filter((r) => filterRating === "all" || r.pour_rating === filterRating)
      .filter((r) =>
        !q || r.name.toLowerCase().includes(q) || r.neighborhood.toLowerCase().includes(q)
      );
  }, [restaurants, filterRating, searchQuery]);

  async function handleSave() {
    if (!form.restaurant_name || !form.wine_name) return;
    setSaving(true);
    try {
      await onAddPour({
        restaurant_name: form.restaurant_name,
        wine_name: form.wine_name,
        pour_rating: form.pour_rating,
        price_paid: form.price_paid ? parseFloat(form.price_paid) : null,
        notes: form.notes || null,
        user_name: form.user_name || t("anonymous"),
      });
      setShowForm(false);
      setForm({ restaurant_name: "", wine_name: "", pour_rating: "standard", price_paid: "", notes: "", user_name: "" });
    } finally {
      setSaving(false);
    }
  }

  const generous = restaurants.filter((r) => r.pour_rating === "generous").length;

  const filterLabel = (r: "all" | PourRating) => {
    if (r === "all") return t("filterAll");
    return t(`filter${r.charAt(0).toUpperCase()}${r.slice(1)}` as
      | "filterGenerous"
      | "filterStandard"
      | "filterStingy"
      | "filterCriminal");
  };

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="font-heading text-2xl mb-1">{t("heading")}</h2>
        <p className="text-muted-foreground text-sm">{t("subheading")}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="glass rounded-xl p-3">
          <div className="text-2xl font-bold text-green">{generous}</div>
          <div className="text-xs text-muted-foreground">{t("statGenerous")}</div>
        </div>
        <div className="glass rounded-xl p-3">
          <div className="text-2xl font-bold">{restaurants.length}</div>
          <div className="text-xs text-muted-foreground">{t("statRestaurants")}</div>
        </div>
        <div className="glass rounded-xl p-3">
          <div className="text-2xl font-bold">{pourLogs.length}</div>
          <div className="text-xs text-muted-foreground">{t("statPours")}</div>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 items-center">
        {(["all", "generous", "standard", "stingy", "criminal"] as const).map((r) => (
          <Button
            key={r}
            variant={filterRating === r ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterRating(r)}
            className={`rounded-full text-xs capitalize ${filterRating === r ? "bg-accent text-black border-accent" : ""}`}
          >
            {filterLabel(r)}
          </Button>
        ))}
        <Input
          type="text"
          placeholder={t("searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="ml-auto w-48 glass-input text-sm"
        />
      </div>

      <div className="flex justify-end">
        <Button
          variant={showForm ? "outline" : "default"}
          onClick={() => setShowForm((v) => !v)}
          className={showForm ? "" : "bg-accent text-black hover:opacity-90"}
        >
          {showForm ? t("buttonCancel") : t("buttonLogPour")}
        </Button>
      </div>

      {/* Log pour form */}
      {showForm && (
        <Card className="glass border-surface-border">
          <CardContent className="p-5 space-y-3">
            <h3 className="font-heading text-base mb-2">{t("formHeading")}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="wine-restaurant-name" className="block text-xs text-muted-foreground font-semibold mb-1">{t("labelRestaurantName")}</label>
                <Input
                  id="wine-restaurant-name"
                  type="text"
                  placeholder={t("placeholderRestaurant")}
                  value={form.restaurant_name}
                  onChange={(e) => setForm((f) => ({ ...f, restaurant_name: e.target.value }))}
                  className="glass-input"
                />
              </div>
              <div>
                <label htmlFor="wine-name" className="block text-xs text-muted-foreground font-semibold mb-1">{t("labelWineName")}</label>
                <Input
                  id="wine-name"
                  type="text"
                  placeholder={t("placeholderWine")}
                  value={form.wine_name}
                  onChange={(e) => setForm((f) => ({ ...f, wine_name: e.target.value }))}
                  className="glass-input"
                />
              </div>
              <div>
                <label htmlFor="wine-pour-rating" className="block text-xs text-muted-foreground font-semibold mb-1">{t("labelPourRating")}</label>
                <select
                  id="wine-pour-rating"
                  value={form.pour_rating}
                  onChange={(e) => setForm((f) => ({ ...f, pour_rating: e.target.value as PourRating }))}
                  className="w-full px-3 py-2 glass-input text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="generous">{t("ratingGenerous")}</option>
                  <option value="standard">{t("ratingStandard")}</option>
                  <option value="stingy">{t("ratingStingy")}</option>
                  <option value="criminal">{t("ratingCriminal")}</option>
                </select>
              </div>
              <div>
                <label htmlFor="wine-price-paid" className="block text-xs text-muted-foreground font-semibold mb-1">{t("labelPricePaid")}</label>
                <Input
                  id="wine-price-paid"
                  type="number"
                  placeholder={t("placeholderPrice")}
                  min={1}
                  max={500}
                  value={form.price_paid}
                  onChange={(e) => setForm((f) => ({ ...f, price_paid: e.target.value }))}
                  className="glass-input"
                />
              </div>
            </div>
            <div>
              <label htmlFor="wine-notes" className="block text-xs text-muted-foreground font-semibold mb-1">{t("labelNotes")}</label>
              <textarea
                id="wine-notes"
                placeholder={t("placeholderNotes")}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full px-3 py-2 glass-input text-sm focus:outline-none focus:ring-1 focus:ring-accent min-h-16 resize-y"
              />
            </div>
            <div>
              <label htmlFor="wine-user-name-pour" className="block text-xs text-muted-foreground font-semibold mb-1">{t("labelUserName")}</label>
              <Input
                id="wine-user-name-pour"
                type="text"
                placeholder={t("placeholderUserName")}
                value={form.user_name}
                onChange={(e) => setForm((f) => ({ ...f, user_name: e.target.value }))}
                className="glass-input"
              />
            </div>
            <Button
              onClick={handleSave}
              disabled={saving || !form.restaurant_name || !form.wine_name}
              className="bg-accent text-black hover:opacity-90"
            >
              {saving ? t("buttonSaving") : t("buttonSave")}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Restaurant list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <div className="text-3xl mb-2">🍷</div>
            <p className="text-sm">{t("emptyState")}</p>
          </div>
        ) : (
          filtered.map((r) => (
            <Card key={r.id} className="glass border-surface-border">
              <CardContent className="p-4 flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-semibold text-sm">{r.name}</h4>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    {t("restaurantMeta", { neighborhood: r.neighborhood, price: r.avg_glass_price })}
                  </p>
                  <div className="flex gap-0.5 mt-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span key={i} className={i < r.wine_list_rating ? "text-red" : "text-muted-foreground"}>
                        {i < r.wine_list_rating ? "🍷" : "○"}
                      </span>
                    ))}
                  </div>
                  {r.notes && (
                    <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{r.notes}</p>
                  )}
                </div>
                <Badge
                  variant={POUR_RATING_BADGE[r.pour_rating].variant}
                  className={`shrink-0 uppercase text-xs ${POUR_RATING_BADGE[r.pour_rating].className}`}
                >
                  {r.pour_rating}
                </Badge>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function KnowledgeTab() {
  const t = useTranslations("proper-wine-pour.knowledge");

  const temps = [
    { type: t("temp1Type"), temp: t("temp1Temp"), tip: t("temp1Tip") },
    { type: t("temp2Type"), temp: t("temp2Temp"), tip: t("temp2Tip") },
    { type: t("temp3Type"), temp: t("temp3Temp"), tip: t("temp3Tip") },
    { type: t("temp4Type"), temp: t("temp4Temp"), tip: t("temp4Tip") },
    { type: t("temp5Type"), temp: t("temp5Temp"), tip: t("temp5Tip") },
    { type: t("temp6Type"), temp: t("temp6Temp"), tip: t("temp6Tip") },
  ];

  const pairings = [
    { food: t("pair1Food"), wine: t("pair1Wine") },
    { food: t("pair2Food"), wine: t("pair2Wine") },
    { food: t("pair3Food"), wine: t("pair3Wine") },
    { food: t("pair4Food"), wine: t("pair4Wine") },
    { food: t("pair5Food"), wine: t("pair5Wine") },
    { food: t("pair6Food"), wine: t("pair6Wine") },
  ];

  const shortPourTests = [
    { title: t("short1Title"), body: t("short1Body") },
    { title: t("short2Title"), body: t("short2Body") },
    { title: t("short3Title"), body: t("short3Body") },
    { title: t("short4Title"), body: t("short4Body") },
  ];

  const terms = [
    { term: t("term1"), def: t("term1Def") },
    { term: t("term2"), def: t("term2Def") },
    { term: t("term3"), def: t("term3Def") },
    { term: t("term4"), def: t("term4Def") },
    { term: t("term5"), def: t("term5Def") },
    { term: t("term6"), def: t("term6Def") },
    { term: t("term7"), def: t("term7Def") },
    { term: t("term8"), def: t("term8Def") },
    { term: t("term9"), def: t("term9Def") },
    { term: t("term10"), def: t("term10Def") },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="font-heading text-2xl mb-1">{t("heading")}</h2>
        <p className="text-muted-foreground text-sm">{t("subheading")}</p>
      </div>

      {/* Serving Temperatures */}
      <section>
        <h3 className="font-heading text-lg mb-3">{t("tempsHeading")}</h3>
        <div className="glass rounded-xl overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-2 text-xs text-muted-foreground uppercase tracking-wide font-semibold">{t("tempsCol1")}</th>
                <th className="text-left px-4 py-2 text-xs text-muted-foreground uppercase tracking-wide font-semibold">{t("tempsCol2")}</th>
                <th className="text-left px-4 py-2 text-xs text-muted-foreground uppercase tracking-wide font-semibold hidden sm:table-cell">{t("tempsCol3")}</th>
              </tr>
            </thead>
            <tbody>
              {temps.map((row) => (
                <tr key={row.type} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-2.5 font-medium">{row.type}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{row.temp}</td>
                  <td className="px-4 py-2.5 text-muted-foreground hidden sm:table-cell">{row.tip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Food Pairings */}
      <section>
        <h3 className="font-heading text-lg mb-3">{t("pairingsHeading")}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {pairings.map((p) => (
            <div key={p.food} className="glass rounded-xl p-3">
              <h4 className="text-sm font-semibold mb-1">{p.food}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{p.wine}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How to tell if your pour is short */}
      <section>
        <h3 className="font-heading text-lg mb-3">{t("shortPourHeading")}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {shortPourTests.map((item) => (
            <div key={item.title} className="glass rounded-xl p-3">
              <h4 className="text-sm font-semibold mb-1">{item.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Corkage */}
      <section>
        <h3 className="font-heading text-lg mb-2">{t("corkageHeading")}</h3>
        <div className="glass rounded-xl p-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{t("corkageBody")}</p>
        </div>
      </section>

      {/* Terminology */}
      <section>
        <h3 className="font-heading text-lg mb-3">{t("termsHeading")}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {terms.map((item) => (
            <div key={item.term} className="glass rounded-lg px-3 py-2.5">
              <strong className="text-sm font-heading">{item.term}</strong>
              <span className="text-xs text-muted-foreground"> — {item.def}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function WallTab({ wallPosts, onAddPost, onUpvote }: {
  wallPosts: WallPost[];
  onAddPost: (post: Omit<WallPost, "id" | "created_at" | "upvotes">) => Promise<void>;
  onUpvote: (id: string, newCount: number) => Promise<void>;
}) {
  const t = useTranslations("proper-wine-pour.wall");
  const [filterType, setFilterType] = useState<WallPostType | "all">("all");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ user_name: "", pour_type: "glory" as WallPostType, content: "" });
  const [upvoting, setUpvoting] = useState<string | null>(null);

  const filtered = filterType === "all" ? wallPosts : wallPosts.filter((p) => p.pour_type === filterType);

  async function handleSave() {
    if (!form.content.trim()) return;
    setSaving(true);
    try {
      await onAddPost({
        user_name: form.user_name || t("anonymous"),
        pour_type: form.pour_type,
        content: form.content,
      });
      setShowForm(false);
      setForm({ user_name: "", pour_type: "glory", content: "" });
    } finally {
      setSaving(false);
    }
  }

  async function handleUpvote(post: WallPost) {
    if (upvoting === post.id) return;
    setUpvoting(post.id);
    try {
      await onUpvote(post.id, post.upvotes + 1);
    } finally {
      setUpvoting(null);
    }
  }

  const filterLabel = (k: "all" | WallPostType) => {
    if (k === "all") return t("filterAll");
    return k === "glory" ? t("filterGlory") : t("filterShame");
  };

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="font-heading text-2xl mb-1">{t("heading")}</h2>
        <p className="text-muted-foreground text-sm">{t("subheading")}</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {(["all", "glory", "shame"] as const).map((k) => (
          <Button
            key={k}
            variant={filterType === k ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType(k)}
            className={`rounded-full capitalize ${filterType === k ? "bg-accent text-black border-accent" : ""}`}
          >
            {filterLabel(k)}
          </Button>
        ))}
        <Button
          variant={showForm ? "outline" : "default"}
          onClick={() => setShowForm((v) => !v)}
          className={`ml-auto ${showForm ? "" : "bg-accent text-black hover:opacity-90"}`}
        >
          {showForm ? t("buttonCancel") : t("buttonShare")}
        </Button>
      </div>

      {/* Add story form */}
      {showForm && (
        <Card className="glass border-surface-border">
          <CardContent className="p-5 space-y-3">
            <h3 className="font-heading text-base">{t("formHeading")}</h3>
            <div>
              <label htmlFor="wine-user-name-story" className="block text-xs text-muted-foreground font-semibold mb-1">{t("labelUserName")}</label>
              <Input
                id="wine-user-name-story"
                type="text"
                placeholder={t("placeholderUserName")}
                value={form.user_name}
                onChange={(e) => setForm((f) => ({ ...f, user_name: e.target.value }))}
                className="glass-input"
              />
            </div>
            <div>
              <label htmlFor="wine-pour-type" className="block text-xs text-muted-foreground font-semibold mb-1">{t("labelType")}</label>
              <select
                id="wine-pour-type"
                value={form.pour_type}
                onChange={(e) => setForm((f) => ({ ...f, pour_type: e.target.value as WallPostType }))}
                className="w-full px-3 py-2 glass-input text-sm focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="glory">{t("typeGloryOption")}</option>
                <option value="shame">{t("typeShameOption")}</option>
              </select>
            </div>
            <div>
              <label htmlFor="wine-story-content" className="block text-xs text-muted-foreground font-semibold mb-1">{t("labelContent")}</label>
              <textarea
                id="wine-story-content"
                placeholder={t("placeholderContent")}
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                className="w-full px-3 py-2 glass-input text-sm focus:outline-none focus:ring-1 focus:ring-accent min-h-20 resize-y"
              />
            </div>
            <Button
              onClick={handleSave}
              disabled={saving || !form.content.trim()}
              className="bg-accent text-black hover:opacity-90"
            >
              {saving ? t("buttonPosting") : t("buttonPost")}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Posts */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <div className="text-3xl mb-2">🍷</div>
          <p className="text-sm">{t("emptyState")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((post) => (
            <Card key={post.id} className="glass border-surface-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm">{post.user_name}</span>
                  <Badge
                    variant={post.pour_type === "glory" ? "secondary" : "destructive"}
                    className={post.pour_type === "glory" ? "text-green bg-green/15 border-green/30" : ""}
                  >
                    {post.pour_type === "glory" ? t("badgeGlory") : t("badgeShame")}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed mb-3">{post.content}</p>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpvote(post)}
                    disabled={upvoting === post.id}
                    className="text-xs"
                  >
                    👍 {post.upvotes}
                  </Button>
                  <span className="text-xs text-muted-foreground">{formatDate(post.created_at)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function WineApp({ restaurants, initialPourLogs, initialWallPosts }: Props) {
  const tTabs = useTranslations("proper-wine-pour.tabs");
  const [pourLogs, setPourLogs] = useState<WinePour[]>(initialPourLogs);
  const [wallPosts, setWallPosts] = useState<WallPost[]>(initialWallPosts);

  async function handleAddPour(pour: Omit<WinePour, "id" | "created_at">) {
    const supabase = createClient();
    const newPour = {
      ...pour,
      id: `pour-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    // biome-ignore lint/suspicious/noExplicitAny: wine_pours not in generated DB types
    const { error } = await (supabase as any).from("wine_pours").upsert(newPour);
    if (error) throw error;
    setPourLogs((prev) => [newPour as WinePour, ...prev]);
  }

  async function handleAddWallPost(post: Omit<WallPost, "id" | "created_at" | "upvotes">) {
    const supabase = createClient();
    const newPost = {
      ...post,
      id: `wall-${Date.now()}`,
      upvotes: 0,
      created_at: new Date().toISOString(),
    };
    // biome-ignore lint/suspicious/noExplicitAny: pour_wall not in generated DB types
    const { error } = await (supabase as any).from("pour_wall").upsert(newPost);
    if (error) throw error;
    setWallPosts((prev) => [newPost as WallPost, ...prev]);
  }

  async function handleUpvote(id: string, newCount: number) {
    const supabase = createClient();
    // biome-ignore lint/suspicious/noExplicitAny: pour_wall not in generated DB types
    const { error } = await (supabase as any)
      .from("pour_wall")
      .update({ upvotes: newCount })
      .eq("id", id);
    if (error) throw error;
    setWallPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, upvotes: newCount } : p))
    );
  }

  return (
    <div>
      <Tabs defaultValue="guide">
        <TabsList className="w-full flex-wrap h-auto gap-1 border-b border-surface-border rounded-none bg-transparent pb-0 mb-6">
          <TabsTrigger value="guide">{tTabs("guide")}</TabsTrigger>
          <TabsTrigger value="calculator">{tTabs("calculator")}</TabsTrigger>
          <TabsTrigger value="tracker">{tTabs("tracker")}</TabsTrigger>
          <TabsTrigger value="knowledge">{tTabs("knowledge")}</TabsTrigger>
          <TabsTrigger value="wall">{tTabs("wall")}</TabsTrigger>
        </TabsList>

        <TabsContent value="guide">
          <GuideTab />
        </TabsContent>
        <TabsContent value="calculator">
          <CalculatorTab />
        </TabsContent>
        <TabsContent value="tracker">
          <TrackerTab
            restaurants={restaurants}
            pourLogs={pourLogs}
            onAddPour={handleAddPour}
          />
        </TabsContent>
        <TabsContent value="knowledge">
          <KnowledgeTab />
        </TabsContent>
        <TabsContent value="wall">
          <WallTab
            wallPosts={wallPosts}
            onAddPost={handleAddWallPost}
            onUpvote={handleUpvote}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
