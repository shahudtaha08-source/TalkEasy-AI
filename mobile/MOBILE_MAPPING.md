# TalkEasy — Web → Flutter Mobile Mapping

The React/Vite app in `client/` is the **source of truth**. This document records the exact
screen-by-screen mapping used to build the Flutter app in `mobile/`. Nothing here is a redesign:
the same features, terminology, colors, and API calls, laid out for a phone.

---

## 1. Design tokens (verbatim from `client/src/index.css` + `tailwind.config.ts`)

| Token | CSS value | Flutter |
| --- | --- | --- |
| Display font | `Outfit` | `Outfit` |
| Body font | `DM Sans` | `DM Sans` |
| Primary | `hsl(170 70% 40%)` → `#1DAF9C` | `TalkColors.primary` |
| Primary foreground | `hsl(170 90% 98%)` | `TalkColors.onPrimary` |
| Primary border | `hsl(170 60% 32%)` | `TalkColors.primaryBorder` |
| Soft blue accent | `hsl(210 60% 92%)` | `TalkColors.softBlue` |
| Background | `hsl(160 20% 98%)` → `#F4F8F7` | `TalkColors.background` |
| Card | `hsl(0 0% 100%)` | `TalkColors.card` |
| Foreground | `hsl(200 40% 14%)` → `#1A2C33` | `TalkColors.foreground` |
| Muted foreground | `hsl(200 12% 46%)` | `TalkColors.muted` |
| Border | `hsl(200 16% 90%)` | `TalkColors.border` |
| Radius — card | `rounded-xl` (0.75rem) | `TalkRadius.card` |
| Radius — button | `rounded-md` (0.375rem) | `TalkRadius.button` |
| Radius — pill | `rounded-full` | `TalkRadius.pill` |
| Card border | `1px solid var(--card-border)` + `shadow-sm` | `TalkCard` |

Auth pages use their own gradient that is preserved exactly:
`bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100`
(light) / `from-slate-950 via-teal-950/10 to-slate-900` (dark).

Dark theme tokens are mirrored in `TalkColors.dark*` and driven by `ThemeMode`.

---

## 2. Navigation model

Web uses a fixed `w-64` sidebar (`Sidebar.tsx`) inside `Layout.tsx`.

- **≥ 900px** → Flutter renders the same sidebar as a permanent `NavigationRail`-style column.
- **< 900px** → the same list collapses into a `Drawer` (hamburger in the app bar).
- **< 600px** → the 5 highest-traffic destinations additionally appear in a bottom bar:
  Dashboard, Chat, Mood, Habits, Settings. Everything else stays in the drawer.

Item order, labels, icons and grouping are copied from `Sidebar.tsx`, not invented.

| Sidebar group | Items |
| --- | --- |
| Main | Dashboard, Chatbot, Mood Tracker, Habit Tracker, Sleep Tracker, Water Intake, Stress Tracker |
| Insights | Health Dashboard, 30-Day Trends, 90-Day Trends, Reports, Statistics, Emotional History |
| Resources | Journal, Resources, Find Help |
| Footer | Settings |

---

## 3. Route map

| Web route | Flutter route | Screen |
| --- | --- | --- |
| `/` | `/` | `LandingScreen` |
| `/login` | `/login` | `LoginScreen` |
| `/signup` | `/signup` | `SignupScreen` |
| `/setup-profile` | `/setup-profile` | `SetupProfileScreen` |
| `/forgot-password` | `/forgot-password` | `ForgotPasswordScreen` |
| `/reset-password?token=` | `/reset-password` | `ResetPasswordScreen` |
| `/dashboard` | `/dashboard` | `DashboardScreen` |
| `/chat` | `/chat` | `ChatbotScreen` |
| `/mood`, `/mood-enhanced` | `/mood-enhanced` | `MoodTrackerScreen` |
| `/habits` | `/habits` | `HabitTrackerScreen` |
| `/sleep` | `/sleep` | `SleepTrackerScreen` |
| `/water` | `/water` | `WaterIntakeScreen` |
| `/stress` | `/stress` | `StressTrackerScreen` |
| `/health` | `/health` | `HealthDashboardScreen` |
| `/trends-30` | `/trends-30` | `Trends30Screen` |
| `/trends-90` | `/trends-90` | `Trends90Screen` |
| `/reports` | `/reports` | `ReportsScreen` |
| `/statistics` | `/statistics` | `StatisticsScreen` |
| `/history` | `/history` | `EmotionalHistoryScreen` |
| `/journal` | `/journal` | `JournalScreen` |
| `/resources` | `/resources` | `ResourcesScreen` |
| `/resources/:slug` | `/resources/:slug` | `ResourceDetailScreen` |
| `/help` | `/help` | `FindHelpScreen` |
| `/settings` | `/settings` | `SettingsScreen` |
| `/privacy`, `/terms`, `/cookies`, `/cookie-preferences` | same | `LegalScreen` |

