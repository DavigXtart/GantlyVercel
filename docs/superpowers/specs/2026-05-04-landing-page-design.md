# Gantly Landing Page — Design Spec

## Overview
Complete redesign of the Gantly landing page. Gantly is a mental health platform connecting patients with psychologists. The landing targets BOTH patients and professionals/clinics equally.

## Design Direction
- Modern-tech SaaS aesthetic with warmth of a mental health platform
- NOT cold/corporate - premium tech that conveys trust and care
- 3D elements + Blue Illustrations from Figma + abstract shapes
- Scroll-triggered animations throughout
- Desktop-first, mobile functional but simplified (3D simplified to CSS on mobile)
- Spanish + English (i18next) from the start

## Tech Stack
- React 18 + TypeScript + Vite + Tailwind 3.4
- Framer Motion (already installed) — scroll reveal, component transitions
- React Three Fiber + Drei (to install) — 3D hero with Gantly G logo extruded, particles
- GSAP ScrollTrigger (to install) — scroll pinning, horizontal timeline, parallax
- i18next (already installed) — ES/EN
- Lucide React (already installed) — icons
- Google Fonts: Outfit (headings) + Work Sans (body)

## Color Palette

| Role | Hex | Tailwind Token | Usage |
|------|-----|----------------|-------|
| Deep Navy | `#0A1628` | `gantly-navy` | Hero bg, dark sections, footer |
| Gantly Blue | `#2E93CC` | `gantly-blue` | Primary, links, key elements |
| Cyan Glow | `#22D3EE` | `gantly-cyan` | Accents, glowing borders, 3D particles |
| Warm Gold | `#F0C930` | `gantly-gold` | CTAs, highlights, badges |
| Soft Cloud | `#F0F8FF` | `gantly-cloud` | Light section backgrounds |
| Ice White | `#ECFEFF` | `gantly-ice` | Cards, secondary backgrounds |
| Emerald | `#059669` | `gantly-emerald` | Trust badges, security, verification |
| Text Dark | `#0F172A` | `gantly-text` | Headings on light bg |
| Text Muted | `#475569` | `gantly-muted` | Body text, descriptions |

## Typography

- **Headings**: Outfit (geometric, modern) — weights 600-800
- **Body**: Work Sans (clean, readable) — weights 300-500
- **Google Fonts import**: `Outfit:wght@300;400;500;600;700;800` + `Work+Sans:wght@300;400;500;600;700`
- **Tailwind config**: `fontFamily: { heading: ["Outfit", "sans-serif"], body: ["Work Sans", "sans-serif"] }`

### Type Scale
| Token | Size | Usage |
|-------|------|-------|
| display | 72px / 4.5rem | Hero headline |
| h1 | 56px / 3.5rem | Section headlines |
| h2 | 40px / 2.5rem | Sub-headlines |
| h3 | 28px / 1.75rem | Card titles |
| body-lg | 20px / 1.25rem | Lead paragraphs |
| body | 18px / 1.125rem | Body text |
| body-sm | 16px / 1rem | Secondary text |
| caption | 14px / 0.875rem | Labels, badges |
| tiny | 12px / 0.75rem | Fine print |

## Spacing System
Multiples of 4px, using Tailwind defaults. Key section spacing:
- Between sections: 120-160px (py-28 to py-40)
- Card padding: 24-32px
- Hero padding: 64px top/bottom minimum

## Animation Philosophy
- Framer Motion for scroll-triggered reveals (whileInView)
- GSAP ScrollTrigger for horizontal scroll pinning (patient flow section)
- React Three Fiber for 3D hero (logo G, particles)
- ALWAYS respect prefers-reduced-motion (static fallback)
- Easing: ease-out for entering, ease-in for exiting
- Duration: 300-400ms for micro-interactions, 600-800ms for section reveals
- Max 1-2 animated elements per viewport at once

## Component Architecture
The landing page should be split into sub-components:
```
frontend/src/components/landing/
├── Landing.tsx              (main orchestrator, i18n provider)
├── Navbar.tsx               (floating glassmorphism navbar)
├── HeroSection.tsx          (3D scene + tagline + CTAs)
├── Hero3DScene.tsx          (R3F Canvas: G logo, particles, lights)
├── WhatIsGantly.tsx         (text reveal + illustrations + stats)
├── PatientFlow.tsx          (GSAP horizontal scroll pinning timeline)
├── SmartMatching.tsx        (connection visualization)
├── VideoChat.tsx            (split screen mockups)
├── ForProfessionals.tsx     (benefits cards with 3D tilt)
├── ForClinics.tsx           (ERP features + dashboard preview)
├── TestsPreview.tsx         (radar chart + test types)
├── TrustSecurity.tsx        (badges grid)
├── FinalCTA.tsx             (CTA + particles bg)
├── Footer.tsx               (links, logo, legal)
└── shared/
    ├── ScrollReveal.tsx     (reusable Framer Motion wrapper)
    ├── SectionWrapper.tsx   (consistent section spacing/layout)
    ├── GlowCard.tsx         (card with glow border effect)
    └── TiltCard.tsx         (3D perspective tilt on hover)
```

