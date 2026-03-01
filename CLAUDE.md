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
- **DB**: MySQL 8.0, 26 entidades JPA, 22+ tablas
- **Infra**: Docker (2-stage build), Nginx reverse proxy

## Architecture
- Backend: Controllers → Services → Repositories → JPA Entities
- Frontend: Monolithic App.tsx router (32 useState hooks), single api.ts service (846 lines)
- Auth: JWT (15min access + 7d refresh) + Google OAuth2
- Chat: WebSocket STOMP con AES-256-GCM encryption
- Roles: USER, PSYCHOLOGIST, ADMIN, EMPRESA

## Key Backend Files
```
psicoapp/src/main/java/com/alvaro/psicoapp/
├── controller/     (20+ controllers: Auth, Admin, Task, Calendar, Chat, Test, Stripe, Jitsi, Matching...)
├── service/        (32+ services: Auth, Email, JWT, Task, Test, Calendar, Chat, Matching, Audit, Stripe...)
├── domain/         (26 JPA entities)
├── repository/     (35+ Spring Data repositories)
├── dto/            (23+ DTO classes with validation)
├── security/       (SecurityConfig, JwtAuthFilter, RateLimitFilter, OAuth2SuccessHandler)
└── config/         (JwtConfig, WebSocketConfig)
```

## Key Frontend Files
```
frontend/src/
├── App.tsx                    (801 lines - monolithic router)
├── services/api.ts            (846 lines - all API calls)
├── components/                (52 .tsx components)
│   ├── Auth: Login, Register, ForgotPassword, ResetPassword
│   ├── Dashboards: UserDashboard (13 tabs), PsychDashboard (11 tabs), AdminPanel (6 tabs)
│   ├── Flows: TestFlow, InitialTestFlow, AgendaPersonal, PatientMatchingTest
│   └── UI: ChatWidget, CalendarWeek, Landing, About, Toast, pricing
├── i18n/                      (ES/EN translations)
└── assets/                    (images, lottie animations)
```

## Database Schema (Main Tables)
- **users** - Core user entity (roles: USER/PSYCHOLOGIST/ADMIN/EMPRESA)
- **tests/questions/answers** - Personality test system (16PF, INITIAL, MATCHING)
- **subfactors/factors** - Test scoring dimensions
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
1. **TestEntity** (personality/matching): Full question→answer→subfactor→factor hierarchy with scoring
2. **EvaluationTestEntity** (clinical): Simpler score+level system, answers stored as JSON

Currently only personality tests exist. Planned: clinical psychological tests (Beck, Hamilton, etc.)

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
- **Tests**: Need to support clinical psychological tests beyond personality
- **Missing**: Error boundary (global), .env.production, Nginx security headers, CSP