Redirects preserved from `App.tsx`: `/mood` → `/mood-enhanced`, `/statistics` → `/trends-30` behaviour
is kept identical.

---

## 4. API surface (from `shared/routes.ts` + `server/routes.ts`)

Auth cookies are `talkeasy_access` (15 min) and `talkeasy_refresh` (7 days), `path=/`,
`sameSite=lax`, `httpOnly` on the server. Dart's `HttpClient` does **not** keep a cookie jar,
so `ApiClient` keeps its own in-memory cookie store and replays the `Cookie` header — including
a single automatic `/api/auth/refresh` + retry on 401.

| Purpose | Method + path |
| --- | --- |
| Current user | `GET /api/auth/user` |
| Update profile | `PATCH /api/user` |
| Register | `POST /api/auth/register` |
| Login | `POST /api/auth/login` |
| Refresh | `POST /api/auth/refresh` |
| Logout | `POST /api/auth/logout` |
| Forgot password | `POST /api/auth/forgot-password` |
| Verify reset token | `POST /api/auth/verify-reset-token` |
| Reset password | `POST /api/auth/reset-password` |
| Moods (simple) | `GET/POST /api/moods` |
| Mood entries (detailed) | `GET/POST /api/mood-entries` (`?limit=`) |
| Habits | `GET/POST /api/habits` (`?date=`), `PATCH /api/habits/:id` |
| Journals | `GET/POST /api/journals`, `PATCH/DELETE /api/journals/:id` |
| Sleep | `GET/POST /api/sleep-entries` (POST upserts per date) |
| Water | `GET/POST /api/water-entries` (`?date=`), `DELETE /api/water-entries/:id` |
| Stress | `GET/POST /api/stress-entries` (`?limit=`), `PATCH /api/stress-entries/:id` |
| Health records | `GET /api/health-daily-records` (`?limit=`), `GET /api/health-daily-records/latest`, `POST /api/health-daily-records` (upsert per date) |
| Reports | `GET/POST /api/reports`, `GET /api/reports/:id` |
| Conversations | `GET/POST /api/conversations` |
| Message history | `GET /api/conversations/:id/messages` |
| Send message | `POST /api/conversations/:id/messages` — **SSE**, `text/event-stream`, frames `data: {"content":…,"detectedEmotion":…,"aiSuggestion":…}` then `data: {"done":true}` |
| Emotional history | `GET /api/history/emotional` |

`POST /api/conversations/:id/messages` is streamed with a raw socket in `ChatService` so the
assistant reply types in progressively exactly like the web app.

### Demo mode

`client/src/lib/demo-data.ts` short-circuits every hook above when `talkeasy_demo_mode` is set and
generates a private 7-day dataset. `DemoStore` in `mobile/lib/data/demo_store.dart` reproduces the
same keys, the same seven-day shape, and the same create/update/delete helpers so the mobile app is
usable with no server and no account.

---

## 5. Feature parity notes

- **Age-adaptive UI** — `Layout.tsx` scales text, spacing, card padding and button height from
  `user.ageGroup`. `AgeStyle.of(context)` reproduces this so Settings → age changes take effect
  app-wide, as on web.
- **RTL** — `LanguageContext` flips `dir` for Urdu. Flutter uses `Directionality` +
  `localeName == 'ur'` from `shared_preferences` (`talkeasy_language`).
- **Health metrics are demo-labelled.** `health_daily_records.is_demo` is always true in v6.0, so
  `HealthDashboardScreen` shows the same "Demo" badges as the web Health page. No wearable claims.
- **Wellness insights** — `shared/wellness-insights.ts` deterministic rules are ported to
  `mobile/lib/data/wellness_insights.dart` so trend copy matches the web app.
- **Safety / crisis copy** on `FindHelp` and the chat safety banner is reproduced verbatim.
- **Password strength meter** in `ResetPassword` (Too short / Weak / Fair / Good / Strong) uses the
  same scoring as `ResetPassword.tsx`.
- **Toasts** — `use-toast` destructive/default variants become `TalkToast`.

---

## 6. Screens removed from the Flutter port

The pre-existing `mobile/` stub screens (`splash_screen.dart`, `login_screen.dart`,
`dashboard_screen.dart`, `health_device_service.dart`) used placeholder `Icons.favorite` branding,
a 2-second fake splash, a fake login and hard-coded health values. They are **replaced**, because
they do not match the web source of truth. There is no splash delay: the app restores the session
from cookies and routes straight to `/dashboard` or `/login`.