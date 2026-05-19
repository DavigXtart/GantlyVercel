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
  - `2026-05-06-erp-redesign-y-fixes.md` — ERP ConfigTab + rediseño premium + fix notificaciones + fix calendario 500
  - `2026-05-06-ui-unification.md` — Unificacion UI/UX completa (emojis→Lucide, colores→brand tokens, textos, legacy CSS)
  - `2026-05-10-security-audit.md` — Auditoría de ciberseguridad completa + RGPD + fixes arquitecturales
  - `2026-05-19-formula-scoring.md` — Fix scoring fórmulas factores + percentil Gaussiano TCA
  - `2026-05-19-clinic-erp-redesign.md` — Rediseño completo ERP clínica (7 tabs) a estilo SaaS flat
  - `2026-05-19-12-features-plan.md` — Plan 12 features post-launch (4 waves, **COMPLETADO**)
  - `2026-05-20-ux-audit-verification.md` — Verificación UX/UI audit 26 fixes (ya implementados, tsc clean)

## Project Overview
Plataforma de salud mental que conecta pacientes con psicólogos.
- **Backend**: Spring Boot 3.4.7 (Java 21) en `localhost:8080/api`
- **Frontend**: React 18 + TypeScript + Vite + Tailwind + React Router en `frontend/`
- **Base de datos**: PostgreSQL 17 (migrado desde MySQL, Docker en puerto 5433)
- **Docker**: `docker-compose.yml` levanta PostgreSQL + Backend + Frontend + Jitsi Meet

## Tech Stack
- **Backend**: Spring Boot 3.4.7, Spring Security, JWT (JJWT 0.11.5), WebSocket STOMP/SockJS, JPA/Hibernate
- **Frontend**: React 18.3.1, TypeScript 5.6.3, Vite 5.4.10, Tailwind 3.4.18, React Router 7, Axios, Framer Motion, i18next, Stripe JS, GSAP, Three.js/@react-three
- **DB**: PostgreSQL 17, 26+ entidades JPA, 22+ tablas (migrado de MySQL 8.0)
- **Infra**: Docker (2-stage build), Nginx reverse proxy, Jitsi Meet self-hosted
- **PDF Export**: html2canvas + jsPDF (frontend)
- **Excel Import**: Apache POI 5.2.5 (backend)
- **Payments**: Stripe (subscriptions + single appointment payments)
- **Email**: Resend API (producción) / SMTP (desarrollo)
- **Monitoring**: Sentry (error tracking), Umami (analytics), BetterStack/Logtail (logging)

## Architecture
- Backend: Controllers → Services → Repositories → JPA Entities
- Frontend: App.tsx uses `react-router-dom` declarative routing with `useAuth()` hook and `ProtectedRoute`
- Auth: JWT (15min access + 7d refresh with rotation) + Google OAuth2 (secure code exchange) + email verification (6-digit code)
- Chat: WebSocket STOMP con AES-256-GCM encryption (PBKDF2 key derivation, per-conversation salt) — también chat clínica encriptado
- PII: Field-level encryption at-rest (AES-256-GCM) para email, nombre, TOTP secret
- Roles: USER, PSYCHOLOGIST, ADMIN, EMPRESA

