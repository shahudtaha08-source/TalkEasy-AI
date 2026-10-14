# TalkEasy — Setup & Operations

How to configure, run, migrate, and extend **TalkEasy AI** (web + server) and
**TalkEasy Mobile** (Flutter). Current release: **v6.3.0** — multiple mood
check-ins with 3-hour reminders and phone-based exercise tracking, now with
**genuine background reminders** (Web Push for the PWA + on-device Android local
notifications) and **ML transparency labels** — on top of the
v6.1.3 foundation (7-day trial / ₹199 premium, dual-source insights,
notification preferences, email password reset, remote push).

## 1. Requirements

| Tool        | Notes                                                                 |
| ----------- | --------------------------------------------------------------------- |
| Node.js     | v18+ (repo developed against v22). Requires `npm`.                    |
| PostgreSQL  | A reachable instance and a `DATABASE_URL`.                            |
| Flutter SDK | Optional — only needed to build/run `mobile/`. `flutter`, `dart` CLI. |

No mail provider, FCM key, or Ollama instance is required to *start* the app;
those features degrade gracefully (see below).

## 2. Environment variables

Copy `.env.example` to `.env`. Variables actually read by the code:

### Required
| Variable       | Used by                                |
| -------------- | -------------------------------------- |
| `DATABASE_URL` | `server/db.ts`, `drizzle.config.ts`. Fails hard if missing. |

### Authentication (JWT)
| Variable              | Default | Notes                                                        |
| --------------------- | ------- | ------------------------------------------------------------ |
| `JWT_SECRET`          | —       | Fails hard at boot in production if missing.                 |
| `JWT_REFRESH_SECRET`  | —       | Same.                                                        |
| `SESSION_SECRET`      | dev fallback | Only read by the Replit login integration (`server/replit_integrations/auth/replitAuth.ts`). That integration is exported but **not mounted** by `server/index.ts` (the active server uses the local JWT auth in `server/auth.ts`), so this is not currently required at runtime. If you enable it, set a strong value in production — the code otherwise falls back to a known development default. |

### Server
| Variable      | Default                    | Notes                                                              |
| ------------- | -------------------------- | ------------------------------------------------------------------ |
| `NODE_ENV`    | `development`              | `production` turns on cookie `secure`, static serving, strict checks. |
| `PORT`        | `5000`                     | Server listen port (see *Port consistency* below).                 |
| `HOST`        | `127.0.0.1` (Windows) else `0.0.0.0` | Bind address.                                        |

### Support-chat AI (Ollama)
| Variable            | Default                   |
| ------------------- | ------------------------- |
| `OLLAMA_BASE_URL`   | `http://127.0.0.1:11434`  |
| `OLLAMA_MODEL`      | `phi3:latest`             |
| `AI_TIMEOUT`        | `30000` (ms)              |

### Email (password reset) — `server/email.ts`
| Variable                     | Default      | Notes                                                        |
| ---------------------------- | ------------ | ------------------------------------------------------------ |
| `EMAIL_PROVIDER`             | auto         | `auto` detects by key; else one of `resend` \| `sendgrid` \| `mailgun` \| `smtp` \| `console` \| `none`. |
| `RESEND_API_KEY`             | —            | Provider: **resend**.                                         |
| `SENDGRID_API_KEY`           | —            | Provider: **sendgrid**.                                       |
| `MAILGUN_API_KEY`            | —            | Provider: **mailgun** (also needs `MAILGUN_DOMAIN`).          |
| `MAILGUN_DOMAIN`             | —            |                                                               |
| `SMTP_HOST`                  | —            | Provider: **smtp**.                                           |
| `SMTP_PORT`                  | `587`        |                                                               |
| `SMTP_SECURE`                | `true` if port 465 | Any truthy `"true"` enables TLS.                          |
| `SMTP_USER` / `SMTP_PASSWORD`| —            | Auth (optional).                                              |
| `EMAIL_FROM` (or `SMTP_FROM`)| —            | From address.                                                 |
| `EMAIL_FROM_NAME`            | `TalkEasy`   |                                                               |
| `APP_PUBLIC_URL`             | —            | Public app base URL used to build reset links (`PUBLIC_APP_URL`, `APP_URL`, `VITE_APP_URL` also accepted). Never derived from the `Host` header. **Set this in production or reset links will be wrong.** |

Email behavior:
- No provider configured → `console` in development (prints the reset link to the
  server log) and `none` in production. `console` is refused in production.
- With no working provider, `POST /api/auth/forgot-password` returns `503` without
  revealing whether the account exists, and emails are **not** claimed as sent.

