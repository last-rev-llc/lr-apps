-- CC Iron Fitness App Database Schema

-- Exercises table
CREATE TABLE IF NOT EXISTS exercises (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- chest/back/shoulders/legs/arms/core
    equipment TEXT NOT NULL, -- barbell/dumbbell/cable/machine/bodyweight/kettlebell/bands
    muscle_group TEXT NOT NULL,
    description TEXT,
    instructions TEXT,
    difficulty TEXT NOT NULL DEFAULT 'beginner', -- beginner/intermediate/advanced
    alternatives TEXT[] DEFAULT ARRAY[]::TEXT[], -- array of exercise IDs
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Workout templates (pre-built programs)
CREATE TABLE IF NOT EXISTS workout_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL, -- push_pull_legs/upper_lower/full_body/custom
    difficulty TEXT NOT NULL DEFAULT 'beginner',
    days_per_week INTEGER DEFAULT 3,
    exercises JSONB DEFAULT '[]'::jsonb, -- array with sets/reps/rest info
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- User workout logs
CREATE TABLE IF NOT EXISTS workout_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT DEFAULT 'anonymous',
    template_id TEXT,
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Exercise performance logs (sets within workout logs)
CREATE TABLE IF NOT EXISTS exercise_logs (
    id TEXT PRIMARY KEY,
    workout_log_id TEXT NOT NULL,
    exercise_id TEXT NOT NULL,
    sets JSONB DEFAULT '[]'::jsonb, -- [{set_number, reps, weight, rpe}]
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Personal records tracking
CREATE TABLE IF NOT EXISTS personal_records (
    id TEXT PRIMARY KEY,
    user_id TEXT DEFAULT 'anonymous',
    exercise_id TEXT NOT NULL,
    weight REAL NOT NULL,
    reps INTEGER NOT NULL,
    date TIMESTAMPTZ DEFAULT now(),
    type TEXT NOT NULL DEFAULT '1rm', -- 1rm/volume
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;

-- Public access policies
DROP POLICY IF EXISTS "Public access exercises" ON exercises;
CREATE POLICY "Public access exercises" ON exercises FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access workout_templates" ON workout_templates;
CREATE POLICY "Public access workout_templates" ON workout_templates FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access workout_logs" ON workout_logs;
CREATE POLICY "Public access workout_logs" ON workout_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access exercise_logs" ON exercise_logs;
CREATE POLICY "Public access exercise_logs" ON exercise_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access personal_records" ON personal_records;
CREATE POLICY "Public access personal_records" ON personal_records FOR ALL USING (true) WITH CHECK (true);
