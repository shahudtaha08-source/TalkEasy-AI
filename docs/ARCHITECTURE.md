# TalkEasy v6.0 Architecture Documentation

## Overview

TalkEasy v6.0 is a mental-wellness and personal wellness tracking platform with comprehensive health tracking, rule-based insights, and a foundation for future AI and wearable integration.

**Version:** 6.0  
**Status:** Production-oriented feature implementation  
**Release Date:** October 2026

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Data Architecture](#data-architecture)
5. [Health Data Model](#health-data-model)
6. [Demo Data Policy](#demo-data-policy)
7. [Report System](#report-system)
8. [Flutter Architecture](#flutter-architecture)
9. [Future Roadmap](#future-roadmap)
10. [Security Considerations](#security-considerations)

---

## Architecture Overview

TalkEasy v6.0 follows a monolithic full-stack architecture with clear separation of concerns:

```
TalkEasy/
├── client/          # React web application
├── server/          # Express.js backend API
├── shared/          # Shared TypeScript types and utilities
├── mobile/          # Flutter mobile application
├── migrations/      # Database migration scripts
└── docs/            # Documentation
```

### Key Principles

- **Preserve Existing Features:** All v5.x features remain functional
- **No Age-Adaptive UX:** Removed age-based UI variations for consistency
- **Rule-Based Insights:** v6.0 uses deterministic logic, not AI
- **Demo-Labeled Data:** All wearable metrics are clearly marked as demo
- **AI-Ready:** Architecture supports future AI integration

---

## Technology Stack

### Web Application (Client)

- **Framework:** React 18 with TypeScript
- **Routing:** Wouter
- **State Management:** TanStack Query (React Query)
- **UI Components:** Radix UI + Tailwind CSS
- **Charts:** Recharts
- **Forms:** React Hook Form + Zod validation

### Backend (Server)

- **Runtime:** Node.js with Express
- **ORM:** Drizzle ORM
- **Database:** PostgreSQL
- **Authentication:** JWT + Express Session
- **AI Service:** Ollama integration (non-production in v6.0)

### Mobile Application (Flutter)

- **Framework:** Flutter 3.0+
- **State Management:** Provider
- **Navigation:** GoRouter
- **HTTP:** Dio
- **Charts:** FL Chart

---

## Project Structure

### Client (Web)

```
client/
├── src/
│   ├── components/     # Reusable UI components
│   │   ├── Layout.tsx
│   │   ├── Sidebar.tsx
│   │   └── ui/         # Radix UI components
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Page components
│   │   ├── Dashboard.tsx
│   │   ├── MoodTrackerEnhanced.tsx
│   │   ├── WaterIntake.tsx
│   │   ├── StressTracker.tsx
│   │   ├── HealthDashboard.tsx
│   │   ├── Trends30Days.tsx
│   │   ├── Trends90Days.tsx
│   │   ├── ReportLibrary.tsx
│   │   ├── PrivacyPolicy.tsx
│   │   ├── TermsConditions.tsx
│   │   ├── CookiePolicy.tsx
│   │   └── CookiePreferences.tsx
│   ├── lib/            # Utilities and configuration
│   └── i18n/           # Internationalization
```

### Server (Backend)

```
server/
├── index.ts           # Entry point
├── routes.ts          # API route definitions
├── auth.ts            # Authentication middleware
├── db.ts              # Database connection
├── storage.ts         # Data access layer
├── ai-service.ts      # AI service integration
└── safety-detection.ts # Safety escalation logic
```

### Shared

```
shared/
├── schema.ts          # Drizzle ORM schema definitions
├── routes.ts          # API route type definitions
├── data/              # Shared data
│   └── india-locations.ts
└── wellness-insights.ts # Rule-based insights engine
```

### Mobile (Flutter)

```
mobile/
├── lib/
│   ├── main.dart              # App entry point
│   ├── screens/               # Screen widgets
│   │   ├── splash_screen.dart
│   │   ├── login_screen.dart
│   │   └── dashboard_screen.dart
│   ├── services/              # Business logic
│   │   └── health_device_service.dart
│   ├── models/                # Data models
│   ├── widgets/               # Reusable widgets
│   └── utils/                 # Utilities
├── pubspec.yaml
└── assets/
```

---

## Data Architecture

### Database Schema

TalkEasy uses PostgreSQL with Drizzle ORM. The schema includes:

#### Core Tables (Preserved from v5.x)

- `users` - User accounts and profiles
- `sessions` - Session management
- `moods` - Basic mood tracking (backward compatibility)
- `habits` - Habit tracking
- `journals` - Journal entries
- `sleep_entries` - Sleep tracking
- `conversations` - Support chat conversations
- `messages` - Chat messages
- `password_reset_tokens` - Password reset flow
- `safety_events` - Safety escalation tracking

#### New v6.0 Tables

- `mood_entries` - Detailed mood tracking with factors and intensity
- `water_entries` - Daily water intake logs
- `stress_entries` - Stress level tracking with interventions
- `health_daily_records` - Aggregated daily health snapshot
- `reports` - Generated wellness reports metadata

### Key Relationships

```
users (1) ───< (N) mood_entries
users (1) ───< (N) water_entries
users (1) ───< (N) stress_entries
users (1) ───< (N) health_daily_records
users (1) ───< (N) reports
```

---

## Health Data Model

### Health Daily Records

The `health_daily_records` table stores aggregated daily health data:

```typescript
{
  id: number;
  userId: string;
  date: Date;
  
  // Demo/simulated wearable metrics (v6.0)
  heartRate?: number;      // BPM - demo data
  spo2?: number;           // % - demo data
  systolicBp?: number;     // mmHg - demo data
  diastolicBp?: number;    // mmHg - demo data
  ecgStatus?: string;      // demo/simulated record
  steps?: number;          // demo data
  isDemo: boolean;         // Always true in v6.0
  
  // Real user-entered metrics
  sleepHours?: number;
  waterMl?: number;
  stressLevel?: string;
  mood?: string;
  moodIntensity?: number;
  
  createdAt: Date;
  updatedAt: Date;
}
```

### Mood Entries

Detailed mood tracking with contextual factors:

```typescript
{
  id: number;
  userId: string;
  mood: string;              // Happy, Calm, Sad, Anxious, etc.
  intensity: number;         // 1-10
  factors?: string;          // JSON array: ["Friends", "College"]
  contextNote?: string;      // "What happened today?"
  date: Date;
  createdAt: Date;
}
```

### Water Entries

Individual drink log entries:

```typescript
{
  id: number;
  userId: string;
  amountMl: number;
  date: Date;
  loggedAt: Date;
}
```

### Stress Entries

Stress level tracking with intervention tracking:

```typescript
{
  id: number;
  userId: string;
  level: string;             // Relaxed, Low, Moderate, High
  score?: number;            // 1-10 optional
  note?: string;
  interventionViewed: boolean;
  date: Date;
  createdAt: Date;
}
```

---

## Demo Data Policy

### Purpose

Demo data in v6.0 serves two purposes:

1. **UI Demonstration:** Show the application's capabilities without requiring wearable hardware
2. **Architecture Foundation:** Establish data structures for future real wearable integration

### Demo-Labeled Fields

The following fields are always marked as demo in v6.0:

- `health_daily_records.heartRate`
- `health_daily_records.spo2`
- `health_daily_records.systolicBp`
- `health_daily_records.diastolicBp`
- `health_daily_records.ecgStatus`
- `health_daily_records.steps`

### UI Requirements

All demo data must be:

- Clearly labeled in the UI with "Demo data" or similar text
- Never presented as real medical measurements
- Accompanied by disclaimers
- Visually distinguished (e.g., amber badges, italic text)

### Disclaimers

Required disclaimer text:

> "Health metrics displayed as 'Demo data' are simulated values for demonstration purposes. Wearable device integration is planned for a future TalkEasy release. This data is not medical advice and should not be used for medical diagnosis. Consult a qualified healthcare professional for medical interpretation."

---

## Report System

### Report Generation

Reports are generated on-demand using rule-based insights:

1. **Data Collection:** Fetch health, mood, stress, and water data for the period
2. **Insight Generation:** Apply rule-based logic to identify patterns
3. **Aggregation:** Calculate averages and distributions
4. **Report Creation:** Store report metadata and JSON summary

### Report Types

- **30-Day Report:** Covers the last 30 days of tracked data
- **90-Day Report:** Covers the last 90 days with monthly comparisons

### Report Structure

```typescript
{
  id: number;
  userId: string;
  type: "30day" | "90day";
  title: string;
  periodStart: Date;
  periodEnd: Date;
  summaryJson: string;  // JSON blob with report data
  generatedAt: Date;
}
```

### Report Sections

1. User/report period
2. Executive Summary (rule-based insights)
3. Heart Rate (demo data)
4. SpO2 (demo data)
5. Blood Pressure (demo data)
6. ECG Records (demo data)
7. Sleep
8. Steps (demo data)
9. Water Intake
10. Stress
11. Mood
12. Mood Factors
13. Trends
14. Notable Patterns
15. Wellness Suggestions
16. Data Disclaimer

### PDF Generation

v6.0 implements basic text-based report download. Future versions will use jsPDF for professional PDF generation.

---

## Flutter Architecture

### Design Principles

1. **Shared Backend:** Flutter app uses the same API as the web application
2. **Same Authentication:** JWT-based auth with the same token validation
3. **Same Data Models:** Shared types where practical
4. **Native Performance:** Not a WebView wrapper - real Flutter app

### Health Device Service

The `HealthDeviceService` provides an abstraction layer for wearable integration:

```dart
abstract class HealthDeviceService {
  bool get isConnected;
  Future<bool> connect();
  Future<void> disconnect();
  Future<int?> getHeartRate();
  Future<int?> getSpO2();
  Future<Map<String, int>?> getBloodPressure();
  Future<String?> getECG();
  Future<Map<String, dynamic>?> getSleep();
  Future<int?> getSteps();
  Future<int?> getBatteryStatus();
  Stream<int?> getHeartRateStream();
  Stream<int?> getSpO2Stream();
  Stream<int?> getStepsStream();
}
```

### Implementation

- **v6.0:** `DemoHealthDeviceService` - Simulated data
- **v6.5/v7.0:** `BluetoothHealthDeviceService` - Real BLE integration (planned)

### Screens Implemented (v6.0)

- Splash Screen
- Login Screen
- Dashboard Screen

### Screens Planned (Future)

- Register
- Forgot Password
- Mood Tracker
- Habits
- Sleep
- Journal
- Water Intake
- Stress
- Health Overview
- Trends (30-day, 90-day)
- Reports
- Report Library
- Find Help
- Resources
- Settings
- Legal Pages

---

## Future Roadmap

### v6.0 (Current Release)

**Focus:** Wellness tracking + reports + mobile foundation

**Features:**
- ✅ Detailed mood tracking with factors
- ✅ Water intake tracking
- ✅ Stress tracking with interventions
- ✅ Health dashboard with demo wearable metrics
- ✅ 30-day and 90-day trends
- ✅ Rule-based wellness insights
- ✅ Report generation and library
- ✅ Legal pages (Privacy, Terms, Cookies)
- ✅ Flutter app foundation
- ✅ Health device service abstraction
- ✅ India location data for Find Help
- ✅ Complete forgot password flow

**What's NOT in v6.0:**
- ❌ Production AI fine-tuning
- ❌ Real wearable device integration
- ❌ Age-adaptive UX (removed)
- ❌ Medical diagnosis features

### v6.5 or v7.0 (Planned)

**Focus:** Production AI integration

**Features:**
- Fine-tuned AI model for wellness support
- Context-aware AI responses
- Multilingual AI support
- AI-generated wellness reports
- Enhanced safety escalation with AI
- Improved chatbot with memory

### Future (Post-v7.0)

**Focus:** Wearable device integration

**Features:**
- Real smartwatch integration via BLE
- Real smart band integration via BLE
- Live health data streaming
- Battery level monitoring
- Device pairing UI
- Automatic data sync

---

## Security Considerations

### Authentication

- JWT tokens for API authentication
- Secure session management
- Password hashing with bcrypt
- Password reset with cryptographically secure tokens

### Data Protection

- Encryption in transit (HTTPS)
- Encryption at rest (database encryption)
- Secure token storage (flutter_secure_storage)
- No hardcoded secrets in code

### Safety Architecture

- Independent of AI (safety logic runs separately)
- Immediate safety escalation for self-harm indicators
- India emergency: 112
- Tele-MANAS: 14416
- Follow-up tracking for safety events

### Privacy

- User data isolation
- Privacy policy and terms
- Cookie policy and preferences
- Data deletion capability
- GDPR-compliant data handling

---

## API Endpoints

### Health Data

- `GET /api/health-daily-records` - Fetch health records
- `GET /api/health-daily-records/latest` - Fetch latest record
- `POST /api/health-daily-records` - Create/update health record

### Mood Tracking

- `GET /api/mood-entries` - Fetch mood entries
- `POST /api/mood-entries` - Create mood entry

### Water Intake

- `GET /api/water-entries` - Fetch water entries
- `POST /api/water-entries` - Log water intake
- `DELETE /api/water-entries/:id` - Delete water entry

### Stress Tracking

- `GET /api/stress-entries` - Fetch stress entries
- `POST /api/stress-entries` - Create stress entry
- `PATCH /api/stress-entries/:id` - Update stress entry

### Reports

- `GET /api/reports` - Fetch user reports
- `POST /api/reports` - Generate new report
- `GET /api/reports/:id` - Fetch specific report

---

## Testing Strategy

### Manual Testing Checklist

- [ ] Signup, login, logout
- [ ] Forgot password flow
- [ ] Reset password flow
- [ ] Mood tracking with factors
- [ ] Water intake tracking
- [ ] Stress tracking with interventions
- [ ] Health dashboard demo data display
- [ ] 30-day trends
- [ ] 90-day trends
- [ ] Report generation
- [ ] Report download
- [ ] Find Help (all 28 states)
- [ ] City search and selection
- [ ] Legal pages accessibility
- [ ] Safety escalation
- [ ] Flutter app build
- [ ] Flutter API connectivity

### Build Verification

```bash
npm run check    # TypeScript check
npm run build    # Production build
npm run db:push  # Database migration
```

---

## Known Limitations

1. **No Real Wearable Integration:** All wearable metrics are demo data
2. **AI Not Production-Ready:** Support Chat uses Ollama without fine-tuning
3. **PDF Generation Basic:** Current implementation generates text files, not professional PDFs
4. **Flutter Screens Incomplete:** Only splash, login, and dashboard screens implemented
5. **No Offline Support:** Application requires internet connection
6. **Limited Notifications:** No push notification system
7. **No Social Features:** No sharing or community features

---

## Recommendations Before Launch

1. **Legal Review:** Have Privacy Policy and Terms reviewed by legal counsel
2. **Security Audit:** Conduct penetration testing
3. **Performance Testing:** Load test the API endpoints
4. **Accessibility Audit:** Ensure WCAG 2.1 AA compliance
5. **Browser Testing:** Test across major browsers and mobile devices
6. **Error Handling:** Improve error messages and edge case handling
7. **Monitoring:** Set up application monitoring and logging
8. **Backup Strategy:** Implement database backup and recovery
9. **CDN Setup:** Configure CDN for static assets
10. **Domain Setup:** Configure production domain and SSL

---

## Contact

For questions about TalkEasy v6.0 architecture:

- **Founder:** Taha Shahud
- **Documentation:** docs/ARCHITECTURE.md
- **Issues:** Report via project issue tracker

---

*Last updated: October 2026*
