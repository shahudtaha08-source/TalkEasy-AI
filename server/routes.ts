import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupLocalAuth, isAuthenticated } from "./auth";
import { api } from "@shared/routes";
import { db } from "./db";
import { moods, conversations, messages, users, journals, sleepEntries, moodEntries, waterEntries, stressEntries, healthDailyRecords, reports } from "@shared/schema";
import { and, desc, eq, inArray } from "drizzle-orm";
import { getAIService, SAFETY_SYSTEM_PROMPT, STANDARD_SYSTEM_PROMPT } from "./ai-service";
import { SafetyDetector, SafetyEventLogger } from "./safety-detection";

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  setupLocalAuth(app);

  app.patch(api.user.update.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.user.update.input.parse(req.body);
      res.json(await storage.updateUser(req.user.claims.sub, input));
    } catch { res.status(400).json({ message: "Failed to update user" }); }
  });

  app.get(api.moods.list.path, isAuthenticated, async (req: any, res) => res.json(await storage.getMoods(req.user.claims.sub)));
  app.post(api.moods.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { intensity, factors, contextNote, ...legacy } = api.moods.create.input.parse(req.body);
      const created = await storage.createMood(userId, legacy);
      // Mirror into the structured mood_entries table so trends/statistics can
      // read intensity, factors and the context note as real columns.
      try {
        await db.insert(moodEntries).values({
          userId,
          mood: legacy.mood,
          intensity: intensity ?? 5,
          factors: factors && factors.length ? JSON.stringify(factors) : null,
          contextNote: contextNote ?? legacy.notes ?? null,
          ...(legacy.date ? { date: legacy.date } : {}),
        });
      } catch { /* structured copy is best-effort; legacy row is authoritative */ }
      res.status(201).json(created);
    }
    catch { res.status(400).json({ message: "Failed to create mood" }); }
  });

  app.get(api.habits.list.path, isAuthenticated, async (req: any, res) => res.json(await storage.getHabits(req.user.claims.sub, req.query.date as string | undefined)));
  app.post(api.habits.create.path, isAuthenticated, async (req: any, res) => {
    try { const input = api.habits.create.input.parse(req.body); res.status(201).json(await storage.createHabit(req.user.claims.sub, input)); }
    catch { res.status(400).json({ message: "Failed to create habit" }); }
  });
  app.patch("/api/habits/:id", isAuthenticated, async (req: any, res) => {
    try { const input = api.habits.update.input.parse(req.body); res.json(await storage.updateHabit(req.user.claims.sub, parseInt(req.params.id), input)); }
    catch (err: any) { res.status(err?.status ?? 400).json({ message: err?.status === 404 ? "Habit not found" : "Failed to update habit" }); }
  });

  app.get(api.journals.list.path, isAuthenticated, async (req: any, res) => res.json(await storage.getJournals(req.user.claims.sub)));
  app.post(api.journals.create.path, isAuthenticated, async (req: any, res) => {
    try { const input = api.journals.create.input.parse(req.body); res.status(201).json(await storage.createJournal(req.user.claims.sub, input)); }
    catch { res.status(400).json({ message: "Failed to create journal" }); }
  });
  app.patch("/api/journals/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const [journal] = await db.update(journals)
        .set(updates)
        .where(and(eq(journals.id, id), eq(journals.userId, req.user.claims.sub)))
        .returning();
      if (!journal) return res.status(404).json({ message: "Journal not found" });
      res.json(journal);
    } catch { res.status(400).json({ message: "Failed to update journal" }); }
  });
  app.delete("/api/journals/:id", isAuthenticated, async (req: any, res) => {
    try {
      const deleted = await db.delete(journals)
        .where(and(eq(journals.id, parseInt(req.params.id)), eq(journals.userId, req.user.claims.sub)))
        .returning();
      if (deleted.length === 0) return res.status(404).json({ message: "Journal not found" });
      res.json({ success: true });
    } catch { res.status(400).json({ message: "Failed to delete journal" }); }
  });

  // Sleep tracking routes
  app.get("/api/sleep-entries", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const entries = await db
        .select()
        .from(sleepEntries)
        .where(eq(sleepEntries.userId, userId))
        .orderBy(desc(sleepEntries.date))
        .limit(30);
      res.json(entries);
    } catch { res.status(400).json({ message: "Failed to fetch sleep entries" }); }
  });

  app.post("/api/sleep-entries", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { nightSleep, nap, totalSleep, date } = req.body;

      // Check if entry exists for this date
      const [existing] = await db
        .select()
        .from(sleepEntries)
        .where(and(eq(sleepEntries.userId, userId), eq(sleepEntries.date, date)));

      if (existing) {
        // Update existing entry
        const [updated] = await db
          .update(sleepEntries)
          .set({ nightSleep, nap, totalSleep })
          .where(eq(sleepEntries.id, existing.id))
          .returning();
        res.json(updated);
      } else {
        // Create new entry
        const [created] = await db
          .insert(sleepEntries)
          .values({ userId, nightSleep, nap, totalSleep, date })
          .returning();
        res.status(201).json(created);
      }
    } catch { res.status(400).json({ message: "Failed to save sleep entry" }); }
  });

  // ─── v6.0 NEW ROUTES ─────────────────────────────────────────────────────────────

  // Mood entries (detailed mood tracking with factors + intensity)
  app.get("/api/mood-entries", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 30;
      const entries = await db
        .select()
        .from(moodEntries)
        .where(eq(moodEntries.userId, userId))
        .orderBy(desc(moodEntries.date))
        .limit(limit);
      res.json(entries);
    } catch { res.status(400).json({ message: "Failed to fetch mood entries" }); }
  });

  app.post("/api/mood-entries", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { mood, intensity, factors, contextNote, date } = req.body;
      const [created] = await db
        .insert(moodEntries)
        .values({ userId, mood, intensity, factors, contextNote, date })
        .returning();
      res.status(201).json(created);
    } catch { res.status(400).json({ message: "Failed to create mood entry" }); }
  });

  // Water intake entries
  app.get("/api/water-entries", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const date = req.query.date as string;
      const whereClause = date
        ? and(eq(waterEntries.userId, userId), eq(waterEntries.date, date))
        : eq(waterEntries.userId, userId);
      
      const entries = await db
        .select()
        .from(waterEntries)
        .where(whereClause)
        .orderBy(desc(waterEntries.loggedAt))
        .limit(100);
      res.json(entries);
    } catch { res.status(400).json({ message: "Failed to fetch water entries" }); }
  });

  app.post("/api/water-entries", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { amountMl, date } = req.body;
      const [created] = await db
        .insert(waterEntries)
        .values({ userId, amountMl, date })
        .returning();
      res.status(201).json(created);
    } catch { res.status(400).json({ message: "Failed to create water entry" }); }
  });

  app.delete("/api/water-entries/:id", isAuthenticated, async (req: any, res) => {
    try {
      await db.delete(waterEntries).where(eq(waterEntries.id, parseInt(req.params.id)));
      res.json({ success: true });
    } catch { res.status(400).json({ message: "Failed to delete water entry" }); }
  });

  // Stress entries
  app.get("/api/stress-entries", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 30;
      const entries = await db
        .select()
        .from(stressEntries)
        .where(eq(stressEntries.userId, userId))
        .orderBy(desc(stressEntries.date))
        .limit(limit);
      res.json(entries);
    } catch { res.status(400).json({ message: "Failed to fetch stress entries" }); }
  });

  app.post("/api/stress-entries", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { level, score, note, date } = req.body;
      const [created] = await db
        .insert(stressEntries)
        .values({ userId, level, score, note, date })
        .returning();
      res.status(201).json(created);
    } catch { res.status(400).json({ message: "Failed to create stress entry" }); }
  });

  app.patch("/api/stress-entries/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { interventionViewed } = req.body;
      const [updated] = await db
        .update(stressEntries)
        .set({ interventionViewed })
        .where(eq(stressEntries.id, parseInt(req.params.id)))
        .returning();
      res.json(updated);
    } catch { res.status(400).json({ message: "Failed to update stress entry" }); }
  });

  // Health daily records
  app.get("/api/health-daily-records", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 90;
      const entries = await db
        .select()
        .from(healthDailyRecords)
        .where(eq(healthDailyRecords.userId, userId))
        .orderBy(desc(healthDailyRecords.date))
        .limit(limit);
      res.json(entries);
    } catch { res.status(400).json({ message: "Failed to fetch health records" }); }
  });

  app.get("/api/health-daily-records/latest", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [latest] = await db
        .select()
        .from(healthDailyRecords)
        .where(eq(healthDailyRecords.userId, userId))
        .orderBy(desc(healthDailyRecords.date))
        .limit(1);
      res.json(latest || null);
    } catch { res.status(400).json({ message: "Failed to fetch latest health record" }); }
  });

  app.post("/api/health-daily-records", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { date, heartRate, spo2, systolicBp, diastolicBp, ecgStatus, steps, isDemo, sleepHours, waterMl, stressLevel, mood, moodIntensity } = req.body;

      // Check if record exists for this date
      const [existing] = await db
        .select()
        .from(healthDailyRecords)
        .where(and(eq(healthDailyRecords.userId, userId), eq(healthDailyRecords.date, date)));

      if (existing) {
        // Update existing record
        const [updated] = await db
          .update(healthDailyRecords)
          .set({ heartRate, spo2, systolicBp, diastolicBp, ecgStatus, steps, isDemo, sleepHours, waterMl, stressLevel, mood, moodIntensity, updatedAt: new Date() })
          .where(eq(healthDailyRecords.id, existing.id))
          .returning();
        res.json(updated);
      } else {
        // Create new record
        const [created] = await db
          .insert(healthDailyRecords)
          .values({ userId, date, heartRate, spo2, systolicBp, diastolicBp, ecgStatus, steps, isDemo, sleepHours, waterMl, stressLevel, mood, moodIntensity })
          .returning();
        res.status(201).json(created);
      }
    } catch { res.status(400).json({ message: "Failed to save health record" }); }
  });

  // Reports
  app.get("/api/reports", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reportsList = await db
        .select()
        .from(reports)
        .where(eq(reports.userId, userId))
        .orderBy(desc(reports.generatedAt));
      res.json(reportsList);
    } catch { res.status(400).json({ message: "Failed to fetch reports" }); }
  });

  app.post("/api/reports", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { type, title, periodStart, periodEnd, summaryJson } = req.body;
      const [created] = await db
        .insert(reports)
        .values({ userId, type, title, periodStart, periodEnd, summaryJson })
        .returning();
      res.status(201).json(created);
    } catch { res.status(400).json({ message: "Failed to create report" }); }
  });

  app.get("/api/reports/:id", isAuthenticated, async (req: any, res) => {
    try {
      const report = await db
        .select()
        .from(reports)
        .where(eq(reports.id, parseInt(req.params.id)))
        .limit(1);
      if (report.length === 0) {
        res.status(404).json({ message: "Report not found" });
      } else {
        res.json(report[0]);
      }
    } catch { res.status(400).json({ message: "Failed to fetch report" }); }
  });

  app.get(api.chat.list.path, isAuthenticated, async (req: any, res) => {
    res.json(await db.select().from(conversations).where(eq(conversations.userId, req.user.claims.sub)).orderBy(desc(conversations.createdAt)));
  });
  app.post(api.chat.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.chat.create.input.parse(req.body);
      const [conversation] = await db.insert(conversations).values({ ...input, userId: req.user.claims.sub }).returning();
      res.status(201).json(conversation);
    } catch { res.status(400).json({ message: "Invalid input" }); }
  });
  app.get(api.chat.history.path, isAuthenticated, async (req: any, res) => {
    res.json(await db.select().from(messages).where(eq(messages.conversationId, parseInt(req.params.id))).orderBy(messages.createdAt));
  });

  app.post(api.chat.sendMessage.path, isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { content } = req.body;
      const userId = req.user.claims.sub;
      const [user] = await db.select().from(users).where(eq(users.id, userId));

      await db.insert(messages).values({ conversationId: id, role: "user", content });

      // Safety detection
      const safetyDetection = SafetyDetector.detectSafetyConcern(content);
      
      if (safetyDetection.isSafetyConcern) {
        // Log safety event
        await SafetyEventLogger.logSafetyEvent({
          userId,
          eventType: 'safety_concern',
          severity: safetyDetection.severity,
          notes: `User message: ${content.substring(0, 200)}`,
          actionRequested: safetyDetection.suggestedAction,
          followUpRequired: safetyDetection.requiresImmediateIntervention,
          followUpCompleted: false,
        }, db);

        // Generate safety response
        const safetyResponse = SafetyDetector.generateSafetyResponse(safetyDetection, user.preferredLanguage || 'English');
        
        await db.insert(messages).values({
          conversationId: id,
          role: "assistant",
          content: safetyResponse,
          detectedEmotion: safetyDetection.riskCategory,
          aiSuggestion: SafetyDetector.getCrisisResources(user.preferredLanguage || 'English'),
        });

        if (!res.headersSent) {
          res.setHeader("Content-Type", "text/event-stream");
          res.setHeader("Cache-Control", "no-cache");
          res.setHeader("Connection", "keep-alive");
        }

        res.write(`data: ${JSON.stringify({ content: safetyResponse, detectedEmotion: safetyDetection.riskCategory, aiSuggestion: SafetyDetector.getCrisisResources(user.preferredLanguage || 'English') })}\n\n`);
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
        return;
      }

      // Check for pending follow-ups
      const pendingFollowUps = await SafetyEventLogger.checkPendingFollowUps(userId, db);
      if (pendingFollowUps.length > 0) {
        const followUpMessage = "Before we continue, were you able to take the safety step we discussed in our last conversation?";
        
        await db.insert(messages).values({
          conversationId: id,
          role: "assistant",
          content: followUpMessage,
          detectedEmotion: "neutral",
          aiSuggestion: null,
        });

        if (!res.headersSent) {
          res.setHeader("Content-Type", "text/event-stream");
          res.setHeader("Cache-Control", "no-cache");
          res.setHeader("Connection", "keep-alive");
        }

        res.write(`data: ${JSON.stringify({ content: followUpMessage, detectedEmotion: "neutral", aiSuggestion: null })}\n\n`);
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
        return;
      }

      // Get conversation history for context
      const conversationHistory = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, id))
        .orderBy(messages.createdAt)
        .limit(10);

      const messagesForAI = conversationHistory.map((m: any) => ({
        role: m.role,
        content: m.content,
      }));

      // Use AI service
      const aiService = getAIService();
      const isAIAvailable = await aiService.checkHealth() && await aiService.checkModelAvailability();

      if (!isAIAvailable) {
        const unavailableMessage = "Support Chat is currently unavailable. The AI service is not running. Please try again later or use the Find Help page for crisis resources.";
        
        await db.insert(messages).values({
          conversationId: id,
          role: "assistant",
          content: unavailableMessage,
          detectedEmotion: "neutral",
          aiSuggestion: null,
        });

        if (!res.headersSent) {
          res.setHeader("Content-Type", "text/event-stream");
          res.setHeader("Cache-Control", "no-cache");
          res.setHeader("Connection", "keep-alive");
        }

        res.write(`data: ${JSON.stringify({ content: unavailableMessage, detectedEmotion: "neutral", aiSuggestion: null })}\n\n`);
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
        return;
      }

      // Generate AI response
      const systemPrompt = safetyDetection.isSafetyConcern ? SAFETY_SYSTEM_PROMPT : STANDARD_SYSTEM_PROMPT;
      const aiResponse = await aiService.generateResponse(
        messagesForAI,
        systemPrompt,
        user.preferredLanguage || 'English'
      );

      await db.insert(messages).values({
        conversationId: id,
        role: "assistant",
        content: aiResponse.content,
        detectedEmotion: aiResponse.detectedEmotion,
        aiSuggestion: aiResponse.aiSuggestion,
      });

      if (!res.headersSent) {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
      }

      res.write(`data: ${JSON.stringify({ content: aiResponse.content, detectedEmotion: aiResponse.detectedEmotion, aiSuggestion: aiResponse.aiSuggestion })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("AI chat error:", error);
      if (!res.headersSent) {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
      }
      res.write(`data: ${JSON.stringify({ content: "Support Chat encountered an error. Please try again or use the Find Help page for crisis resources.", detectedEmotion: "neutral", aiSuggestion: null })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    }
  });

  app.get(api.history.emotional.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const userMoods = await db.select().from(moods).where(eq(moods.userId, userId)).orderBy(desc(moods.date));
    const userJournals = await db.select().from(journals).where(eq(journals.userId, userId)).orderBy(desc(journals.date));
    const userConvos = await db.select({ id: conversations.id }).from(conversations).where(eq(conversations.userId, userId));
    const convoIds = userConvos.map((conversation) => conversation.id);
    let userMessages: any[] = [];
    if (convoIds.length > 0) userMessages = await db.select().from(messages).where(and(inArray(messages.conversationId, convoIds), eq(messages.role, "assistant"))).orderBy(desc(messages.createdAt));

    const toIsoString = (value: unknown): string => {
      if (typeof value === "string") return value;
      if (value instanceof Date) return value.toISOString();
      if (value === null || value === undefined) return new Date().toISOString();
      return new Date(String(value)).toISOString();
    };

    const history = [
      ...userMoods.map((mood) => ({ id: mood.id, date: toIsoString(mood.date), type: "mood", value: mood.mood, notes: mood.notes })),
      ...userJournals.map((journal) => ({ id: journal.id, date: toIsoString(journal.date), type: "journal", value: journal.title || "Journal Entry", notes: journal.content, tags: journal.tags })),
      ...userMessages.filter((message) => message.detectedEmotion).map((message) => ({ id: message.id, date: toIsoString(message.createdAt), type: "emotion", value: message.detectedEmotion, suggestion: message.aiSuggestion })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json(history);
  });


  // Goals
  app.get(api.goals.list.path, isAuthenticated, async (req: any, res) => res.json(await storage.getGoals(req.user.claims.sub)));
  app.post(api.goals.create.path, isAuthenticated, async (req: any, res) => {
    try { const input = api.goals.create.input.parse(req.body); res.status(201).json(await storage.createGoal(req.user.claims.sub, input)); }
    catch { res.status(400).json({ message: 'Failed to create goal' }); }
  });
  app.patch('/api/goals/:id', isAuthenticated, async (req: any, res) => {
    try { const input = api.goals.update.input.parse(req.body); const updates = { ...input, completedAt: input.completedAt ? new Date(input.completedAt) : undefined }; res.json(await storage.updateGoal(req.user.claims.sub, parseInt(req.params.id), updates as any)); }
    catch (err: any) { res.status(err?.status ?? 400).json({ message: err?.status === 404 ? 'Goal not found' : 'Failed to update goal' }); }
  });
  app.delete('/api/goals/:id', isAuthenticated, async (req: any, res) => {
    try { await storage.deleteGoal(req.user.claims.sub, parseInt(req.params.id)); res.json({ success: true }); }
    catch (err: any) { res.status(err?.status ?? 400).json({ message: err?.status === 404 ? 'Goal not found' : 'Failed to delete goal' }); }
  });

  // Reflection prompts and responses
  app.get(api.reflections.prompts.path, isAuthenticated, async (_req: any, res) => res.json(await storage.getReflectionPrompts()));
  app.get(api.reflections.list.path, isAuthenticated, async (req: any, res) => res.json(await storage.getReflectionResponses(req.user.claims.sub)));
  app.post(api.reflections.create.path, isAuthenticated, async (req: any, res) => {
    try { const input = api.reflections.create.input.parse(req.body); res.status(201).json(await storage.createReflectionResponse(req.user.claims.sub, input)); }
    catch { res.status(400).json({ message: 'Failed to create reflection response' }); }
  });

  // Safety plan
  app.get(api.safetyPlan.get.path, isAuthenticated, async (req: any, res) => res.json(await storage.getSafetyPlan(req.user.claims.sub)));
  app.post(api.safetyPlan.save.path, isAuthenticated, async (req: any, res) => {
    try { const input = api.safetyPlan.save.input.parse(req.body); res.json(await storage.createOrUpdateSafetyPlan(req.user.claims.sub, input)); }
    catch { res.status(400).json({ message: 'Failed to save safety plan' }); }
  });

  // Experiments
  app.get(api.experiments.list.path, isAuthenticated, async (req: any, res) => res.json(await storage.getExperiments(req.user.claims.sub)));
  app.post(api.experiments.create.path, isAuthenticated, async (req: any, res) => {
    try { const input = api.experiments.create.input.parse(req.body); res.status(201).json(await storage.createExperiment(req.user.claims.sub, input)); }
    catch { res.status(400).json({ message: 'Failed to create experiment' }); }
  });
  app.patch('/api/experiments/:id', isAuthenticated, async (req: any, res) => {
    try { const input = api.experiments.update.input.parse(req.body); res.json(await storage.updateExperiment(req.user.claims.sub, parseInt(req.params.id), input)); }
    catch (err: any) { res.status(err?.status ?? 400).json({ message: err?.status === 404 ? 'Experiment not found' : 'Failed to update experiment' }); }
  });
  return httpServer;
}
