import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, timestamp, varchar, serial, integer, text, boolean, date } from "drizzle-orm/pg-core";
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

export const insertConversationSchema = createInsertSchema(conversations).omit({ id: true, createdAt: true, userId: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertMoodSchema = createInsertSchema(moods).omit({ id: true, createdAt: true, userId: true });
export const insertHabitSchema = createInsertSchema(habits).omit({ id: true, createdAt: true, userId: true });
export const insertJournalSchema = createInsertSchema(journals).omit({ id: true, createdAt: true, userId: true });
export const insertSleepEntrySchema = createInsertSchema(sleepEntries).omit({ id: true, createdAt: true, userId: true });
export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({ id: true, createdAt: true });
export const insertSafetyEventSchema = createInsertSchema(safetyEvents).omit({ id: true, createdAt: true, userId: true });

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
