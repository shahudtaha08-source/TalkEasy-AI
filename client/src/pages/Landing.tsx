import { useState } from "react";
import { ArrowRight, X, Lock, FlaskConical, Mail, KeyRound, Globe, Activity, MessageCircle, Smile, BookOpen, HeartPulse, ShieldAlert, Code2, Lightbulb, BrainCircuit, Loader2 } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { LanguageCode } from "@/i18n/translations";
import { TalkEasyLogo } from "@/components/TalkEasyLogo";
import { isDemoMode, disableDemoMode } from "@/lib/demo-data";
import { useToast } from "@/hooks/use-toast";

const AGE_GROUPS = ["Teen (13-19)", "Young Adult (20-35)", "Adult (36-55)", "Senior (55+)"];
const LANGUAGES: LanguageCode[] = ["English", "Hindi", "Urdu", "Marathi", "Tamil", "Telugu", "Malayalam", "Kannada", "Bengali", "Gujarati"];

export default function Landing() {
  const { t, language, setLanguage, isRTL } = useTranslation();
  const { toast } = useToast();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [ageGroup, setAgeGroup] = useState("Young Adult (20-35)");
  const [preferredLang, setPreferredLang] = useState<LanguageCode>("English");
  const inDemo = isDemoMode();

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const formData = authMode === "login"
        ? { identifier, password }
        : { email, username, password, firstName, lastName, ageGroup, preferredLanguage: preferredLang };
      const res = await fetch(`/api/auth/${authMode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Authentication failed");
      toast({ title: authMode === "login" ? "Signed in successfully" : "Account created successfully" });
      setAuthModalOpen(false);
      window.location.href = "/dashboard";
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoMode = () => {
    disableDemoMode();
    toast({ title: "Demo mode activated", description: "Your demo data is private and expires in 7 days." });
    window.location.href = "/dashboard";
  };

  const handleExitDemo = () => {
    disableDemoMode();
    toast({ title: "Demo deactivated" });
    window.location.href = "/";
  };

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 ${isRTL ? "rtl" : "ltr"}`}>
      <header className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between">
        <TalkEasyLogo size={36} />
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold"><Globe className="w-3.5 h-3.5 text-teal-600" /><select value={language} onChange={(e) => setLanguage(e.target.value as LanguageCode)} className="bg-transparent outline-none cursor-pointer">{LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}</select></div>
          <button onClick={() => { setAuthMode("login"); setAuthModalOpen(true); }} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md transition-all flex items-center gap-2"><Lock className="w-4 h-4" /> {t("login")}</button>
        </div>
      </header>
      {inDemo && <div className="bg-indigo-600 text-white text-center py-2 px-4 text-sm font-medium flex items-center justify-center gap-3"><FlaskConical className="w-4 h-4" /> Private 7-day demo trial — your demo data is separate from every other user. <button onClick={handleExitDemo} className="underline font-bold">{t("exitDemo")}</button></div>}
      <section className="text-center py-20 md:py-28 px-6 bg-gradient-to-br from-teal-600 via-teal-700 to-indigo-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        <div className="relative max-w-4xl mx-auto space-y-6">
          <div className="mx-auto w-20 h-20 rounded-3xl bg-white/15 border border-white/25 flex items-center justify-center shadow-2xl backdrop-blur-md"><TalkEasyLogo size={54} showText={false} /></div>
          <h1 className="text-5xl md:text-7xl font-display font-extrabold tracking-tight leading-tight">{t("landingHeroTitle")}</h1>
          <p className="text-xl md:text-2xl text-teal-100 max-w-2xl mx-auto font-medium">{t("landingHeroSubtitle")}</p>
          <p className="text-teal-200 max-w-xl mx-auto text-base leading-relaxed">{t("landingHeroDesc")}</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <button onClick={() => { setAuthMode("signup"); setAuthModalOpen(true); }} className="bg-white text-teal-800 px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-teal-500/30 hover:-translate-y-0.5 transition-all inline-flex items-center justify-center gap-2">{t("signInBtn")} <ArrowRight className="w-5 h-5" /></button>
            <button onClick={handleDemoMode} className="bg-white/15 border border-white/30 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/25 transition inline-flex items-center justify-center gap-2 backdrop-blur-sm"><FlaskConical className="w-5 h-5" /> {t("tryDemoBtn")}</button>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 max-w-4xl mx-auto">
        <p className="text-sm font-bold tracking-widest text-teal-600 uppercase text-center mb-2">About TalkEasy AI</p>
        <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-8 text-slate-900 dark:text-white">What TalkEasy AI Is</h2>
        <div className="prose prose-lg max-w-none text-slate-600 dark:text-slate-300">
          <p className="text-center text-lg leading-relaxed mb-6">
            TalkEasy AI is a mental-wellness support web application designed to provide accessible emotional support and wellness tools.
          </p>
          <p className="text-center text-lg leading-relaxed mb-6">
            It exists because emotional wellbeing shouldn't be inaccessible or intimidating. Many people struggle to express their feelings, track their emotional patterns, or know where to turn when they need support. TalkEasy AI aims to reduce that friction.
          </p>
          <p className="text-center text-lg leading-relaxed mb-6">
            The platform provides supportive conversation, mood tracking, habit building, journaling, and resources to help users understand their emotional patterns and find appropriate support when needed.
          </p>
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-6 mt-8">
            <p className="text-amber-800 dark:text-amber-300 font-semibold text-center mb-3">Important: TalkEasy AI is NOT a therapist, doctor, or diagnostic system.</p>
            <p className="text-amber-700 dark:text-amber-400 text-center text-sm">
              It does not diagnose mental health conditions, prescribe medication, or replace licensed professionals. For clinical care, crisis situations, or emergency needs, users should seek appropriate professional/emergency support.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 max-w-6xl mx-auto">
        <p className="text-sm font-bold tracking-widest text-teal-600 uppercase text-center mb-2">{t("platformFeatures")}</p>
        <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-12 text-slate-900 dark:text-white">Support designed around the person</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: MessageCircle, title: "Support Chat", desc: "Chat with TalkEasy's locally powered support assistant using Ollama and Phi-3." },
            { icon: Smile, title: t("moodTracker"), desc: "Log your emotional state daily and track trends over time." },
            { icon: BookOpen, title: t("journal"), desc: "Daily, gratitude, and reflection entries with tags." },
            { icon: Activity, title: t("habits"), desc: "Build sleep, hydration, exercise, and mindfulness routines." },
            { icon: HeartPulse, title: t("findHelp"), desc: "Professional and crisis-support resources." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center mb-4"><Icon className="w-6 h-6 text-teal-600" /></div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-red-600 text-white border-y-4 border-red-700 py-8 px-6 text-center shadow-lg">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-3">
          <ShieldAlert className="w-9 h-9" />
          <p className="text-base md:text-lg leading-relaxed font-medium"><strong className="font-extrabold">DISCLAIMER:</strong> {t("disclaimerText")} In an emergency, please use local emergency/crisis services immediately.</p>
        </div>
      </section>

      <section className="py-20 bg-white dark:bg-slate-900 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm font-bold tracking-widest text-teal-600 uppercase mb-2">{t("meetTheDevelopers")}</p>
          <h2 className="text-3xl font-display font-bold mb-10 text-slate-900 dark:text-white">Meet the Developer</h2>
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-8 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-xl mx-auto mb-5">TS</div>
            <h3 className="text-2xl font-bold">{t("developerName")}</h3>
            <p className="text-teal-600 font-bold text-sm mt-2">{t("developerTitle")}</p>
            <p className="mt-5 text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">{t("developerDescription")}</p>
            <div className="grid sm:grid-cols-3 gap-3 mt-8 text-sm font-semibold">
              <div className="flex items-center justify-center gap-2 rounded-xl bg-white dark:bg-slate-900 p-3"><Code2 className="w-4 h-4 text-teal-600" /> Student Developer</div>
              <div className="flex items-center justify-center gap-2 rounded-xl bg-white dark:bg-slate-900 p-3"><Lightbulb className="w-4 h-4 text-amber-500" /> Creative Minded</div>
              <div className="flex items-center justify-center gap-2 rounded-xl bg-white dark:bg-slate-900 p-3"><BrainCircuit className="w-4 h-4 text-indigo-500" /> Exploring AI</div>
            </div>
          </div>
        </div>
      </section>

      <footer className="text-center py-8 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-slate-500 text-sm">© {new Date().getFullYear()} TalkEasy AI · Designed and Developed by {t("developerName")}</footer>

      {authModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-3xl p-8 shadow-2xl border border-border relative animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setAuthModalOpen(false)} className="absolute right-6 top-6 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            <div className="mb-6 text-center"><TalkEasyLogo size={40} className="justify-center mb-3" /><h3 className="text-2xl font-bold text-slate-900 dark:text-white">{authMode === "login" ? t("loginTitle") : t("signupTitle")}</h3></div>
            {errorMsg && <div className="mb-4 p-3 rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 text-xs font-semibold text-center">{errorMsg}</div>}
            <form onSubmit={handleAuthSubmit} className="space-y-4" autoComplete={authMode === "login" ? "on" : "off"}>
              {authMode === "login" ? (
                <>
                  <div><label className="block text-xs font-semibold mb-1">{t("emailLabel")}</label><div className="relative"><Mail className="w-4 h-4 absolute left-3 top-3.5 text-muted-foreground" /><input name="email" type="email" defaultValue="" onInput={(e) => setIdentifier((e.currentTarget as HTMLInputElement).value)} className="w-full pl-10 pr-3 py-3 rounded-xl border bg-background" placeholder="you@example.com" autoComplete="username email" disabled={isSubmitting} /></div></div>
                  <div><label className="block text-xs font-semibold mb-1">{t("passwordLabel")}</label><div className="relative"><KeyRound className="w-4 h-4 absolute left-3 top-3.5 text-muted-foreground" /><input name="password" type="password" defaultValue="" onInput={(e) => setPassword((e.currentTarget as HTMLInputElement).value)} className="w-full pl-10 pr-3 py-3 rounded-xl border bg-background" placeholder="••••••••" autoComplete="current-password" disabled={isSubmitting} /></div></div>
                </>
              ) : (
                <>
                  <div><label className="block text-xs font-semibold mb-1">{t("emailLabel")}</label><input name="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-3 rounded-xl border bg-background" autoComplete="email" disabled={isSubmitting} /></div>
                  <div><label className="block text-xs font-semibold mb-1">{t("usernameLabel")}</label><input name="username" value={username} onChange={e => setUsername(e.target.value)} className="w-full px-3 py-3 rounded-xl border bg-background" autoComplete="username" disabled={isSubmitting} /></div>
                  <div className="grid grid-cols-2 gap-3"><div><label className="block text-xs font-semibold mb-1">{t("firstNameLabel")}</label><input name="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full px-3 py-3 rounded-xl border bg-background" disabled={isSubmitting} /></div><div><label className="block text-xs font-semibold mb-1">{t("lastNameLabel")}</label><input name="lastName" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full px-3 py-3 rounded-xl border bg-background" disabled={isSubmitting} /></div></div>
                  <div className="grid grid-cols-2 gap-3"><div><label className="block text-xs font-semibold mb-1">{t("ageGroupLabel")}</label><select name="ageGroup" value={ageGroup} onChange={e => setAgeGroup(e.target.value)} className="w-full px-3 py-3 rounded-xl border bg-background" disabled={isSubmitting}>{AGE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}</select></div><div><label className="block text-xs font-semibold mb-1">{t("preferredLanguageLabel")}</label><select name="preferredLanguage" value={preferredLang} onChange={e => setPreferredLang(e.target.value as LanguageCode)} className="w-full px-3 py-3 rounded-xl border bg-background" disabled={isSubmitting}>{LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}</select></div></div>
                  <div><label className="block text-xs font-semibold mb-1">{t("passwordLabel")}</label><input name="password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-3 rounded-xl border bg-background" autoComplete="new-password" disabled={isSubmitting} /></div>
                </>
              )}
              <button type="submit" disabled={isSubmitting || (authMode === "signup" && (!email.trim() || !username.trim() || !password || !firstName.trim() || !lastName.trim()))} className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50">{isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}{authMode === "login" ? t("login") : t("signup")}</button>
            </form>
            <button type="button" onClick={() => { setAuthMode(authMode === "login" ? "signup" : "login"); setErrorMsg(""); }} className="w-full mt-4 text-sm font-semibold text-teal-600 hover:text-teal-700">{authMode === "login" ? t("noAccountText") : t("alreadyHaveAccountText")}</button>
          </div>
        </div>
      )}
    </div>
  );
}
