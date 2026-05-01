"use client";

import { useState } from "react";
import { LibraryCard } from "./library-card";
import type { MemeWithSignedUrl } from "../../actions";

export interface LibraryGridProps {
  memes: MemeWithSignedUrl[];
}

export function LibraryGrid({ memes }: LibraryGridProps) {
  const [items, setItems] = useState<MemeWithSignedUrl[]>(memes);

  function onDelete(id: string) {
    setItems((prev) => prev.filter((m) => m.id !== id));
  }

  function onRestore(meme: MemeWithSignedUrl) {
    setItems((prev) => {
      if (prev.some((m) => m.id === meme.id)) return prev;
      return [...prev, meme].sort((a, b) =>
        a.createdAt < b.createdAt ? 1 : -1,
      );
    });
  }

  function onTitleUpdate(id: string, title: string) {
    setItems((prev) =>
      prev.map((m) => (m.id === id ? { ...m, title } : m)),
    );
  }

  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      data-testid="library-grid"
    >
      {items.map((meme) => (
        <LibraryCard
          key={meme.id}
          meme={meme}
          onDelete={onDelete}
          onRestore={onRestore}
          onTitleUpdate={onTitleUpdate}
        />
      ))}
    </div>
  );
}
