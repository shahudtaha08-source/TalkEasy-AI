-- TalkEasy v6.5.0 migration — User preferences (cross-device UI & theme sync)
--
-- Additive and idempotent: creates one new table and one index, drops nothing,
-- and is safe to re-run against an existing database. Existing data is preserved.
--
-- Stores per-user UI preferences (theme, accent palette, dashboard layout,
-- sidebar config, home shortcuts) server-side so they follow the user across
-- devices. All fields have safe defaults; missing rows are treated as
-- "use defaults" by the client.

CREATE TABLE IF NOT EXISTS user_preferences (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'system',
  accent_palette TEXT DEFAULT 'teal',
  accent_color TEXT,
  background_color TEXT,
  surface_color TEXT,
  dashboard_layout TEXT DEFAULT '{}',
  sidebar_config TEXT DEFAULT '{}',
  home_shortcuts TEXT DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);

COMMENT ON TABLE user_preferences IS 'Per-user UI preferences for cross-device sync (v6.5.0)';