## Key Backend Files
```
psicoapp/src/main/java/com/alvaro/psicoapp/
├── controller/     (20+ controllers: Auth, Admin, Task, Calendar, Chat, Test, Stripe, Jitsi, Matching, Gdpr, Company...)
├── service/        (35+ services: Auth, Email, JWT, Task, Test, Calendar, Chat, Matching, Audit, Stripe, TestImport, Gdpr, PiiEncryption, SecurityBreach, DataRetention, OAuthCodeStore...)
├── domain/         (25+ JPA entities)
├── repository/     (33+ Spring Data repositories)
├── dto/            (23+ DTO classes with validation)
├── security/       (SecurityConfig, JwtAuthFilter, RateLimitFilter, OAuth2SuccessHandler)
├── config/         (JwtConfig, WebSocketConfig, AppTimezone, PiiEncryptConverter, PiiDeterministicConverter)
└── util/           (InputSanitizer, FormulaEvaluator, ReferralCodeUtil)
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
- `PsychBillingTab.tsx`: Filterable table with Base/IVA/Total columns, payment status, monthly totals, CSV export
- `ClinicBilling.tsx`: Same for clinics, PDF invoice with tax data, CSV export with IVA fields
- `CalendarController.getBillingAppointments()` → all confirmed/booked appointments for psychologist

### IVA/Impuestos
- Campos en AppointmentEntity: `taxRate`, `taxAmount`, `totalAmount`, `taxExempt`
- Default: exento IVA (servicio sanitario, Art. 20 LIVA España)
- Clinic agenda: checkbox "IVA exento" + dropdown tasa (21%/10%/4%)
- Stripe cobra `totalAmount` (tax-inclusive) cuando está definido
- BigDecimal para todos los cálculos monetarios

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
- **Clinic chat**: Same AES-256-GCM, key derived from (companyId, patientId), prefixed "ENC:" for backwards compat
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
- **Payment gating**: `JitsiService` blocks calls if Stripe payment required and not PAID. Clinic-created appointments and non-Stripe payment methods (Efectivo) bypass the gate
- **Producción**: Usar Jitsi en VPS EU (Hetzner) para cumplir RGPD, NO meet.jit.si (sin DPA)

## Security (auditoría Mayo 2026)
- **CORS**: Explicit allowed origins (not wildcard), explicit headers/methods, `maxAge(3600)`
- **Rate limiting**: 5 req/min sensitive endpoints, 30/min general auth, per-email verification lockout (5 intentos → 15min lock)
- **Account lockout**: Escalado exponencial (15min → 1h → 4h → 24h), `lockoutCount` en UserEntity
- **Password policy**: Mínimo 10 caracteres + 1 mayúscula + 1 símbolo especial
- **OAuth2**: Secure code exchange (UUID 30s one-time code, no token en URL hash). OAuthCodeStoreService
- **WebSocket**: JWT obligatorio en CONNECT, destination validation (/topic/chat/*, /topic/notifications/*), 10KB max payload, 10 msg/min
- **CSP Header**: `default-src 'self'; script-src 'self' https://js.stripe.com; ...` en SecurityConfig
- **CSRF**: Deshabilitado (correcto para JWT en Authorization header, no cookies)
- **File access**: IDOR fix en FileController — ownership verification antes de servir archivos
- **Token blacklist**: TokenBlacklistService, refresh token rotation (nuevo par en cada refresh)
- **PII encryption**: AES-256-GCM field-level en UserEntity (email determinístico, nombre randomizado, TOTP)
- **InputSanitizer**: Eliminado SQL blacklist (falsos positivos), mantenido XSS + HTML strip
- **Request limits**: Body 2MB, headers 16KB (application.yml)
- **Security breach logging**: SecurityBreachService para rate limit violations y account lockouts
- **Frontend**: safeStorage (localStorage try-catch), Stripe URL whitelist (checkout.stripe.com), form debounce
- **IP resolution**: Only trusts `X-Forwarded-For`/`X-Real-IP` from localhost proxies
- **Nginx**: HSTS header, Permissions-Policy (camera, microphone, payment restricted to self)

## RGPD / GDPR Compliance
- **Consentimiento dual**: Checkbox privacidad + checkbox explícito datos de salud (Art. 9.2.a)
- **Política de privacidad**: Página /privacidad con 14 secciones (base legal salud, retención, brechas)
- **Derecho de acceso**: GET /api/user/export-data — descarga JSON con todos los datos
- **Derecho de supresión**: DELETE /api/user/delete-account — anonimiza PII + elimina datos personales
- **Derecho de rectificación**: Todos los campos PII editables en UserSettingsTab
- **Retención automática**: Job diario 3AM — cuentas no verificadas (30d), notificaciones (90d), cuentas borradas (30d)
- **Banner storage consent**: CookieBanner global (almacenamiento local, no cookies de seguimiento)
- **Pendiente (no código)**: DPAs con proveedores, DPIA, registro actividades de tratamiento, DPO, Jitsi en VPS EU