### Password reset
| Variable                    | Default |
| --------------------------- | ------- |
| `RESET_TOKEN_EXPIRY_HOURS`  | `1`     |

### Remote push (FCM) — `server/push.ts`
| Variable          | Default     | Notes                                                   |
| ----------------- | ----------- | ------------------------------------------------------- |
| `FCM_SERVER_KEY`  | —           | Legacy FCM HTTP server key. Absent → push disabled (`configured: false`); no delivery is ever claimed. |
| `PUSH_PROVIDER`   | `fcm` if key present else `noop` | |

Push privacy: payloads are neutral titles/body + a deep link and **never**
contain journal contents or health values.

### Web Push / PWA (VAPID) — `server/web-push.ts`
| Variable            | Default                          | Notes                                                        |
| ------------------- | -------------------------------- | ------------------------------------------------------------ |
| `VAPID_PUBLIC_KEY`  | —                                | URL-safe base64 public key, served to the browser at `GET /api/notifications/web-push/config`. Absent (or invalid) → Web Push disabled and `webPushConfigured: false` is reported. |
| `VAPID_PRIVATE_KEY` | —                                | **Server-only.** Never expose to the client or commit it.    |
| `VAPID_SUBJECT`     | `mailto:talkeasysupport@gmail.com` | `mailto:` or `https:` contact URL required by the Web Push spec. |

Generate a pair with `node scripts/generate-vapid-keys.mjs` (prints both keys;
the operator copies them into `.env`). Web Push payloads are the same neutral
shape as FCM and never contain journal or health data.

### Obsolete variables
The following appear in older `.env` files but are **no longer read**:
`EMAIL_API_KEY`, `RESET_TOKEN_LENGTH`, `SESSION_MAX_AGE`, `SECURE_COOKIES`,
`COOKIE_DOMAIN`, `COOKIE_SAME_SITE`, `ALLOWED_ORIGINS`.

### Port consistency
`server/index.ts` defaults to port **5000**, but the Flutter `ApiClient` defaults
to `http://localhost:3000` and older `.env.example` files said `3000`. Set
`PORT=3000` in `.env`, or pass `--dart-define=TALKEASY_API_URL=...` to the Flutter
app so the web, server, and mobile targets agree.

## 3. Database & migrations

Schema lives in `shared/schema.ts`; Drizzle config in `drizzle.config.ts`
(`dialect: postgresql`). Hand-written migrations are plain SQL in `migrations/`.

```sh
npm install
# then, in order, for a fresh database:
psql "$DATABASE_URL" -f migrations/0000_nostalgic_tempest.sql
psql "$DATABASE_URL" -f migrations/002_v6_new_tables.sql
psql "$DATABASE_URL" -f migrations/003_seed_reflection_prompts.sql
psql "$DATABASE_URL" -f migrations/004_v6_1_wellness_tables.sql
psql "$DATABASE_URL" -f migrations/005_v6_1_3_entitlements_wearables_notifications.sql
psql "$DATABASE_URL" -f migrations/006_v6_2_0_workout_sessions.sql
psql "$DATABASE_URL" -f migrations/007_v6_3_0_mood_checkins_reminders.sql
psql "$DATABASE_URL" -f migrations/008_v6_3_0_web_push_subscriptions.sql
```

Notes:
- `005` adds `entitlements`, `wearable_measurements`, `device_tokens`,
  `notification_preferences`, and `reports.source` (default `wellness`).
- `006` adds `workout_sessions` (phone-based exercise/activity tracking).
- `007` adds `mood_reminder_state` (per-user 3-hour mood check-in reminder state)
  plus ordering indexes on `mood_entries`.
- `008` adds `push_subscriptions` (Web Push subscriptions for PWA background
  reminders) plus an index on `user_id`.
- `005`, `006`, `007`, and `008` are **additive and idempotent** (they use
  `CREATE TABLE IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS`, no `DROP`s), so they
  are safe to re-run against an existing database and **preserve existing data**.
- `migrations/meta/_journal.json` is generated by Drizzle and is **not** a reliable
  list of applied steps for the handwritten files (it currently records only
  `0000`, `003`, and `005`). Do not hand-edit it. Apply the SQL files in numeric
  order.
- `npm run db:push` syncs the live schema to `shared/schema.ts` directly; it does
  **not** create migration files.

### Recommended release deployment path (v6.3.0)

There is exactly one migration mechanism in this repo (`npm run db:push`), so pick
one of these and use it consistently — **do not** mix a hand-edited Drizzle journal
with ad-hoc SQL:

