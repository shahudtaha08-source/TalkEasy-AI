import { useState } from "react";
import { enableDemoMode, isDemoMode, disableDemoMode, getDemoExpiryDate } from "@/lib/demo-data";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Smile, BookOpen, Activity, MessageCircle, HeartPulse, FlaskConical, CheckCircle, ArrowRight, Lock, User, Mail, Globe, ShieldAlert, KeyRound, Loader2, X } from "lucide-react";
import { TalkEasyLogo } from "@/components/TalkEasyLogo";
import { useTranslation } from "@/i18n/LanguageContext";
import { LanguageCode } from "@/i18n/translations";

const LANGUAGES: LanguageCode[] = ["English", "Hindi", "Urdu", "Marathi", "Tamil", "Telugu", "Malayalam", "Kannada", "Bengali", "Gujarati"];
const AGE_GROUPS = ["Teen (13-19)", "Young Adult (20-35)", "Adult (36-55)", "Senior (55+)"];

export default function Landing() {
  const [, navigate] = useLocation();
  const { t, language, setLanguage, isRTL } = useTranslation();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
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
    // Demo is always fresh: no previous visitor's data is reused.
    enableDemoMode();
    queryClient.clear();
    navigate("/dashboard");
  }
  function handleExitDemo() { disableDemoMode(); queryClient.clear(); window.location.reload(); }
  function getLoginCredentials(form: HTMLFormElement) {
    const emailInput = form.elements.namedItem("email") as HTMLInputElement | null;
    const passwordInput = form.elements.namedItem("password") as HTMLInputElement | null;
    return { loginEmail: (emailInput?.value || "").trim(), loginPassword: passwordInput?.value || "" };
  }
  async function handleAuthSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setErrorMsg(""); setIsSubmitting(true);
    try {
      if (authMode === "login") {
        const { loginEmail, loginPassword } = getLoginCredentials(e.currentTarget);
        if (!loginEmail || !loginPassword) throw new Error("Email and password are required");
        const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ email: loginEmail, identifier: loginEmail, username: loginEmail, password: loginPassword }) });
        const data = await res.json(); if (!res.ok) throw new Error(data.message || "Failed to sign in");
      } else {
        const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ email: email.trim(), username: username.trim(), password, firstName: firstName.trim(), lastName: lastName.trim(), ageGroup, preferredLanguage: preferredLang }) });
        const data = await res.json(); if (!res.ok) throw new Error(data.message || "Failed to register");
      }
      queryClient.clear(); window.location.href = "/dashboard";
    } catch (err: any) { setErrorMsg(err.message || "An unexpected error occurred"); }
    finally { setIsSubmitting(false); }
  }
  const inDemo = isDemoMode();

  return <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 ${isRTL ? "rtl" : "ltr"}`}>
    <header className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between">
      <TalkEasyLogo size={36} />
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold"><Globe className="w-3.5 h-3.5 text-teal-600" /><select value={language} onChange={(e) => setLanguage(e.target.value as LanguageCode)} className="bg-transparent outline-none cursor-pointer">{LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}</select></div>
        <button onClick={() => { setAuthMode("login"); setAuthModalOpen(true); }} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md transition-all flex items-center gap-2"><Lock className="w-4 h-4" /> {t("login")}</button>
      </div>
    </header>
    {inDemo && <div className="bg-indigo-600 text-white text-center py-2 px-4 text-sm font-medium flex items-center justify-center gap-3"><FlaskConical className="w-4 h-4" /> Private 7-day demo trial — your demo data is separate from every other user. <button onClick={handleExitDemo} className="underline font-bold">{t("exitDemo")}</button></div>}
    <section className="text-center py-20 md:py-28 px-6 bg-gradient-to-br from-teal-600 via-teal-700 to-indigo-900 text-white relative overflow-hidden"><div className="relative max-w-4xl mx-auto space-y-6"><div className="mx-auto w-20 h-20 rounded-3xl bg-white/15 border border-white/25 flex items-center justify-center"><TalkEasyLogo size={54} showText={false} /></div><h1 className="text-5xl md:text-7xl font-display font-extrabold tracking-tight leading-tight">{t("landingHeroTitle")}</h1><p className="text-xl md:text-2xl text-teal-100 max-w-2xl mx-auto font-medium">{t("landingHeroSubtitle")}</p><p className="text-teal-200 max-w-xl mx-auto text-base leading-relaxed">{t("landingHeroDesc")}</p><div className="flex flex-col sm:flex-row justify-center gap-4 pt-4"><button onClick={() => { setAuthMode("signup"); setAuthModalOpen(true); }} className="bg-white text-teal-800 px-8 py-4 rounded-2xl font-bold text-lg shadow-xl inline-flex items-center justify-center gap-2">{t("signInBtn")} <ArrowRight className="w-5 h-5" /></button><button onClick={handleDemoMode} className="bg-white/15 border border-white/30 text-white px-8 py-4 rounded-2xl font-bold text-lg inline-flex items-center justify-center gap-2 backdrop-blur-sm"><FlaskConical className="w-5 h-5" /> {t("tryDemoBtn")}</button></div><p className="text-xs text-teal-100/90">Starts a fresh private trial with no previous user's data. Demo expires after 7 days.</p></div></section>
    <section className="py-20 px-6 max-w-6xl mx-auto"><p className="text-sm font-bold tracking-widest text-teal-600 uppercase text-center mb-2">{t("platformFeatures")}</p><h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-12 text-slate-900 dark:text-white">Support designed around the person</h2><div className="grid md:grid-cols-3 gap-6">{[{ icon: MessageCircle, title: t("supportChat"), desc: "Support Chat is currently under development and will be available in the next TalkEasy version." }, { icon: Smile, title: t("moodTracker"), desc: "Log your emotional state daily and track trends over time." }, { icon: BookOpen, title: t("journal"), desc: "Daily, gratitude, and reflection entries with tags." }, { icon: Activity, title: t("habits"), desc: "Build sleep, hydration, exercise, and mindfulness routines." }, { icon: HeartPulse, title: t("findHelp"), desc: "Professional and crisis-support resources." }].map(({ icon: Icon, title, desc }) => <div key={title} className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800"><div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center mb-4"><Icon className="w-6 h-6 text-teal-600" /></div><h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3><p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{desc}</p></div>)}</div></section>
    <section className="bg-red-600 text-white border-y-4 border-red-700 py-8 px-6 text-center shadow-lg"><div className="max-w-3xl mx-auto flex flex-col items-center gap-3"><ShieldAlert className="w-9 h-9" /><p className="text-base md:text-lg leading-relaxed font-medium"><strong className="font-extrabold">DISCLAIMER:</strong> {t("disclaimerText")} In an emergency, please use local emergency/crisis services immediately.</p></div></section>
    <section className="py-20 bg-white dark:bg-slate-900 px-6"><div className="max-w-4xl mx-auto"><p className="text-sm font-bold tracking-widest text-teal-600 uppercase text-center mb-2">Project Team</p><h2 className="text-3xl font-display font-bold text-center mb-12 text-slate-900 dark:text-white">{t("meetTheDevelopers")}</h2><div className="grid md:grid-cols-2 gap-8"><div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-8 shadow-sm"><div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-xl mb-5">TS</div><h3 className="text-2xl font-bold">Taha Shahud</h3><p className="text-teal-600 font-bold text-sm mt-1">{t("leadDev")}</p></div><div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-8 shadow-sm"><div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl mb-5">PG</div><h3 className="text-2xl font-bold">Praneet Gholap</h3><p className="text-indigo-600 font-bold text-sm mt-1">{t("coDev")}</p></div></div></div></section>
    <footer className="text-center py-8 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-slate-500 text-sm">© {new Date().getFullYear()} TalkEasy AI · {t("developedBy")} · {t("institution")}</footer>
    {authModalOpen && <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"><div className="bg-card w-full max-w-md rounded-3xl p-8 shadow-2xl border border-border relative"><button onClick={() => setAuthModalOpen(false)} className="absolute right-6 top-6 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button><div className="mb-6 text-center"><TalkEasyLogo size={40} className="justify-center mb-3" /><h3 className="text-2xl font-bold">{authMode === "login" ? t("loginTitle") : t("signupTitle")}</h3></div>{errorMsg && <div className="mb-4 p-3 rounded-xl bg-rose-100 text-rose-700 text-xs font-semibold text-center">{errorMsg}</div>}<form onSubmit={handleAuthSubmit} className="space-y-4" autoComplete={authMode === "login" ? "on" : "off"}>{authMode === "login" ? <><div><label className="block text-xs font-semibold mb-1">{t("emailLabel")}</label><div className="relative"><Mail className="w-4 h-4 absolute left-3 top-3.5 text-muted-foreground" /><input name="email" type="email" className="w-full pl-10 pr-3 py-3 rounded-xl border bg-background" placeholder="you@example.com" autoComplete="username email" disabled={isSubmitting} /></div></div><div><label className="block text-xs font-semibold mb-1">{t("passwordLabel")}</label><div className="relative"><KeyRound className="w-4 h-4 absolute left-3 top-3.5 text-muted-foreground" /><input name="password" type="password" className="w-full pl-10 pr-3 py-3 rounded-xl border bg-background" placeholder="••••••••" autoComplete="current-password" disabled={isSubmitting} /></div></div></> : <><div className="grid grid-cols-2 gap-3"><div><label className="block text-xs font-semibold mb-1">First name</label><input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full px-3 py-3 rounded-xl border bg-background" required /></div><div><label className="block text-xs font-semibold mb-1">Last name</label><input value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full px-3 py-3 rounded-xl border bg-background" required /></div></div><div><label className="block text-xs font-semibold mb-1">Email</label><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full px-3 py-3 rounded-xl border bg-background" required /></div><div><label className="block text-xs font-semibold mb-1">Username</label><input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-3 py-3 rounded-xl border bg-background" required /></div><div><label className="block text-xs font-semibold mb-1">Password</label><input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="w-full px-3 py-3 rounded-xl border bg-background" required /></div><div><label className="block text-xs font-semibold mb-1">Age group</label><select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} className="w-full px-3 py-3 rounded-xl border bg-background">{AGE_GROUPS.map((a) => <option key={a}>{a}</option>)}</select></div></>}<button disabled={isSubmitting} className="w-full bg-teal-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2">{isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}{authMode === "login" ? t("login") : t("signUp")}</button></form><button onClick={() => { setAuthMode(authMode === "login" ? "signup" : "login"); setErrorMsg(""); }} className="w-full mt-4 text-sm text-teal-600 font-semibold">{authMode === "login" ? t("noAccount") : t("alreadyAccount")}</button></div></div>}
  </div>;
}