## Email System (Resend + SMTP)
- **Provider dual**: `EmailService` usa Resend API cuando `RESEND_API_KEY` está configurado, SMTP como fallback
- **Resend config**: `app.email.resend-api-key`, `app.email.from` (noreply@gantly.com), `app.email.from-name` (Gantly)
- **SMTP config**: `spring.mail.host/port/username/password` (Gmail)
- **Templates**: Thymeleaf — el HTML renderizado es idéntico independientemente del proveedor
- **Selección automática**: `@PostConstruct logProvider()` informa qué proveedor está activo
- **Dependency**: `com.resend:resend-java:3.1.0`

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
- **Factors**: Higher-level aggregations. Defined by formulas referencing subfactor codes (e.g., `"A+F+N(-)+Q2(-)"`)
- **Formula evaluation**: `FormulaEvaluator` parses formulas (parenthesis-aware splitting) and resolves terms against subfactor/factor score maps
- **Two-pass evaluation**: Pass 1 = factors referencing only subfactors (TCP, Ansiedad, TCA INV/IV). Pass 2 = factors referencing other factors (TCA IG=INV+IV)
- **Fallback**: Factors without formula use simple sum of child subfactors (backwards compat)
- **Bipolar labels**: `min_label` / `max_label` on subfactors and factors (e.g., "Reservado" / "Abierto")
- **Inverse items**: `questions.inverse = true` reverses scoring: `score = maxValue - answerValue`
- **Percentage (personality)**: `(totalScore / maxScore) * 100` — TCP, Ansiedad
- **Percentile (aptitude)**: Gaussian CDF approximation (Abramowitz & Stegun, mean=max/2, stddev=max/6) — TCA. Clamped [1, 99]
- **Test category**: `TestEntity.category` stores test type ("tcp"/"tca"/"ansiedad"/"generic") set during import. TCA triggers Gaussian percentile mode

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
- `V39__add_lockout_count.sql` - Adds `lockout_count` for escalated account lockout
- `V40__gdpr_consent_fields.sql` - Adds `gdpr_consent_at`, `gdpr_consent_version`
- `V41__pii_encryption_columns.sql` - Widens email/name columns to VARCHAR(500) for encrypted values
- `V42__prevent_double_booking.sql` - Partial unique index on appointments(psychologist_id, start_time)
- `V43__encrypt_totp_secret.sql` - Widens totp_secret to VARCHAR(500) for encryption
- `V44__add_tax_fields.sql` - Adds tax_rate, tax_amount, total_amount, tax_exempt to appointments
- `V45__health_data_consent.sql` - Adds `health_data_consent_at` for Art. 9 RGPD

## Deleted Features
- **Group Sessions**: Removed entirely (GroupSessionController, GroupSessionService, GroupSessionEntity, GroupSessionParticipantEntity, GroupSessions.tsx)
- **ProgressDashboard.tsx**: Removed (progress tracking)
- **PSYmatchLogo.tsx**: Removed (standalone logo component)
- **EnhancedAddQuestions.tsx**: Removed (enhanced question UI)
- **TestsList.tsx**: Removed (tests list component)
- **App.css**: Removed (styles in Tailwind/global.css)
- **CompanyController/CompanyService/CompanyDashboard.tsx**: Replaced by new Clinic ERP (see ERP_CLINICA.md)

## Known Issues — Audit (Mayo 2026, actualizado 20 Mayo)

### CRITICAL (P0 — Production Blockers)

