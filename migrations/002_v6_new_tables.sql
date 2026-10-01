-- TalkEasy v6.0 Database Migration
-- New tables for enhanced wellness tracking
-- Run this after the base schema migration

-- Mood Entries Table (detailed mood tracking with factors + intensity)
CREATE TABLE IF NOT EXISTS mood_entries (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mood TEXT NOT NULL, -- Happy, Calm, Sad, Anxious, Angry, Tired, Overwhelmed, Excited, Neutral, Other
  intensity INTEGER NOT NULL DEFAULT 5, -- 1-10
  factors TEXT, -- JSON array of strings: ["Friends", "College", ...]
  context_note TEXT, -- Optional "What happened today?"
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mood_entries_user_date ON mood_entries(user_id, date);

-- Water Entries Table (daily water intake tracking)
CREATE TABLE IF NOT EXISTS water_entries (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_ml INTEGER NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  logged_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_water_user_date ON water_entries(user_id, date);

-- Stress Entries Table (stress level tracking)
CREATE TABLE IF NOT EXISTS stress_entries (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level TEXT NOT NULL, -- Relaxed, Low, Moderate, High
  score INTEGER, -- 1-10 optional numeric score
  note TEXT,
  intervention_viewed BOOLEAN NOT NULL DEFAULT FALSE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stress_user_date ON stress_entries(user_id, date);

-- Health Daily Records Table (aggregated daily health snapshot)
CREATE TABLE IF NOT EXISTS health_daily_records (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Demo/simulated wearable metrics (v6.0 - no real hardware connected)
  heart_rate INTEGER, -- bpm - demo data
  spo2 INTEGER, -- % - demo data
  systolic_bp INTEGER, -- mmHg - demo data
  diastolic_bp INTEGER, -- mmHg - demo data
  ecg_status TEXT, -- demo/simulated record
  steps INTEGER, -- demo data
  is_demo BOOLEAN NOT NULL DEFAULT TRUE, -- Always true in v6.0
  
  -- Real user-entered metrics
  sleep_hours REAL,
  water_ml INTEGER DEFAULT 0,
  stress_level TEXT,
  mood TEXT,
  mood_intensity INTEGER,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_health_user_date ON health_daily_records(user_id, date);

-- Reports Table (generated wellness reports metadata)
CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- "30day" | "90day"
  title TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  summary_json TEXT, -- JSON blob of report data
  generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reports_user ON reports(user_id);

-- Add new columns to users table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'water_target_ml') THEN
        ALTER TABLE users ADD COLUMN water_target_ml INTEGER DEFAULT 2500;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'sleep_target_hours') THEN
        ALTER TABLE users ADD COLUMN sleep_target_hours REAL DEFAULT 8;
    END IF;
END $$;

-- Add comments to document the schema
COMMENT ON TABLE mood_entries IS 'Detailed mood entries with factors and intensity - replaces basic mood tracking';
COMMENT ON TABLE water_entries IS 'Daily water intake entries - each drink log entry';
COMMENT ON TABLE stress_entries IS 'Stress tracking entries with intervention tracking';
COMMENT ON TABLE health_daily_records IS 'Health daily records - aggregated daily health snapshot with demo wearable metrics';
COMMENT ON TABLE reports IS 'Generated wellness reports metadata';

COMMENT ON COLUMN health_daily_records.is_demo IS 'True in v6.0 - indicates wearable metrics are simulated/demo data';
COMMENT ON COLUMN health_daily_records.heart_rate IS 'Demo data in v6.0 - no real wearable connected';
COMMENT ON COLUMN health_daily_records.spo2 IS 'Demo data in v6.0 - no real wearable connected';
COMMENT ON COLUMN health_daily_records.systolic_bp IS 'Demo data in v6.0 - no real wearable connected';
COMMENT ON COLUMN health_daily_records.diastolic_bp IS 'Demo data in v6.0 - no real wearable connected';
COMMENT ON COLUMN health_daily_records.ecg_status IS 'Demo/simulated record in v6.0 - no real wearable connected';
COMMENT ON COLUMN health_daily_records.steps IS 'Demo data in v6.0 - no real wearable connected';
