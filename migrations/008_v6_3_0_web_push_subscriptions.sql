-- TalkEasy v6.3.0 migration — Web Push (browser Push API / RFC 8030) subscriptions.
--
-- Additive and idempotent: creates one new table and one index, drops nothing,
-- and is safe to re-run against an existing database. Existing data is preserved.
-- The server-side scheduler reads this table to deliver background mood
-- reminders while the browser tab is closed.

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id serial PRIMARY KEY,
  user_id varchar NOT NULL REFERENCES users(id),
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  invalid boolean NOT NULL DEFAULT false,
  failure_count integer NOT NULL DEFAULT 0,
  last_success_at timestamp,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "IDX_push_sub_user" ON push_subscriptions (user_id);
