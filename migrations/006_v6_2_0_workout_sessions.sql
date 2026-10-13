-- TalkEasy v6.2.0 migration
-- Adds phone-tracked exercise/activity sessions. Provenance (`source`) is
-- recorded so phone-tracked activity is never confused with device/wearable
-- measurements. Calories are always a labelled estimate; the column is nullable
-- because missing data must stay missing rather than becoming 0.
-- Camera-based recognition is intentionally not supported in v6.2.0.
-- Idempotent: safe to run more than once.

CREATE TABLE IF NOT EXISTS workout_sessions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  activity_id TEXT NOT NULL,
  category TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual', -- manual | phone_sensor | gps
  started_at TIMESTAMPTZ NOT NULL,
  duration_seconds INTEGER NOT NULL,
  repetitions INTEGER,
  sets INTEGER,
  distance_meters REAL,
  weight_kg REAL,
  calories_kcal INTEGER,
  calories_estimated BOOLEAN NOT NULL DEFAULT TRUE,
  weight_assumed BOOLEAN NOT NULL DEFAULT FALSE,
  met REAL,
  notes TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workout_user_date ON workout_sessions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_workout_user_activity ON workout_sessions(user_id, activity_id);
