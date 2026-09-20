import { useState, useEffect } from "react";
import { useUser, useUpdateUser } from "@/hooks/use-user";
import {
  Loader2, Globe, Clock, User, Phone, MapPin, Briefcase,
  DollarSign, ShieldAlert, Save
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n/LanguageContext";
import { LanguageCode } from "@/i18n/translations";

const LANGUAGES: LanguageCode[] = [
  "English", "Hindi", "Urdu", "Marathi", "Tamil", 
  "Telugu", "Malayalam", "Kannada", "Bengali", "Gujarati"
];
const AGE_GROUPS = [
  "Teen (13-19)",
  "Young Adult (20-35)",
  "Adult (36-55)",
  "Senior (55+)"
];
const OCCUPATIONS = ["Student", "Working Professional", "Self-Employed", "Homemaker", "Retired", "Unemployed", "Other"];
const BUDGETS = ["Low (Free resources only)", "Medium (Under ₹500/session)", "High (₹500+ per session)"];

interface FormState {
  firstName: string;
  lastName: string;
  ageGroup: string;
  preferredLanguage: LanguageCode;
  emergencyContact: string;
  city: string;
  locality: string;
  budget: string;
  occupationType: string;
}

function Field({ label, icon: Icon, children }: { label: string; icon: typeof User; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
        <Icon className="w-4 h-4 text-teal-600" /> {label}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-4 py-3 rounded-xl border-2 border-border bg-card focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all text-slate-900 dark:text-slate-100";
const selectCls = `${inputCls} cursor-pointer`;

export default function Settings() {
  const { t, language, setLanguage } = useTranslation();
  const { data: user, isLoading } = useUser();
  const { mutate: updateUser, isPending } = useUpdateUser();
  const { toast } = useToast();

  const [form, setForm] = useState<FormState>({
    firstName: "",
    lastName: "",
    ageGroup: "Young Adult (20-35)",
    preferredLanguage: language,
    emergencyContact: "",
    city: "",
    locality: "",
    budget: BUDGETS[0],
    occupationType: "Student",
  });

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        ageGroup: user.ageGroup || "Young Adult (20-35)",
        preferredLanguage: (user.preferredLanguage as LanguageCode) || language,
        emergencyContact: user.emergencyContact || "",
        city: user.city || "",
        locality: user.locality || "",
        budget: user.budget || BUDGETS[0],
        occupationType: user.occupationType || "Student",
      });
    }
  }, [user]);

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const val = e.target.value;
    setForm(f => ({ ...f, [key]: val }));
    if (key === "preferredLanguage") {
      setLanguage(val as LanguageCode);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser(form, {
      onSuccess: () => toast({ title: "Settings saved successfully." }),
      onError: () => toast({ title: "Failed to save settings.", variant: "destructive" }),
    });
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-96">
      <Loader2 className="animate-spin w-10 h-10 text-teal-600" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in duration-500 space-y-8">
      <div>
        <h1 className="text-4xl font-display font-bold text-slate-900 dark:text-white">{t("settingsTitle")}</h1>
        <p className="text-muted-foreground mt-2 text-lg">{t("settingsSubtitle")}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile */}
        <section className="glass-card rounded-3xl p-8 space-y-6">
          <div className="flex items-center gap-5 pb-6 border-b border-border">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white shadow-lg text-2xl font-bold overflow-hidden flex-shrink-0">
              {user?.profileImageUrl ? (
                <img src={user.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                form.firstName?.[0] || user?.username?.[0] || "U"
              )}
            </div>
            <div>
              <p className="font-bold text-lg text-slate-900 dark:text-white">{user?.email || user?.username}</p>
              <p className="text-muted-foreground text-sm">Your TalkEasy account identity</p>
            </div>
          </div>

          <h2 className="font-bold text-base text-slate-700 dark:text-slate-300">{t("personalDetails")}</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t("firstNameLabel")} icon={User}>
              <input type="text" value={form.firstName} onChange={set("firstName")} placeholder="First name" className={inputCls} />
            </Field>
            <Field label={t("lastNameLabel")} icon={User}>
              <input type="text" value={form.lastName} onChange={set("lastName")} placeholder="Last name" className={inputCls} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label={t("ageGroupLabel")} icon={Clock}>
              <select value={form.ageGroup} onChange={set("ageGroup")} className={selectCls}>
                {AGE_GROUPS.map(a => <option key={a}>{a}</option>)}
              </select>
            </Field>
            <Field label={t("preferredLanguageLabel")} icon={Globe}>
              <select value={form.preferredLanguage} onChange={set("preferredLanguage")} className={selectCls}>
                {LANGUAGES.map(l => <option key={l}>{l}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Occupation" icon={Briefcase}>
              <select value={form.occupationType} onChange={set("occupationType")} className={selectCls}>
                {OCCUPATIONS.map(o => <option key={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Monthly Support Budget" icon={DollarSign}>
              <select value={form.budget} onChange={set("budget")} className={selectCls}>
                {BUDGETS.map(b => <option key={b}>{b}</option>)}
              </select>
            </Field>
          </div>
        </section>

        {/* Location */}
        <section className="glass-card rounded-3xl p-8 space-y-6">
          <h2 className="font-bold text-base text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-teal-600" /> Location (used for Find Help)
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t("cityLabel")} icon={MapPin}>
              <input type="text" value={form.city} onChange={set("city")} placeholder="e.g. Mumbai" className={inputCls} />
            </Field>
            <Field label="Locality / Area" icon={MapPin}>
              <input type="text" value={form.locality} onChange={set("locality")} placeholder="e.g. Andheri West" className={inputCls} />
            </Field>
          </div>
        </section>

        {/* Emergency Contact */}
        <section className="glass-card rounded-3xl p-8 space-y-6 border-l-4 border-rose-400">
          <h2 className="font-bold text-base text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-500" /> {t("emergencyContactLabel")}
          </h2>
          <p className="text-sm text-muted-foreground -mt-3">
            Stored privately to present in times of emotional distress.
          </p>
          <Field label={t("emergencyContactLabel")} icon={Phone}>
            <input type="text" value={form.emergencyContact} onChange={set("emergencyContact")} placeholder="e.g. +91 99999 00000" className={inputCls} />
          </Field>
        </section>

        {/* Save */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isPending}
            className="px-8 py-3 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-teal-600/20"
          >
            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {t("saveSettings")}
          </button>
        </div>
      </form>

      <div className="text-center text-xs text-muted-foreground pb-6">
        TalkEasy · Designed and Developed by <span className="font-semibold text-foreground">Taha Shahud</span>
      </div>
    </div>
  );
}
