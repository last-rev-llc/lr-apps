"use client";

import { useState, useMemo } from "react";
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
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="font-heading text-2xl mb-1">Know Your Pour</h2>
        <p className="text-muted-foreground text-sm">A visual guide to what you should be getting in your glass.</p>
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
        <h3 className="font-heading text-xl mb-2" style={{ color: "var(--color-pill-6)" }}>The Golden Rule</h3>
        <p className="text-sm font-semibold mb-1">1 bottle (750ml) = 5 standard glasses (5oz each)</p>
        <p className="text-muted-foreground text-xs">If a restaurant charges you $18/glass for a $45 bottle, that's 5 glasses at $9 cost each.</p>
        <p className="text-muted-foreground text-xs mt-1">If you're getting less than 5oz, you're being shorted. Period.</p>
      </div>

      {/* Glass types */}
      <div>
        <h3 className="font-heading text-lg mb-4">Glass Types &amp; Proper Fill Levels</h3>
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
  const [bottlePrice, setBottlePrice] = useState(45);
  const [pourSize, setPourSize] = useState(5);
  const [glassPrice, setGlassPrice] = useState(18);

  const glassesPerBottle = 750 / (pourSize * 29.5735);
  const costPerGlass = (bottlePrice / glassesPerBottle).toFixed(2);
  const costPerOz = (bottlePrice / 25.36).toFixed(2);
  const markup = glassPrice / parseFloat(costPerGlass);
  const ripOff = Math.min(100, Math.max(0, ((markup - 1) / 4) * 100));

  let ripLabel = "Fair Deal";
  if (ripOff > 75) ripLabel = "Highway Robbery";
  else if (ripOff > 55) ripLabel = "Outrageous";
  else if (ripOff > 35) ripLabel = "Steep";
  else if (ripOff > 15) ripLabel = "Normal Markup";

  const markupPct = (markup * 100).toFixed(0);
  const markupColor = ripOff > 55 ? "var(--color-red)" : ripOff > 30 ? "var(--color-orange)" : "var(--color-green)";

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="font-heading text-2xl mb-1">Pour Calculator</h2>
        <p className="text-muted-foreground text-sm">Find out if you're getting ripped off.</p>
      </div>

      <Card className="glass border-surface-border">
        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="wine-bottle-price"
                className="block text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-1"
              >
                Retail Bottle Price ($)
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
                Pour Size (oz)
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
                Restaurant Glass Price ($)
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
            { label: "Your cost per glass (retail)", value: `$${costPerGlass}`, color: "text-foreground" },
            { label: "Cost per oz (retail)", value: `$${costPerOz}`, color: "text-foreground" },
            { label: "Restaurant price per glass", value: `$${glassPrice.toFixed(2)}`, color: "text-foreground" },
            { label: "Actual markup", value: `${markupPct}%`, color: "" },
            { label: "Glasses per bottle", value: glassesPerBottle.toFixed(1), color: "text-foreground" },
          ].map((row) => (
            <div key={row.label} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
              <span className="text-muted-foreground text-sm">{row.label}</span>
              <span
                className="font-bold text-base"
                style={row.label.includes("markup") ? { color: markupColor } : undefined}
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
            Rip-Off Meter:{" "}
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
            <span>Fair Deal</span>
            <span>Normal</span>
            <span>Steep</span>
            <span>Outrageous</span>
            <span>Robbery</span>
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
        user_name: form.user_name || "Anonymous",
      });
      setShowForm(false);
      setForm({ restaurant_name: "", wine_name: "", pour_rating: "standard", price_paid: "", notes: "", user_name: "" });
    } finally {
      setSaving(false);
    }
  }

  const generous = restaurants.filter((r) => r.pour_rating === "generous").length;

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="font-heading text-2xl mb-1">Pour Tracker</h2>
        <p className="text-muted-foreground text-sm">Track and rate restaurant wine pours.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="glass rounded-xl p-3">
          <div className="text-2xl font-bold text-green">{generous}</div>
          <div className="text-xs text-muted-foreground">Generous Spots</div>
        </div>
        <div className="glass rounded-xl p-3">
          <div className="text-2xl font-bold">{restaurants.length}</div>
          <div className="text-xs text-muted-foreground">Restaurants</div>
        </div>
        <div className="glass rounded-xl p-3">
          <div className="text-2xl font-bold">{pourLogs.length}</div>
          <div className="text-xs text-muted-foreground">Pours Logged</div>
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
            {r === "all" ? "All" : r}
          </Button>
        ))}
        <Input
          type="text"
          placeholder="Search restaurants..."
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
          {showForm ? "Cancel" : "+ Log Pour"}
        </Button>
      </div>

      {/* Log pour form */}
      {showForm && (
        <Card className="glass border-surface-border">
          <CardContent className="p-5 space-y-3">
            <h3 className="font-heading text-base mb-2">Log a Pour</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="wine-restaurant-name" className="block text-xs text-muted-foreground font-semibold mb-1">Restaurant Name *</label>
                <Input
                  id="wine-restaurant-name"
                  type="text"
                  placeholder="e.g. Gary Danko"
                  value={form.restaurant_name}
                  onChange={(e) => setForm((f) => ({ ...f, restaurant_name: e.target.value }))}
                  className="glass-input"
                />
              </div>
              <div>
                <label htmlFor="wine-name" className="block text-xs text-muted-foreground font-semibold mb-1">Wine Ordered *</label>
                <Input
                  id="wine-name"
                  type="text"
                  placeholder="e.g. Caymus Cabernet 2021"
                  value={form.wine_name}
                  onChange={(e) => setForm((f) => ({ ...f, wine_name: e.target.value }))}
                  className="glass-input"
                />
              </div>
              <div>
                <label htmlFor="wine-pour-rating" className="block text-xs text-muted-foreground font-semibold mb-1">Pour Rating</label>
                <select
                  id="wine-pour-rating"
                  value={form.pour_rating}
                  onChange={(e) => setForm((f) => ({ ...f, pour_rating: e.target.value as PourRating }))}
                  className="w-full px-3 py-2 glass-input text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="generous">Generous</option>
                  <option value="standard">Standard</option>
                  <option value="stingy">Stingy</option>
                  <option value="criminal">Criminal</option>
                </select>
              </div>
              <div>
                <label htmlFor="wine-price-paid" className="block text-xs text-muted-foreground font-semibold mb-1">Price Paid ($)</label>
                <Input
                  id="wine-price-paid"
                  type="number"
                  placeholder="18"
                  min={1}
                  max={500}
                  value={form.price_paid}
                  onChange={(e) => setForm((f) => ({ ...f, price_paid: e.target.value }))}
                  className="glass-input"
                />
              </div>
            </div>
            <div>
              <label htmlFor="wine-notes" className="block text-xs text-muted-foreground font-semibold mb-1">Notes</label>
              <textarea
                id="wine-notes"
                placeholder="How was the pour? Any comments..."
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full px-3 py-2 glass-input text-sm focus:outline-none focus:ring-1 focus:ring-accent min-h-16 resize-y"
              />
            </div>
            <div>
              <label htmlFor="wine-user-name-pour" className="block text-xs text-muted-foreground font-semibold mb-1">Your Name</label>
              <Input
                id="wine-user-name-pour"
                type="text"
                placeholder="Your name"
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
              {saving ? "Saving…" : "Save Pour"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Restaurant list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <div className="text-3xl mb-2">🍷</div>
            <p className="text-sm">No restaurants match this filter</p>
          </div>
        ) : (
          filtered.map((r) => (
            <Card key={r.id} className="glass border-surface-border">
              <CardContent className="p-4 flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-semibold text-sm">{r.name}</h4>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    {r.neighborhood} · Avg ${r.avg_glass_price}/glass
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
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="font-heading text-2xl mb-1">Wine Knowledge</h2>
        <p className="text-muted-foreground text-sm">Everything you need to know to be a savvy wine drinker.</p>
      </div>

      {/* Serving Temperatures */}
      <section>
        <h3 className="font-heading text-lg mb-3">Serving Temperatures</h3>
        <div className="glass rounded-xl overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-2 text-xs text-muted-foreground uppercase tracking-wide font-semibold">Wine Type</th>
                <th className="text-left px-4 py-2 text-xs text-muted-foreground uppercase tracking-wide font-semibold">Temperature</th>
                <th className="text-left px-4 py-2 text-xs text-muted-foreground uppercase tracking-wide font-semibold hidden sm:table-cell">Tip</th>
              </tr>
            </thead>
            <tbody>
              {[
                { type: "Light Reds (Pinot Noir)", temp: "55-60°F / 13-16°C", tip: "Slightly cool, not room temp" },
                { type: "Full Reds (Cabernet)", temp: "60-65°F / 16-18°C", tip: '"Room temp" means a cool room' },
                { type: "White Wine", temp: "45-50°F / 7-10°C", tip: "20 min out of fridge" },
                { type: "Sparkling", temp: "40-45°F / 4-7°C", tip: "Ice bucket for 15 min" },
                { type: "Rosé", temp: "45-55°F / 7-13°C", tip: "Slightly warmer than white" },
                { type: "Dessert Wine", temp: "43-47°F / 6-8°C", tip: "Well chilled" },
              ].map((row) => (
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
        <h3 className="font-heading text-lg mb-3">Food Pairing Basics</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { food: "Red Meat", wine: "Bold reds: Cabernet Sauvignon, Malbec, Syrah. Tannins cut through fat." },
            { food: "Seafood", wine: "Crisp whites: Sauvignon Blanc, Chablis, Muscadet. Acidity complements fish." },
            { food: "Pasta (Red Sauce)", wine: "Italian reds: Chianti, Barbera, Sangiovese. Acidity matches tomato." },
            { food: "Spicy Food", wine: "Off-dry whites: Riesling, Gewürztraminer. Sweetness tames heat." },
            { food: "Cheese", wine: "Match intensity. Soft cheese = light wine. Aged cheese = bold wine." },
            { food: "Dessert", wine: "Wine should be sweeter than dessert. Port, Sauternes, late harvest." },
          ].map((p) => (
            <div key={p.food} className="glass rounded-xl p-3">
              <h4 className="text-sm font-semibold mb-1">{p.food}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{p.wine}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How to tell if your pour is short */}
      <section>
        <h3 className="font-heading text-lg mb-3">How to Tell If Your Pour Is Short</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { title: "The Finger Test", body: "Standard pour = about 2 fingers width in a standard red wine glass. Less than 1.5 fingers? You're being shorted." },
            { title: "The Weight Test", body: "Pick up the glass. 5oz of wine should have noticeable weight. If it feels empty, it probably is." },
            { title: "The Bottle Math", body: "If they pour more than 5-6 glasses from a bottle, each pour is under 5oz. Watch the bottle." },
            { title: "The Swirl Test", body: "In a proper pour, swirling should show wine reaching the widest part of the bowl. If it barely moves, it's too little." },
          ].map((item) => (
            <div key={item.title} className="glass rounded-xl p-3">
              <h4 className="text-sm font-semibold mb-1">{item.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Corkage */}
      <section>
        <h3 className="font-heading text-lg mb-2">Corkage Fee Guide</h3>
        <div className="glass rounded-xl p-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Bringing your own bottle (BYO) means paying a corkage fee, typically $25–75. It&apos;s worth it if your bottle costs significantly less than the restaurant&apos;s markup. Etiquette: Always offer the sommelier a taste. Don&apos;t bring a wine the restaurant already sells. Some restaurants waive corkage if you also buy a bottle from their list.
          </p>
        </div>
      </section>

      {/* Terminology */}
      <section>
        <h3 className="font-heading text-lg mb-3">Wine Terminology</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { term: "Tannins", def: "Compounds that create a drying sensation. Higher in red wines. Softens with age." },
            { term: "Body", def: "How heavy/full the wine feels. Light (Pinot Grigio) to full (Cabernet)." },
            { term: "Terroir", def: "The environment where grapes grow: soil, climate, altitude. Makes each wine unique." },
            { term: "Vintage", def: "The year the grapes were harvested. Not all years are equal." },
            { term: "Decanting", def: "Pouring wine into a vessel to aerate it. Opens up flavors in young bold reds." },
            { term: "Legs/Tears", def: "Droplets running down the glass after swirling. Indicates alcohol/sugar content." },
            { term: "Corked", def: "Wine contaminated by TCA. Smells like wet cardboard. Send it back." },
            { term: "Varietal", def: "Wine made primarily from one grape variety (e.g., 100% Chardonnay)." },
            { term: "Sommelier", def: "Trained wine professional. Your ally in getting a proper pour." },
            { term: "Finish", def: "The taste that lingers after swallowing. Long finish = quality wine." },
          ].map((item) => (
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
        user_name: form.user_name || "Anonymous",
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

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="font-heading text-2xl mb-1">Community Wall</h2>
        <p className="text-muted-foreground text-sm">Share your pour stories — the good, the bad, and the criminal.</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {(["all", "glory", "shame"] as const).map((t) => (
          <Button
            key={t}
            variant={filterType === t ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType(t)}
            className={`rounded-full capitalize ${filterType === t ? "bg-accent text-black border-accent" : ""}`}
          >
            {t === "all" ? "All" : t === "glory" ? "Pour of Glory" : "Pour of Shame"}
          </Button>
        ))}
        <Button
          variant={showForm ? "outline" : "default"}
          onClick={() => setShowForm((v) => !v)}
          className={`ml-auto ${showForm ? "" : "bg-accent text-black hover:opacity-90"}`}
        >
          {showForm ? "Cancel" : "+ Share Story"}
        </Button>
      </div>

      {/* Add story form */}
      {showForm && (
        <Card className="glass border-surface-border">
          <CardContent className="p-5 space-y-3">
            <h3 className="font-heading text-base">Share a Pour Story</h3>
            <div>
              <label htmlFor="wine-user-name-story" className="block text-xs text-muted-foreground font-semibold mb-1">Your Name</label>
              <Input
                id="wine-user-name-story"
                type="text"
                placeholder="Your name"
                value={form.user_name}
                onChange={(e) => setForm((f) => ({ ...f, user_name: e.target.value }))}
                className="glass-input"
              />
            </div>
            <div>
              <label htmlFor="wine-pour-type" className="block text-xs text-muted-foreground font-semibold mb-1">Story Type</label>
              <select
                id="wine-pour-type"
                value={form.pour_type}
                onChange={(e) => setForm((f) => ({ ...f, pour_type: e.target.value as WallPostType }))}
                className="w-full px-3 py-2 glass-input text-sm focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="glory">Pour of Glory (great pour!)</option>
                <option value="shame">Pour of Shame (terrible pour)</option>
              </select>
            </div>
            <div>
              <label htmlFor="wine-story-content" className="block text-xs text-muted-foreground font-semibold mb-1">Your Story *</label>
              <textarea
                id="wine-story-content"
                placeholder="Tell us about your pour experience..."
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
              {saving ? "Posting…" : "Post Story"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Posts */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <div className="text-3xl mb-2">🍷</div>
          <p className="text-sm">No stories yet. Be the first to share!</p>
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
                    {post.pour_type === "glory" ? "Pour of Glory" : "Pour of Shame"}
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
          <TabsTrigger value="guide">🍷 Pour Guide</TabsTrigger>
          <TabsTrigger value="calculator">🧮 Calculator</TabsTrigger>
          <TabsTrigger value="tracker">📋 Tracker</TabsTrigger>
          <TabsTrigger value="knowledge">📖 Knowledge</TabsTrigger>
          <TabsTrigger value="wall">💬 Community</TabsTrigger>
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
