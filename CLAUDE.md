# Gantly (PsicoApp) - Plataforma de Salud Mental

## Project Overview
Plataforma de salud mental que conecta pacientes con psicólogos.
- **Backend**: Spring Boot 3.4.7 (Java 21) en `localhost:8080/api`
- **Frontend**: React 18 + TypeScript + Vite + Tailwind + React Router en `frontend/`
- **Base de datos**: MySQL 8.0 (UTF8MB4)
- **Docker**: `docker-compose.yml` levanta MySQL + Backend + Frontend + Jitsi Meet

## Tech Stack
- **Backend**: Spring Boot 3.4.7, Spring Security, JWT (JJWT 0.11.5), WebSocket STOMP/SockJS, JPA/Hibernate
- **Frontend**: React 18.3.1, TypeScript 5.6.3, Vite 5.4.10, Tailwind 3.4.18, React Router 7, Axios, Framer Motion, i18next, Stripe JS
- **DB**: MySQL 8.0, 26+ entidades JPA, 22+ tablas
- **Infra**: Docker (2-stage build), Nginx reverse proxy, Jitsi Meet self-hosted
- **PDF Export**: html2canvas + jsPDF (frontend)
- **Excel Import**: Apache POI 5.2.5 (backend)
- **Payments**: Stripe (subscriptions + single appointment payments)

## Architecture
- Backend: Controllers → Services → Repositories → JPA Entities
- Frontend: App.tsx uses `react-router-dom` declarative routing with `useAuth()` hook and `ProtectedRoute`
- Auth: JWT (15min access + 7d refresh) + Google OAuth2 + email verification (6-digit code)
- Chat: WebSocket STOMP con AES-256-GCM encryption (PBKDF2 key derivation, per-conversation salt)
- Roles: USER, PSYCHOLOGIST, ADMIN, EMPRESA

## Key Backend Files
```
psicoapp/src/main/java/com/alvaro/psicoapp/
├── controller/     (20+ controllers: Auth, Admin, Task, Calendar, Chat, Test, Stripe, Jitsi, Matching, Company...)
├── service/        (30+ services: Auth, Email, JWT, Task, Test, Calendar, Chat, Matching, Audit, Stripe, TestImport...)
├── domain/         (25+ JPA entities)
├── repository/     (33+ Spring Data repositories)
├── dto/            (23+ DTO classes with validation)
├── security/       (SecurityConfig, JwtAuthFilter, RateLimitFilter, OAuth2SuccessHandler)
└── config/         (JwtConfig, WebSocketConfig)
```

## Key Frontend Files
```
frontend/src/
├── App.tsx                    (react-router-dom Routes, useAuth hook, ProtectedRoute)
├── services/api.ts            (all API calls)
├── components/                (60+ .tsx components)
│   ├── Auth: Login, Register, ForgotPassword, ResetPassword
│   ├── Dashboards: UserDashboard, PsychDashboard, AdminPanel, CompanyDashboard
│   ├── Dashboard Tabs (extracted):
│   │   ├── Psych: PsychEditProfileTab, PsychPatientsTab, PsychTasksTab, PsychTestsTab, PsychBillingTab
│   │   └── User: UserSettingsTab, UserTasksTab, UserPsychProfileTab
│   ├── Flows: TestFlow, InitialTestFlow, AgendaPersonal, PatientMatchingTest
│   ├── Tests: TestManager, TestImporter, TestReport
│   ├── Payments: PricingPage
│   └── UI: ChatWidget, CalendarWeek, Landing, About, Toast, BarChart, FactorChart
├── i18n/                      (ES/EN translations)
└── assets/                    (images, lottie animations)
```

## Database Schema (Main Tables)
- **users** - Core user entity (roles: USER/PSYCHOLOGIST/ADMIN/EMPRESA, verification_code for email)
- **tests/questions/answers** - Personality test system (16PF, INITIAL, MATCHING)
- **subfactors/factors** - Test scoring dimensions (with bipolar labels and formulas)
- **test_results/factor_results** - Test results per subfactor/factor
- **evaluation_tests/evaluation_test_results** - Clinical tests (GAD-7, PANIC, SOCIAL_ANXIETY)
- **daily_mood_entries** - Daily mood journal (mood_rating, emotions JSON, activities JSON)
- **appointments/appointment_requests/appointment_ratings** - Booking system (stripe_session_id, paymentStatus)
- **chat_messages** - Encrypted chat (AES-256-GCM)
- **chat_conversations** - Per-conversation encryption salt (PBKDF2)
- **tasks/task_comments/task_files** - Therapeutic tasks
- **psychologist_profiles** - Extended psychologist info (approved, approved_at, rejection_reason, license_number)
- **user_psychologist** - Patient-psychologist assignment
- **consent_requests/consent_document_types** - Consent management (minors)