| # | Sistema | Issue | Estado |
|---|---------|-------|--------|
| 1 | **Tests** | Fórmulas de factores NUNCA se aplican en scoring → factores MAL calculados | **RESUELTO** — FormulaEvaluator + two-pass evaluation |
| 2 | **Tests** | Tablas Valores TCA no implementadas (transformación no-lineal Delphos) | **RESUELTO** — Aproximación Gaussiana (CDF normal, Abramowitz & Stegun) |
| 3 | **Auth** | OAuth2 token expuesto en URL hash | **RESUELTO** — code exchange UUID 30s |
| 4 | **Auth** | Secrets hardcodeados en application-prod.yml | **PENDIENTE** — mover a env vars en deploy |
| 5 | **Payments** | Stripe Price IDs hardcodeados en código | **PENDIENTE** — requiere config Stripe |
| 6 | **Calendar** | Deadline 48h no se enforcea | **RESUELTO** — AppointmentSchedulerService cada hora |
| 7 | **ERP** | Chat clínica solo unidireccional | **RESUELTO** — UserClinicChatTab funcional |
| 8 | **Payments** | Sin protección webhook replay | **PENDIENTE** — requiere tabla stripe_events |
| 9 | **Payments** | Sin idempotency en subscription checkout | **PENDIENTE** — requiere config Stripe |
| 10 | **Payments** | Suscripción webhook no persiste en DB | **PENDIENTE** — requiere config Stripe |
| 11 | **GDPR** | Sin privacy policy ni consentimiento salud | **RESUELTO** — RGPD completo |

### HIGH (P1)

| # | Sistema | Issue | Estado |
|---|---------|-------|--------|
| 12 | **ERP** | Sin notificaciones chat clínica→paciente | **RESUELTO** — ya existía + icono Building2 |
| 13 | **ERP** | Videollamada bloqueada en citas ERP | **RESUELTO** — bypass para clínica/efectivo |
| 14 | **Tasks** | Archivos sin control de acceso | **RESUELTO** — IDOR fix en FileController |
| 15 | **Matching** | Psicólogos 15% en vez de excluirse (menores) | **RESUELTO** — hard exclude + zero floor |
| 17 | **Auth** | Password inconsistente | **RESUELTO** — 10 chars + mayúscula + símbolo |
| 18 | **Auth** | TOTP secret plaintext | **RESUELTO** — PiiEncryptConverter |
| 19 | **Auth** | Sin logout / token blacklist | **RESUELTO** — blacklist + refresh rotation |
| 20 | **Calendar** | Bug timezone UTC vs local | **RESUELTO** — AppTimezone Europe/Madrid |
| 21 | **Calendar** | Double-booking race condition | **RESUELTO** — unique index + validación |
| 23 | **Chat** | WebSocket sin reconexión backoff | **RESUELTO** — exponential backoff 3→60s + random jitter |
| 24 | **ERP** | Clínica hardcodeada en PDF | **PENDIENTE** |

### MEDIUM (P2) — Pendientes

| # | Sistema | Issue |
|---|---------|-------|
| 25 | **Tests** | Preguntas importadas sin subfactor asignado |
| 26 | **Tests** | ~~TestReport PDF solo escala 1-10~~ → **RESUELTO** — PercentageScaleTable para factors sin bipolar labels |
| 27 | **Tests** | TestEntity vs EvaluationTestEntity mezclados |
| 29 | **Dashboard** | ~~UserDashboard.tsx muy grande~~ → **RESUELTO** — 14 tabs extraídos, 609 líneas shell |
| 32 | **Tasks** | ~~Archivos huérfanos no se limpian al eliminar~~ → **RESUELTO** — DELETE endpoint + file cleanup |
| 33 | **Tasks** | ~~Tarea completada no se puede reabrir~~ → **RESUELTO** — PUT /tasks/{id}/reopen |
| 34 | **Chat** | ~~Sin retención~~ → **RESUELTO** — DataRetentionService diario 3AM |
| 35 | **Chat** | ~~Sin rate limiting WebSocket~~ → **RESUELTO** — 10 msg/min + 10KB |
| 36 | **Calendar** | ~~Sin cascade delete AppointmentRequest~~ → **RESUELTO** — CascadeType.REMOVE + orphanRemoval |
| 38 | **Payments** | ~~Sin IVA~~ → **RESUELTO** — campos tax en appointment |
| 39 | **Payments** | ~~Sin notificación de fallo de pago~~ → **RESUELTO** — StripeService.handlePaymentFailed() + NotificationService |
| 40 | **ERP** | ~~Chat sin encriptación~~ → **RESUELTO** — AES-256-GCM |