## Sections Detail

### 1. Navbar (fixed, floating, glassmorphism)
- Position: fixed top with 16px margin from edges
- Background: rgba(10, 22, 40, 0.7) with backdrop-blur-xl
- Border: 1px solid rgba(34, 211, 238, 0.1)
- Border-radius: 16px
- Contents: Logo wordmark (SVG) left, nav links center, 2 CTA buttons right
- Nav links: "Pacientes", "Profesionales", "Clínicas", "Tests"
- CTA: "Iniciar sesión" (ghost) + "Empezar" (gold solid)
- On scroll: opacity transition, slightly more opaque
- Mobile: hamburger menu

### 2. Hero Section (100vh, bg #0A1628)
- Full viewport height
- 3D Scene (React Three Fiber Canvas) as background/center element:
  - Gantly G logo extruded in 3D (ExtrudeGeometry from SVG path)
  - Slow rotation on Y axis (0.1 rad/s)
  - Lighting: ambient + point light (cyan #22D3EE) + point light (gold #F0C930)
  - Floating particles (Drei Points or custom) in blue/cyan
  - Responsive: on mobile, replace with static SVG logo + CSS gradient background
- Text overlay (centered below or beside 3D):
  - Headline: "Tu bienestar mental, potenciado por tecnología" (kinetic: words reveal one by one)
  - Subtitle: "Conectamos pacientes con los mejores psicólogos usando IA y tests clínicos validados"
  - 2 CTAs: "Soy paciente" (gold bg #F0C930, dark text) + "Soy profesional" (outline cyan border)
- Scroll indicator: animated chevron at bottom

### 3. What is Gantly (bg #F0F8FF → white gradient)
- Large text that reveals on scroll (Framer Motion staggered words)
- "Gantly es la plataforma que conecta salud mental y tecnología. Tests clínicos validados, matching inteligente, videollamadas seguras y seguimiento continuo — todo en un solo lugar."
- 3 animated stat counters: "2,000+ pacientes", "500+ psicólogos", "15,000+ sesiones"
- Blue Illustrations from Figma floating with parallax at different speeds (2-3 layers)
- Subtle gradient blobs in background (CSS, not 3D)

### 4. Patient Flow (GSAP horizontal scroll pinning)
- Container takes 400vh of scroll space but visually pins at 100vh
- Horizontal scroll: 4 panels slide left as user scrolls down
- Progress bar at top that fills as you scroll through
- Panel 1: "Test inicial" — illustration + description of the personality test
- Panel 2: "Matching inteligente" — algorithm finds best psychologist
- Panel 3: "Primera sesión" — videocall setup
- Panel 4: "Seguimiento continuo" — tasks, mood tracking, chat
- Each panel: icon (Lucide) + title + description + illustration
- Background: light with subtle blue gradient
- Mobile: vertical stack with scroll reveal, no horizontal pinning

### 5. Smart Matching (bg gradient: #0A1628 → #0F2847)
- Dark section for visual contrast
- SVG/Canvas animation: patient node (left) → animated connecting lines with particles → psychologist node (right)
- Lines glow in cyan, pulse when "connected"
- Data points appear one by one: "16 factores de personalidad", "Especialización verificada", "98% satisfacción", "Matching en < 24h"
- Framer Motion staggered entry for data points
- Glow effect behind the connection visualization

### 6. Videocalls & Chat (bg white/cloud)
- Split layout: 60/40
- Left: Stylized mockup of a videocall interface (CSS-built, not screenshot)
  - Fake UI: 2 video feeds, controls bar (mic, camera, end call)
  - Subtle entrance animation (slide from left)
- Right: Chat mockup with messages appearing sequentially
  - 3-4 messages fade in with typing indicator
  - Shows both patient and psychologist messages
- Floating badge: "Cifrado extremo a extremo" with shield icon + emerald accent
- Below: 3 small feature chips: "Videollamadas HD", "Chat seguro", "Notas de sesión"

### 7. For Professionals (bg #0F172A with subtle grid pattern)
- Darker section - shift in visual tone
- Headline: "Herramientas diseñadas para profesionales"
- Grid of 4 GlowCards with 3D tilt hover effect (perspective transform):
  - "Agenda inteligente" — Calendar icon, manage availability
  - "Tests clínicos" — ClipboardCheck icon, 16PF, TCA, anxiety tests
  - "Facturación automática" — Receipt icon, billing, payment tracking
  - "Panel de pacientes" — Users icon, notes, progress, history
- Each card: glassmorphism bg, glow border on hover (cyan), icon + title + description
- CTA: "Únete como profesional" (gold button)

### 8. For Clinics/Companies (bg #F0F8FF)
- Light section
- Headline: "Gestiona tu clínica desde un solo lugar"
- Left: feature list with animated checkmarks
  - "Gestión de equipo de psicólogos"
  - "Invitaciones por email con token"
  - "Agenda centralizada"
  - "Facturación y despachos"
  - "Chat clínica-paciente"
- Right: Stylized dashboard preview (CSS-built fake UI with animated numbers)
- CTA: "Solicitar demo" (outline blue)

### 9. Tests Preview (bg gradient: light blue)
- Reference visual style from the Claude Design artifact the user shared
- Animated radar chart (SVG or canvas) showing sample personality profile
- Bipolar scale preview: animated bars that fill
- 3 test type badges: "16PF Personalidad", "TCA Inteligencia", "Ansiedad"
- Brief description: "Tests clínicos validados con informes detallados para cada paciente"

### 10. Trust & Security (bg white)
- Grid of 4-6 trust badges/cards:
  - "RGPD Compliant" — shield icon, emerald
  - "Cifrado AES-256-GCM" — lock icon
  - "Datos de salud protegidos" — heart + shield icon
  - "Profesionales verificados" — badge check icon
  - "Pagos seguros con Stripe" — credit card icon
  - "Videollamadas privadas" — video icon
- Each badge: icon animates on viewport entry (scale + fade)
- Clean, reassuring visual tone

### 11. Final CTA (bg #0A1628 with particles)
- Reuse 3D particle effect from hero (shared canvas or CSS fallback)
- Large headline: "Empieza hoy — es gratis"
- Subtitle: "Crea tu cuenta en menos de 2 minutos"
- 2 large CTAs: "Soy paciente" (gold) + "Soy profesional" (outline cyan)
- Mobile: simplified background

### 12. Footer (bg #070E1A)
- 4-column layout: Logo + tagline, Plataforma links, Legal links, Contact/Social
- Logo: Gantly wordmark SVG in white
- Links: Sobre nosotros, Pricing, Blog, Contacto, Privacidad, Términos
- Social icons (if any)
- Copyright: "© 2026 Gantly. Todos los derechos reservados."
- Mobile: stacked columns

## Accessibility Requirements
- All images: descriptive alt text
- prefers-reduced-motion: disable all animations, show static content
- Keyboard navigation: visible focus rings on all interactive elements
- Color contrast: 4.5:1 minimum for text
- ARIA labels on icon-only buttons
- Semantic HTML: header, nav, main, section, footer
- Touch targets: 44x44px minimum

## i18n Structure
All text strings go through i18next with namespace `landing`:
- `landing.hero.title`, `landing.hero.subtitle`, etc.
- ES and EN translation files
- Language toggle in navbar (ES/EN switch)

## Performance Considerations
- Three.js canvas: lazy load, only render when in viewport
- Images: WebP format, lazy loading, srcset for responsive
- GSAP: import only ScrollTrigger plugin, not full library
- Code splitting: each section lazy-loaded with React.lazy/Suspense
- Fonts: display=swap, preconnect to Google Fonts
- Target: Lighthouse Performance > 85

## Mobile Adaptations
- Hero: static SVG logo + CSS gradient instead of Three.js canvas
- Patient flow: vertical timeline instead of horizontal pinning
- Cards: single column stack
- Matching visualization: simplified (static SVG)
- Chat/Video mockups: stacked vertically
- Font sizes: scale down proportionally (display → 40px, h1 → 32px, etc.)

## Files to Create/Modify
- CREATE: `frontend/src/components/landing/` — all new component files (listed in architecture)
- CREATE: `frontend/src/i18n/locales/es/landing.json` — Spanish translations
- CREATE: `frontend/src/i18n/locales/en/landing.json` — English translations
- MODIFY: `frontend/tailwind.config.js` — add Gantly color tokens and font families
- MODIFY: `frontend/src/index.css` — add Outfit + Work Sans font import, remove old landing vars
- MODIFY: `frontend/src/App.tsx` — update Landing import path
- DELETE: `frontend/src/components/Landing.tsx` — replaced by new modular structure

## Dependencies to Install
- `@react-three/fiber` — React Three Fiber
- `@react-three/drei` — Drei helpers (Float, Points, etc.)
- `three` — Three.js core
- `gsap` — GSAP animation library
- `@gsap/react` — GSAP React integration
