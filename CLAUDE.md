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
├── config/         (JwtConfig, WebSocketConfig, AppTimezone, PiiEncryptConverter, PiiDeterministicConverter, StripeProperties)
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

### Stripe Hardening (Mayo 2026)
- **Webhook replay protection**: `stripe_events` table + `StripeEventEntity` — dedup by event ID before processing
- **Subscription idempotency**: `RequestOptions.idempotencyKey("sub-" + userId + "-" + priceId)` en `createCheckoutSession()`
- **Customer ID persistence**: `stripeCustomerId` en `UserSubscriptionEntity` — set en handleSubscriptionCreated/Updated
- **Price IDs externalizados**: `StripeProperties` (`@ConfigurationProperties(prefix="stripe")`) con `prices.basic/premium/enterprise.monthly/yearly`
- **Config**: `application-local.yml` tiene IDs hardcodeados, `application-prod.yml` usa `${STRIPE_PRICE_BASIC_MONTHLY:}` etc.

### Datos Fiscales Clínica
- **CompanyEntity**: `razonSocial` (VARCHAR 300), `direccionFiscal` (VARCHAR 500)
- **ClinicService**: DTOs `ClinicMeDto` + `UpdateClinicInfoRequest` incluyen ambos campos
- **ClinicDashboard.tsx**: Inputs en Config tab tras NIF
- **ClinicBilling.tsx PDF**: Header = brand name, body = `razonSocial || clinicName`, address = `direccionFiscal || clinicAddress`

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
- `V57__stripe_events_table.sql` - Webhook replay protection (stripe_events table)
- `V58__add_stripe_customer_id.sql` - Adds `stripe_customer_id` to user_subscriptions
- `V59__add_fiscal_fields.sql` - Adds `razon_social`, `direccion_fiscal` to companies

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
| 5 | **Payments** | Stripe Price IDs hardcodeados en código | **RESUELTO** — StripeProperties @ConfigurationProperties + yml |
| 6 | **Calendar** | Deadline 48h no se enforcea | **RESUELTO** — AppointmentSchedulerService cada hora |
| 7 | **ERP** | Chat clínica solo unidireccional | **RESUELTO** — UserClinicChatTab funcional |
| 8 | **Payments** | Sin protección webhook replay | **RESUELTO** — StripeEventEntity + dedup en handleWebhook |
| 9 | **Payments** | Sin idempotency en subscription checkout | **RESUELTO** — RequestOptions idempotency key sub-{userId}-{priceId} |
| 10 | **Payments** | Suscripción webhook no persiste en DB | **RESUELTO** — stripeCustomerId en UserSubscriptionEntity |
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
| 24 | **ERP** | Clínica hardcodeada en PDF | **RESUELTO** — razonSocial + direccionFiscal en CompanyEntity + PDF |

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
- ~~**Stripe config**: `@ConfigurationProperties` con validación no implementado~~ → **RESUELTO** — StripeProperties
- **File storage**: filesystem local → migrar a Supabase Storage en deploy

## Auditoría Psicólogo/UX — Mayo 2026

### P0 — Bloqueantes clínicos (antes de producción)

| # | Área | Issue | Detalle |
|---|------|-------|---------|
| UX-1 | **Clínica** | Sin notas de sesión | Psicólogo NO puede documentar sesiones. `AppointmentEntity.notes` existe (500 chars) pero NO hay UI. Incumple requisito legal de historial clínico (Ley 41/2002 Art. 5) |
| UX-2 | **Clínica** | Sin plan de tratamiento | No hay objetivos terapéuticos, duración estimada, línea base + seguimiento. Solo tasks ad-hoc |
| UX-3 | **Psicólogo** | Aprobación sin re-envío | Psicólogo rechazado ve razón pero NO puede editar y re-enviar perfil. Flujo termina en dead-end |
| UX-4 | **Paciente** | Sin historial de sesiones | Paciente no puede ver notas de sesiones pasadas (prepararse para siguiente) |
| UX-5 | **ERP** | Multi-admin parcial | ClinicAdminEntity existe pero UI de gestión de admins no está completa |

### P1 — Gaps importantes (primer sprint post-launch)

