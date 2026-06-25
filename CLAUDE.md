# Gantly (PsicoApp) - Plataforma de Salud Mental

## Communication Style
- **Respuestas cortas y concisas**. No gastar tiempo en explicaciones largas cuando no son necesarias.
- Usar skills de superpowers y ui-ux-pro-max para todas las tareas relevantes.
- **SIEMPRE usar el skill ui-ux-pro-max para cualquier tarea de frontend** (diseño, componentes, estilos, layouts, rediseños).

## Session Context Files
- Los archivos en `docs/sessions/` contienen el contexto de cada sesion de trabajo.
- **Leer estos archivos al inicio de cada sesion** para retomar el contexto sin perder lo avanzado.
- Formato: `YYYY-MM-DD-<tema>.md`

## Project Overview
Plataforma de salud mental que conecta pacientes con psicólogos.
- **Backend**: Spring Boot 3.4.7 (Java 21) — `psicoapp/`
- **Frontend**: React 18 + TypeScript + Vite + Tailwind + React Router — `frontend/`
- **Base de datos**: PostgreSQL 17 (Supabase en producción, Docker local en puerto 5433)
- **Roles**: USER, PSYCHOLOGIST, ADMIN, EMPRESA

## Tech Stack
- **Backend**: Spring Boot 3.4.7, Spring Security, JWT (JJWT 0.11.5), WebSocket STOMP/SockJS, JPA/Hibernate
- **Frontend**: React 18.3.1, TypeScript 5.6.3, Vite 5.4.10, Tailwind 3.4.18, React Router 7, Axios, Framer Motion, i18next, Stripe JS, GSAP, Three.js/@react-three
- **DB**: PostgreSQL 17, 27+ entidades JPA, 43+ tablas
- **PDF Export**: html2canvas + jsPDF (frontend)
- **Excel Import**: Apache POI 5.2.5 (backend)
- **Payments**: Stripe (subscriptions + appointment payments)
- **Email**: Gmail SMTP (producción) / Resend API (requiere dominio verificado)
- **Monitoring**: Sentry (errors), Umami (analytics), BetterStack/Logtail (logs)

## Architecture
- Backend: Controllers → Services → Repositories → JPA Entities
- Frontend: App.tsx uses `react-router-dom` declarative routing with `useAuth()` hook and `ProtectedRoute`
- Auth: JWT (15min access + 7d refresh with rotation) + Google OAuth2 (secure code exchange) + email verification (6-digit code)
- Chat: WebSocket STOMP con AES-256-GCM encryption (PBKDF2 key derivation, per-conversation salt)
- PII: Field-level encryption at-rest (AES-256-GCM) para email, nombre, TOTP secret

## Key Backend Files
```
psicoapp/src/main/java/com/alvaro/psicoapp/
├── controller/     (20+ controllers)
├── service/        (37+ services)
├── domain/         (25+ JPA entities)
├── repository/     (33+ Spring Data repositories)
├── dto/            (23+ DTO classes with validation)
├── security/       (SecurityConfig, JwtAuthFilter, RateLimitFilter, OAuth2SuccessHandler)
├── config/         (JwtConfig, WebSocketConfig, AppTimezone, PiiEncryptConverter, StripeProperties)
└── util/           (InputSanitizer, FormulaEvaluator, ReferralCodeUtil)
```

## Key Frontend Files
```
frontend/src/
├── App.tsx                    (Routes, useAuth, ProtectedRoute)
├── services/api.ts            (all API calls)
├── components/                (60+ .tsx components)
│   ├── Auth: Login, Register, ForgotPassword, ResetPassword
│   ├── Dashboards: UserDashboard, PsychDashboard, AdminPanel, ClinicDashboard
│   ├── Dashboard Tabs: Psych* (7 tabs incl. PsychSettingsTab), User* (3 tabs)
│   ├── Flows: TestFlow, InitialTestFlow, AgendaPersonal, PatientMatchingTest
│   ├── Landing (modular): 12 section components + shared/ utilities
│   └── UI: ChatWidget, CalendarWeek, Modal, ConfirmDialog, SignaturePad
├── i18n/                      (ES/EN translations)
└── assets/                    (SVG logos)
```

## Routing (React Router)
- `/` — Landing or Dashboard (based on auth)
- `/login`, `/register`, `/register/:referralCode` — Auth flows
- `/about`, `/pricing`, `/soy-profesional` — Public pages
- `/dashboard` — Role-based dashboard (USER/PSYCHOLOGIST/ADMIN/EMPRESA)
- `/test/:testId` — Test taking flow
- `/reset-password`, `/oauth-callback` — Auth utilities
- `/clinica/:slug` — Public clinic page with online booking

