# Gantly (PsicoApp) - Plataforma de Salud Mental

## Communication Style
- **Respuestas cortas y concisas**. No gastar tiempo en explicaciones largas cuando no son necesarias.
- Usar skills de superpowers y ui-ux-pro-max para todas las tareas relevantes.
- **SIEMPRE usar el skill ui-ux-pro-max para cualquier tarea de frontend** (diseño, componentes, estilos, layouts, rediseños).

## Session Context Files
- Los archivos en `docs/sessions/` contienen el contexto de cada sesion de trabajo.
- **Leer estos archivos al inicio de cada sesion** para retomar el contexto sin perder lo avanzado.
- Formato: `YYYY-MM-DD-<tema>.md`
- Sesiones disponibles:
  - `2026-05-04-audit-y-fixes.md` — Audit completo del codebase + 25 fixes implementados
  - `2026-05-05-landing-page.md` — Rediseño completo de la landing page (12 secciones, i18n, animaciones)

## Project Overview
Plataforma de salud mental que conecta pacientes con psicólogos.
- **Backend**: Spring Boot 3.4.7 (Java 21) en `localhost:8080/api`
- **Frontend**: React 18 + TypeScript + Vite + Tailwind + React Router en `frontend/`
- **Base de datos**: MySQL 8.0 (UTF8MB4)
- **Docker**: `docker-compose.yml` levanta MySQL + Backend + Frontend + Jitsi Meet

## Tech Stack
- **Backend**: Spring Boot 3.4.7, Spring Security, JWT (JJWT 0.11.5), WebSocket STOMP/SockJS, JPA/Hibernate
- **Frontend**: React 18.3.1, TypeScript 5.6.3, Vite 5.4.10, Tailwind 3.4.18, React Router 7, Axios, Framer Motion, i18next, Stripe JS, GSAP, Three.js/@react-three
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
│   ├── Landing (modular):
│   │   ├── Landing.tsx (orchestrator), Navbar.tsx, HeroSection.tsx, Hero3DScene.tsx
│   │   ├── WhatIsGantly.tsx, PatientFlow.tsx, SmartMatching.tsx, VideoChat.tsx
│   │   ├── ForProfessionals.tsx, ForClinics.tsx, TestsPreview.tsx, TrustSecurity.tsx
│   │   ├── FinalCTA.tsx, Footer.tsx
│   │   └── shared/: ScrollReveal, SectionWrapper, GlowCard, TiltCard
│   └── UI: ChatWidget, CalendarWeek, About, Toast, BarChart, FactorChart
├── i18n/                      (ES/EN translations, config imported in main.tsx)
└── assets/                    (SVG logos: logo-gantly.svg, logo-gantly-icon.svg, logo-gantly-double.svg)
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

## Known Issues — Full Audit (Mayo 2026)

### CRITICAL (P0 — Production Blockers)

| # | Sistema | Issue | Archivo clave |
|---|---------|-------|---------------|
| 1 | **Tests** | Fórmulas de factores NUNCA se aplican en scoring (suma simple en vez de parsear `"A+F+H+Q2(-)"`) → todos los factores 16PF/TCA/Ansiedad MAL calculados | `TestResultService.java:140-172` |
| 2 | **Tests** | Tablas Valores de TCA no implementadas (porcentaje lineal en vez de transformación no-lineal Delphos) | `TestResultService.java` |
| 3 | **Auth** | OAuth2 token expuesto en URL hash → visible en historial del navegador | `OAuth2SuccessHandler.java:56` |
| 4 | **Auth** | Secrets hardcodeados en application-prod.yml (Gmail password, Google OAuth) | `application-prod.yml` |
| 5 | **Payments** | Stripe Price IDs hardcodeados en código (no en DB) → si cambian en Stripe, cobra mal | `StripeService.java:64-76` |
| 6 | **Calendar** | Deadline 48h de pago NO se enforcea (no hay scheduled job para expirar citas sin pagar) | `CalendarService.java:245` |
| 7 | **ERP** | Paciente NO puede responder al chat de clínica (solo unidireccional) | `ClinicPatients.tsx` |
| 8 | **Payments** | No hay protección contra webhook replay (notificación duplicada si Stripe reenvía) | `StripeService.java:192` |
| 9 | **Payments** | No hay idempotency token en creación de Stripe session → riesgo de doble cobro | `StripeService.java:109` |
| 10 | **Payments** | Webhook de suscripción se procesa pero NO se persiste en DB → usuario no marcado como premium | `StripeService.java:309` |
| 11 | **GDPR** | Sin privacy policy, sin consentimiento para datos de salud, sin endpoints de eliminación de datos | Global |

### HIGH (P1)

