-- TalkEasy v6.1 migration
-- Creates the wellness-experience tables that are present in shared/schema.ts
-- but were never materialised in the database, plus starter reflection prompts.
-- Idempotent: safe to run more than once.

-- ─── PERSONAL GOALS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS goals (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  focus_area TEXT NOT NULL,
  target REAL,
  unit TEXT,
  current_progress REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  deadline DATE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);

-- ─── REFLECTION PROMPTS & RESPONSES ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reflection_prompts (
  id SERIAL PRIMARY KEY,
  prompt TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'daily',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reflection_prompts_category ON reflection_prompts(category);

CREATE TABLE IF NOT EXISTS reflection_responses (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  prompt_id INTEGER NOT NULL REFERENCES reflection_prompts(id),
  response TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reflection_responses_user_date ON reflection_responses(user_id, date);

-- ─── SAFETY PLAN ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS safety_plans (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  trusted_contacts TEXT,
  safe_places TEXT,
  coping_strategies TEXT,
  grounding_techniques TEXT,
  reasons_to_keep_going TEXT,
  professional_support TEXT,
  emergency_resources TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_safety_plans_user ON safety_plans(user_id);

-- ─── MICRO EXPERIMENTS / TALKEASY LAB ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS experiments (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  objective TEXT,
  duration_days INTEGER NOT NULL DEFAULT 7,
  target REAL,
  baseline_start_date DATE,
  baseline_end_date DATE,
  experiment_start_date DATE,
  experiment_end_date DATE,
  status TEXT NOT NULL DEFAULT 'draft',
  completed_at TIMESTAMP,
  baseline_data TEXT,
  experiment_data TEXT,
  result TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_experiments_user ON experiments(user_id);
CREATE INDEX IF NOT EXISTS idx_experiments_status ON experiments(status);

-- ─── STARTER REFLECTION PROMPTS ─────────────────────────────────────────────
INSERT INTO reflection_prompts (id, prompt, category) VALUES
  (1,  'What is one thing that has been on your mind today?', 'daily'),
  (2,  'What made today feel a little easier or harder?', 'daily'),
  (3,  'What are you feeling right now, and what do you think contributed to it?', 'daily'),
  (4,  'What is something you handled better than you expected?', 'daily'),
  (5,  'What is one small thing you would like to change tomorrow?', 'daily'),
  (6,  'What do you need more of right now?', 'daily'),
  (7,  'What is something you are grateful for today?', 'daily'),
  (8,  'What brought me joy today?', 'daily'),
  (9,  'What challenged me today and how did I respond?', 'daily'),
  (10, 'What is one thing I learned today?', 'daily'),
  (11, 'What moment made me feel calm or safe today?', 'daily'),
  (12, 'What is something I am looking forward to this week?', 'daily')
ON CONFLICT (id) DO UPDATE SET prompt = EXCLUDED.prompt, category = EXCLUDED.category;
