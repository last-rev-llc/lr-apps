CREATE TABLE IF NOT EXISTS area_52_experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'exploring',
  category text,
  owner text,
  outcome text,
  links jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE area_52_experiments ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read experiments
CREATE POLICY "Authenticated users can read experiments"
  ON area_52_experiments FOR SELECT
  USING (auth.role() = 'authenticated');
