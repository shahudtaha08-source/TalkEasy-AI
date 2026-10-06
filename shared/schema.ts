import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, timestamp, varchar, serial, integer, text, boolean, date, real, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const sessions = pgTable("sessions", {
  sid: varchar("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire").notNull(),
}, (table) => [index("IDX_session_expire").on(table.expire)]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  username: varchar("username").unique(),
  passwordHash: text("password_hash"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  ageGroup: text("age_group"),
  preferredLanguage: text("preferred_language").default('English'),
  emergencyContact: text("emergency_contact"),
  city: text("city"),
  locality: text("locality"),
  budget: text("budget"),
  occupationType: text("occupation_type"),
  waterTargetMl: integer("water_target_ml").default(2500),
  sleepTargetHours: real("sleep_target_hours").default(8),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  detectedEmotion: text("detected_emotion"),
  aiSuggestion: text("ai_suggestion"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const moods = pgTable("moods", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  mood: text("mood").notNull(),
  notes: text("notes"),
  date: date("date").notNull().default(sql`CURRENT_DATE`),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const habits = pgTable("habits", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  completed: boolean("completed").default(false).notNull(),
  completionPercentage: integer("completion_percentage").default(100).notNull(),
  notes: text("notes"),
  date: date("date").notNull().default(sql`CURRENT_DATE`),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const journals = pgTable("journals", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title"),
  content: text("content").notNull(),
  type: text("type").notNull().default("reflection"),
  tags: text("tags"),
  date: date("date").notNull().default(sql`CURRENT_DATE`),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const sleepEntries = pgTable("sleep_entries", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  nightSleep: integer("night_sleep").notNull(),
  nap: integer("nap").default(0).notNull(),
  totalSleep: integer("total_sleep").notNull(),
  date: date("date").notNull().default(sql`CURRENT_DATE`),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [index("IDX_sleep_user_date").on(table.userId, table.date)]);

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [index("IDX_reset_token_user").on(table.userId), index("IDX_reset_token_expires").on(table.expiresAt)]);

export const safetyEvents = pgTable("safety_events", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  eventType: text("event_type").notNull(),
  severity: text("severity").notNull(),
  notes: text("notes"),
  actionRequested: text("action_requested"),
  followUpRequired: boolean("follow_up_required").default(true).notNull(),
  followUpCompleted: boolean("follow_up_completed").default(false).notNull(),
  followUpDate: timestamp("follow_up_date"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [index("IDX_safety_user").on(table.userId), index("IDX_safety_follow_up").on(table.followUpRequired)]);

// ─── NEW v6.0 TABLES ─────────────────────────────────────────────────────────

/**
 * Detailed mood entries — replaces basic mood tracking with factors + intensity.
 * The basic `moods` table is preserved for backward-compatibility.
 */
export const moodEntries = pgTable("mood_entries", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  mood: text("mood").notNull(),           // Happy, Calm, Sad, Anxious, Angry, Tired, Overwhelmed, Excited, Neutral, Other
  intensity: integer("intensity").notNull().default(5), // 1–10
  factors: text("factors"),              // JSON array of strings: ["Friends", "College", ...]
  contextNote: text("context_note"),     // Optional "What happened today?"
  date: date("date").notNull().default(sql`CURRENT_DATE`),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [index("IDX_mood_entries_user_date").on(table.userId, table.date)]);

/**
 * Daily water intake entries — each drink log entry.
 */
export const waterEntries = pgTable("water_entries", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  amountMl: integer("amount_ml").notNull(),
  date: date("date").notNull().default(sql`CURRENT_DATE`),
  loggedAt: timestamp("logged_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [index("IDX_water_user_date").on(table.userId, table.date)]);

/**
 * Stress tracking entries.
 */
export const stressEntries = pgTable("stress_entries", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  level: text("level").notNull(),         // Relaxed, Low, Moderate, High
  score: integer("score"),                // 1–10 optional numeric score
  note: text("note"),
  interventionViewed: boolean("intervention_viewed").default(false).notNull(),
  date: date("date").notNull().default(sql`CURRENT_DATE`),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [index("IDX_stress_user_date").on(table.userId, table.date)]);

/**
 * Health daily records — aggregated daily health snapshot.
 * Demo-labelled fields: heartRate, spo2, systolicBP, diastolicBP, steps — 
 * these are demo/simulated in v6.0 (no wearable hardware connected).
 */
export const healthDailyRecords = pgTable("health_daily_records", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: date("date").notNull().default(sql`CURRENT_DATE`),
  // Demo/simulated wearable metrics — must be labelled in UI
  heartRate: integer("heart_rate"),        // bpm — demo data
  spo2: integer("spo2"),                   // % — demo data
  systolicBp: integer("systolic_bp"),      // mmHg — demo data
  diastolicBp: integer("diastolic_bp"),    // mmHg — demo data
  ecgStatus: text("ecg_status"),           // demo/simulated record
  steps: integer("steps"),                 // demo data
  isDemo: boolean("is_demo").default(true).notNull(), // Always true in v6.0
  // Real user-entered metrics
  sleepHours: real("sleep_hours"),
  waterMl: integer("water_ml").default(0),
  stressLevel: text("stress_level"),
  mood: text("mood"),
  moodIntensity: integer("mood_intensity"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
  index("IDX_health_user_date").on(table.userId, table.date),
]);

/**
 * Generated wellness reports metadata.
 */
export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),           // "30day" | "90day"
  title: text("title").notNull(),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  summaryJson: text("summary_json"),      // JSON blob of report data
  generatedAt: timestamp("generated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [index("IDX_reports_user").on(table.userId)]);

// ─── PERSONAL GOALS ────────────────────────────────────────────────────────────
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  focusArea: text("focus_area").notNull(), // Sleep | Mood | Stress | Hydration | Habits | Activity | Reflection | General wellness
  target: real("target"),
  unit: text("unit"),
  currentProgress: real("current_progress").default(0).notNull(),
  status: text("status").notNull().default("active"), // active | paused | completed | archived
  deadline: date("deadline"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [index("IDX_goals_user").on(table.userId), index("IDX_goals_status").on(table.status)]);

// ─── REFLECTION PROMPTS & RESPONSES ───────────────────────────────────────────
export const reflectionPrompts = pgTable("reflection_prompts", {
  id: serial("id").primaryKey(),
  prompt: text("prompt").notNull(),
  category: text("category").notNull().default("daily"), // daily | weekly
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [index("IDX_reflection_prompts_category").on(table.category)]);

export const reflectionResponses = pgTable("reflection_responses", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  promptId: integer("prompt_id").notNull().references(() => reflectionPrompts.id),
  response: text("response").notNull(),
  date: date("date").notNull().default(sql`CURRENT_DATE`),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [index("IDX_reflection_responses_user_date").on(table.userId, table.date)]);

// ─── SAFETY PLAN ───────────────────────────────────────────────────────────────
export const safetyPlans = pgTable("safety_plans", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  trustedContacts: text("trusted_contacts"), // JSON array
  safePlaces: text("safe_places"), // JSON array
  copingStrategies: text("coping_strategies"), // JSON array
  groundingTechniques: text("grounding_techniques"), // JSON array
  reasonsToKeepGoing: text("reasons_to_keep_going"), // JSON array
  professionalSupport: text("professional_support"), // JSON array
  emergencyResources: text("emergency_resources"), // JSON array
  notes: text("notes"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [index("IDX_safety_plans_user").on(table.userId)]);

// ─── MICRO EXPERIMENTS / TALKEASY LAB ──────────────────────────────────────────
export const experiments = pgTable("experiments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // sleep | hydration | reflection | habit | stress | mood | activity
  title: text("title").notNull(),
  objective: text("objective"),
  durationDays: integer("duration_days").notNull().default(7),
  target: real("target"),
  baselineStartDate: date("baseline_start_date"),
  baselineEndDate: date("baseline_end_date"),
  experimentStartDate: date("experiment_start_date"),
  experimentEndDate: date("experiment_end_date"),
  status: text("status").notNull().default("draft"), // draft | active | completed | cancelled
  completedAt: timestamp("completed_at"),
  baselineData: text("baseline_data"), // JSON
  experimentData: text("experiment_data"), // JSON
  result: text("result"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [index("IDX_experiments_user").on(table.userId), index("IDX_experiments_status").on(table.status)]);

// ─── INSERT SCHEMAS ───────────────────────────────────────────────────────────

export const insertConversationSchema = createInsertSchema(conversations).omit({ id: true, createdAt: true, userId: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertMoodSchema = createInsertSchema(moods).omit({ id: true, createdAt: true, userId: true });
export const insertHabitSchema = createInsertSchema(habits).omit({ id: true, createdAt: true, userId: true });
export const insertJournalSchema = createInsertSchema(journals).omit({ id: true, createdAt: true, userId: true });
export const insertSleepEntrySchema = createInsertSchema(sleepEntries).omit({ id: true, createdAt: true, userId: true });
export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({ id: true, createdAt: true });
export const insertSafetyEventSchema = createInsertSchema(safetyEvents).omit({ id: true, createdAt: true, userId: true });
export const insertMoodEntrySchema = createInsertSchema(moodEntries).omit({ id: true, createdAt: true, userId: true });
export const insertWaterEntrySchema = createInsertSchema(waterEntries).omit({ id: true, loggedAt: true, userId: true });
export const insertStressEntrySchema = createInsertSchema(stressEntries).omit({ id: true, createdAt: true, userId: true });
export const insertHealthDailyRecordSchema = createInsertSchema(healthDailyRecords).omit({ id: true, createdAt: true, updatedAt: true, userId: true });
export const insertReportSchema = createInsertSchema(reports).omit({ id: true, generatedAt: true, userId: true });
export const insertGoalSchema = createInsertSchema(goals).omit({ id: true, createdAt: true, updatedAt: true, completedAt: true, userId: true });
export const insertReflectionPromptSchema = createInsertSchema(reflectionPrompts).omit({ id: true, createdAt: true });
export const insertReflectionResponseSchema = createInsertSchema(reflectionResponses).omit({ id: true, createdAt: true, userId: true });
export const insertSafetyPlanSchema = createInsertSchema(safetyPlans).omit({ id: true, createdAt: true, updatedAt: true, userId: true });
export const insertExperimentSchema = createInsertSchema(experiments).omit({ id: true, createdAt: true, updatedAt: true, completedAt: true, userId: true });

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Mood = typeof moods.$inferSelect;
export type InsertMood = z.infer<typeof insertMoodSchema>;
export type Habit = typeof habits.$inferSelect;
export type InsertHabit = z.infer<typeof insertHabitSchema>;
export type Journal = typeof journals.$inferSelect;
export type InsertJournal = z.infer<typeof insertJournalSchema>;
export type SleepEntry = typeof sleepEntries.$inferSelect;
export type InsertSleepEntry = z.infer<typeof insertSleepEntrySchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type SafetyEvent = typeof safetyEvents.$inferSelect;
export type InsertSafetyEvent = z.infer<typeof insertSafetyEventSchema>;
export type MoodEntry = typeof moodEntries.$inferSelect;
export type InsertMoodEntry = z.infer<typeof insertMoodEntrySchema>;
export type WaterEntry = typeof waterEntries.$inferSelect;
export type InsertWaterEntry = z.infer<typeof insertWaterEntrySchema>;
export type StressEntry = typeof stressEntries.$inferSelect;
export type InsertStressEntry = z.infer<typeof insertStressEntrySchema>;
export type HealthDailyRecord = typeof healthDailyRecords.$inferSelect;
export type InsertHealthDailyRecord = z.infer<typeof insertHealthDailyRecordSchema>;
export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type ReflectionPrompt = typeof reflectionPrompts.$inferSelect;
export type InsertReflectionPrompt = z.infer<typeof insertReflectionPromptSchema>;
export type ReflectionResponse = typeof reflectionResponses.$inferSelect;
export type InsertReflectionResponse = z.infer<typeof insertReflectionResponseSchema>;
export type SafetyPlan = typeof safetyPlans.$inferSelect;
export type InsertSafetyPlan = z.infer<typeof insertSafetyPlanSchema>;
export type Experiment = typeof experiments.$inferSelect;
export type InsertExperiment = z.infer<typeof insertExperimentSchema>;