## Stripe Payment System
- **Subscriptions**: 3 plans (Basic/Premium/Enterprise), monthly/yearly toggle, StripeProperties externalizes Price IDs
- **Appointments**: Single-payment Checkout, 48h deadline, payment gating for video calls
- **Billing**: PsychBillingTab + ClinicBilling with IVA/tax, CSV export, PDF invoice
- **Tax**: taxRate, taxAmount, totalAmount, taxExempt fields — default exento (sanitario Art. 20 LIVA)
- **Hardening**: Webhook replay protection (stripe_events dedup), subscription idempotency, customer ID persistence
- **Fiscal**: razonSocial + direccionFiscal en CompanyEntity for PDF invoices

## Test System Architecture
Two parallel systems:
1. **TestEntity** (personality/matching/intelligence): question→answer→subfactor→factor hierarchy with scoring
2. **EvaluationTestEntity** (clinical): Simpler score+level system, answers stored as JSON

- **Types**: TCP (16PF), TCA (aptitude), Ansiedad — auto-detected on import
- **Scoring**: FormulaEvaluator with two-pass evaluation, inverse items, percentage (personality) / Gaussian percentile (aptitude)
- **Import**: Excel (Delphos + generic format), POST /admin/tests/import/parse + confirm
- **Report**: TestReport.tsx with PDF export (html2canvas + jsPDF)

## Security
- CORS explicit origins, Rate limiting (5/min sensitive, 30/min auth), Account lockout escalated
- Password: 10 chars + uppercase + symbol, OAuth2 code exchange, Token blacklist + refresh rotation
- WebSocket: JWT on CONNECT, destination validation, 10KB max, 10 msg/min
- CSP headers, IDOR protection, PII encryption (AES-256-GCM), InputSanitizer (XSS)
- SecurityBreachService logging, IP resolution from trusted proxies only

## RGPD / GDPR
- Dual consent (privacy + health data Art. 9), privacy policy page, export/delete account
- Data retention job (3AM daily), CookieBanner, Sentry PII disabled
- **Pendiente**: DPAs con proveedores, DPIA, registro tratamiento, activar PII encryption

## Email System
- Dual provider: Resend API (needs verified domain) / Gmail SMTP fallback
- Thymeleaf templates: verification, approval, rejection, cancellation
- `com.resend:resend-java:3.1.0`

## Clinical Forms (Consent + Intake)
- Two templates: INFORMED_CONSENT (read+sign) and INTAKE_FORM (fillable+sign)
- formSchema JSON with conditional logic (showIf), template variables for auto-fill
- SignaturePad with Bezier curves, velocity-based width