| # | Sistema | Issue |
|---|---------|-------|
| 12 | **ERP** | No hay notificaciones cuando la clínica envía mensaje al paciente |
| 13 | **ERP** | Videollamada bloqueada para citas creadas desde ERP (JitsiService requiere PAID) |
| 14 | **Tasks** | Archivos en `/uploads/tasks/` accesibles sin control de acceso (vulnerabilidad seguridad) |
| 15 | **Matching** | Psicólogos que no pasan filtros aparecen al 15% en vez de excluirse (riesgo con menores) |
| 16 | **Dashboard** | `setEditProfileForm`/`setPasswordForm` usados pero nunca declarados en UserDashboard.tsx → runtime error |
| 17 | **Auth** | Validación password inconsistente: register exige 8 chars, reset acepta 6 |
| 18 | **Auth** | TOTP secret almacenado en plaintext en DB (sin encriptar) |
| 19 | **Auth** | No hay logout / token blacklist (JWT válido 15min tras "cerrar sesión") |
| 20 | **Calendar** | Bug de timezone: servidor usa `ZoneId.systemDefault()` (UTC) vs cliente local |
| 21 | **Calendar** | Race condition en double-booking (sin lock pesimista ni unique constraint) |
| 22 | **Payments** | No se valida que el monto del Stripe session coincida con el precio de la cita |
| 23 | **Chat** | WebSocket sin reconexión con backoff exponencial (usuario debe recargar manualmente) |
| 24 | **ERP** | Nombre de clínica hardcodeado como "Mi Clínica" en PDF de factura |

### MEDIUM (P2)

| # | Sistema | Issue |
|---|---------|-------|
| 25 | **Tests** | Preguntas importadas sin subfactor asignado (inutilizables hasta asignación manual) |
| 26 | **Tests** | TestReport PDF hardcodeado a escala 1-10 (no soporta otros formatos) |
| 27 | **Tests** | TestEntity y EvaluationTestEntity mezclados en queries (arquitectura confusa) |
| 28 | **Tests** | Campo `calculated` en factors nunca leído (dead code) |
| 29 | **Dashboard** | UserDashboard.tsx tiene 1434 líneas y 84+ state variables (necesita refactor) |
| 30 | **Dashboard** | PsychDashboard: memory leaks en test details, billing sin paginación |
| 31 | **Admin** | Búsqueda de usuarios filtra client-side sin paginación backend |
| 32 | **Tasks** | Archivos huérfanos no se limpian al eliminar tareas |
| 33 | **Tasks** | Tarea completada no se puede reabrir |
| 34 | **Chat** | Mensajes almacenados indefinidamente sin política de retención (GDPR) |
| 35 | **Chat** | Sin rate limiting en WebSocket SEND |
| 36 | **Calendar** | Sin cascade delete para AppointmentRequestEntity (registros huérfanos) |
| 37 | **Calendar** | Sin auditoría de operaciones de calendario |
| 38 | **Payments** | Sin cálculo de IVA/impuestos por país (ilegal en UE) |
| 39 | **Payments** | Sin notificación de fallo de pago (solo maneja `checkout.session.completed`) |
| 40 | **ERP** | Chat de clínica sin encriptación (a diferencia del chat user-psychologist con AES-256-GCM) |
| 41 | **ERP** | Sin rate limiting en endpoints de clínica |
| 42 | **ERP** | Sin validación de archivos subidos en backend (solo frontend) |

### Architectural Debt

- **UserDashboard.tsx**: 1434 líneas, 84 state variables → necesita descomposición en componentes + useReducer/Context
- **PsychDashboard.tsx**: ~1000 líneas, mismo problema
- **Appointment status**: strings sueltos ("FREE", "BOOKED", "CONFIRMED"...) sin enum → propenso a errores
- **Payment status**: solo "PENDING"/"PAID", faltan "FAILED"/"REFUNDED"/"CANCELLED"
- **Dos sistemas de tests paralelos**: TestEntity vs EvaluationTestEntity con scoring diferente y queries mezcladas
- **Stripe config**: `@ConfigurationProperties` con validación no implementado
- **File storage**: filesystem local sin backup ni persistencia en Docker

## Pending Features (por prioridad)

### Alta
- Implementar parser/evaluador de fórmulas para factores (TestResultService)
- Implementar tablas Valores TCA (transformación no-lineal)
- Fix OAuth2: usar POST redirect con form auto-submit en vez de token en URL
- Mover secrets a variables de entorno
- Scheduled job para expirar citas sin pagar (48h deadline)
- Chat bidireccional clínica↔paciente (endpoint + UI paciente)
- Notificaciones de chat clínica→paciente

### Media
- Error boundary global
- Auto-asignación de subfactors en import de tests
- Token blacklist / logout real
- Encriptar TOTP secrets con AES-256-GCM
- Mover Stripe Price IDs a DB
- Persistir estado de suscripción en DB tras webhook
- Idempotency tokens en Stripe sessions
- GDPR: privacy policy, consent flow, data export/deletion
- Validación de acceso a archivos de tareas

### Baja
- Refactor UserDashboard/PsychDashboard (descomponer en componentes)
- Paginación backend para usuarios y billing
- Enums para appointment status y payment status
- Cálculo de IVA por país
- Política de retención de mensajes
- Auditoría de operaciones de calendario
- Portal paciente con vista clínica
- Citas recurrentes
- Catálogo de servicios con precios

## Build & Run
- **Maven**: Installed globally at `/c/Program Files (x86)/Apache/Maven/bin/mvn` (no `./mvnw` wrapper)
- **MySQL**: Local at `/c/Program Files/MySQL/MySQL Server 8.4/bin/mysql` (user: root, pass: 1234, db: gantly)
- **Backend compile**: `cd psicoapp && mvn compile`
- **Frontend typecheck**: `cd frontend && npx tsc --noEmit`
- **Frontend dev**: `cd frontend && npm run dev` (Vite on port 5173)
