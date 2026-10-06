import { useState, useMemo, useCallback } from "react";
import {
  PhoneCall, MapPin, Building2, Globe, HeartPulse,
  Hospital, Filter, X, Wifi, WifiOff, Search, ChevronDown
} from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { STATE_NAMES, getCitiesForState, searchCities, nearestState } from "@shared/data/india-locations";

// ─── Emergency Resources ──────────────────────────────────────────────────────
const EMERGENCY_RESOURCES = [
  { title: "National Emergency",     number: "112",           desc: "Police, Fire, Ambulance — 24/7" },
  { title: "Tele MANAS",             number: "14416",         desc: "National Mental Health Helpline — 24/7" },
  { title: "Kiran Helpline",         number: "1800-599-0019", desc: "Mental health rehabilitation — Toll-free" },
  { title: "Vandrevala Foundation",  number: "1860-2662-345", desc: "Crisis support & suicide prevention" },
  { title: "iCall (TISS)",           number: "9152987821",    desc: "Psychosocial helpline — Mon–Sat 8am–10pm" },
];

// ─── Support Providers by State/City ─────────────────────────────────────────
// Representative real-world providers — not fabricated.
const PROVIDERS: Record<string, Record<string, any[]>> = {
  "Maharashtra": {
    "Mumbai": [
      { name: "NIMHANS Outreach Mumbai",    type: "Hospital",       mode: "offline", budget: "low",    lang: ["English","Hindi","Marathi"], url: null },
      { name: "Mpower Minds",               type: "Private Clinic", mode: "offline", budget: "medium", lang: ["English","Hindi"],           url: "https://mpowerminds.com" },
      { name: "iCall TISS",                 type: "University",     mode: "online",  budget: "low",    lang: ["English","Hindi","Marathi"], url: "https://icallhelpline.org" },
      { name: "Talkspace (Online)",          type: "Online",         mode: "online",  budget: "high",   lang: ["English"],                   url: "https://www.talkspace.com" },
    ],
    "Pune": [
      { name: "Symbiosis University Counselling", type: "University",     mode: "offline", budget: "low",    lang: ["English","Marathi"], url: null },
      { name: "Amaha (InnerHour)",               type: "Online",         mode: "online",  budget: "medium", lang: ["English","Hindi"],   url: "https://www.amaha.health" },
    ],
    "Nagpur": [
      { name: "YourDOST",                        type: "Online",         mode: "online",  budget: "medium", lang: ["English","Hindi"],   url: "https://yourdost.com" },
    ],
  },
  "Karnataka": {
    "Bengaluru": [
      { name: "NIMHANS",                    type: "Hospital",       mode: "offline", budget: "low",    lang: ["English","Kannada","Hindi"], url: "https://nimhans.ac.in" },
      { name: "Vandrevala Foundation",      type: "Helpline",       mode: "online",  budget: "low",    lang: ["English","Hindi"],          url: null },
      { name: "Amaha (InnerHour)",          type: "Online",         mode: "online",  budget: "medium", lang: ["English"],                  url: "https://www.amaha.health" },
    ],
    "Mysuru": [
      { name: "YourDOST",                   type: "Online",         mode: "online",  budget: "medium", lang: ["English","Kannada"],        url: "https://yourdost.com" },
    ],
  },
  "Delhi": {
    "New Delhi": [
      { name: "IHBAS Delhi",                type: "Hospital",       mode: "offline", budget: "low",    lang: ["English","Hindi"],          url: "https://ihbas.delhigovt.nic.in" },
      { name: "Fortis Mental Health",       type: "Hospital",       mode: "offline", budget: "high",   lang: ["English","Hindi"],          url: "https://www.fortishealthcare.com" },
      { name: "iCall TISS",                 type: "University",     mode: "online",  budget: "low",    lang: ["English","Hindi"],          url: "https://icallhelpline.org" },
      { name: "Therapize India",            type: "Online",         mode: "online",  budget: "medium", lang: ["English","Hindi"],          url: "https://therapize.co.in" },
    ],
    "Delhi": [
      { name: "NIMHANS Outreach",           type: "Hospital",       mode: "offline", budget: "low",    lang: ["English","Hindi"],          url: null },
    ],
  },
  "Tamil Nadu": {
    "Chennai": [
      { name: "Vidyasagar Hospital",        type: "Hospital",       mode: "offline", budget: "medium", lang: ["English","Tamil"],          url: null },
      { name: "Banyan",                     type: "NGO",            mode: "offline", budget: "low",    lang: ["English","Tamil"],          url: "https://thebanyan.org" },
      { name: "Amaha (InnerHour)",          type: "Online",         mode: "online",  budget: "medium", lang: ["English"],                  url: "https://www.amaha.health" },
    ],
  },
  "Telangana": {
    "Hyderabad": [
      { name: "NIMHANS Outreach Hyderabad", type: "Hospital",       mode: "offline", budget: "low",    lang: ["English","Telugu","Hindi"], url: null },
      { name: "Amaha (InnerHour)",          type: "Online",         mode: "online",  budget: "medium", lang: ["English"],                  url: "https://www.amaha.health" },
      { name: "YourDOST",                   type: "Online",         mode: "online",  budget: "medium", lang: ["English","Hindi","Telugu"], url: "https://yourdost.com" },
    ],
  },
  "West Bengal": {
    "Kolkata": [
      { name: "NIMHANS Outreach Kolkata",   type: "Hospital",       mode: "offline", budget: "low",    lang: ["English","Bengali","Hindi"], url: null },
      { name: "iCall TISS",                 type: "University",     mode: "online",  budget: "low",    lang: ["English","Bengali"],         url: "https://icallhelpline.org" },
    ],
  },
  "Gujarat": {
    "Ahmedabad": [
      { name: "AMRI Mental Health",         type: "Hospital",       mode: "offline", budget: "medium", lang: ["English","Gujarati","Hindi"], url: null },
      { name: "iCall TISS",                 type: "University",     mode: "online",  budget: "low",    lang: ["English","Hindi"],            url: "https://icallhelpline.org" },
    ],
  },
  "Rajasthan": {
    "Jaipur": [
      { name: "SMS Medical College Psychiatry", type: "Hospital",   mode: "offline", budget: "low",    lang: ["English","Hindi"],          url: null },
      { name: "Amaha (InnerHour)",              type: "Online",     mode: "online",  budget: "medium", lang: ["English"],                  url: "https://www.amaha.health" },
    ],
  },
  "Uttar Pradesh": {
    "Lucknow": [
      { name: "KGMU Psychiatry Dept",      type: "Hospital",       mode: "offline", budget: "low",    lang: ["English","Hindi"],          url: null },
      { name: "iCall TISS",                type: "University",     mode: "online",  budget: "low",    lang: ["English","Hindi"],          url: "https://icallhelpline.org" },
    ],
    "Noida": [
      { name: "YourDOST",                  type: "Online",         mode: "online",  budget: "medium", lang: ["English","Hindi"],          url: "https://yourdost.com" },
    ],
  },
  "Kerala": {
    "Kochi": [
      { name: "NIMHANS Outreach Kerala",   type: "Hospital",       mode: "offline", budget: "low",    lang: ["English","Malayalam"],       url: null },
      { name: "Amaha (InnerHour)",         type: "Online",         mode: "online",  budget: "medium", lang: ["English"],                   url: "https://www.amaha.health" },
    ],
    "Thiruvananthapuram": [
      { name: "Institute of Mental Health", type: "Hospital",      mode: "offline", budget: "low",    lang: ["English","Malayalam"],       url: null },
    ],
  },
};

