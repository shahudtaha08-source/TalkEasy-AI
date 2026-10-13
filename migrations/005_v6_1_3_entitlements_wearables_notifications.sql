-- TalkEasy v6.1.3 migration
-- Adds server-authoritative entitlements, device-sourced wearable measurements,
-- push device tokens and per-user notification preferences.
-- Idempotent: safe to run more than once.

-- ─── ENTITLEMENTS (7-day trial + premium) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS entitlements (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL UNIQUE REFERENCES users(id),
  trial_started_at TIMESTAMP,
  trial_ends_at TIMESTAMP,
  plan TEXT NOT NULL DEFAULT 'free',
  premium_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_entitlements_user ON entitlements(user_id);

-- ─── WEARABLE MEASUREMENTS (device-sourced only, never mixed with AI data) ────
CREATE TABLE IF NOT EXISTS wearable_measurements (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  source TEXT NOT NULL,
  device_label TEXT,
  metric TEXT NOT NULL,
  value REAL,
  value_secondary REAL,
  unit TEXT,
  recorded_at TIMESTAMP NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  meta TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wearable_user_metric_date ON wearable_measurements(user_id, metric, date);
CREATE INDEX IF NOT EXISTS idx_wearable_user_date ON wearable_measurements(user_id, date);

-- ─── DEVICE PUSH TOKENS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS device_tokens (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  token TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL DEFAULT 'unknown',
  provider TEXT NOT NULL DEFAULT 'fcm',
  invalid BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_device_tokens_user ON device_tokens(user_id);

-- ─── NOTIFICATION PREFERENCES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notification_preferences (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL UNIQUE REFERENCES users(id),
  timezone TEXT NOT NULL DEFAULT 'UTC',
  quiet_hours_start TEXT,
  quiet_hours_end TEXT,
  categories TEXT NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_prefs_user ON notification_preferences(user_id);

-- ─── REPORTS: split by data source (wellness vs wearable) ────────────────────
ALTER TABLE reports ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'wellness';