### Architectural Debt

- ~~**Appointment status**: strings sueltos sin enum~~ → **RESUELTO** — `AppointmentStatusEnum` (FREE/REQUESTED/CONFIRMED/BOOKED/CANCELLED)
- ~~**Payment status**: solo "PENDING"/"PAID"~~ → **RESUELTO** — `PaymentStatusEnum` (PENDING/PAID/EXPIRED/FAILED/REFUNDED/CANCELLED)
- ~~**Request status**: strings sueltos~~ → **RESUELTO** — `RequestStatusEnum` (PENDING/CONFIRMED/REJECTED)
- **Dos sistemas de tests paralelos**: TestEntity vs EvaluationTestEntity
- **Stripe config**: `@ConfigurationProperties` con validación no implementado
- **File storage**: filesystem local → migrar a Supabase Storage en deploy

## Pending Features (por prioridad)

### Alta (bloqueantes para producción)
- ~~Implementar parser/evaluador de fórmulas para factores~~ → **HECHO** — FormulaEvaluator + two-pass
- ~~Implementar tablas Valores TCA~~ → **HECHO** — Aproximación Gaussiana (reemplazable por baremos reales si se obtienen)
- Mover secrets a variables de entorno (al deployar en Render)
- Stripe: webhook replay protection + idempotency + persistir suscripción

### Media
- ~~Error boundary global~~ → **YA EXISTÍA** — Sentry ErrorBoundary en App.tsx
- Auto-asignación de subfactors en import de tests
- Mover Stripe Price IDs a DB
- ~~Nombre de clínica dinámico en PDF factura~~ → **YA EXISTÍA** — clinicInfo?.name, solo fallback 'Clínica'
- ~~Notificación de fallo de pago~~ → **YA EXISTÍA** — StripeService.handlePaymentFailed()
- Datos fiscales clínica (NIF, dirección) dinámicos en PDF factura (actualmente hardcodeados)

### Baja (post-launch) — COMPLETADAS
- ~~Refactor UserDashboard/PsychDashboard~~ → **HECHO** — 2013→728 líneas, 6 tabs extraídos
- ~~Enums para appointment/payment status~~ → **HECHO** — AppointmentStatusEnum, PaymentStatusEnum, RequestStatusEnum
- ~~Auditoría de operaciones de calendario~~ → **HECHO** — AuditLogEntity + AuditLogViewer
- ~~Citas recurrentes~~ → **HECHO** — ClinicAgenda + ClinicService recurrence
- ~~Catálogo de servicios con precios~~ → **HECHO** — servicios dinámicos en agendas
- ~~Recordatorios automáticos de cita (email 24h antes)~~ → **HECHO** — AppointmentReminderService
- ~~Portal paciente — vista clínica~~ → **HECHO** — UserClinicPortalTab completo
- ~~Página pública clínica con reserva online~~ → **HECHO** — /clinica/:slug
- ~~Lista de espera~~ → **HECHO** — WaitingListEntity + ClinicWaitingList UI
- ~~Multi-administrador clínica~~ → **HECHO** — ClinicAdminEntity
- ~~Facturación aseguradoras~~ → **HECHO** — InsuranceCompanyEntity + policies
- ~~Firma digital consentimientos~~ → **HECHO** — SignaturePad + consent tabs
- ~~Gestión bajas/ausencias psicólogo~~ → **HECHO** — diagonal stripes + notificaciones
- ~~UX/UI Audit 26 fixes~~ → **HECHO** — Modal, ConfirmDialog, ARIA, responsive, confirm()→ConfirmDialog, rounded-2xl, focus rings

## MCP Servers
- **Playwright**: Browser automation para testing E2E. Configurado con `claude mcp add playwright -- npx @playwright/mcp@latest`
  - Permite navegar, hacer click, rellenar formularios, hacer screenshots
  - Requiere reiniciar sesion de Claude Code para activarse
  - Requiere backend (localhost:8080) y frontend (localhost:5173) corriendo
  - Flujos a testear: registro (paciente/psicologo/clinica), login, test inicial, matching, citas, chat, tareas, ERP

