CREATE TABLE IF NOT EXISTS lighthouse_sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lighthouse_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid REFERENCES lighthouse_sites(id) ON DELETE CASCADE,
  performance integer,
  accessibility integer,
  best_practices integer,
  seo integer,
  lcp numeric,
  fid numeric,
  cls numeric,
  fcp numeric,
  ttfb numeric,
  run_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE lighthouse_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE lighthouse_runs ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read lighthouse data
CREATE POLICY "Authenticated users can read lighthouse sites"
  ON lighthouse_sites FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read lighthouse runs"
  ON lighthouse_runs FOR SELECT
  USING (auth.role() = 'authenticated');
