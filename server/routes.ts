import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { setupLocalAuth, isAuthenticated } from "./auth";
import { api } from "@shared/routes";
import { db } from "./db";
import { moods, conversations, messages, journals } from "@shared/schema";
import { and, desc, eq, inArray } from "drizzle-orm";

const OLLAMA_BASE_URL = (process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").replace(/\/$/, "");
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "phi3:latest";
const SUPPORT_SYSTEM_PROMPT = "You are TalkEasy AI Support Chat, a warm and practical support companion for the wellbeing product TalkEasy AI, created by Taha Shahud. Be supportive, calm, respectful and concise. You are not a therapist, doctor, diagnostic service, or replacement for professional care. Do not claim to diagnose mental health conditions. Encourage the user to contact trusted people, local emergency services, or crisis services if they appear to be in immediate danger. Never pretend to be a human professional. Focus on supportive conversation, reflection, coping ideas, and practical next steps.";

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  setupLocalAuth(app);

  app.patch(api.user.update.path, isAuthenticated, async (req: any, res) => {
    try { const input = api.user.update.input.parse(req.body); res.json(await storage.updateUser(req.user.claims.sub, input)); }
    catch { res.status(400).json({ message: "Failed to update user" }); }
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
    try { const [journal] = await db.update(journals).set(req.body).where(eq(journals.id, parseInt(req.params.id))).returning(); res.json(journal); }
    catch { res.status(400).json({ message: "Failed to update journal" }); }
  });
  app.delete("/api/journals/:id", isAuthenticated, async (req: any, res) => {
    try { await db.delete(journals).where(eq(journals.id, parseInt(req.params.id))); res.json({ success: true }); }
    catch { res.status(400).json({ message: "Failed to delete journal" }); }
  });

  app.get(api.chat.list.path, isAuthenticated, async (req: any, res) => {
    res.json(await db.select().from(conversations).where(eq(conversations.userId, req.user.claims.sub)).orderBy(desc(conversations.createdAt)));
  });
  app.post(api.chat.create.path, isAuthenticated, async (req: any, res) => {
    try { const input = api.chat.create.input.parse(req.body); const [conversation] = await db.insert(conversations).values({ ...input, userId: req.user.claims.sub }).returning(); res.status(201).json(conversation); }
    catch { res.status(400).json({ message: "Invalid input" }); }
  });
  app.get(api.chat.history.path, isAuthenticated, async (req: any, res) => {
    const conversationId = parseInt(req.params.id);
    const [conversation] = await db.select().from(conversations).where(and(eq(conversations.id, conversationId), eq(conversations.userId, req.user.claims.sub)));
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });
    res.json(await db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt));
  });

  app.post(api.chat.sendMessage.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.chat.sendMessage.input.parse(req.body);
      const conversationId = parseInt(req.params.id);
      const [conversation] = await db.select().from(conversations).where(and(eq(conversations.id, conversationId), eq(conversations.userId, req.user.claims.sub)));
      if (!conversation) return res.status(404).json({ message: "Conversation not found" });

      await db.insert(messages).values({ conversationId, role: "user", content: input.content });
      const history = await db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
      const ollamaMessages = [
        { role: "system", content: SUPPORT_SYSTEM_PROMPT },
        ...history.map((message) => ({ role: message.role === "assistant" ? "assistant" : "user", content: message.content })),
      ];

      const ollamaResponse = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: OLLAMA_MODEL, messages: ollamaMessages, stream: false }),
      });
      if (!ollamaResponse.ok) throw new Error(`Ollama returned ${ollamaResponse.status}`);
      const ollamaData: any = await ollamaResponse.json();
      const assistantContent = String(ollamaData?.message?.content || "I’m sorry, I couldn’t generate a response right now.").trim();
      await db.insert(messages).values({ conversationId, role: "assistant", content: assistantContent });

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.write(`data: ${JSON.stringify({ content: assistantContent, detectedEmotion: "neutral", aiSuggestion: null })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("TalkEasy Ollama Support Chat error:", error);
      res.status(503).json({ message: `Support Chat is unavailable. Make sure Ollama is running at ${OLLAMA_BASE_URL} and ${OLLAMA_MODEL} is installed.` });
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
    const toIsoString = (value: unknown): string => typeof value === "string" ? value : value instanceof Date ? value.toISOString() : value === null || value === undefined ? new Date().toISOString() : new Date(String(value)).toISOString();
    const history = [
      ...userMoods.map((mood) => ({ id: mood.id, date: toIsoString(mood.date), type: "mood", value: mood.mood, notes: mood.notes })),
      ...userJournals.map((journal) => ({ id: journal.id, date: toIsoString(journal.date), type: "journal", value: journal.title || "Journal Entry", notes: journal.content, tags: journal.tags })),
      ...userMessages.filter((message) => message.detectedEmotion).map((message) => ({ id: message.id, date: toIsoString(message.createdAt), type: "emotion", value: message.detectedEmotion, suggestion: message.aiSuggestion })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json(history);
  });

  return httpServer;
}
