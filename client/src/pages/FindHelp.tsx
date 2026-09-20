import { useState, useMemo } from "react";
import { PhoneCall, MapPin, Building2, Globe, HeartPulse, Hospital, Filter, X, Wifi, WifiOff } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";

const EMERGENCY_RESOURCES = [
  { title: "National Emergency",     number: "112",           desc: "Police, Fire, Ambulance — 24/7" },
  { title: "Tele MANAS",             number: "14416",         desc: "National Mental Health Helpline — 24/7" },
  { title: "Kiran Helpline",         number: "1800-599-0019", desc: "Mental health rehabilitation — Toll-free" },
  { title: "Vandrevala Foundation",  number: "1860-2662-345", desc: "Crisis support & suicide prevention" },
  { title: "iCall (TISS)",           number: "9152987821",    desc: "Psychosocial helpline — Mon–Sat 8am–10pm" },
];

const PROVIDERS: Record<string, Record<string, Record<string, any[]>>> = {
  IN: {
    "Maharashtra": {
      "Mumbai": [
        { name: "NIMHANS Outreach Mumbai",   type: "Hospital",    mode: "offline", budget: "low",    lang: ["English","Hindi","Marathi"], audience: ["all"] },
        { name: "Mpower Minds",              type: "Private Clinic", mode: "offline", budget: "medium",lang: ["English","Hindi"],          audience: ["all"] },
        { name: "iCall TISS",                type: "University",  mode: "online",  budget: "low",    lang: ["English","Hindi","Marathi"], audience: ["student"] },
        { name: "Talkspace (Online)",        type: "Online",      mode: "online",  budget: "high",   lang: ["English"],                   audience: ["all"] },
      ],
      "Pune": [
        { name: "Symbiosis University Counselling", type: "University", mode: "offline", budget: "low", lang: ["English","Marathi"], audience: ["student"] },
        { name: "Dr. Prerna Mental Wellness",       type: "Private Clinic", mode: "offline", budget: "medium", lang: ["English","Hindi"], audience: ["all"] },
      ],
    },
  },
};

const COUNTRIES = ["IN - India"];
const STATES: Record<string, string[]>    = { "IN - India": ["Maharashtra"] };
const CITIES:  Record<string, string[]>   = { "Maharashtra": ["Mumbai", "Pune"] };
const BUDGETS  = ["All", "low", "medium", "high"];
const LANGS    = ["All", "English", "Hindi", "Marathi", "Tamil"];
const MODES    = ["All", "online", "offline"];
const AUDIENCE = ["All", "student", "professional"];

const BUDGET_LABELS: Record<string, string> = { low: "Free / Low", medium: "Medium", high: "Premium" };
const MODE_ICONS: Record<string, typeof Wifi> = { online: Wifi, offline: WifiOff };

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

