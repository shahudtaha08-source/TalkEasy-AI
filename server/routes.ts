import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupLocalAuth, isAuthenticated } from "./auth";
import { api } from "@shared/routes";
import { db } from "./db";
import { moods, conversations, messages, users, journals, sleepEntries } from "@shared/schema";
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
    try { const input = api.moods.create.input.parse(req.body); res.status(201).json(await storage.createMood(req.user.claims.sub, input)); }
    catch { res.status(400).json({ message: "Failed to create mood" }); }
  });

  app.get(api.habits.list.path, isAuthenticated, async (req: any, res) => res.json(await storage.getHabits(req.user.claims.sub, req.query.date as string | undefined)));
  app.post(api.habits.create.path, isAuthenticated, async (req: any, res) => {
    try { const input = api.habits.create.input.parse(req.body); res.status(201).json(await storage.createHabit(req.user.claims.sub, input)); }
    catch { res.status(400).json({ message: "Failed to create habit" }); }
  });
  app.patch("/api/habits/:id", isAuthenticated, async (req: any, res) => {
    try { const input = api.habits.update.input.parse(req.body); res.json(await storage.updateHabit(parseInt(req.params.id), input)); }
    catch { res.status(400).json({ message: "Failed to update habit" }); }
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
      const [journal] = await db.update(journals).set(updates).where(eq(journals.id, id)).returning();
      res.json(journal);
    } catch { res.status(400).json({ message: "Failed to update journal" }); }
  });
  app.delete("/api/journals/:id", isAuthenticated, async (req: any, res) => {
    try {
      await db.delete(journals).where(eq(journals.id, parseInt(req.params.id)));
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

  return httpServer;
}
