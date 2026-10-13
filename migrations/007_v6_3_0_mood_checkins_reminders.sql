-- TalkEasy v6.3.0 migration — multiple mood check-ins + 3-hour reminder state.
--
-- Additive and idempotent: no existing rows or columns are dropped or rewritten.
--
-- Notes on data integrity:
--   * `moods` and `mood_entries` have NEVER had a per-day UNIQUE constraint, so
--     several check-ins on the same calendar day were always representable. The
--     once-per-day limit lived only in the client UI and has been removed; no
--     upsert/uniqueness change is required here.
--   * Each row already carries `created_at` (absolute timestamp), which is the
--     reference point for the next reminder. The indexes below simply make
--     "latest check-in per user" and per-day timelines efficient.
--   * Existing mood history and user records are preserved untouched.

-- ─── ORDERING INDEXES FOR MULTIPLE CHECK-INS ────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_mood_entries_user_created
  ON mood_entries(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_moods_user_created
  ON moods(user_id, created_at DESC);

-- ─── 3-HOUR REMINDER SCHEDULING STATE ───────────────────────────────────────
-- Stores the last saved check-in and the derived next reminder so a device that
-- reconnects after being offline schedules a single future reminder (never a
-- burst). Preferences (timezone / quiet hours / on-off) remain in
-- notification_preferences.
CREATE TABLE IF NOT EXISTS mood_reminder_state (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  last_check_in_at TIMESTAMP,
  next_reminder_at TIMESTAMP,
  last_notified_at TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mood_reminder_user ON mood_reminder_state(user_id);

COMMENT ON TABLE mood_reminder_state IS 'Per-user 3-hour mood check-in reminder scheduling state (v6.3.0)';
COMMENT ON COLUMN mood_reminder_state.last_check_in_at IS 'Timestamp of the last successfully saved mood check-in';
COMMENT ON COLUMN mood_reminder_state.next_reminder_at IS 'Next reminder instant derived from last_check_in_at';
COMMENT ON COLUMN mood_reminder_state.last_notified_at IS 'Last reminder actually shown, to prevent duplicates';
