import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, Loader2 } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";

type ChatMessage = { id?: number; role: "user" | "assistant"; content: string };

export default function Chatbot() {
  const { t } = useTranslation();
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  useEffect(() => {
    (async () => {
      try {
        const listResponse = await fetch("/api/conversations");
        const list = await listResponse.json();
        let conversation = Array.isArray(list) ? list[0] : null;
        if (!conversation) {
          const createdResponse = await fetch("/api/conversations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: "Support Chat" }) });
          if (!createdResponse.ok) throw new Error("Could not create a conversation");
          conversation = await createdResponse.json();
        }
        setConversationId(conversation.id);
        const historyResponse = await fetch(`/api/conversations/${conversation.id}/messages`);
        if (!historyResponse.ok) throw new Error("Could not load chat history");
        const history = await historyResponse.json();
        if (Array.isArray(history)) setMessages(history.map((message: any) => ({ id: message.id, role: message.role, content: message.content })));
      } catch (err: any) { setError(err.message || "Could not start Support Chat."); }
    })();
  }, []);

  async function sendMessage() {
    const content = input.trim();
    if (!content || !conversationId || loading) return;
    setInput(""); setError(""); setLoading(true);
    setMessages((previous) => [...previous, { role: "user", content }]);
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || "Support Chat is unavailable");
      }
      const raw = await response.text();
      let assistantContent = "";
      for (const line of raw.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        try {
          const event = JSON.parse(line.slice(6));
          if (event.content) assistantContent += event.content;
        } catch { /* ignore malformed SSE lines */ }
      }
      if (!assistantContent) assistantContent = "I’m sorry, I couldn’t generate a response right now.";
      setMessages((previous) => [...previous, { role: "assistant", content: assistantContent }]);
    } catch (err: any) {
      setError(err.message || "Support Chat is unavailable. Check that Ollama and Phi-3 are running.");
    } finally { setLoading(false); }
  }

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-4xl grow basis-0 flex-col p-4 md:p-8">
      <div className="mb-4 flex shrink-0 items-center gap-3 md:mb-6 md:gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-3xl bg-teal-100 dark:bg-teal-900/30 md:h-14 md:w-14"><MessageCircle className="h-6 w-6 text-teal-600 md:h-7 md:w-7" /></div>
        <div className="min-w-0"><h1 className="text-2xl font-display font-extrabold sm:text-3xl md:text-4xl">Support Chat</h1><p className="text-sm text-muted-foreground">TalkEasy AI by Taha Shahud · Powered locally by Ollama Phi-3</p></div>
      </div>
      <div className="min-h-0 grow basis-0 space-y-4 overflow-y-auto overscroll-contain rounded-3xl glass-card border border-slate-200 p-5 dark:border-slate-800 md:p-7">
        {messages.length === 0 && <div className="text-center text-muted-foreground py-16"><MessageCircle className="w-10 h-10 mx-auto mb-4 text-teal-600" /><p className="font-semibold text-foreground mb-2">How can I support you today?</p><p className="text-sm">This is Support Chat, not therapy or a diagnostic service.</p></div>}
        {messages.map((message, index) => <div key={message.id || index} className={`max-w-[85%] rounded-2xl px-4 py-3 whitespace-pre-wrap leading-relaxed ${message.role === "user" ? "ml-auto bg-teal-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-foreground"}`}>{message.content}</div>)}
        {loading && <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-slate-100 dark:bg-slate-800 text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Thinking…</div>}
        <div ref={bottomRef} />
      </div>
      {error && <p className="mt-3 shrink-0 text-sm text-red-600">{error}</p>}
      <div className="mt-4 flex shrink-0 gap-2 sm:gap-3"><input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder="Tell Support Chat what is on your mind…" disabled={loading || !conversationId} className="min-w-0 flex-1 rounded-2xl border border-border bg-background px-4 py-3.5 outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-60 sm:px-5" /><button type="button" onClick={sendMessage} disabled={loading || !input.trim() || !conversationId} aria-label="Send message" className="shrink-0 rounded-2xl bg-teal-600 px-4 text-white hover:bg-teal-700 disabled:opacity-50 sm:px-5"><Send className="w-5 h-5" /></button></div>
      <p className="mt-3 shrink-0 text-center text-[11px] text-muted-foreground">{t("disclaimerText")}</p>
    </div>
  );
}
