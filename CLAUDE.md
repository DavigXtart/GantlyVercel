# Gantly (PsicoApp) - Plataforma de Salud Mental

## Project Overview
Plataforma de salud mental que conecta pacientes con psicólogos.
- **Backend**: Spring Boot 3.4.7 (Java 21) en `localhost:8080/api`
- **Frontend**: React 18 + TypeScript + Vite + Tailwind en `frontend/`
- **Base de datos**: MySQL 8.0 (UTF8MB4)
- **Docker**: `docker-compose.yml` levanta MySQL + Backend + Frontend

## Tech Stack
- **Backend**: Spring Boot 3.4.7, Spring Security, JWT (JJWT 0.11.5), WebSocket STOMP/SockJS, JPA/Hibernate
- **Frontend**: React 18.3.1, TypeScript 5.6.3, Vite 5.4.10, Tailwind 3.4.18, Axios, Framer Motion, i18next, Stripe JS
- **DB**: MySQL 8.0, 26+ entidades JPA, 22+ tablas
- **Infra**: Docker (2-stage build), Nginx reverse proxy
- **PDF Export**: html2canvas + jsPDF (frontend)
- **Excel Import**: Apache POI 5.2.5 (backend)

## Architecture
- Backend: Controllers → Services → Repositories → JPA Entities
- Frontend: Monolithic App.tsx router (32 useState hooks), single api.ts service
- Auth: JWT (15min access + 7d refresh) + Google OAuth2
- Chat: WebSocket STOMP con AES-256-GCM encryption
- Roles: USER, PSYCHOLOGIST, ADMIN, EMPRESA

## Key Backend Files
```
psicoapp/src/main/java/com/alvaro/psicoapp/
├── controller/     (20+ controllers: Auth, Admin, Task, Calendar, Chat, Test, Stripe, Jitsi, Matching...)
├── service/        (32+ services: Auth, Email, JWT, Task, Test, Calendar, Chat, Matching, Audit, Stripe, TestImport...)
├── domain/         (26+ JPA entities)
├── repository/     (35+ Spring Data repositories)
├── dto/            (23+ DTO classes with validation)
├── security/       (SecurityConfig, JwtAuthFilter, RateLimitFilter, OAuth2SuccessHandler)
└── config/         (JwtConfig, WebSocketConfig)
```

## Key Frontend Files
```
frontend/src/
├── App.tsx                    (801 lines - monolithic router)
├── services/api.ts            (all API calls)
├── components/                (54+ .tsx components)
│   ├── Auth: Login, Register, ForgotPassword, ResetPassword
│   ├── Dashboards: UserDashboard (13 tabs), PsychDashboard (11 tabs), AdminPanel (6 tabs)
│   ├── Flows: TestFlow, InitialTestFlow, AgendaPersonal, PatientMatchingTest
│   ├── Tests: TestManager, TestImporter, TestReport
│   └── UI: ChatWidget, CalendarWeek, Landing, About, Toast, BarChart, FactorChart
├── i18n/                      (ES/EN translations)
└── assets/                    (images, lottie animations)
```

## Database Schema (Main Tables)
- **users** - Core user entity (roles: USER/PSYCHOLOGIST/ADMIN/EMPRESA)
- **tests/questions/answers** - Personality test system (16PF, INITIAL, MATCHING)
- **subfactors/factors** - Test scoring dimensions (with bipolar labels and formulas)
- **test_results/factor_results** - Test results per subfactor/factor
- **evaluation_tests/evaluation_test_results** - Clinical tests (GAD-7, PANIC, SOCIAL_ANXIETY)
- **daily_mood_entries** - Daily mood journal (mood_rating, emotions JSON, activities JSON)
- **appointments/appointment_requests/appointment_ratings** - Booking system
- **chat_messages** - Encrypted chat (AES-256-GCM)
- **tasks/task_comments/task_files** - Therapeutic tasks
- **psychologist_profiles** - Extended psychologist info
- **user_psychologist** - Patient-psychologist assignment
- **consent_requests/consent_document_types** - Consent management (minors)

## Test System Architecture
Two parallel systems:
1. **TestEntity** (personality/matching/intelligence): Full question→answer→subfactor→factor hierarchy with scoring
2. **EvaluationTestEntity** (clinical): Simpler score+level system, answers stored as JSON

### Test Types (Delphos-compatible)
Three predefined test structures available during import:

| Type | Description | Structure |
|---|---|---|
| **TCP** | Test de Competencias Personales (16PF) | 5 factores globales + 17 subfactores con etiquetas bipolares |
| **TCA** | Test de Competencias Académicas | 3 rasgos calculados (IG=INV+IV, INV=RA+APE, IV=RV+APN) + 4 subfactores base |
| **Ansiedad** | Test de Ansiedad | 1 factor global + 3 subfactores: R1 Cognitivo, R2 Fisiológico, R3 Motor |

### Scoring Model
- **Subfactors**: Primary scoring units. Each question belongs to one subfactor. Score = sum of answer values.
- **Factors**: Higher-level aggregations. Defined by formulas referencing subfactor codes (e.g., `"A+F+H+Q2(-)"`)
- **Bipolar labels**: `min_label` / `max_label` on subfactors and factors (e.g., "Reservado" / "Abierto")
- **Inverse items**: `questions.inverse = true` reverses scoring: `score = maxValue - answerValue`
- **Percentage**: `(totalScore / maxScore) * 100` per subfactor, rolled up to factors