export default function FindHelp() {
  const { t } = useTranslation();
  const [country,  setCountry]  = useState("IN - India");
  const [state,    setState]    = useState("Maharashtra");
  const [city,     setCity]     = useState("Mumbai");
  const [budget,   setBudget]   = useState("All");
  const [lang,     setLang]     = useState("All");
  const [mode,     setMode]     = useState("All");
  const [audience, setAudience] = useState("All");
  const [showFilters, setShowFilters] = useState(false);

  const countryCode = country.split(" - ")[0];

  const filtered = useMemo(() => {
    const cityData = PROVIDERS[countryCode]?.[state]?.[city] || [];
    return cityData.filter((p: any) => {
      if (budget   !== "All" && p.budget !== budget)                                  return false;
      if (lang     !== "All" && !p.lang.includes(lang))                               return false;
      if (mode     !== "All" && p.mode  !== mode)                                     return false;
      if (audience !== "All" && !p.audience.includes(audience) && !p.audience.includes("all")) return false;
      return true;
    });
  }, [countryCode, state, city, budget, lang, mode, audience]);

  const hasActiveFilters = budget !== "All" || lang !== "All" || mode !== "All" || audience !== "All";

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <header>
        <h1 className="text-4xl font-display font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <HeartPulse className="w-8 h-8 text-rose-500" /> {t("findHelpTitle")}
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          {t("findHelpSubtitle")}
        </p>
      </header>

      {/* Emergency Resources */}
      <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-rose-700 dark:text-rose-400 mb-4 flex items-center gap-2">
          <PhoneCall className="w-5 h-5" /> {t("emergencyHelplines")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {EMERGENCY_RESOURCES.map((res, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-rose-100 dark:border-rose-900/50 shadow-sm">
              <p className="text-xs font-bold text-rose-500 uppercase tracking-wide mb-1">{res.title}</p>
              <a href={`tel:${res.number}`} className="text-xl font-display font-bold text-slate-900 dark:text-white hover:text-rose-600 transition-colors">
                {res.number}
              </a>
              <p className="text-xs text-muted-foreground mt-1">{res.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Location + Filters */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-base flex items-center gap-2">
            <MapPin className="w-4 h-4 text-teal-600" /> Find Support Near You
          </h2>
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full border transition ${
              showFilters || hasActiveFilters
                ? "bg-teal-600 text-white border-teal-600"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters {hasActiveFilters && "●"}
          </button>
        </div>

        {/* Location selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FilterSelect label="Country" value={country} options={COUNTRIES} onChange={v => { setCountry(v); setState(STATES[v.split(" - ")[0] ? v : "IN - India"]?.[0] || ""); }} />
          <FilterSelect label="State"   value={state}   options={STATES[country.split(" - ")[0]] || []} onChange={v => { setState(v); setCity(CITIES[v]?.[0] || ""); }} />
          <FilterSelect label="City"    value={city}    options={CITIES[state] || []}  onChange={setCity} />
        </div>

        {/* Advanced filters */}
        {showFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-border">
            <FilterSelect label="Budget"   value={budget}   options={BUDGETS}  onChange={setBudget} />
            <FilterSelect label="Language" value={lang}     options={LANGS}    onChange={setLang} />
            <FilterSelect label="Mode"     value={mode}     options={MODES}    onChange={setMode} />
            <FilterSelect label="For"      value={audience} options={AUDIENCE} onChange={setAudience} />
          </div>
        )}

        {hasActiveFilters && (
          <button
            onClick={() => { setBudget("All"); setLang("All"); setMode("All"); setAudience("All"); }}
            className="flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-700 font-medium"
          >
            <X className="w-3 h-3" /> Clear filters
          </button>
        )}
      </div>

      {/* Results */}
      <div>
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Hospital className="w-5 h-5 text-blue-500" />
          {filtered.length > 0 ? `${filtered.length} Support Provider${filtered.length !== 1 ? "s" : ""} in ${city}` : "No results"}
        </h2>

        {filtered.length === 0 ? (
          <div className="glass-card rounded-2xl p-10 text-center">
            <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-600 dark:text-slate-300">No providers match your filters.</p>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your city or clearing filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((p: any, i: number) => {
              const ModeIcon = MODE_ICONS[p.mode] || Globe;
              return (
                <div key={i} className="glass-card p-5 rounded-2xl hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start gap-3 mb-3">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{p.name}</h3>
                      <p className="text-sm text-muted-foreground">{p.type}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${
                      p.mode === "online"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30"
                    }`}>
                      <ModeIcon className="w-3 h-3" /> {p.mode}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      p.budget === "low" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30" :
                      p.budget === "medium" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30" :
                      "bg-rose-100 text-rose-700 dark:bg-rose-900/30"
                    }`}>
                      {BUDGET_LABELS[p.budget]}
                    </span>
                    {p.lang.map((l: string) => (
                      <span key={l} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">{l}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Online Platforms */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="font-bold text-base flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-purple-500" /> Online Counseling Platforms
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
          Connect with licensed professionals remotely via text, audio, or video sessions.
        </p>
        <div className="flex flex-wrap gap-3">
          {[
            { name: "BetterHelp", url: "https://www.betterhelp.com" },
            { name: "Talkspace", url: "https://www.talkspace.com" },
            { name: "Amaha (InnerHour)", url: "https://www.amaha.health" },
            { name: "YourDOST", url: "https://www.yourdost.com" },
            { name: "Therapize India", url: "https://www.therapize.co.in" },
          ].map(p => (
            <a
              key={p.name}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-xl font-medium text-sm hover:bg-purple-200 dark:hover:bg-purple-900/30 transition-colors"
            >
              {p.name}
            </a>
          ))}
        </div>
      </div>

      {/* University */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="font-bold text-base flex items-center gap-2 mb-3">
          <Building2 className="w-5 h-5 text-teal-600" /> University Psychology Department
        </h2>
        <div className="bg-teal-50 dark:bg-teal-950/20 rounded-xl p-4">
          <p className="font-semibold text-slate-900 dark:text-white">Student Counseling Center</p>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Contact your university counseling center for confidential mental health support and resources.</p>
          <p className="text-sm text-muted-foreground mt-2 italic">Contact information available through your university's student services.</p>
        </div>
      </div>

      <div className="text-xs text-center text-muted-foreground pb-4">
        {t("disclaimerText")}
      </div>
    </div>
  );
}
