# PsicoApp - Migration React → Angular

## Project Overview
Mental health platform (Gantly/PSYmatch) connecting patients with psychologists.
- **Backend**: Spring Boot (Java) at `localhost:8080/api`
- **Frontend React** (original): `frontend/` - React 18 + TypeScript + Vite + Tailwind
- **Frontend Angular** (migration): `frontend-angular/` - Angular 21 + Tailwind
- **Branch**: `rama-angular`

## Course Requirements (Proyecto Full-Stack 2.0) - ALL MET
1. Dashboard with indicators/counters/summary ✅ (hero + serif italic counters)
2. Entity CRUD (list, detail, create/edit, delete, search/filter/sort) ✅ (tests, tasks, agenda, admin)
3. Forms for creating/modifying data + interacting with external API ✅ (Reactive Forms everywhere)
4. HttpClient with REST (GET, POST, PUT, DELETE) via Angular services ✅
5. External REST API consumption ✅ (ZenQuotes)
6. Angular CLI, 10 routes, standalone components, services, TypeScript models, Reactive Forms ✅
7. Clear design and usability, intuitive navigation, common layout ✅

## Angular Migration Status

### Migrated (including recent work)
- Auth flow (login, register, forgot/reset password, Google OAuth2) - with gradient design
- Route guards (auth, noAuth, role)
- JWT interceptor with refresh token logic
- All 3 role dashboards (USER, PSYCHOLOGIST, ADMIN) with tab navigation
- **Visual parity with React** - hero headers, organic cards, Material Symbols icons, serif italic counters
- **Sidebar redesign** - w-24 icon-only with Material Symbols, logout button, mobile bottom nav
- **TestFlow** - Question-by-question test taking UI with progress bar, auto-advance, multiple question types
- **AgendaPersonal** - Daily mood journal with 2-step form, emotion/activity tags, weekly calendar view
- WebSocket chat (STOMP/SockJS)
- Calendar/booking system
- Task management
- Test listing, assignment, search/filter
- All backend API services wired (including agenda.service.ts)
- Shared components: Header, Sidebar, Toast, LoadingSpinner
- TypeScript models/interfaces
- External API: ZenQuotes (quotes.service.ts)
- Tailwind design system with custom tokens
- **Image migration from React assets** (all images from `frontend/src/assets/` reused in Angular):
  - SoyProfesional: 6 Gemini circular psychologist images in hero grid + `imagenProfesional.jpg` in advantages section
  - TestFlow: background image (`Adobe Express - file (1).png`) as fixed fullscreen background
- **Landing rewritten to match React structure** (7 sections):
  1. Hero: large title left + big logo illustration right (`7442f63c-...png` at 139% width with organic blur)
  2. Mini features strip: 4 Material Symbols icons on mint background
  3. Daily quote (ZenQuotes API)
  4. Philosophy: "Un espacio tranquilo..." + 2 staggered feature cards (Matching clínico, Todo en un solo lugar)
  5. Care paths: "Cómo funciona Gantly" + 3 rounded image cards (test inicial with `Gemini_Generated_Image_2xvx8k...png`)
  6. Team: "Un equipo cercano" + 3 staggered team cards with Material icons
  7. Final CTA: dark forest rounded-[4rem] box + footer with links
- **About page redesigned like React**:
  - Hero: Álvaro's photo (`chumte.jpeg`) on left with gradient overlay + bio text + 3 expertise cards
  - Methodology section: 3-column card (Formación continua, Metodología, Confidencialidad)
  - Gradient CTA section (green-to-blue gradient with blur orbs)

### NOT Yet Migrated (not needed for course)
- Evaluaciones / Descubrimiento test categories
- MisEstadisticas / charts
- InitialTestFlow / Matching system
- Jitsi video calls
- AdminSectionsManager (drag/drop)
- CompanyDashboard / RegisterCompany / RegisterPsychologist
- Consent UI, Pricing/Stripe, BarChart/FactorChart, i18n

## Key Architecture Decisions
- Angular 21 standalone components (no NgModule)
- Lazy-loaded routes
- Functional interceptors/guards (Angular 15+ style)
- Dashboards are monolithic single-file components (inline templates)
- Tailwind CSS for styling (matching React's design system)
- `@if` / `@for` control flow syntax (Angular 17+)
- Material Symbols Outlined for icons (font-based)

## File Structure (Angular)
```
frontend-angular/src/app/
├── core/
│   ├── guards/        (auth, no-auth, role)
│   ├── interceptors/  (auth interceptor)
│   ├── models/        (index.ts - all interfaces)
│   └── services/      (auth, profile, psych, calendar, chat, task, test, admin, quotes, toast, agenda)
├── features/
│   ├── auth/          (login, register, forgot-password, reset-password)
│   ├── landing/       (landing, about, soy-profesional)
│   ├── user-dashboard/ (user-dashboard, test-flow/, agenda-personal/)
│   ├── psych-dashboard/ (psych-dashboard)
│   └── admin/         (admin)
└── shared/components/ (header, sidebar, toast, loading-spinner)
```
