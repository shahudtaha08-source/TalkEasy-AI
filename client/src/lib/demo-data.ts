import { format } from "date-fns";

const DEMO_USER_KEY = "talkeasy_demo_user";
const DEMO_MOODS_KEY = "talkeasy_demo_moods";
const DEMO_HABITS_KEY = "talkeasy_demo_habits";
const DEMO_JOURNALS_KEY = "talkeasy_demo_journals";
const DEMO_CHAT_KEY = "talkeasy_demo_chat";
const DEMO_MODE_KEY = "talkeasy_demo_mode";
const DEMO_STARTED_KEY = "talkeasy_demo_started_at";
const DEMO_SESSION_KEY = "talkeasy_demo_session_id";
const DEMO_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function clearDemoData() {
  [DEMO_USER_KEY, DEMO_MOODS_KEY, DEMO_HABITS_KEY, DEMO_JOURNALS_KEY, DEMO_CHAT_KEY, DEMO_STARTED_KEY, DEMO_SESSION_KEY].forEach((key) => localStorage.removeItem(key));
}

export function isDemoMode(): boolean {
  if (localStorage.getItem(DEMO_MODE_KEY) !== "true") return false;
  const startedAt = Number(localStorage.getItem(DEMO_STARTED_KEY) || 0);
  if (!startedAt || Date.now() - startedAt > DEMO_DURATION_MS) {
    disableDemoMode();
    return false;
  }
  return true;
}

export function getDemoExpiryDate() {
  const startedAt = Number(localStorage.getItem(DEMO_STARTED_KEY) || Date.now());
  return new Date(startedAt + DEMO_DURATION_MS);
}

export function enableDemoMode() {
  // Every click starts a completely fresh, private demo session.
  clearDemoData();
  localStorage.setItem(DEMO_MODE_KEY, "true");
  localStorage.setItem(DEMO_STARTED_KEY, String(Date.now()));
  localStorage.setItem(DEMO_SESSION_KEY, crypto.randomUUID());
  initializeDemoData(true);
}

export function disableDemoMode() {
  localStorage.removeItem(DEMO_MODE_KEY);
  clearDemoData();
}

export function getDemoUser() {
  const sessionId = localStorage.getItem(DEMO_SESSION_KEY) || crypto.randomUUID();
  const defaultUser = {
    id: `demo-${sessionId}`,
    email: `demo-${sessionId.slice(0, 8)}@talkeasy.local`,
    firstName: "Demo",
    lastName: "User",
    profileImageUrl: null,
    ageGroup: "Young Adult (20-35)",
    preferredLanguage: "English",
    emergencyContact: null,
    city: null,
    locality: null,
    budget: null,
    occupationType: null,
    theme: "light",
  };
  const val = localStorage.getItem(DEMO_USER_KEY);
  if (!val) {
    localStorage.setItem(DEMO_SESSION_KEY, sessionId);
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(defaultUser));
    return defaultUser;
  }
  return JSON.parse(val);
}

export function updateDemoUser(updates: any) {
  const user = { ...getDemoUser(), ...updates };
  localStorage.setItem(DEMO_USER_KEY, JSON.stringify(user));
  return user;
}

export function initializeDemoData(force = false) {
  if (!force && localStorage.getItem(DEMO_MOODS_KEY)) return;
  localStorage.setItem(DEMO_MOODS_KEY, JSON.stringify([]));
  localStorage.setItem(DEMO_JOURNALS_KEY, JSON.stringify([]));
  localStorage.setItem(DEMO_HABITS_KEY, JSON.stringify([]));
  localStorage.setItem(DEMO_CHAT_KEY, JSON.stringify([]));
  getDemoUser();
}