## Routing (React Router)
App.tsx uses `react-router-dom` v7 with declarative `<Routes>`:
- `/` — Landing or Dashboard (based on auth)
- `/login`, `/register`, `/register/:referralCode` — Auth flows
- `/about`, `/pricing`, `/soy-profesional` — Public pages
- `/dashboard` — Role-based dashboard (USER/PSYCHOLOGIST/ADMIN/EMPRESA)
- `/test/:testId` — Test taking flow
- `/reset-password` — Password reset
- `/oauth-callback` — Google OAuth2 handler

## Stripe Payment System
### Subscriptions (Psychologist plans)
- `PricingPage.tsx`: 3 plans (Basic/Premium/Enterprise) with monthly/yearly toggle
- `StripeController.createCheckoutSession()` → Stripe Checkout → webhook confirms

### Appointment Payments
- Patient books appointment → `paymentStatus = PENDING` with 48h deadline
- `StripeController.createAppointmentCheckoutSession()` → Stripe single-payment Checkout
- On return: `UserDashboard` reads `?payment=success&appointment=X` → calls `verifyAppointmentPayment()`
- Webhook: `handleAppointmentPaymentCompleted()` sets `paymentStatus = PAID`
- Video calls gated: `JitsiService` blocks if `paymentStatus != PAID`

### Billing Tab
- `PsychBillingTab.tsx`: Filterable table of appointments with payment status, monthly totals, CSV export
- `CalendarController.getBillingAppointments()` → all confirmed/booked appointments for psychologist

## Email Verification System
Two methods: clickable link (token) + 6-digit code:
- Registration creates `verification_token` + `verification_code` (6 digits)
- `POST /auth/verify-code` — Verify by email + code (public, no auth)
- `POST /auth/resend-verification` — Resend code by email (safe against enumeration)
- Frontend: Login shows inline code input if `EMAIL_NOT_VERIFIED`; Register shows code screen after success

## Psychologist Approval System
Psychologists must be approved by an admin before appearing as active in the platform.

### Flow
1. **Registration**: User registers with role PSYCHOLOGIST → `AuthService.register()` creates `UserEntity` + `PsychologistProfileEntity` with `approved = false`
2. **Admin review**: Admin goes to **Psicólogos tab** in admin panel → sees "Pendientes de aprobación" section below the approved psychologists grid
3. **Click card** → full-page detail view with parsed profile (bio, education, experience, certifications, specializations, languages, interests, links) + Aprobar/Rechazar buttons
4. **Approve** → sets `approved = true`, sends notification + email, psychologist moves to main grid
5. **Reject** → keeps `approved = false`, sets `rejectionReason`, sends notification + email, stays in pending with reason visible
6. **Matching filter**: `MatchingService` only shows approved psychologists to patients

### Key Implementation Details
- **Backend DTO**: `PendingPsychologistDto` in `AdminDtos.java` includes profile fields (bio, languages, linkedinUrl, website, interests) + user fields (avatarUrl, gender, age)
- **Backend query**: `psychologistProfileRepository.findByApprovedFalseOrderByUpdatedAtDesc()`
- **Frontend filtering**: `UsersManager.tsx` filters `pendingUserIds` out of the main psychologist grid
- **JSON parsing**: Profile fields stored as JSON strings; frontend parses with `parseJson()` fallback helper
- **Rejection keeps in pending**: After rejecting, `loadPendingPsychologists()` reloads from backend

## Chat Encryption
- **Algorithm**: AES-256-GCM with 12-byte random IV per message
- **Key derivation**: PBKDF2WithHmacSHA256 (100k iterations, random 32-byte salt per conversation)
- **Salt storage**: `chat_conversations` table with per-conversation salt
- **Backwards compatible**: Decryption tries PBKDF2 key first, falls back to legacy SHA-256 for old messages