## UI Design System
- **Colores**: gantly-blue (#2E93CC), gantly-cyan (#22D3EE), gantly-navy (#0A1628), gantly-gold (#F0C930), gantly-emerald (#059669)
- **Iconos**: Lucide React (NO emojis as UI icons)
- **Cards**: `bg-white rounded-2xl border border-slate-200/80`
- **Inputs**: `h-9 px-3 rounded-md border border-slate-200`
- **Buttons**: flat `bg-gantly-blue text-white rounded-md` (NO gradients)
- **Fuentes**: Outfit (heading), Work Sans (body), Caveat (handwritten)
- **Contraste**: text-slate-500 minimum (NOT text-slate-400)
- **Modal**: focus trap, Escape, z-[1000], max-h-[90vh], stable onClose
- **ConfirmDialog**: variants danger/warning/info (replaces native confirm())
- **A11y**: ARIA roles (tablist/tab/tabpanel), focus rings, touch targets min-h-[44px]

## Deploy (v1 — Mayo 2026)

| Componente | Servicio | URL |
|-----------|----------|-----|
| Frontend | Vercel | https://gantly-vercel-d4ti.vercel.app |
| Backend | Render (free) | https://gantlyvercel.onrender.com |
| Base de datos | Supabase (EU) | aws-0-eu-west-1.pooler.supabase.com |
| Videollamadas | Hetzner VPS (pendiente) | — |

### Env vars Render
Ver `.env` (gitignored) para valores actuales. Variables principales:
- DATABASE_URL, DATABASE_USER, DATABASE_PASSWORD — Supabase PostgreSQL
- JWT_SECRET, PII_ENCRYPTION_KEY — Security
- GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET — OAuth2
- MAIL_USERNAME, MAIL_PASSWORD — Gmail SMTP (pendiente configurar)
- STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET — Stripe
- STRIPE_PRICE_* (6 price IDs) — Stripe plans
- APP_BASE_URL, APP_CORS_ALLOWED_ORIGINS — Frontend URL
- RESEND_API_KEY — Email (requiere dominio verificado)

### Env vars Vercel
- VITE_SENTRY_DSN, VITE_UMAMI_WEBSITE_ID, VITE_UMAMI_SRC

## Pendiente para Producción Final

### P0 — Bloqueantes
- [x] **Email**: Configurado en Render (SMTP) ✅
- [x] **Dominio**: gantly.es + api.gantly.es con DNS configurado ✅
- [x] **Borrado cuenta**: Cascade delete completo (chat, relaciones, tests asignados) ✅
- [ ] **Stripe webhook**: Crear endpoint en Stripe dashboard → `https://api.gantly.es/api/stripe/webhook` + `STRIPE_WEBHOOK_SECRET` *(config, no-código)*
- [ ] **Jitsi**: Configurar en Hetzner VPS con dominio propio (video.gantly.es) *(infra, no-código)*
- [ ] **PII encryption**: Activar @Convert en UserEntity (descomentar L18/L22/L101) — **requiere migración previa de datos existentes en claro** (email con converter determinista para búsquedas/login). Único P0 de código. Riesgo alto: hacer con plan.
- [ ] **DPAs**: Firmar con Stripe, Supabase, Render, Google, Sentry, Hetzner *(legal, no-código)*

### P1 — Primer mes post-launch
- [ ] Notas de sesión UI para psicólogos (backend existe, falta frontend)
- [ ] Retirada consentimiento Art. 9 (UI + endpoint)
- [ ] Completar GDPR export (chat messages, clinic docs)
- [ ] Redactar PII en logs
- [ ] Factura PDF para psicólogos
- [ ] Buscador de pacientes
- [ ] Re-envío perfil psicólogo tras rechazo

### P2 — Post-MVP
- [ ] Plan de tratamiento (objetivos terapéuticos, seguimiento)
- [ ] Outcome measures en flujo clínico (GAD-7/PHQ-9 baseline)
- [ ] Status visual citas en calendario
- [ ] Reagendar cita (sin cancelar + re-reservar)
- [ ] Auto-asignación subfactors en import tests
- [ ] OG image 1200x630px, Google Search Console, blog SEO

### P3 — Futuro
- Terapia de grupo, modo supervisor, app móvil nativa
- SMS/WhatsApp recordatorios, plantillas de cita
- Dark mode, integración iCal/Google Calendar
- Exportación HL7/FHIR

### No-código (legal/admin)
- [ ] DPIA (Evaluación de Impacto) — obligatorio para datos de salud
- [ ] Registro de actividades de tratamiento (Art. 30 RGPD)
- [ ] Designar DPO o justificar exención

### Deuda técnica
- Dos sistemas de tests paralelos (TestEntity vs EvaluationTestEntity)
- File storage: filesystem local → migrar a Supabase Storage
- `user_answers` no se persiste para muchos tests antiguos (solo quedan `test_results`). El perfil del paciente ya lee `test_results` como fuente principal, pero el detalle de respuestas crudas no existe para esos casos.

## Estado verificado en producción (2026-06-04)
- 0 registros en `evaluation_test_results` (sistema clínico sin uso real aún)
- Mayoría de pacientes: 0 `user_answers` pero sí `test_results` (datos de la época local)
- 323 `user_answers` con `user_id` NULL (tests de matching/initial anónimos)
- Acceso a BD de prod para diagnóstico: psycopg2 + credenciales de `.env` (host pooler Supabase). NUNCA commitear scripts con credenciales.

## Build & Run
- **Maven**: `/c/Program Files (x86)/Apache/Maven/bin/mvn` (no wrapper)
- **PostgreSQL local**: Docker `postgres_gantly` puerto 5433 (user: gantly, pass: gantly, db: gantly)
- **Backend compile**: `cd psicoapp && mvn compile`
- **Frontend typecheck**: `cd frontend && npx tsc --noEmit`
- **Frontend dev**: `cd frontend && npm run dev` (Vite on port 5173)

## MCP Servers
- **Playwright**: Browser automation E2E. `claude mcp add playwright -- npx @playwright/mcp@latest`