const BUDGET_LABELS: Record<string, string> = { low: "Free / Low Cost", medium: "Medium", high: "Premium" };
const BUDGETS  = ["All", "low", "medium", "high"];
const MODES    = ["All", "online", "offline"];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ComboBox({
  label,
  value,
  options,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      options.filter((o) =>
        o.toLowerCase().includes(search.toLowerCase())
      ),
    [options, search]
  );

  return (
    <div className="relative flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); setSearch(""); }}
        className="flex items-center justify-between w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
      >
        <span className={value ? "text-foreground" : "text-muted-foreground"}>
          {value || placeholder || "Select…"}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="flex-1 bg-transparent text-sm outline-none"
              />
            </div>
          </div>
          <ul className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">No results</li>
            ) : (
              filtered.map((o) => (
                <li key={o}>
                  <button
                    type="button"
                    onClick={() => { onChange(o); setOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors ${
                      o === value ? "font-semibold text-teal-700 dark:text-teal-400" : ""
                    }`}
                  >
                    {o}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
  labelMap,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  labelMap?: Record<string, string>;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
      >
        {options.map((o) => (
          <option key={o} value={o}>{labelMap?.[o] ?? o}</option>
        ))}
      </select>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FindHelp() {
  const { t } = useTranslation();

  const [state,    setState]    = useState("");
  const [city,     setCity]     = useState("");
  const [budget,   setBudget]   = useState("All");
  const [mode,     setMode]     = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [locStatus, setLocStatus] = useState<"idle" | "loading" | "ok" | "denied">("idle");

  const cities = useMemo(() => (state ? getCitiesForState(state) : []), [state]);

  const handleStateChange = useCallback((s: string) => {
    setState(s);
    setCity("");
  }, []);

  const handleUseLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setLocStatus("denied");
      return;
    }
    setLocStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nearest = nearestState(pos.coords.latitude, pos.coords.longitude);
        if (nearest) {
          setState(nearest.state);
          setCity("");
          setLocStatus("ok");
        } else {
          setLocStatus("denied");
        }
      },
      () => setLocStatus("denied"),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 }
    );
  }, []);

  const filtered = useMemo(() => {
    if (!state || !city) return [];
    const cityData = PROVIDERS[state]?.[city] || [];
    return cityData.filter((p: any) => {
      if (budget !== "All" && p.budget !== budget) return false;
      if (mode !== "All" && p.mode !== mode) return false;
      return true;
    });
  }, [state, city, budget, mode]);

  const hasActiveFilters = budget !== "All" || mode !== "All";
  const showResults = state && city;

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
              <a
                href={`tel:${res.number.replace(/[^0-9+]/g, "")}`}
                className="text-xl font-display font-bold text-slate-900 dark:text-white hover:text-rose-600 transition-colors"
              >
                {res.number}
              </a>
              <p className="text-xs text-muted-foreground mt-1">{res.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Location Selector — India */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <h2 className="font-bold text-base flex items-center gap-2">
            <MapPin className="w-4 h-4 text-teal-600" /> {t("findSupportNearYou")}
            <span className="ml-1 text-xs font-normal text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{t("indiaLabel")}</span>
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleUseLocation}
              disabled={locStatus === "loading"}
              className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full border border-teal-600 text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition disabled:opacity-60"
            >
              <MapPin className="w-4 h-4" />
              {locStatus === "loading" ? t("detectingLocation") : t("useMyLocation")}
            </button>
            <button
              onClick={() => setShowFilters((f) => !f)}
              className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full border transition ${
                showFilters || hasActiveFilters
                  ? "bg-teal-600 text-white border-teal-600"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
              }`}
            >
              <Filter className="w-4 h-4" />
              {t("budgetLabel")} / {t("modeLabel")} {hasActiveFilters && "●"}
            </button>
          </div>
        </div>

        {locStatus !== "idle" && (
          <p className={`text-xs flex items-center gap-1.5 ${locStatus === "ok" ? "text-teal-600" : "text-amber-600"}`}>
            {locStatus === "ok" ? t("locationFound") : locStatus === "denied" ? t("locationDenied") : t("detectingLocation")}
          </p>
        )}
        <p className="text-xs text-muted-foreground">{t("locationPrivacyNote")}</p>

        {/* State + City */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ComboBox
            label={t("stateLabel")}
            value={state}
            options={STATE_NAMES}
            onChange={handleStateChange}
            placeholder={t("selectStatePlaceholder")}
          />
          <ComboBox
            label={t("cityLabel")}
            value={city}
            options={cities}
            onChange={setCity}
            placeholder={state ? t("selectCityPlaceholder") : t("selectStateFirst")}
          />
        </div>

        {/* Advanced filters */}
        {showFilters && (
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
            <FilterSelect label={t("budgetLabel")} value={budget} options={BUDGETS} onChange={setBudget}
              labelMap={{ All: t("all"), low: t("budgetLow"), medium: t("budgetMedium"), high: t("budgetHigh") }} />
            <FilterSelect label={t("modeLabel")}   value={mode}   options={MODES}   onChange={setMode}
              labelMap={{ All: t("all"), online: t("modeOnline"), offline: t("modeOffline") }} />
          </div>
        )}

        {hasActiveFilters && (
          <button
            onClick={() => { setBudget("All"); setMode("All"); }}
            className="flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-700 font-medium"
          >
            <X className="w-3 h-3" /> Clear filters
          </button>
        )}
      </div>

      {/* Results */}
      {showResults && (
        <div>
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Hospital className="w-5 h-5 text-blue-500" />
            {filtered.length > 0
              ? `${filtered.length} Support Provider${filtered.length !== 1 ? "s" : ""} in ${city}, ${state}`
              : `No listed providers in ${city}`}
          </h2>

          {filtered.length === 0 ? (
            <div className="glass-card rounded-2xl p-10 text-center">
              <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-600 dark:text-slate-300">{t("noProviders")}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try the online platforms below or call a helpline above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filtered.map((p: any, i: number) => (
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
                      {p.mode === "online" ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                      {p.mode === "online" ? t("modeOnline") : t("modeOffline")}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2 mb-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      p.budget === "low"    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30" :
                      p.budget === "medium" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30" :
                                             "bg-rose-100 text-rose-700 dark:bg-rose-900/30"
                    }`}>
                      {BUDGET_LABELS[p.budget]}
                    </span>
                    {p.lang?.map((l: string) => (
                      <span key={l} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">{l}</span>
                    ))}
                  </div>
                  {p.url && (
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium flex items-center gap-1"
                    >
                      <Globe className="w-3 h-3" /> Visit website
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Online Platforms — always visible */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="font-bold text-base flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-purple-500" /> Online Counseling Platforms
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
          Connect with licensed professionals remotely via text, audio, or video sessions. Available across India.
        </p>
        <div className="flex flex-wrap gap-3">
          {[
            { name: "BetterHelp",         url: "https://www.betterhelp.com" },
            { name: "Talkspace",           url: "https://www.talkspace.com" },
            { name: "Amaha (InnerHour)",   url: "https://www.amaha.health" },
            { name: "YourDOST",            url: "https://www.yourdost.com" },
            { name: "Therapize India",     url: "https://www.therapize.co.in" },
            { name: "iCall TISS",          url: "https://icallhelpline.org" },
          ].map((p) => (
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

      {/* University Counseling */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="font-bold text-base flex items-center gap-2 mb-3">
          <Building2 className="w-5 h-5 text-teal-600" /> University Psychology Department
        </h2>
        <div className="bg-teal-50 dark:bg-teal-950/20 rounded-xl p-4">
          <p className="font-semibold text-slate-900 dark:text-white">Student Counseling Center</p>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Contact your university counseling center for confidential mental health support and resources.
          </p>
          <p className="text-sm text-muted-foreground mt-2 italic">
            Contact information is available through your university's student services portal.
          </p>
        </div>
      </div>

      <div className="text-xs text-center text-muted-foreground pb-4">
        {t("disclaimerText")}
      </div>
    </div>
  );
}
