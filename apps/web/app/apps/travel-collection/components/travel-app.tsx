"use client";

import { useState, useMemo } from "react";
import {
  Badge,
  Button,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui";
import type { TravelProperty, SortField } from "../lib/types";
import { CATEGORIES, REGIONS, TYPES, SORT_OPTIONS } from "../lib/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_EMOJI: Record<string, string> = {
  Hotel: "🏨",
  Resort: "🌴",
  Villa: "🏡",
  "Private Island": "🏝️",
  Estate: "🏰",
  Cruise: "🚢",
};

function getTypeEmoji(type: string): string {
  return TYPE_EMOJI[type] ?? "🏨";
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────

interface FilterBarProps {
  search: string;
  category: string;
  region: string;
  type: string;
  sort: SortField;
  onSearch: (v: string) => void;
  onCategory: (v: string) => void;
  onRegion: (v: string) => void;
  onType: (v: string) => void;
  onSort: (v: SortField) => void;
}

function PillSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-1.5 rounded-full text-sm border border-surface-border bg-surface text-foreground hover:border-accent focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors cursor-pointer backdrop-blur"
      aria-label={label}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function FilterBar({
  search,
  category,
  region,
  type,
  sort,
  onSearch,
  onCategory,
  onRegion,
  onType,
  onSort,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-3 items-center mb-4">
      <Input
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Search properties..."
        className="w-48 h-8 text-sm rounded-full"
      />
      <PillSelect
        label="Category"
        value={category}
        options={[
          { value: "", label: "All Categories" },
          ...CATEGORIES.map((c) => ({ value: c, label: c })),
        ]}
        onChange={onCategory}
      />
      <PillSelect
        label="Region"
        value={region}
        options={[
          { value: "", label: "All Regions" },
          ...REGIONS.map((r) => ({ value: r, label: r })),
        ]}
        onChange={onRegion}
      />
      <PillSelect
        label="Type"
        value={type}
        options={[
          { value: "", label: "All Types" },
          ...TYPES.map((t) => ({ value: t, label: t })),
        ]}
        onChange={onType}
      />
      <PillSelect
        label="Sort"
        value={sort}
        options={SORT_OPTIONS}
        onChange={(v) => onSort(v as SortField)}
      />
    </div>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar({ properties }: { properties: TravelProperty[] }) {
  const researched = properties.filter((p) => p.researched).length;
  const regions = new Set(properties.map((p) => p.region)).size;

  return (
    <div className="flex flex-wrap gap-3 mb-5 text-sm">
      {[
        { label: "properties", value: properties.length },
        { label: "researched", value: researched },
        { label: "pending", value: properties.length - researched },
        { label: "regions", value: regions },
      ].map((s) => (
        <div
          key={s.label}
          className="px-3 py-1.5 rounded-lg border border-surface-border bg-surface backdrop-blur text-muted-foreground"
        >
          <span className="text-accent font-semibold">{s.value}</span>{" "}
          {s.label}
        </div>
      ))}
    </div>
  );
}

// ─── Property Card ────────────────────────────────────────────────────────────

function PropertyCard({
  property,
  onClick,
}: {
  property: TravelProperty;
  onClick: () => void;
}) {
  const firstPhoto = property.photos?.[0];

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left w-full rounded-2xl overflow-hidden border border-surface-border bg-surface backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-glass-hover-strong hover:border-accent cursor-pointer group"
    >
      {/* Photo */}
      <div className="w-full h-48 overflow-hidden bg-surface flex items-center justify-center text-5xl">
        {firstPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={firstPhoto}
            alt={property.name}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{getTypeEmoji(property.type)}</span>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-heading text-base font-semibold mb-1 group-hover:text-accent transition-colors">
          {property.name}
        </h3>
        <p className="text-muted-foreground text-xs mb-3">
          📍 {property.location}
        </p>
        <div className="flex flex-wrap gap-1.5 items-center">
          <Badge variant="secondary" className="text-xs">
            {property.type}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {property.region}
          </Badge>
          {property.researched ? (
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-green-500/20 text-green-400 font-semibold border border-green-500/30">
              ✓ Researched
            </span>
          ) : (
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted/40 text-muted-foreground font-semibold border border-surface-border">
              Pending
            </span>
          )}
        </div>
        {property.pricing && (
          <p className="text-accent font-semibold text-sm mt-2">
            {property.pricing}
          </p>
        )}
      </div>
    </button>
  );
}

// ─── Property Modal ───────────────────────────────────────────────────────────

function PropertyModal({
  property,
  onClose,
}: {
  property: TravelProperty | null;
  onClose: () => void;
}) {
  if (!property) return null;

  return (
    <Dialog open={!!property} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-surface-border">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">
            {property.name}
          </DialogTitle>
        </DialogHeader>

        {/* Photo gallery */}
        <div className="flex overflow-x-auto gap-1 rounded-xl mb-4 bg-surface">
          {property.photos && property.photos.length > 0 ? (
            property.photos.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url}
                src={url}
                alt={`${property.name} ${i + 1}`}
                loading="lazy"
                className="w-64 h-48 object-cover flex-shrink-0 first:rounded-l-xl last:rounded-r-xl"
              />
            ))
          ) : (
            <div className="w-full h-48 flex items-center justify-center text-5xl rounded-xl">
              {getTypeEmoji(property.type)}
            </div>
          )}
        </div>

        {/* Location + meta */}
        <p className="text-muted-foreground text-sm mb-3">
          📍 {property.location} · {property.region}
        </p>
        <div className="flex flex-wrap gap-1.5 items-center mb-4">
          <Badge variant="secondary">{property.category}</Badge>
          <Badge variant="outline">{property.type}</Badge>
          {property.researched ? (
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-green-500/20 text-green-400 font-semibold border border-green-500/30">
              ✓ Researched
            </span>
          ) : (
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted/40 text-muted-foreground font-semibold border border-surface-border">
              Pending Research
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-sm leading-relaxed text-foreground mb-4">
          {property.description ?? (
            <span className="text-muted-foreground italic">
              Research pending…
            </span>
          )}
        </p>

        {/* Website */}
        {property.website && (
          <div className="mb-4">
            <h4 className="text-[10px] uppercase tracking-widest text-accent font-semibold mb-1.5">
              Website
            </h4>
            <a
              href={property.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent text-sm hover:underline break-all"
            >
              {property.website}
            </a>
          </div>
        )}

        {/* Pricing */}
        {property.pricing && (
          <div className="mb-4">
            <h4 className="text-[10px] uppercase tracking-widest text-accent font-semibold mb-1.5">
              Pricing
            </h4>
            <p className="text-accent font-semibold">{property.pricing}</p>
          </div>
        )}

        {/* Amenities */}
        {property.amenities && property.amenities.length > 0 && (
          <div className="mb-4">
            <h4 className="text-[10px] uppercase tracking-widest text-accent font-semibold mb-1.5">
              Amenities
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {property.amenities.map((a) => (
                <Badge key={a} variant="secondary" className="text-xs">
                  {a}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Highlights */}
        {property.highlights && property.highlights.length > 0 && (
          <div className="mb-4">
            <h4 className="text-[10px] uppercase tracking-widest text-accent font-semibold mb-1.5">
              Highlights
            </h4>
            <ul className="list-disc pl-5 space-y-1">
              {property.highlights.map((h) => (
                <li key={h} className="text-sm leading-relaxed">
                  {h}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tags */}
        {property.tags && property.tags.length > 0 && (
          <div className="mb-4">
            <h4 className="text-[10px] uppercase tracking-widest text-accent font-semibold mb-1.5">
              Tags
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {property.tags.map((t) => (
                <Badge key={t} variant="outline" className="text-xs">
                  {t}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Rating */}
        {property.rating != null && (
          <div className="mb-2">
            <h4 className="text-[10px] uppercase tracking-widest text-accent font-semibold mb-1.5">
              Rating
            </h4>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={
                    i < Math.round(property.rating ?? 0)
                      ? "text-accent"
                      : "text-muted-foreground/30"
                  }
                >
                  ★
                </span>
              ))}
              <span className="text-sm text-muted-foreground ml-1">
                {property.rating}/5
              </span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Main TravelApp ───────────────────────────────────────────────────────────

interface TravelAppProps {
  initialProperties: TravelProperty[];
}

export function TravelApp({ initialProperties }: TravelAppProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [region, setRegion] = useState("");
  const [type, setType] = useState("");
  const [sort, setSort] = useState<SortField>("name");
  const [selectedProperty, setSelectedProperty] =
    useState<TravelProperty | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let result = initialProperties;

    if (q) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          (p.description ?? "").toLowerCase().includes(q),
      );
    }
    if (category) result = result.filter((p) => p.category === category);
    if (region) result = result.filter((p) => p.region === region);
    if (type) result = result.filter((p) => p.type === type);

    return [...result].sort((a, b) => {
      const aVal = (a[sort] ?? "") as string;
      const bVal = (b[sort] ?? "") as string;
      return aVal.localeCompare(bVal);
    });
  }, [initialProperties, search, category, region, type, sort]);

  // Group by category
  const grouped = useMemo(() => {
    const map: Record<string, TravelProperty[]> = {};
    for (const p of filtered) {
      if (!map[p.category]) map[p.category] = [];
      map[p.category].push(p);
    }
    return map;
  }, [filtered]);

  return (
    <>
      {/* Hero */}
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold mb-1">
          🏨 Travel Collection
        </h1>
        <p className="text-muted-foreground text-sm max-w-xl">
          Curated luxury properties, private islands, and once-in-a-lifetime
          escapes. The world&apos;s best — researched, verified, and ready to
          book.
        </p>
      </div>

      <FilterBar
        search={search}
        category={category}
        region={region}
        type={type}
        sort={sort}
        onSearch={setSearch}
        onCategory={setCategory}
        onRegion={setRegion}
        onType={setType}
        onSort={setSort}
      />

      <StatsBar properties={filtered} />

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <span className="text-6xl">🏨</span>
          <p className="text-muted-foreground">
            No properties match your filters.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch("");
              setCategory("");
              setRegion("");
              setType("");
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([cat, items]) => (
            <section key={cat}>
              <h2 className="font-heading text-lg font-semibold mb-3">
                {cat}{" "}
                <span className="text-muted-foreground font-normal text-sm">
                  ({items.length})
                </span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {items.map((p) => (
                  <PropertyCard
                    key={p.id}
                    property={p}
                    onClick={() => setSelectedProperty(p)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <PropertyModal
        property={selectedProperty}
        onClose={() => setSelectedProperty(null)}
      />
    </>
  );
}