1. **Preferred for an existing production database (no data loss):** apply the
   four new files in order with `psql`, right after deploying the new server
   build. All four are additive/idempotent, so re-running is harmless:
   ```sh
   psql "$DATABASE_URL" -f migrations/005_v6_1_3_entitlements_wearables_notifications.sql
   psql "$DATABASE_URL" -f migrations/006_v6_2_0_workout_sessions.sql
   psql "$DATABASE_URL" -f migrations/007_v6_3_0_mood_checkins_reminders.sql
   psql "$DATABASE_URL" -f migrations/008_v6_3_0_web_push_subscriptions.sql
   ```
2. **Alternative (schema-driven):** run `npm run db:push` (`drizzle-kit push`).
   It diffs the live database against `shared/schema.ts`; for these additive
   tables it only issues `CREATE TABLE`/`CREATE INDEX`. Review its proposed
   statements and reject any destructive change before confirming.

Fresh databases: run every numbered file `0000 → 008` in order. If you want a
journal-based `drizzle-kit migrate` workflow later, regenerate the metadata with
`drizzle-kit generate` from `shared/schema.ts` (a separate, deliberate change) —
never edit `_journal.json` by hand.

## 4. Running the app

```sh
npm run dev        # NODE_ENV=development, tsx --env-file=.env server/index.ts
npm run check      # tsc (no emit)
npm test           # node --import tsx --test "tests/*.test.ts"  (116 tests)
npm run build      # node script/build.mjs  → dist/index.cjs + dist/public
npm start          # NODE_ENV=production node dist/index.cjs
```

All testable functionality is covered in `tests/`: entitlement math, source
isolation in insights, wearable/exercise validation, mood-check-in aggregation
(double-count prevention), 3-hour reminder scheduling, Web Push subscription
validation and reminder-due logic, ML disclosure labels, notification
preferences, email provider behavior, and rate limiting (116 tests total).

## 5. Email (password reset) setup checklist

1. Pick a provider and add its key(s) to `.env`.
2. Set `APP_PUBLIC_URL` to the public origin of the app.
3. Start the server (`npm run dev`) and confirm the provider is detected:
   `GET /api/email/status` reports the configured provider/from/configured flag.
4. Trigger `POST /api/auth/forgot-password` with a real account and confirm the
   link arrives. `POST /api/auth/verify-reset-token` then `POST /api/auth/reset-password`
   complete the flow. Tokens are single-use and expire after
   `RESET_TOKEN_EXPIRY_HOURS` (default 1 h).
5. `EMAIL_PROVIDER=console` prints the reset email to the log for local testing
   only; it is disabled in production.

## 6. Remote push (FCM) and Web Push setup checklist

FCM (Android/iOS remote push):

1. Add `FCM_SERVER_KEY` (legacy HTTP key) to `.env` and restart the server.
   `/api/email/status`-style checks exist under `POST /api/notifications/test-push`.
2. Register a device: `POST /api/notifications/device-tokens` with
   `{ "token": "<fcm token>", "platform": "android|ios", "provider": "fcm" }`.
3. Click “Send test push” in **Settings → Notifications** (web), or hit
   `POST /api/notifications/test-push`.
4. Push is never attempted when unconfigured: responses report
   `configured: false` and no delivery is implied.

Web Push (PWA background reminders):