### Test Import (Excel)
- **Endpoint**: `POST /admin/tests/import/parse` + `POST /admin/tests/import/confirm`
- **Formats**: Auto-detects Delphos format (questions in col D, answers with points in col B) or generic (questions in col A)
- **Flow**: Upload .xlsx → parse preview → select type (TCP/TCA/Ansiedad/Generic) → confirm → creates test + structure + questions + answers

### Test Report (PDF Export)
- **Component**: `TestReport.tsx` with `forwardRef` exposing `exportPdf()`
- **Layouts**: FactorScaleTable (1-10 bipolar scale) for personality tests, PercentageScaleTable (10-90 with zones MUY BAJO→MUY ALTO) for intelligence tests
- **Integration**: PsychDashboard test-details tab renders TestReport + "Exportar PDF" button
- **Libraries**: html2canvas (DOM→canvas) + jsPDF (canvas→PDF, multi-page support)

### SQL Migrations (manual, not Flyway)
Located in `psicoapp/src/main/resources/db/`:
- `V30__fix_16pf_subfactor_mapping.sql` - Maps 187 16PF questions to correct subfactors
- `V31__add_test_indexes.sql` - 10 performance indexes on test-related tables
- `V32__add_bipolar_labels_and_formulas.sql` - Adds min_label, max_label, formula, calculated columns + 16PF seed data
- `V33__add_question_inverse_flag.sql` - Adds `inverse` boolean to questions for reverse-scored items

## Psychologist Approval System
Psychologists must be approved by an admin before appearing as active in the platform.

### Flow
1. **Registration**: User registers with role PSYCHOLOGIST → `AuthService.register()` creates `UserEntity` + `PsychologistProfileEntity` with `approved = false`
2. **Admin review**: Admin goes to **Psicólogos tab** in admin panel → sees "Pendientes de aprobación" section below the approved psychologists grid
3. **Click card** → full-page detail view with parsed profile (bio, education, experience, certifications, specializations, languages, interests, links) + Aprobar/Rechazar buttons
4. **Approve** → sets `approved = true`, sends notification + email, psychologist moves to main grid
5. **Reject** → keeps `approved = false`, sets `rejectionReason`, sends notification + email, stays in pending with reason visible

### Key Implementation Details
- **Backend DTO**: `PendingPsychologistDto` in `AdminDtos.java` includes profile fields (bio, languages, linkedinUrl, website, interests) + user fields (avatarUrl, gender, age)
- **Backend query**: `psychologistProfileRepository.findByApprovedFalseOrderByUpdatedAtDesc()`
- **Frontend filtering**: `UsersManager.tsx` filters `pendingUserIds` out of the main psychologist grid so unapproved psychologists don't appear in both places
- **JSON parsing**: Profile fields (education, experience, certifications, specializations, languages, interests) are stored as JSON strings; frontend parses them with `parseJson()` fallback helper, showing raw text if JSON is invalid
- **Rejection keeps in pending**: After rejecting, `loadPendingPsychologists()` is called (not removed from local state) so the psychologist stays in "Pendientes" with the rejection reason displayed

### Files Involved
- `AuthService.java` — Creates `PsychologistProfileEntity` on registration
- `AdminService.java` — `getPendingPsychologists()`, `approvePsychologist()`, `rejectPsychologist()`
- `AdminDtos.java` — `PendingPsychologistDto` record
- `UsersManager.tsx` — Full UI: pending grid, detail page, approve/reject flow
- `AdminPanel.tsx` — Pending psychologists removed from here (moved to UsersManager)

## Known Critical Issues (Production Blockers)
1. **Secrets hardcoded** in application-prod.yml (Gmail password, Google OAuth fallbacks)
2. **CORS wildcard** `*` with credentials=true in SecurityConfig
3. **OAuth2 token in URL** (sendRedirect with ?token=) - visible in browser history/logs
4. **Zero unit/integration tests** in both backend and frontend
5. **No GDPR compliance**: No privacy policy, no consent for health data, no data subject rights endpoints
6. **Chat encryption key deterministic** (derived from user IDs, no salt/PBKDF2)
7. **Health data unencrypted** in DB (mood entries, test results, evaluations)
8. **SQL debug logging in prod** (logs PII)
9. **WebSocket CORS wildcard** + no wss:// enforcement
10. **Hardcoded localhost URLs** in React components (file download links)

## Pending Features
- **Stripe**: Backend StripeController exists but frontend integration incomplete
- **Emails**: EmailService works (Gmail SMTP) but needs HTML templates, credentials externalized
- **GDPR**: Need privacy policy, consent flow, data export/deletion endpoints, DPO assignment
- **Tests**: Question-to-subfactor assignment UI needed for imported tests
- **Missing**: Error boundary (global), .env.production, Nginx security headers, CSP

## Build & Run
- **Maven**: Installed globally at `/c/Program Files (x86)/Apache/Maven/bin/mvn` (no `./mvnw` wrapper)
- **Backend compile**: `cd psicoapp && mvn compile`
- **Frontend typecheck**: `cd frontend && npx tsc --noEmit`
- **Frontend dev**: `cd frontend && npm run dev` (Vite on port 5173)