## UI Design System (unificado Mayo 2026)
- **Colores**: gantly-blue (#2E93CC), gantly-cyan (#22D3EE), gantly-navy (#0A1628), gantly-gold (#F0C930), gantly-emerald (#059669)
- **Iconos**: Lucide React (NO emojis como iconos UI). Emojis solo para mood picker y ratings
- **Cards**: `bg-white rounded-2xl border border-slate-200/80` (todas las cards usan rounded-2xl tras audit)
- **Card headers**: `px-5 py-3 border-b border-slate-100` con icono + título
- **Inputs**: `h-9 px-3 rounded-md border border-slate-200` (compact SaaS style)
- **Buttons**: flat `bg-gantly-blue text-white rounded-md` (NO gradients)
- **Labels**: `text-[11px] text-slate-500` para texto secundario
- **Contraste minimo**: text-slate-500 para texto secundario legible (NO text-slate-400)
- **Fuentes**: Outfit (heading), Work Sans (body), Caveat (handwritten)
- **Legacy CSS eliminado**: .btn, .form-group, .admin-container → Tailwind utilities
- **Clinic ERP**: 7 tabs rediseñados a estilo SaaS flat (sin gradients, sin shadow-soft, sin ALL CAPS headers)
- **Modal**: `components/ui/Modal.tsx` — role="dialog", aria-modal, focus trap, Escape, backdrop click, z-[1000]
- **ConfirmDialog**: `components/ui/ConfirmDialog.tsx` — variants danger/warning/info, loading state (reemplaza confirm())
- **Accesibilidad**: role="tablist/tab/tabpanel", aria-selected, aria-controls, aria-labelledby, aria-expanded en todos los componentes
- **Focus rings**: `focus:outline-none focus:ring-2 focus:ring-gantly-blue/20` (botones), `focus:ring-1` (inputs)
- **Responsive**: flex-col sm:flex-row en sidebars, hidden md:grid + md:hidden para grids complejas
- **Touch targets**: min-h-[44px] en elementos interactivos móviles
- **confirm() nativo**: Eliminado — 0 usos en frontend/src/components (todo usa ConfirmDialog)

## PII Encryption System
- **PiiEncryptionService**: AES-256-GCM con clave derivada de `PII_ENCRYPTION_KEY` env var
- **PiiEncryptConverter**: JPA AttributeConverter para encriptación randomizada (nombre). Prefijo "ENC:"
- **PiiDeterministicConverter**: JPA AttributeConverter para encriptación determinística (email). Prefijo "DENC:" — permite findByEmail y unique constraint
- **Campos encriptados**: email (determinístico), name (randomizado), totpSecret (randomizado)
- **Backwards compatible**: Valores sin prefijo se devuelven tal cual (plaintext). Se encriptan automáticamente en el siguiente save
- **Key config**: `app.pii.encryption-key` en application.yml (default dev key, cambiar en producción)

## Matching System
- **MatchingService**: Calcula afinidad paciente-psicólogo basado en múltiples criterios
- **Hard exclusion filters**: Menores (<18 años) NUNCA se asignan a psicólogos sin experiencia con menores
- **Approved only**: Solo psicólogos con `approved = true` aparecen en resultados
- **Zero floor**: Sin score mínimo artificial — si no hay match, score = 0 y se excluye

## Appointment System
- **Double-booking prevention**: Partial unique index en (psychologist_id, start_time) para status BOOKED/CONFIRMED
- **48h expiration**: AppointmentSchedulerService expira citas sin pagar cada hora (con notificación al paciente)
- **Timezone**: AppTimezone.APP_ZONE = Europe/Madrid centralizado en todos los servicios
- **Tax fields**: taxRate, taxAmount, totalAmount, taxExempt — default exento (sanitario)

## Monitoring & Observability

### Sentry (Error Tracking)
- **Backend**: `sentry-spring-boot-starter-jakarta` + `sentry-logback` (7.14.0)
- **Frontend**: `@sentry/react` init en `main.tsx` con guard `VITE_SENTRY_DSN`
- **Config**: `sentry.dsn`, `sentry.environment`, `sentry.traces-sample-rate` (0.1 dev, 0.2 prod)
- **PII**: `send-default-pii: false` (RGPD compliant)
- **Env vars**: `SENTRY_DSN` (backend), `VITE_SENTRY_DSN` (frontend)

### Umami (Analytics)
- **Script**: Cargado dinámicamente en `main.tsx` si `VITE_UMAMI_WEBSITE_ID` está definido
- **Server**: Self-hosted o Umami Cloud (cloud.umami.is)
- **RGPD**: No usa cookies, no requiere consentimiento
- **Custom events**: `trackEvent()` en `frontend/src/utils/analytics.ts`
- **Eventos trackeados**: `register` (con role), `login`, `checkout_started`, `appointment_checkout_started`
- **Env vars**: `VITE_UMAMI_WEBSITE_ID`, `VITE_UMAMI_SRC` (URL del script)

### BetterStack / Logtail (Logging centralizado)
- **Dependency**: `com.logtail:logback-logtail:0.3.4`
- **Config**: Appender en `logback-spring.xml`, solo perfil `prod`
- **Env var**: `BETTERSTACK_SOURCE_TOKEN` (en application.yml como `app.betterstack.source-token`)
- **Formato**: JSON structurado (timestamp, level, logger, thread, message)

## Deploy Plan (Supabase + Render)

| Componente | Servicio | Región | Coste |
|-----------|----------|--------|-------|
| Frontend (React) | Vercel | Auto | Gratis |
| Backend (Spring Boot) | Render | Frankfurt EU | ~7$/mes |
| Base de datos (PostgreSQL) | Supabase | eu-central-1 | Gratis hasta 500MB |
| Videollamadas (Jitsi) | Hetzner VPS | Falkenstein DE | ~5€/mes |
| Archivos (avatars, docs) | Supabase Storage | eu-central-1 | Incluido |

### Env vars necesarias en Render (backend)
- `DB_PASSWORD`, `DB_URL` — Supabase PostgreSQL connection
- `JWT_SECRET` — secreto para firmar tokens
- `PII_ENCRYPTION_KEY` — clave para encriptación PII (32+ chars)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — Stripe API
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — Google OAuth2
- `RESEND_API_KEY` — Resend email API (reemplaza SMTP en prod)
- `SENTRY_DSN` — Sentry error tracking
- `BETTERSTACK_SOURCE_TOKEN` — BetterStack/Logtail logging
- `FRONTEND_URL` — URL del frontend para CORS y redirects

### Env vars necesarias en Vercel (frontend)
- `VITE_SENTRY_DSN` — Sentry error tracking frontend
- `VITE_UMAMI_WEBSITE_ID` — Umami analytics website ID
- `VITE_UMAMI_SRC` — Umami script URL (default: https://cloud.umami.is/script.js)

### Tareas de deploy (no código)
- Firmar DPAs con Supabase, Render, Stripe (descargar de sus webs)
- DPIA (Evaluación de Impacto) — documento legal obligatorio para datos de salud
- Registro de actividades de tratamiento (Art. 30 RGPD)
- Configurar Jitsi en VPS EU con dominio propio (video.gantly.com)

## Build & Run
- **Maven**: Installed globally at `/c/Program Files (x86)/Apache/Maven/bin/mvn` (no `./mvnw` wrapper)
- **PostgreSQL**: Docker container `postgres_gantly` en puerto 5433 (user: gantly, pass: gantly, db: gantly)
- **Backend compile**: `cd psicoapp && mvn compile`
- **Frontend typecheck**: `cd frontend && npx tsc --noEmit`
- **Frontend dev**: `cd frontend && npm run dev` (Vite on port 5173)
- **Migration scripts**: `migration/export_mysql.sh` + `migration/import_to_postgres.py`