1. Generate a key pair: `node scripts/generate-vapid-keys.mjs`.
2. Put the keys in `.env` (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`,
   `VAPID_SUBJECT`) and restart the server. `GET /api/notifications/web-push/config`
   then reports `webPushConfigured: true` and serves the public key.
3. In **Settings → Notifications**, enable background reminders and accept the
   browser permission prompt. The browser registers a subscription via
   `POST /api/notifications/web-push/subscriptions`; `GET
   /api/notifications/web-push/status` reflects it.
4. The server sends a mood reminder when 3 hours have elapsed since the last
   **saved** check-in (never from merely opening the screen), respecting quiet
   hours, timezone, opt-out, and permission; failed endpoints are retried with a
   bounded failure count and then invalidated. No delivery is ever claimed
   without provider confirmation.

## 7. Flutter (TalkEasy Mobile)

See `mobile/README.md` and `mobile/MOBILE_MAPPING.md` for structure. Current state
and steps:

1. Install the Flutter SDK and run `flutter pub get` in `mobile/`. The app uses
   `provider`, `go_router`, `shared_preferences`, `http`, `fl_chart`, `intl`,
   `cached_network_image`, plus `flutter_local_notifications`, `timezone`, and
   `flutter_timezone` for on-device reminders.
2. Point the API at your server:
   - default `http://localhost:3000`;
   - `flutter run --dart-define=TALKEASY_API_URL=http://192.168.x.x:3000` for a
     device/emulator.
3. `flutter analyze` and `flutter test` (smoke test in `mobile/test/widget_test.dart`,
   mood-reminder rules in `mobile/test/mood_reminder_test.dart`, and the
   notification-scheduling contract in `mobile/test/notification_schedule_test.dart`).
4. **On-device local reminders are wired** via `services/notification_service.dart`:
   saving a mood check-in reschedules a single `inexactAllowWhileIdle` reminder
   3 hours after the last saved check-in (never a burst), honouring quiet hours
   and the platform timezone; tapping it deep-links to `/mood-enhanced`. Requires
   `POST_NOTIFICATIONS` (Android 13+) which the app requests at launch.
   Android core-library desugaring is enabled in `android/app/build.gradle.kts`
   (required by `flutter_local_notifications`); `flutter_timezone` is pinned to
   `^4.1.1` because the 5.x line needs a Kotlin 2.x Gradle plugin.
   Remote push on device still requires `firebase_messaging` plus a Firebase
   project (`google-services.json` / `GoogleService-Info.plist`); the server side
   (`POST /api/notifications/*`) is already in place and neutral payloads are
   enforced.
5. Real wearable data is not yet collected on device: `services/health_device_service.dart`
   ships `DisconnectedHealthDeviceService` (reports nothing) and a clearly-labeled
   `DemoHealthDeviceService`. TalkEasy never fabricates measurements.

> Verified with Flutter 3.29.3 / Dart 3.7.2 (`flutter pub get`, `flutter analyze`
> → no issues, `flutter test` → 12 passed, `flutter build apk --debug` → success).
> On-device reminder delivery itself is built but unverified (no Android device
> available in CI); it must be confirmed manually on a real device.

## 8. Premium (v6.1.3+)

- Trial: **7 days** for new users, server-authoritative, auto-started by
  `getOrCreateEntitlement` (no billing integration).
- Premium: **₹199/month**, enforced by the backend (`require90DayAccess` in
  `server/v6-features.ts`; `POST /api/reports` 90-day guard returns `402
  premium_required`).
- There is intentionally **no fake purchase/payment-success** path. Premium cannot
  currently be activated client-side; activation is gated server-side and
  `canAccess90Day` drives the 90-day gates.

## 9. Installable PWA (Android Chrome)

TalkEasy ships a valid web app manifest, real PNG icons, and a service worker, so
it installs from Android Chrome with its own icon and name and launches in
standalone mode.

Required server behaviour (already implemented):

- **HTTPS** is required by Chrome for install + service workers. The Render URL is
  HTTPS.
- The server must serve, at the app origin:
  - `/manifest.webmanifest` with `name`/`short_name` `TalkEasy`,
    `display: standalone`, `start_url: /dashboard`, and 192/512 PNG icons.
  - `/sw.js` (service worker: offline app shell + Web Push handlers).
  - `/icons/icon-192.png`, `/icons/icon-512.png`, `/icons/icon-maskable-512.png`,
    `/icons/apple-touch-icon.png`.
  All of these are emitted into `dist/public/` by `npm run build`.

Icons are generated from the shipped brand mark (`client/public/favicon.svg`) with
headless Chrome and committed to `client/public/icons/`. Regenerate after a brand
change:

```sh
npm run icons           # or: CHROME_PATH=/path/to/chrome node scripts/generate-pwa-icons.mjs
```

Install steps on the phone (Android Chrome):

1. Open `https://talkeasy-ai.onrender.com/` in Chrome.
2. Tap the **⋮** menu → **Install app** (or **Add to Home screen**), or accept the
   in-app **Install TalkEasy** banner.
3. Confirm. TalkEasy then opens in its own window with the TalkEasy icon.
4. For background mood reminders: open **Settings → Notifications**, tap
   **Enable** under *Background reminders*, and allow notifications when Chrome
   asks. The server must have `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY` set (see §6).

Service-worker behaviour and safety:

- Navigations are **network-first** (a new deploy is picked up immediately); the
  cached shell is only a fallback when offline.
- Hashed static assets are cache-first with a background refresh; caches are
  versioned and old versions are deleted on activate.
- `/api/*` is **never** cached or served from cache, so private wellness data is
  never shown stale and a failed API call surfaces as a real failure.