| # | Área | Issue | Detalle |
|---|------|-------|---------|
| UX-6 | **Paciente** | Mood tracking enterrado | Diario de ánimo en tab "Agenda Personal" — debería ser accesible desde home con 1 tap |
| UX-7 | **Paciente** | Status cita confuso | Calendario no diferencia visualmente: por confirmar / confirmada / pago pendiente / pagada / lista para video |
| UX-8 | **Paciente** | Sin notas pre-cita | Psicólogo no puede escribir "Nos centraremos en X" visible para paciente antes de sesión |
| UX-9 | **Psicólogo** | Chat sin contexto paciente | En chat no se ve resumen del paciente (edad, motivo, última sesión). Debe salir a otra tab |
| UX-10 | **Psicólogo** | Sin búsqueda de pacientes | Con 50+ pacientes, solo scroll. Falta buscador por nombre |
| UX-11 | **Psicólogo** | Facturación sin PDF | Solo export CSV. Falta factura PDF con membrete, desglose IVA, datos fiscales |
| UX-12 | **ERP** | Chat clínica→paciente unidireccional | Clínica envía mensaje pero paciente no puede responder (UserClinicChatTab existe pero UX poco clara) |
| UX-13 | **ERP** | Sin métricas por psicólogo | Director no puede ver carga de trabajo, satisfacción, facturación individual |
| UX-14 | **Psicólogo** | Intake form incompleto | Falta: contacto emergencia, aseguradora, fuente referido, motivo consulta |
| UX-15 | **Psicólogo** | Sin outcome measures en flujo clínico | Debería asignar GAD-7/PHQ-9 como baseline día 1 y comparar al alta |
| UX-16 | **Paciente** | Sin reagendar cita | Solo puede cancelar + re-reservar. Debería ser un click |
| UX-17 | **Psicólogo** | Calendario sin nombres de pacientes | Al crear slots en bloque, no se ve qué paciente reservó qué slot |

### P2 — Mejoras de usabilidad (post-MVP)

| # | Área | Issue |
|---|------|-------|
| UX-18 | **Paciente** | 15 tabs en dashboard — reorganizar por fases (Inicio, Chat/Tests/Tareas, Citas, Informes, Config) |
| UX-19 | **Paciente** | Tests vs Evaluaciones — terminología confusa (unificar en "Valoraciones") |
| UX-20 | **Psicólogo** | Edición perfil abrumadora — arrays de educación/certificaciones/experiencia en un solo form |
| UX-21 | **ERP** | Página pública clínica mínima — falta: servicios detallados, FAQ, formulario de contacto |
| UX-22 | **ERP** | Lista espera básica — falta: notificación automática, prioridad, tiempo estimado |
| UX-23 | **ERP** | Sin reportes — revenue por mes/servicio/psicólogo solo via CSV manual |
| UX-24 | **Todos** | Sin integración calendario externo (iCal, Google Calendar) |
| UX-25 | **Todos** | Sin dark mode (accesibilidad para baja visión) |
| UX-26 | **ERP** | Servicios precio global — no per-psicólogo (senior puede cobrar más) |

### P3 — Polish (futuro)

- Terapia de grupo (actualmente solo 1:1)
- Modo supervisor para psicólogos en formación
- App móvil nativa para psicólogos
- Biblioteca de recursos terapéuticos compartibles
- SMS/WhatsApp para recordatorios (email actual a veces va a spam)
- Plantillas de cita ("evaluación inicial 90min", "seguimiento 50min")
- Exportación HL7/FHIR para interoperabilidad con otros EHR

## Auditoría RGPD/Legal — Mayo 2026

### CRITICAL (P0 — Antes de producción)

| # | Área | Issue | Detalle | Riesgo legal |
|---|------|-------|---------|--------------|
| RGPD-1 | **Cifrado** | PII encryption DESACTIVADA | `@Convert` comentado en UserEntity → nombre, email, TOTP en **plaintext** en DB. Implementación existe pero no está activa | RGPD Art. 32 — multa hasta 10M€ |
| RGPD-2 | **Consentimiento** | Sin retirada de consentimiento Art. 9 | Privacy Policy dice "puede retirar desde Privacidad" pero UI NO existe. No hay endpoint | RGPD Art. 7.3 — derecho fundamental |
| RGPD-3 | **Borrado** | Eliminación de cuenta incompleta | `DELETE /user/delete-account` no borra: ChatMessageEntity, UserPsychologistEntity, AssignedTestEntity, ClinicInvitationEntity | RGPD Art. 17 — derecho al olvido |
| RGPD-4 | **DPAs** | Sin DPAs con sub-procesadores | Stripe, Google, Sentry, Resend, Supabase, Render — ningún DPA firmado | RGPD Art. 28 — transferencia ilegal |
| RGPD-5 | **Email** | Resend (USA) para emails con datos de salud | Contenido de emails (citas, tests) contiene datos sensibles enviados a servidor USA sin DPA | RGPD Art. 46 — transferencia internacional |