## Company / Clinic ERP (en desarrollo — ver ERP_CLINICA.md)
El módulo de empresa está siendo reemplazado por un ERP completo para clínicas. Ver `ERP_CLINICA.md` para el plan detallado.

### Lo que se mantiene
- `CompanyEntity`, `CompanyRepository`, `CompanyAuthService` — base de autenticación
- `RegisterCompany.tsx` — registro de empresa
- Registro de psicólogos por código de referido (`UserEntity.companyId`)

### Lo que se elimina (código obsoleto)
- `CompanyController`, `CompanyService` — endpoints de booking/availability
- `CompanyDashboard.tsx` — UI obsoleta

### Lo que se construye (ERP nuevo)
- `ClinicController` → `GET /clinic/...` (dashboard, psicólogos, pacientes, agenda, billing, invitaciones)
- `ClinicInvitationEntity` + tabla `clinic_invitations` (invitar psicólogos por email con token 7 días)
- `ClinicDashboard.tsx` con tabs: Overview, Psicólogos, Pacientes, Agenda, Facturación, Invitaciones

## Jitsi Video Calls
- **Self-hosted**: docker-compose.yml includes full Jitsi stack (web, prosody, jicofo, jvb)
- **JitsiVideoCall.tsx**: Auto-detects self-hosted vs JaaS (8x8.vc), adjusts script loading and room naming
- **Payment gating**: `JitsiService` blocks calls if appointment not paid

## Security
- **CORS**: Explicit allowed origins (not wildcard), explicit headers/methods, `maxAge(3600)`
- **Rate limiting**: 5 req/min for sensitive endpoints (login, register, verify-code, reset-password), 30/min for general auth
- **IP resolution**: Only trusts `X-Forwarded-For`/`X-Real-IP` from localhost proxies
- **Nginx**: HSTS header, CSP includes Stripe and Jitsi domains, `X-Forwarded-Proto`
- **Permissions-Policy**: camera, microphone, payment restricted to self
- **Chat**: XSS fix — `textContent` instead of `innerHTML` for avatar fallback

## Email Templates (Thymeleaf)
Located in `psicoapp/src/main/resources/templates/email/`:
- `verification.html` — Email verification with 6-digit code + clickable link
- `psychologist-approval.html` — Account approved notification
- `psychologist-rejection.html` — Account rejected with reason
- `appointment-cancellation.html` — Appointment cancelled notification

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

## Deleted Features
- **Group Sessions**: Removed entirely (GroupSessionController, GroupSessionService, GroupSessionEntity, GroupSessionParticipantEntity, GroupSessions.tsx)
- **ProgressDashboard.tsx**: Removed (progress tracking)
- **PSYmatchLogo.tsx**: Removed (standalone logo component)
- **EnhancedAddQuestions.tsx**: Removed (enhanced question UI)
- **TestsList.tsx**: Removed (tests list component)
- **App.css**: Removed (styles in Tailwind/global.css)
- **CompanyController/CompanyService/CompanyDashboard.tsx**: Replaced by new Clinic ERP (see ERP_CLINICA.md)

## Known Critical Issues (Production Blockers)
1. **Secrets hardcoded** in application-prod.yml (Gmail password, Google OAuth fallbacks)
2. **OAuth2 token in URL** (sendRedirect with ?token=) - visible in browser history/logs
3. **No GDPR compliance**: No privacy policy, no consent for health data, no data subject rights endpoints
4. **Health data unencrypted** in DB (mood entries, test results, evaluations)
5. **SQL debug logging in prod** (logs PII)
6. **Hardcoded localhost URLs** in React components (file download links)

## Pending Features
- **GDPR**: Need privacy policy, consent flow, data export/deletion endpoints, DPO assignment
- **Tests**: Question-to-subfactor assignment UI needed for imported tests
- **Missing**: Error boundary (global), .env.production

## Build & Run
- **Maven**: Installed globally at `/c/Program Files (x86)/Apache/Maven/bin/mvn` (no `./mvnw` wrapper)
- **MySQL**: Local at `/c/Program Files/MySQL/MySQL Server 8.4/bin/mysql` (user: root, pass: 1234, db: gantly)
- **Backend compile**: `cd psicoapp && mvn compile`
- **Frontend typecheck**: `cd frontend && npx tsc --noEmit`
- **Frontend dev**: `cd frontend && npm run dev` (Vite on port 5173)
