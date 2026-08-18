import { useState } from "react";
import { enableDemoMode, isDemoMode, disableDemoMode } from "@/lib/demo-data";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import {
  Smile, BookOpen, Activity, MessageCircle, TrendingUp, HeartPulse,
  FlaskConical, CheckCircle, ArrowRight, Lock, User, Mail, Globe,
  Shield, KeyRound, Loader2, Sparkles, X
} from "lucide-react";
import { TalkEasyLogo } from "@/components/TalkEasyLogo";
import { useTranslation } from "@/i18n/LanguageContext";
import { LanguageCode } from "@/i18n/translations";

const LANGUAGES: LanguageCode[] = [
  "English", "Hindi", "Urdu", "Marathi", "Tamil",
  "Telugu", "Malayalam", "Kannada", "Bengali", "Gujarati"
];

const AGE_GROUPS = ["Teen (13-19)", "Young Adult (20-35)", "Adult (36-55)", "Senior (55+)"];

export default function Landing() {
  const [, navigate] = useLocation();
  const { t, language, setLanguage, isRTL } = useTranslation();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [ageGroup, setAgeGroup] = useState("Young Adult (20-35)");
  const [preferredLang, setPreferredLang] = useState<LanguageCode>(language);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleDemoMode() {
    enableDemoMode();
    queryClient.clear();
    navigate("/dashboard");
  }

  function handleExitDemo() {
    disableDemoMode();
    queryClient.clear();
    window.location.reload();
  }

  async function handleAuthSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);

      if (authMode === "login") {
        // Read directly from the form so Chrome/Google Password Manager autofill
        // works even when React's onChange event did not fire.
        const loginEmail = String(formData.get("identifier") || identifier).trim();
        const loginPassword = String(formData.get("password") || password);

        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            email: loginEmail,
            identifier: loginEmail,
            username: loginEmail,
            password: loginPassword,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to sign in");
      } else {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            email: email.trim(), username: username.trim(), password,
            firstName: firstName.trim(), lastName: lastName.trim(),
            ageGroup, preferredLanguage: preferredLang,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to register");
      }
      queryClient.clear();
      window.location.href = "/dashboard";
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  const inDemo = isDemoMode();

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 ${isRTL ? "rtl" : "ltr"}`}>
      <header className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between">
        <TalkEasyLogo size={36} />
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Globe className="w-3.5 h-3.5 text-teal-600" />
            <select value={language} onChange={(e) => setLanguage(e.target.value as LanguageCode)} className="bg-transparent outline-none cursor-pointer">
              {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <button onClick={() => { setAuthMode("login"); setAuthModalOpen(true); }} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-teal-600/20 transition-all flex items-center gap-2">
            <Lock className="w-4 h-4" /> {t("login")}
          </button>
        </div>
      </header>

      {inDemo && (
        <div className="bg-amber-500 text-white text-center py-2 px-4 text-sm font-medium flex items-center justify-center gap-3">
          <FlaskConical className="w-4 h-4" />
          {t("demoMode")} — Data is stored locally.
          <button onClick={handleExitDemo} className="underline font-bold">{t("exitDemo")}</button>
        </div>
      )}

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

      <section className="py-20 px-6 max-w-6xl mx-auto">
        <p className="text-sm font-bold tracking-widest text-teal-600 uppercase text-center mb-2">{t("platformFeatures")}</p>
        <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-12 text-slate-900 dark:text-white">Support designed around the person</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: MessageCircle, title: t("supportChat"), desc: "Support Chat is currently under development and will be available in the next TalkEasy version." },
            { icon: Smile, title: t("moodTracker"), desc: "Log your emotional state daily and track trends over time." },
            { icon: BookOpen, title: t("journal"), desc: "Daily, gratitude, and reflection entries with tags." },
            { icon: Activity, title: t("habits"), desc: "Build sleep, hydration, exercise, and mindfulness routines." },
            { icon: HeartPulse, title: t("findHelp"), desc: "Professional and crisis-support resources." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center mb-4 group-hover:bg-teal-100 transition"><Icon className="w-6 h-6 text-teal-600" /></div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-amber-50 dark:bg-amber-950/20 border-y border-amber-200 dark:border-amber-900/40 py-10 px-6 text-center">
        <p className="max-w-3xl mx-auto text-sm text-amber-800 dark:text-amber-300 leading-relaxed font-medium"><strong>Disclaimer:</strong> {t("disclaimerText")} In an emergency, please use local emergency/crisis services immediately.</p>
      </section>

      <section className="py-20 bg-white dark:bg-slate-900 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm font-bold tracking-widest text-teal-600 uppercase text-center mb-2">Project Team</p>
          <h2 className="text-3xl font-display font-bold text-center mb-12 text-slate-900 dark:text-white">{t("meetTheDevelopers")}</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-8 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 text-white flex items-center justify-center font-bold text-xl mb-5 shadow-lg shadow-teal-500/20">TS</div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Taha Shahud</h3>
              <p className="text-teal-600 font-bold text-sm mt-1">{t("leadDev")}</p>
              <p className="text-slate-600 dark:text-slate-400 mt-4 text-sm leading-relaxed">Building practical digital tools that support human wellbeing and accessible mental health support.</p>
              <div className="flex items-center gap-2 mt-4 text-xs font-semibold text-slate-500"><CheckCircle className="w-4 h-4 text-teal-500" /> {t("institution")}</div>
            </div>
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-8 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-xl mb-5 shadow-lg shadow-indigo-500/20">PG</div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Praneet Gholap</h3>
              <p className="text-indigo-600 font-bold text-sm mt-1">{t("coDev")}</p>
              <p className="text-slate-600 dark:text-slate-400 mt-4 text-sm leading-relaxed">Contributing to the design, development, and delivery of the TalkEasy mental wellness platform.</p>
              <div className="flex items-center gap-2 mt-4 text-xs font-semibold text-slate-500"><CheckCircle className="w-4 h-4 text-teal-500" /> {t("institution")}</div>
            </div>
          </div>
        </div>
      </section>

      <footer className="text-center py-8 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-slate-500 text-sm">© {new Date().getFullYear()} TalkEasy AI · {t("developedBy")} · {t("institution")}</footer>

      {authModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-3xl p-8 shadow-2xl border border-border relative animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setAuthModalOpen(false)} className="absolute right-6 top-6 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            <div className="mb-6 text-center"><TalkEasyLogo size={40} className="justify-center mb-3" /><h3 className="text-2xl font-bold text-slate-900 dark:text-white">{authMode === "login" ? t("loginTitle") : t("signupTitle")}</h3></div>
            {errorMsg && <div className="mb-4 p-3 rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 text-xs font-semibold text-center">{errorMsg}</div>}
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === "login" ? (
                <>
                  <div><label className="block text-xs font-semibold mb-1">{t("emailLabel")}</label><div className="relative"><Mail className="w-4 h-4 absolute left-3 top-3.5 text-muted-foreground" /><input name="identifier" value={identifier} onChange={e => setIdentifier(e.target.value)} className="w-full pl-10 pr-3 py-3 rounded-xl border bg-background" placeholder="you@example.com" autoComplete="username email" disabled={isSubmitting} /></div></div>
                  <div><label className="block text-xs font-semibold mb-1">{t("passwordLabel")}</label><div className="relative"><KeyRound className="w-4 h-4 absolute left-3 top-3.5 text-muted-foreground" /><input name="password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-10 pr-3 py-3 rounded-xl border bg-background" placeholder="••••••••" autoComplete="current-password" disabled={isSubmitting} /></div></div>
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