### HIGH (P1 — Primer mes)

| # | Área | Issue | Detalle |
|---|------|-------|---------|
| RGPD-6 | **Logs** | API access sin auditar | No se loguea quién accede a qué endpoint. Admin podría ver datos de pacientes sin registro |
| RGPD-7 | **Menores** | Consentimiento tutor incompleto | ConsentRequestEntity existe pero flujo guardian consent NO implementado (ni endpoint ni UI) |
| RGPD-8 | **Export** | GDPR export incompleto | `GET /user/export-data` NO incluye: chat messages, clinic patient documents |
| RGPD-9 | **Logs** | PII en logs | Email aparece en logs como `user {}`. Si logs comprometidos → filtración PII |
| RGPD-10 | **Archivos** | Avatars/archivos sin cifrar | `/uploads/avatars/`, `/uploads/tasks/` en plaintext en filesystem |
| RGPD-11 | **Stripe** | stripeSessionId almacenado indefinidamente | Debería borrarse 30 días post-pago (PCI scope reduction) |

### MEDIUM (P2 — Antes de escalar)

| # | Área | Issue |
|---|------|-------|
| RGPD-12 | Consentimiento versión — sin re-consentimiento al actualizar política |
| RGPD-13 | Audit logs sin purga automática — retención 2 años no implementada |
| RGPD-14 | Logs locales sin cifrar — `logs/psicoapp.log` plaintext |
| RGPD-15 | Umami analytics auto-enabled — tracking sin opt-in explícito |
| RGPD-16 | Google OAuth scope demasiado amplio — pide email+profile+openid, solo necesita email |
| RGPD-17 | File downloads sin auditar — FileController no registra quién descarga qué |
| RGPD-18 | Chat decryption failures sin alertar — intento de descifrar chat ajeno no se detecta |

### Compliant (lo que SÍ está bien)

- ✅ Doble consentimiento en registro (RGPD + datos de salud Art. 9)
- ✅ Timestamps de consentimiento en DB
- ✅ Chat AES-256-GCM con PBKDF2 (100k iteraciones, salt por conversación)
- ✅ HTTPS obligatorio en prod + HSTS 1 año
- ✅ CSP headers configurados
- ✅ Rate limiting (5 req/min sensitive, 30/min auth)
- ✅ Account lockout escalado (15min → 1h → 4h → 24h)
- ✅ Password policy (10 chars + mayúscula + símbolo)
- ✅ OAuth2 code exchange (no token en URL)
- ✅ Token blacklist + refresh rotation
- ✅ IDOR fix en FileController (ownership check)
- ✅ WebSocket auth + destination validation
- ✅ DataRetentionService (cuentas no verificadas 30d, notificaciones 90d)
- ✅ Sentry `send-default-pii: false`
- ✅ Política de privacidad 14 secciones (base legal salud, retención, brechas)
- ✅ `GET /user/export-data` + `DELETE /user/delete-account`

### DPAs necesarios (no código)

| Proveedor | Tipo | URL DPA | Prioridad |
|-----------|------|---------|-----------|
| Stripe | Pagos | stripe.com/legal/dpa | P0 |
| Supabase | DB + Storage | supabase.com/governance/supabase_dpa.pdf | P0 |
| Render | Backend hosting | render.com/legal/dpa | P0 |
| Google | OAuth2 | Google Cloud Console | P1 |
| Sentry | Error tracking | sentry.io/legal/dpa | P1 |
| Resend | Email | resend.com/legal → NO USAR para datos salud, cambiar a SMTP EU | P0 |
| Hetzner | Jitsi VPS | hetzner.com/legal/dpa | P1 |

## Pending Features (por prioridad)

### Alta (bloqueantes para producción)
- ~~Implementar parser/evaluador de fórmulas para factores~~ → **HECHO** — FormulaEvaluator + two-pass
- ~~Implementar tablas Valores TCA~~ → **HECHO** — Aproximación Gaussiana (reemplazable por baremos reales si se obtienen)
- Mover secrets a variables de entorno (al deployar en Render)
- ~~Stripe: webhook replay protection + idempotency + persistir suscripción~~ → **HECHO** — StripeEventEntity + idempotency key + stripeCustomerId
- **Activar PII encryption** en UserEntity (descomentar @Convert, migrar datos existentes) → RGPD-1
- **Notas de sesión UI** para psicólogos (AppointmentEntity.notes ya existe, falta frontend) → UX-1
- **Completar borrado de cuenta** (cascade delete chat, relaciones, tests asignados) → RGPD-3
- **Firmar DPAs** con Stripe, Supabase, Render (descargar de sus webs) → RGPD-4
- **NO usar Resend para emails con datos de salud** — cambiar a SMTP EU → RGPD-5