export function getDemoMoods() { return JSON.parse(localStorage.getItem(DEMO_MOODS_KEY) || "[]"); }
export function createDemoMood(mood: any) {
  const list = getDemoMoods();
  const newMood = { id: Date.now(), mood: mood.mood, notes: mood.notes || "", date: mood.date || format(new Date(), "yyyy-MM-dd"), createdAt: new Date().toISOString() };
  list.unshift(newMood); localStorage.setItem(DEMO_MOODS_KEY, JSON.stringify(list)); return newMood;
}
export function getDemoJournals() { return JSON.parse(localStorage.getItem(DEMO_JOURNALS_KEY) || "[]"); }
export function createDemoJournal(journal: any) {
  const list = getDemoJournals();
  const newJ = { id: Date.now(), title: journal.title || "", content: journal.content, type: journal.type || "reflection", tags: journal.tags || "", date: journal.date || format(new Date(), "yyyy-MM-dd"), createdAt: new Date().toISOString() };
  list.unshift(newJ); localStorage.setItem(DEMO_JOURNALS_KEY, JSON.stringify(list)); return newJ;
}
export function updateDemoJournal(id: number, updates: any) { const list = getDemoJournals(); const idx = list.findIndex((j: any) => j.id === id); if (idx !== -1) { list[idx] = { ...list[idx], ...updates }; localStorage.setItem(DEMO_JOURNALS_KEY, JSON.stringify(list)); return list[idx]; } return null; }
export function deleteDemoJournal(id: number) { localStorage.setItem(DEMO_JOURNALS_KEY, JSON.stringify(getDemoJournals().filter((j: any) => j.id !== id))); }
export function getDemoHabits(date?: string) { const list = JSON.parse(localStorage.getItem(DEMO_HABITS_KEY) || "[]"); return date ? list.filter((h: any) => h.date === date) : list; }
export function createDemoHabit(habit: any) { const list = getDemoHabits(); const newH = { id: Date.now(), type: habit.type, completed: habit.completed || false, notes: habit.notes || "", date: habit.date || format(new Date(), "yyyy-MM-dd") }; list.push(newH); localStorage.setItem(DEMO_HABITS_KEY, JSON.stringify(list)); return newH; }
export function updateDemoHabit(id: number, updates: any) { const list = getDemoHabits(); const idx = list.findIndex((h: any) => h.id === id); if (idx !== -1) { list[idx] = { ...list[idx], ...updates }; localStorage.setItem(DEMO_HABITS_KEY, JSON.stringify(list)); return list[idx]; } return null; }
export function getDemoConversations() { const chats = JSON.parse(localStorage.getItem(DEMO_CHAT_KEY) || "[]"); return chats.map((c: any) => ({ id: c.id, title: c.title, createdAt: c.createdAt })); }
export function getDemoConversationHistory(id: number) { const chats = JSON.parse(localStorage.getItem(DEMO_CHAT_KEY) || "[]"); return chats.find((c: any) => c.id === id)?.messages || []; }
export function createDemoConversation(title: string) { const chats = JSON.parse(localStorage.getItem(DEMO_CHAT_KEY) || "[]"); const newChat = { id: Date.now(), title, createdAt: new Date().toISOString(), messages: [] }; chats.unshift(newChat); localStorage.setItem(DEMO_CHAT_KEY, JSON.stringify(chats)); return newChat; }
export function addDemoMessage(convoId: number, role: "user" | "assistant", content: string, emotion?: string, suggestion?: string) { const chats = JSON.parse(localStorage.getItem(DEMO_CHAT_KEY) || "[]"); const chatIdx = chats.findIndex((c: any) => c.id === convoId); if (chatIdx !== -1) { const messages = chats[chatIdx].messages; const newMsg = { id: Date.now(), role, content, detectedEmotion: emotion || null, aiSuggestion: suggestion || null, createdAt: new Date().toISOString() }; messages.push(newMsg); localStorage.setItem(DEMO_CHAT_KEY, JSON.stringify(chats)); return newMsg; } return null; }
export function getDemoEmotionalHistory() {
  const history: any[] = [];
  getDemoMoods().forEach((m: any) => history.push({ id: m.id, date: m.createdAt, type: "mood", value: m.mood, notes: m.notes }));
  getDemoJournals().forEach((j: any) => history.push({ id: j.id, date: j.createdAt, type: "journal", value: j.title || "Journal Entry", notes: j.content, tags: j.tags }));
  JSON.parse(localStorage.getItem(DEMO_CHAT_KEY) || "[]").forEach((c: any) => c.messages.forEach((m: any) => { if (m.role === "assistant" && m.detectedEmotion) history.push({ id: m.id, date: m.createdAt, type: "emotion", value: m.detectedEmotion, suggestion: m.aiSuggestion, notes: `Conversation topic: \"${c.title}\"` }); }));
  return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
