"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Badge, Button, Card, CardContent, EmptyState, PageHeader } from "@repo/ui";
import type { ShoppingItem, ItemCategory } from "../lib/types";

const CATEGORIES: ItemCategory[] = ["produce", "dairy", "meat", "bakery", "frozen", "pantry", "beverages", "household", "other"];

const CATEGORY_STYLE: Record<ItemCategory, { icon: string; color: string }> = {
  produce:    { icon: "🥦", color: "var(--color-neon-green)" },
  dairy:      { icon: "🥛", color: "var(--color-neon-blue)" },
  meat:       { icon: "🥩", color: "var(--color-red)" },
  bakery:     { icon: "🍞", color: "var(--color-orange)" },
  frozen:     { icon: "🧊", color: "var(--color-blue)" },
  pantry:     { icon: "🫙", color: "var(--color-accent-400)" },
  beverages:  { icon: "🧃", color: "var(--color-neon-violet)" },
  household:  { icon: "🧹", color: "var(--color-slate)" },
  other:      { icon: "📦", color: "var(--color-slate-light)" },
};

const STORAGE_KEY = "cc-shopping-list";

function loadItems(): ShoppingItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveItems(items: ShoppingItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function ShoppingListApp() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newName, setNewName] = useState("");
  const [newQty, setNewQty] = useState("");
  const [newCategory, setNewCategory] = useState<ItemCategory>("other");
  const [filterCategory, setFilterCategory] = useState<ItemCategory | "all">("all");
  const [showChecked, setShowChecked] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load from localStorage on mount
  useEffect(() => {
    setItems(loadItems());
  }, []);

  function setAndSave(newItems: ShoppingItem[]) {
    setItems(newItems);
    saveItems(newItems);
  }

  function addItem() {
    if (!newName.trim()) return;
    const item: ShoppingItem = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      category: newCategory,
      quantity: newQty.trim() || null,
      checked: false,
      created_at: new Date().toISOString(),
    };
    setAndSave([item, ...items]);
    setNewName("");
    setNewQty("");
    inputRef.current?.focus();
  }

  function toggleItem(id: string) {
    setAndSave(items.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)));
  }

  function removeItem(id: string) {
    setAndSave(items.filter((i) => i.id !== id));
  }

  function clearChecked() {
    setAndSave(items.filter((i) => !i.checked));
  }

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (filterCategory !== "all" && i.category !== filterCategory) return false;
      if (!showChecked && i.checked) return false;
      return true;
    });
  }, [items, filterCategory, showChecked]);

  const grouped = useMemo(() => {
    const g: Record<string, ShoppingItem[]> = {};
    for (const item of filtered) {
      (g[item.category] ??= []).push(item);
    }
    return g;
  }, [filtered]);

  const checkedCount = items.filter((i) => i.checked).length;
  const totalCount = items.length;
  const categoriesInList = [...new Set(items.map((i) => i.category))];

  return (
    <div className="space-y-4">
      <PageHeader
        title="🛒 Shopping List"
        subtitle={`${totalCount - checkedCount} remaining · ${checkedCount} checked`}
      />

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-white/40">
            <span>Progress</span>
            <span>{checkedCount}/{totalCount}</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500/70 rounded-full transition-all"
              style={{ width: `${(checkedCount / Math.max(totalCount, 1)) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Add item form */}
      <Card className="p-4">
        <CardContent className="p-0">
          <h3 className="text-sm font-semibold text-white mb-3">Add Item</h3>
          <div className="flex flex-wrap gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addItem(); }}
              placeholder="Item name…"
              className="flex-1 min-w-[140px] px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-white text-sm outline-none focus:border-amber-500/50 transition-colors"
            />
            <input
              type="text"
              value={newQty}
              onChange={(e) => setNewQty(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addItem(); }}
              placeholder="Qty"
              className="w-20 px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-white text-sm outline-none focus:border-amber-500/50 transition-colors"
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as ItemCategory)}
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-white text-sm outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_STYLE[c].icon} {c}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={addItem}
              disabled={!newName.trim()}
              className="bg-amber-500/20 border-amber-500/40 text-amber-400 hover:bg-amber-500/30"
            >
              + Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={filterCategory === "all" ? "outline" : "ghost"}
          size="sm"
          onClick={() => setFilterCategory("all")}
          className={filterCategory === "all" ? "border-amber-500/60 bg-amber-500/15 text-amber-400" : ""}
        >
          All
        </Button>
        {categoriesInList.map((c) => {
          const cs = CATEGORY_STYLE[c];
          return (
            <Button
              key={c}
              variant={filterCategory === c ? "outline" : "ghost"}
              size="sm"
              onClick={() => setFilterCategory(c)}
              className={filterCategory === c ? "border-amber-500/60 bg-amber-500/15 text-amber-400" : ""}
            >
              {cs.icon} {c}
            </Button>
          );
        })}
        <div className="ml-auto flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowChecked((v) => !v)}
            className={showChecked ? "text-white/50" : "text-white/30"}
          >
            {showChecked ? "Hide" : "Show"} checked
          </Button>
          {checkedCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearChecked}
              className="border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
            >
              Clear checked ({checkedCount})
            </Button>
          )}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="🛒"
          title={totalCount === 0 ? "List is empty" : "No items match filters"}
          description={totalCount === 0 ? "Add items above to get started" : "Adjust your filters"}
        />
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([cat, catItems]) => {
            const cs = CATEGORY_STYLE[cat as ItemCategory];
            return (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">{cs.icon}</span>
                  <span className="text-xs font-semibold text-white/40 capitalize">{cat}</span>
                  <span className="text-xs text-white/20">({catItems.length})</span>
                </div>
                <div className="space-y-1.5">
                  {catItems.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                        item.checked
                          ? "border-white/5 bg-white/3 opacity-50"
                          : "border-white/10 bg-white/5"
                      }`}
                    >
                      <button
                        onClick={() => toggleItem(item.id)}
                        className={`w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center transition-all ${
                          item.checked
                            ? "border-green-500 bg-green-500/30"
                            : "border-white/20 hover:border-white/50"
                        }`}
                      >
                        {item.checked && <span className="text-green-400 text-xs">✓</span>}
                      </button>
                      <span
                        className={`flex-1 text-sm ${
                          item.checked ? "line-through text-white/30" : "text-white"
                        }`}
                      >
                        {item.name}
                      </span>
                      {item.quantity && (
                        <Badge variant="secondary" className="text-xs text-white/30 bg-white/5 border-0">
                          {item.quantity}
                        </Badge>
                      )}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-white/15 hover:text-red-400 transition-colors text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