### Media
- ~~Error boundary global~~ → **YA EXISTÍA** — Sentry ErrorBoundary en App.tsx
- Auto-asignación de subfactors en import de tests
- Crear OG image 1200x630px (actualmente usa iconoGantly.png)
- Registrar Google Search Console + enviar sitemap
- Blog / contenido SEO (footer enlaza a "#")
- ~~Mover Stripe Price IDs a config~~ → **HECHO** — StripeProperties + application-local/prod.yml
- ~~Nombre de clínica dinámico en PDF factura~~ → **YA EXISTÍA** — clinicInfo?.name, solo fallback 'Clínica'
- ~~Notificación de fallo de pago~~ → **YA EXISTÍA** — StripeService.handlePaymentFailed()
- ~~Datos fiscales clínica (NIF, dirección) dinámicos en PDF factura (actualmente hardcodeados)~~ → **HECHO** — razonSocial + direccionFiscal en CompanyEntity
- Implementar retirada de consentimiento Art. 9 (UI + endpoint) → RGPD-2
- Completar export GDPR (añadir chat messages, clinic docs) → RGPD-8
- Redactar PII en logs (email → `user@...com`) → RGPD-9
- Flujo consentimiento tutor para menores → RGPD-7
- Factura PDF para psicólogos (membrete + IVA) → UX-11
- Status visual de citas en calendario (badges color) → UX-7
- Buscador de pacientes para psicólogos → UX-10
- Re-envío perfil psicólogo tras rechazo → UX-3

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

## SEO & Posicionamiento (implementado Mayo 2026)
- **react-helmet-async**: HelmetProvider en `main.tsx`, componente `SEO.tsx` reutilizable
- **Per-page meta tags**: Title, description, canonical, og:*, twitter:* únicos por ruta pública
- **JSON-LD**: Organization, MedicalBusiness, WebApplication, FAQPage (6 preguntas), SoftwareApplication, BreadcrumbList, MedicalClinic (dinámico para /clinica/:slug)
- **Open Graph**: `summary_large_image`, image dimensions, site_name, locale ES/EN
- **Hreflang**: `es`, `en`, `x-default` en Helmet + sitemap.xml
- **robots.txt**: Bloquea auth/test/dashboard pages, permite públicas
- **sitemap.xml**: 6 URLs públicas con lastmod + hreflang xhtml:link
- **noindex**: Login, Register (evitar crawl budget en auth pages)
- **Keywords**: 12 términos clave en index.html (psicólogo online, terapia online, test personalidad, etc.)
- **Componente**: `frontend/src/components/seo/SEO.tsx` — exports: SEO (default), organizationSchema, medicalBusinessSchema, webAppSchema, faqSchema, softwareAppSchema, breadcrumbSchema()

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

### Tareas SEO (no código)
- **Crear OG image 1200x630px** — actualmente usa iconoGantly.png (funcional pero aspect ratio incorrecto). Crear imagen con logo + tagline para redes sociales, guardar como `frontend/public/og-image.png` y actualizar refs en `index.html` y `SEO.tsx`
- **Registrar Google Search Console** — verificar propiedad con meta tag, reemplazar placeholder en `index.html` línea `google-site-verification`
- **Crear cuenta Twitter @gantly_es** — o actualizar el handle en `index.html` y `SEO.tsx` (const `TWITTER_HANDLE`)
- **Enviar sitemap a Google Search Console** — tras registro, enviar `https://gantly.es/sitemap.xml`
- **Configurar Bing Webmaster Tools** — opcional pero recomendado
- **Crear página de blog** — el footer enlaza a "#", ideal para SEO long-tail (contenido sobre ansiedad, terapia, etc.)

## Build & Run
- **Maven**: Installed globally at `/c/Program Files (x86)/Apache/Maven/bin/mvn` (no `./mvnw` wrapper)
- **PostgreSQL**: Docker container `postgres_gantly` en puerto 5433 (user: gantly, pass: gantly, db: gantly)
- **Backend compile**: `cd psicoapp && mvn compile`
- **Frontend typecheck**: `cd frontend && npx tsc --noEmit`
- **Frontend dev**: `cd frontend && npm run dev` (Vite on port 5173)
- **Migration scripts**: `migration/export_mysql.sh` + `migration/import_to_postgres.py`
