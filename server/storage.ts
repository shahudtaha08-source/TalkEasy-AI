import { db } from "./db";
import { 
  users, moods, habits, conversations, messages, journals,
  goals, reflectionPrompts, reflectionResponses, safetyPlans, experiments,
  type User, type InsertMood, type Mood, type InsertHabit, type Habit, type Journal, type InsertJournal,
  type Goal, type InsertGoal, type ReflectionPrompt, type ReflectionResponse, type InsertReflectionResponse,
  type SafetyPlan, type InsertSafetyPlan, type Experiment, type InsertExperiment
} from "@shared/schema";
import { eq, desc, and, asc } from "drizzle-orm";

export interface IStorage {
  // Moods
  getMoods(userId: string): Promise<Mood[]>;
  createMood(userId: string, mood: InsertMood): Promise<Mood>;
  
  // Habits
  getHabits(userId: string, date?: string): Promise<Habit[]>;
  createHabit(userId: string, habit: InsertHabit): Promise<Habit>;
  updateHabit(userId: string, id: number, updates: Partial<InsertHabit>): Promise<Habit>;

  // Journals
  getJournals(userId: string): Promise<Journal[]>;
  createJournal(userId: string, journal: InsertJournal): Promise<Journal>;

  // Goals
  getGoals(userId: string): Promise<Goal[]>;
  createGoal(userId: string, goal: InsertGoal): Promise<Goal>;
  updateGoal(userId: string, id: number, updates: Partial<Goal>): Promise<Goal>;
  deleteGoal(userId: string, id: number): Promise<void>;

  // Reflections
  getReflectionPrompts(): Promise<ReflectionPrompt[]>;
  getReflectionResponses(userId: string): Promise<ReflectionResponse[]>;
  createReflectionResponse(userId: string, response: InsertReflectionResponse): Promise<ReflectionResponse>;

  // Safety Plan
  getSafetyPlan(userId: string): Promise<SafetyPlan | null>;
  createOrUpdateSafetyPlan(userId: string, plan: InsertSafetyPlan): Promise<SafetyPlan>;

  // Experiments
  getExperiments(userId: string): Promise<Experiment[]>;
  createExperiment(userId: string, experiment: InsertExperiment): Promise<Experiment>;
  updateExperiment(userId: string, id: number, updates: Partial<Experiment>): Promise<Experiment>;

  // User
  updateUser(id: string, updates: Partial<User>): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  async getMoods(userId: string): Promise<Mood[]> {
    return await db.select().from(moods).where(eq(moods.userId, userId)).orderBy(desc(moods.date));
  }

  async createMood(userId: string, insertMood: InsertMood): Promise<Mood> {
    const [mood] = await db.insert(moods).values({ ...insertMood, userId }).returning();
    return mood;
  }

  async getHabits(userId: string, date?: string): Promise<Habit[]> {
    const rows = await db.select().from(habits).where(eq(habits.userId, userId));
    if (!date) return rows;
    return rows.filter((habit) => habit.date === date);
  }

  async createHabit(userId: string, insertHabit: InsertHabit): Promise<Habit> {
    const [habit] = await db.insert(habits).values({ ...insertHabit, userId }).returning();
    return habit;
  }

  async updateHabit(userId: string, id: number, updates: Partial<InsertHabit>): Promise<Habit> {
    const [habit] = await db.update(habits).set(updates).where(and(eq(habits.userId, userId), eq(habits.id, id))).returning();
    if (!habit) throw Object.assign(new Error("Habit not found"), { status: 404 });
    return habit;
  }

  async getJournals(userId: string): Promise<Journal[]> {
    return await db.select().from(journals).where(eq(journals.userId, userId)).orderBy(desc(journals.date));
  }

  async createJournal(userId: string, insertJournal: InsertJournal): Promise<Journal> {
    const [journal] = await db.insert(journals).values({ ...insertJournal, userId }).returning();
    return journal;
  }

  async getGoals(userId: string): Promise<Goal[]> {
    return await db.select().from(goals).where(eq(goals.userId, userId)).orderBy(desc(goals.createdAt));
  }

  async createGoal(userId: string, insertGoal: InsertGoal): Promise<Goal> {
    const [goal] = await db.insert(goals).values({ ...insertGoal, userId }).returning();
    return goal;
  }

  async updateGoal(userId: string, id: number, updates: Partial<Goal>): Promise<Goal> {
    const [goal] = await db.update(goals).set({ ...updates, updatedAt: new Date() }).where(and(eq(goals.userId, userId), eq(goals.id, id))).returning();
    if (!goal) throw Object.assign(new Error("Goal not found"), { status: 404 });
    return goal;
  }

  async deleteGoal(userId: string, id: number): Promise<void> {
    const deleted = await db.delete(goals).where(and(eq(goals.userId, userId), eq(goals.id, id))).returning();
    if (deleted.length === 0) throw Object.assign(new Error("Goal not found"), { status: 404 });
  }

  async getReflectionPrompts(): Promise<ReflectionPrompt[]> {
    return await db.select().from(reflectionPrompts).orderBy(asc(reflectionPrompts.id));
  }

  async getReflectionResponses(userId: string): Promise<ReflectionResponse[]> {
    return await db.select().from(reflectionResponses).where(eq(reflectionResponses.userId, userId)).orderBy(desc(reflectionResponses.createdAt));
  }

  async createReflectionResponse(userId: string, insertResponse: InsertReflectionResponse): Promise<ReflectionResponse> {
    const [response] = await db.insert(reflectionResponses).values({ ...insertResponse, userId }).returning();
    return response;
  }

  async getSafetyPlan(userId: string): Promise<SafetyPlan | null> {
    const [plan] = await db.select().from(safetyPlans).where(eq(safetyPlans.userId, userId));
    return plan || null;
  }

  async createOrUpdateSafetyPlan(userId: string, planData: InsertSafetyPlan): Promise<SafetyPlan> {
    const existing = await this.getSafetyPlan(userId);
    if (existing) {
      const [updated] = await db.update(safetyPlans).set({ ...planData, updatedAt: new Date() }).where(eq(safetyPlans.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(safetyPlans).values({ ...planData, userId }).returning();
    return created;
  }

  async getExperiments(userId: string): Promise<Experiment[]> {
    return await db.select().from(experiments).where(eq(experiments.userId, userId)).orderBy(desc(experiments.createdAt));
  }

  async createExperiment(userId: string, insertExperiment: InsertExperiment): Promise<Experiment> {
    const [experiment] = await db.insert(experiments).values({ ...insertExperiment, userId }).returning();
    return experiment;
  }

  async updateExperiment(userId: string, id: number, updates: Partial<Experiment>): Promise<Experiment> {
    const [experiment] = await db.update(experiments).set({ ...updates, updatedAt: new Date() }).where(and(eq(experiments.userId, userId), eq(experiments.id, id))).returning();
    if (!experiment) throw Object.assign(new Error("Experiment not found"), { status: 404 });
    return experiment;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }
}

export const storage = new DatabaseStorage();
