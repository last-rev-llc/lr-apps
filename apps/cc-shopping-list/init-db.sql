-- Shopping Items Table
-- Execute in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS shopping_items (
  id TEXT PRIMARY KEY,
  store TEXT NOT NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  category TEXT DEFAULT 'other',
  in_cart BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shopping_items_store ON shopping_items(store);
CREATE INDEX IF NOT EXISTS idx_shopping_items_category ON shopping_items(category);
CREATE INDEX IF NOT EXISTS idx_shopping_items_sort ON shopping_items(store, sort_order);

ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access" ON shopping_items
  FOR ALL USING (true);

-- Add columns if table already exists
ALTER TABLE shopping_items ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'other';
ALTER TABLE shopping_items ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
