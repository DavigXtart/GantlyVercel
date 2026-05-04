# Gantly Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a spectacular, animation-rich landing page for Gantly with 3D hero, scroll-triggered animations, GSAP horizontal scroll, and full ES/EN i18n support.

**Architecture:** Modular component structure under `frontend/src/components/landing/`. Each section is its own component. Shared utilities (ScrollReveal, TiltCard, GlowCard) are reusable. Three.js canvas is lazy-loaded and disabled on mobile. GSAP ScrollTrigger handles the horizontal patient flow section. All text goes through i18next.

**Tech Stack:** React 18, TypeScript, Tailwind 3.4, Framer Motion, React Three Fiber + Drei, GSAP ScrollTrigger, i18next, Lucide React, Google Fonts (Outfit + Work Sans)

**Spec:** `docs/superpowers/specs/2026-05-04-landing-page-design.md`

---

## File Structure

```
frontend/src/components/landing/
├── Landing.tsx              — Main orchestrator, lazy-loads sections
├── Navbar.tsx               — Fixed floating glassmorphism navbar
├── HeroSection.tsx          — 3D scene wrapper + text overlay + CTAs
├── Hero3DScene.tsx          — R3F Canvas: extruded G logo, particles, lights
├── WhatIsGantly.tsx         — Text reveal + stat counters + floating illustrations
├── PatientFlow.tsx          — GSAP horizontal scroll pinning timeline
├── SmartMatching.tsx        — SVG connection visualization
├── VideoChat.tsx            — Split screen videocall + chat mockups
├── ForProfessionals.tsx     — Benefits cards with 3D tilt hover
├── ForClinics.tsx           — ERP features + dashboard preview
├── TestsPreview.tsx         — Radar chart + bipolar scale + test badges
├── TrustSecurity.tsx        — Trust badges grid
├── FinalCTA.tsx             — Final call-to-action + particle bg
├── Footer.tsx               — 4-column footer
└── shared/
    ├── ScrollReveal.tsx     — Reusable Framer Motion whileInView wrapper
    ├── SectionWrapper.tsx   — Consistent section spacing + max-width
    ├── GlowCard.tsx         — Card with animated glow border
    └── TiltCard.tsx         — 3D perspective tilt on hover

frontend/src/i18n/locales/es.json  — Add landing.* keys
frontend/src/i18n/locales/en.json  — Add landing.* keys
frontend/tailwind.config.js        — Add gantly-* colors + font families
frontend/src/index.css              — Replace fonts + clean old landing vars
frontend/src/App.tsx                — Update Landing import
```

---

### Task 1: Install dependencies and configure Tailwind + fonts

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/tailwind.config.js`
- Modify: `frontend/src/index.css`
- Modify: `frontend/index.html` (font preconnect)

- [ ] **Step 1: Install npm dependencies**

```bash
cd frontend && npm install three @react-three/fiber @react-three/drei gsap @gsap/react @types/three
```

- [ ] **Step 2: Update Tailwind config with Gantly tokens**

Replace the old `sage/cream/mint/forest/clay` colors in `frontend/tailwind.config.js` with:

```js
// Inside theme.extend.colors, replace sage/cream/mint/forest/clay block with:
'gantly-navy': '#0A1628',
'gantly-blue': '#2E93CC',
'gantly-cyan': '#22D3EE',
'gantly-gold': '#F0C930',
'gantly-cloud': '#F0F8FF',
'gantly-ice': '#ECFEFF',
'gantly-emerald': '#059669',
'gantly-text': '#0F172A',
'gantly-muted': '#475569',
```

Add font families in `theme.extend`:

```js
fontFamily: {
  heading: ['Outfit', 'sans-serif'],
  body: ['Work Sans', 'sans-serif'],
},
```

- [ ] **Step 3: Update index.css — replace fonts and clean old landing vars**

In `frontend/src/index.css`:

1. Add Google Fonts import at the very top (before @tailwind):
```css
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Work+Sans:wght@300;400;500;600;700&display=swap');
```

2. Change body font-family to: `'Work Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;`

3. Change headings h1-h6 font-family to: `'Outfit', 'Nunito', 'Inter', sans-serif;`

4. Remove the old landing CSS vars block (lines 112-118: `--soft-sage`, `--warm-cream`, etc.)

5. Remove `.serif-font`, `.organic-shape`, `.soft-shadow`, `.line-art` classes (lines 120-136) — these were old landing-specific styles.

6. Add reduced motion utility at the end:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 4: Add font preconnect to index.html**

In `frontend/index.html`, inside `<head>` before other links:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
```

- [ ] **Step 5: Verify build**

```bash
cd frontend && npx tsc --noEmit
```

Expected: No new errors (existing errors are OK if they pre-date this change).

- [ ] **Step 6: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/tailwind.config.js frontend/src/index.css frontend/index.html
git commit -m "feat(landing): add 3D/GSAP deps, Gantly color tokens, Outfit+WorkSans fonts"
```

---

### Task 2: i18n — add landing translation keys (ES + EN)

**Files:**
- Modify: `frontend/src/i18n/locales/es.json`
- Modify: `frontend/src/i18n/locales/en.json`

- [ ] **Step 1: Add landing keys to es.json**

Add a `"landing"` top-level key to the existing JSON with all section strings. The full object:

```json
"landing": {
  "nav": {
    "patients": "Pacientes",
    "professionals": "Profesionales",
    "clinics": "Clínicas",
    "tests": "Tests",
    "login": "Iniciar sesión",
    "start": "Empezar",
    "language": "EN"
  },
  "hero": {
    "title": "Tu bienestar mental, potenciado por tecnología",
    "subtitle": "Conectamos pacientes con los mejores psicólogos usando IA y tests clínicos validados",
    "cta_patient": "Soy paciente",
    "cta_professional": "Soy profesional"
  },
  "what": {
    "description": "Gantly es la plataforma que conecta salud mental y tecnología. Tests clínicos validados, matching inteligente, videollamadas seguras y seguimiento continuo — todo en un solo lugar.",
    "stat_patients": "pacientes",
    "stat_psychologists": "psicólogos",
    "stat_sessions": "sesiones"
  },
  "flow": {
    "title": "Cómo funciona",
    "step1_title": "Test inicial",
    "step1_desc": "Completa un test de personalidad validado clínicamente para conocer tu perfil psicológico.",
    "step2_title": "Matching inteligente",
    "step2_desc": "Nuestro algoritmo analiza 16 factores de personalidad para encontrar al psicólogo ideal para ti.",
    "step3_title": "Primera sesión",
    "step3_desc": "Conecta con tu psicólogo por videollamada HD en un entorno seguro y privado.",
    "step4_title": "Seguimiento continuo",
    "step4_desc": "Tareas terapéuticas, seguimiento de ánimo y chat seguro entre sesiones."
  },
  "matching": {
    "title": "Matching inteligente",
    "subtitle": "No es aleatorio. Es ciencia.",
    "stat1": "16 factores de personalidad",
    "stat2": "Especialización verificada",
    "stat3": "98% satisfacción",
    "stat4": "Matching en < 24h"
  },
  "videochat": {
    "title": "Sesiones seguras. Comunicación continua.",
    "subtitle": "Videollamadas HD y chat cifrado para que tu terapia no se detenga.",
    "badge": "Cifrado extremo a extremo",
    "chip1": "Videollamadas HD",
    "chip2": "Chat seguro",
    "chip3": "Notas de sesión"
  },
  "professionals": {
    "title": "Herramientas diseñadas para profesionales",
    "subtitle": "Todo lo que necesitas para gestionar tu consulta desde un solo lugar.",
    "card1_title": "Agenda inteligente",
    "card1_desc": "Gestiona tu disponibilidad y deja que los pacientes reserven automáticamente.",
    "card2_title": "Tests clínicos",
    "card2_desc": "16PF, TCA, Ansiedad — aplica tests validados y genera informes detallados.",
    "card3_title": "Facturación automática",
    "card3_desc": "Control de pagos, historial de cobros y exportación CSV con un click.",
    "card4_title": "Panel de pacientes",
    "card4_desc": "Notas clínicas, historial de sesiones y seguimiento del progreso.",
    "cta": "Únete como profesional"
  },
  "clinics": {
    "title": "Gestiona tu clínica desde un solo lugar",
    "subtitle": "ERP completo para clínicas de salud mental.",
    "feature1": "Gestión de equipo de psicólogos",
    "feature2": "Invitaciones por email con token",
    "feature3": "Agenda centralizada",
    "feature4": "Facturación y despachos",
    "feature5": "Chat clínica-paciente",
    "cta": "Solicitar demo"
  },
  "tests": {
    "title": "Tests clínicos validados",
    "subtitle": "Informes detallados con visualización de perfil psicológico.",
    "badge1": "16PF Personalidad",
    "badge2": "TCA Inteligencia",
    "badge3": "Ansiedad",
    "description": "Tests clínicos validados con informes detallados para cada paciente."
  },
  "trust": {
    "title": "Tu seguridad es nuestra prioridad",
    "badge1_title": "RGPD",
    "badge1_desc": "Cumplimiento total del reglamento europeo de protección de datos.",
    "badge2_title": "Cifrado AES-256",
    "badge2_desc": "Tus conversaciones están cifradas de extremo a extremo.",
    "badge3_title": "Datos de salud",
    "badge3_desc": "Protección especial para datos sensibles de salud mental.",
    "badge4_title": "Profesionales verificados",
    "badge4_desc": "Todos los psicólogos pasan un proceso de verificación.",
    "badge5_title": "Pagos seguros",
    "badge5_desc": "Procesamiento de pagos seguro con Stripe.",
    "badge6_title": "Videollamadas privadas",
    "badge6_desc": "Infraestructura propia para máxima privacidad."
  },
  "cta": {
    "title": "Empieza hoy — es gratis",
    "subtitle": "Crea tu cuenta en menos de 2 minutos",
    "cta_patient": "Soy paciente",
    "cta_professional": "Soy profesional"
  },
  "footer": {
    "tagline": "Salud mental potenciada por tecnología",
    "platform": "Plataforma",
    "about": "Sobre nosotros",
    "pricing": "Precios",
    "blog": "Blog",
    "contact": "Contacto",
    "legal": "Legal",
    "privacy": "Privacidad",
    "terms": "Términos",
    "cookies": "Cookies",
    "copyright": "© 2026 Gantly. Todos los derechos reservados."
  }
}
```

- [ ] **Step 2: Add landing keys to en.json**

Same structure with English translations:

```json
"landing": {
  "nav": {
    "patients": "Patients",
    "professionals": "Professionals",
    "clinics": "Clinics",
    "tests": "Tests",
    "login": "Sign in",
    "start": "Get started",
    "language": "ES"
  },
  "hero": {
    "title": "Your mental wellbeing, powered by technology",
    "subtitle": "We connect patients with the best psychologists using AI and clinically validated tests",
    "cta_patient": "I'm a patient",
    "cta_professional": "I'm a professional"
  },
  "what": {
    "description": "Gantly is the platform that connects mental health and technology. Clinically validated tests, smart matching, secure video calls and continuous follow-up — all in one place.",
    "stat_patients": "patients",
    "stat_psychologists": "psychologists",
    "stat_sessions": "sessions"
  },
  "flow": {
    "title": "How it works",
    "step1_title": "Initial test",
    "step1_desc": "Complete a clinically validated personality test to discover your psychological profile.",
    "step2_title": "Smart matching",
    "step2_desc": "Our algorithm analyzes 16 personality factors to find the ideal psychologist for you.",
    "step3_title": "First session",
    "step3_desc": "Connect with your psychologist via HD video call in a secure, private environment.",
    "step4_title": "Continuous follow-up",
    "step4_desc": "Therapeutic tasks, mood tracking and secure chat between sessions."
  },
  "matching": {
    "title": "Smart matching",
    "subtitle": "It's not random. It's science.",
    "stat1": "16 personality factors",
    "stat2": "Verified specialization",
    "stat3": "98% satisfaction",
    "stat4": "Match in < 24h"
  },
  "videochat": {
    "title": "Secure sessions. Continuous communication.",
    "subtitle": "HD video calls and encrypted chat so your therapy never stops.",
    "badge": "End-to-end encrypted",
    "chip1": "HD Video calls",
    "chip2": "Secure chat",
    "chip3": "Session notes"
  },
  "professionals": {
    "title": "Tools designed for professionals",
    "subtitle": "Everything you need to manage your practice from one place.",
    "card1_title": "Smart calendar",
    "card1_desc": "Manage your availability and let patients book automatically.",
    "card2_title": "Clinical tests",
    "card2_desc": "16PF, TCA, Anxiety — apply validated tests and generate detailed reports.",
    "card3_title": "Automatic billing",
    "card3_desc": "Payment control, billing history and CSV export with one click.",
    "card4_title": "Patient panel",
    "card4_desc": "Clinical notes, session history and progress tracking.",
    "cta": "Join as a professional"
  },
  "clinics": {
    "title": "Manage your clinic from one place",
    "subtitle": "Complete ERP for mental health clinics.",
    "feature1": "Psychologist team management",
    "feature2": "Email invitations with token",
    "feature3": "Centralized calendar",
    "feature4": "Billing and offices",
    "feature5": "Clinic-patient chat",
    "cta": "Request demo"
  },
  "tests": {
    "title": "Clinically validated tests",
    "subtitle": "Detailed reports with psychological profile visualization.",
    "badge1": "16PF Personality",
    "badge2": "TCA Intelligence",
    "badge3": "Anxiety",
    "description": "Clinically validated tests with detailed reports for each patient."
  },
  "trust": {
    "title": "Your security is our priority",
    "badge1_title": "GDPR",
    "badge1_desc": "Full compliance with European data protection regulation.",
    "badge2_title": "AES-256 Encryption",
    "badge2_desc": "Your conversations are end-to-end encrypted.",
    "badge3_title": "Health data",
    "badge3_desc": "Special protection for sensitive mental health data.",
    "badge4_title": "Verified professionals",
    "badge4_desc": "All psychologists go through a verification process.",
    "badge5_title": "Secure payments",
    "badge5_desc": "Secure payment processing with Stripe.",
    "badge6_title": "Private video calls",
    "badge6_desc": "Own infrastructure for maximum privacy."
  },
  "cta": {
    "title": "Start today — it's free",
    "subtitle": "Create your account in less than 2 minutes",
    "cta_patient": "I'm a patient",
    "cta_professional": "I'm a professional"
  },
  "footer": {
    "tagline": "Mental health powered by technology",
    "platform": "Platform",
    "about": "About us",
    "pricing": "Pricing",
    "blog": "Blog",
    "contact": "Contact",
    "legal": "Legal",
    "privacy": "Privacy",
    "terms": "Terms",
    "cookies": "Cookies",
    "copyright": "© 2026 Gantly. All rights reserved."
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/i18n/locales/es.json frontend/src/i18n/locales/en.json
git commit -m "feat(landing): add ES/EN landing page translations"
```

---

### Task 3: Shared components — ScrollReveal, SectionWrapper, GlowCard, TiltCard

**Files:**
- Create: `frontend/src/components/landing/shared/ScrollReveal.tsx`
- Create: `frontend/src/components/landing/shared/SectionWrapper.tsx`
- Create: `frontend/src/components/landing/shared/GlowCard.tsx`
- Create: `frontend/src/components/landing/shared/TiltCard.tsx`

- [ ] **Step 1: Create ScrollReveal.tsx**

A reusable Framer Motion wrapper that fades + slides children into view when they enter the viewport.

```tsx
import { motion, type Variants } from 'framer-motion';
import { type ReactNode } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
}

const offsets = { up: [40, 0], down: [-40, 0], left: [0, 40], right: [0, -40] } as const;

export default function ScrollReveal({
  children, direction = 'up', delay = 0, duration = 0.6, className = '', once = true,
}: ScrollRevealProps) {
  const [y, x] = offsets[direction];
  const variants: Variants = {
    hidden: { opacity: 0, y, x },
    visible: { opacity: 1, y: 0, x: 0, transition: { duration, delay, ease: 'easeOut' } },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: '-80px' }}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 2: Create SectionWrapper.tsx**

Consistent section spacing, max-width container, optional dark/light bg.

```tsx
import { type ReactNode } from 'react';

interface SectionWrapperProps {
  children: ReactNode;
  id?: string;
  className?: string;
  dark?: boolean;
  fullWidth?: boolean;
}

export default function SectionWrapper({
  children, id, className = '', dark = false, fullWidth = false,
}: SectionWrapperProps) {
  const bg = dark ? 'bg-gantly-navy text-white' : 'bg-gantly-cloud text-gantly-text';
  return (
    <section id={id} className={`relative py-28 lg:py-36 overflow-hidden ${bg} ${className}`}>
      <div className={fullWidth ? 'w-full' : 'mx-auto max-w-7xl px-6 lg:px-8'}>
        {children}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Create GlowCard.tsx**

Card with animated glow border on hover.

```tsx
import { type ReactNode, useState } from 'react';

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
}

export default function GlowCard({ children, className = '', glowColor = '#22D3EE' }: GlowCardProps) {
  const [hovering, setHovering] = useState(false);

  return (
    <div
      className={`relative rounded-2xl p-px cursor-pointer transition-shadow duration-300 ${className}`}
      style={{
        boxShadow: hovering ? `0 0 30px ${glowColor}33, 0 0 60px ${glowColor}1A` : 'none',
      }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div
        className="absolute inset-0 rounded-2xl transition-opacity duration-300"
        style={{
          background: `linear-gradient(135deg, ${glowColor}44, transparent, ${glowColor}22)`,
          opacity: hovering ? 1 : 0,
        }}
      />
      <div className="relative rounded-2xl bg-gantly-navy/80 backdrop-blur-sm p-6 lg:p-8 h-full border border-white/5">
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create TiltCard.tsx**

3D perspective tilt card that follows mouse position.

```tsx
import { type ReactNode, useRef, useState } from 'react';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  tiltDegree?: number;
}

export default function TiltCard({ children, className = '', tiltDegree = 8 }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('perspective(800px) rotateX(0deg) rotateY(0deg)');

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTransform(`perspective(800px) rotateX(${-y * tiltDegree}deg) rotateY(${x * tiltDegree}deg)`);
  };

  const handleMouseLeave = () => {
    setTransform('perspective(800px) rotateX(0deg) rotateY(0deg)');
  };

  return (
    <div
      ref={ref}
      className={`transition-transform duration-200 ease-out ${className}`}
      style={{ transform }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/landing/shared/
git commit -m "feat(landing): add shared components — ScrollReveal, SectionWrapper, GlowCard, TiltCard"
```

---

### Task 4: Navbar

**Files:**
- Create: `frontend/src/components/landing/Navbar.tsx`

- [ ] **Step 1: Create Navbar.tsx**

Fixed floating glassmorphism navbar with logo, nav links, language toggle, and CTAs.

```tsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, X } from 'lucide-react';
import LogoSvg from '../../assets/logo-gantly.svg';

interface NavbarProps {
  onLogin: () => void;
  onStart: () => void;
}

export default function Navbar({ onLogin, onStart }: NavbarProps) {
  const { t, i18n } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === 'es' ? 'en' : 'es');
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  const navLinks = [
    { label: t('landing.nav.patients'), target: 'flow' },
    { label: t('landing.nav.professionals'), target: 'professionals' },
    { label: t('landing.nav.clinics'), target: 'clinics' },
    { label: t('landing.nav.tests'), target: 'tests' },
  ];

  return (
    <header
      className={`fixed top-4 left-4 right-4 z-50 rounded-2xl border transition-all duration-300 ${
        scrolled
          ? 'bg-gantly-navy/85 backdrop-blur-xl border-gantly-cyan/15 shadow-lg shadow-gantly-navy/20'
          : 'bg-gantly-navy/60 backdrop-blur-lg border-white/5'
      }`}
    >
      <nav className="mx-auto max-w-7xl flex items-center justify-between px-6 py-3">
        {/* Logo */}
        <a href="#" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex-shrink-0">
          <img src={LogoSvg} alt="Gantly" className="h-7 brightness-0 invert" />
        </a>

        {/* Desktop nav links */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <button
              key={link.target}
              onClick={() => scrollTo(link.target)}
              className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-200 cursor-pointer"
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Desktop CTAs + lang toggle */}
        <div className="hidden lg:flex items-center gap-3">
          <button
            onClick={toggleLang}
            className="text-xs font-bold text-gantly-cyan/80 hover:text-gantly-cyan border border-gantly-cyan/20 rounded-lg px-3 py-1.5 transition-colors duration-200 cursor-pointer"
          >
            {t('landing.nav.language')}
          </button>
          <button
            onClick={onLogin}
            className="text-sm font-medium text-white/80 hover:text-white transition-colors duration-200 cursor-pointer"
          >
            {t('landing.nav.login')}
          </button>
          <button
            onClick={onStart}
            className="text-sm font-semibold bg-gantly-gold text-gantly-navy px-5 py-2 rounded-xl hover:bg-gantly-gold/90 transition-all duration-200 cursor-pointer"
          >
            {t('landing.nav.start')}
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="lg:hidden text-white p-2 cursor-pointer"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden border-t border-white/10 px-6 py-4 flex flex-col gap-3">
          {navLinks.map((link) => (
            <button
              key={link.target}
              onClick={() => scrollTo(link.target)}
              className="text-sm text-white/70 hover:text-white text-left py-2 cursor-pointer"
            >
              {link.label}
            </button>
          ))}
          <hr className="border-white/10" />
          <div className="flex items-center gap-3 pt-2">
            <button onClick={toggleLang} className="text-xs font-bold text-gantly-cyan border border-gantly-cyan/20 rounded-lg px-3 py-1.5 cursor-pointer">
              {t('landing.nav.language')}
            </button>
            <button onClick={onLogin} className="text-sm text-white/80 cursor-pointer">{t('landing.nav.login')}</button>
            <button onClick={onStart} className="text-sm font-semibold bg-gantly-gold text-gantly-navy px-4 py-2 rounded-xl cursor-pointer">
              {t('landing.nav.start')}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/landing/Navbar.tsx
git commit -m "feat(landing): add floating glassmorphism navbar with i18n + lang toggle"
```

---

### Task 5: Hero Section + 3D Scene

**Files:**
- Create: `frontend/src/components/landing/HeroSection.tsx`
- Create: `frontend/src/components/landing/Hero3DScene.tsx`

- [ ] **Step 1: Create Hero3DScene.tsx**

React Three Fiber canvas with extruded G logo, dual-color lighting, and floating particles. Uses `Suspense` for loading, disabled on mobile via a `useMediaQuery` check in the parent.

```tsx
import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

function GLogoMesh() {
  const meshRef = useRef<THREE.Mesh>(null);

  const shape = useMemo(() => {
    const s = new THREE.Shape();
    // Simplified G shape — a bold arc with crossbar
    s.moveTo(2, 0);
    s.absarc(0, 0, 2, 0, Math.PI * 1.7, false);
    s.lineTo(-0.6, 1.2);
    s.lineTo(-0.6, 0.6);
    s.absarc(0, 0, 1.4, Math.PI * 1.7, 0, true);
    s.lineTo(1.4, 0);
    s.lineTo(1.4, -0.5);
    s.lineTo(0, -0.5);
    s.lineTo(0, 0);
    s.lineTo(2, 0);
    return s;
  }, []);

  const extrudeSettings = useMemo(() => ({
    depth: 0.6,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.05,
    bevelSegments: 3,
  }), []);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
      <mesh ref={meshRef} position={[0, 0, 0]} scale={0.8}>
        <extrudeGeometry args={[shape, extrudeSettings]} />
        <meshStandardMaterial color="#2E93CC" metalness={0.4} roughness={0.3} />
      </mesh>
    </Float>
  );
}

function Particles() {
  const count = 800;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return arr;
  }, []);

  const ref = useRef<THREE.Points>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.02;
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial transparent color="#22D3EE" size={0.04} sizeAttenuation depthWrite={false} opacity={0.6} />
    </Points>
  );
}

export default function Hero3DScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 50 }}
      style={{ position: 'absolute', inset: 0 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={1.2} color="#22D3EE" />
      <pointLight position={[-5, -3, 3]} intensity={0.8} color="#F0C930" />
      <GLogoMesh />
      <Particles />
    </Canvas>
  );
}
```

- [ ] **Step 2: Create HeroSection.tsx**

Full viewport hero with 3D scene (desktop) or gradient fallback (mobile), kinetic headline, and CTAs.

```tsx
import { lazy, Suspense, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import LogoIcon from '../../assets/logo-gantly-icon.svg';

const Hero3DScene = lazy(() => import('./Hero3DScene'));

interface HeroSectionProps {
  onPatient: () => void;
  onProfessional: () => void;
}

export default function HeroSection({ onPatient, onProfessional }: HeroSectionProps) {
  const { t } = useTranslation();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const words = t('landing.hero.title').split(' ');

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gantly-navy overflow-hidden">
      {/* 3D scene (desktop only) */}
      {isDesktop && (
        <Suspense fallback={null}>
          <Hero3DScene />
        </Suspense>
      )}

      {/* Mobile fallback: static logo + gradient */}
      {!isDesktop && (
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-gantly-navy via-gantly-navy to-gantly-blue/20" />
          <img src={LogoIcon} alt="" className="absolute top-1/4 left-1/2 -translate-x-1/2 w-32 opacity-20" />
        </div>
      )}

      {/* Text overlay */}
      <div className="relative z-10 text-center max-w-4xl mx-auto px-6 pt-24">
        {/* Kinetic headline */}
        <h1 className="font-heading text-4xl sm:text-5xl lg:text-7xl font-800 leading-tight mb-6">
          {words.map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.5, ease: 'easeOut' }}
              className="inline-block mr-[0.3em] text-white"
            >
              {word}
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="font-body text-lg lg:text-xl text-white/60 max-w-2xl mx-auto mb-10"
        >
          {t('landing.hero.subtitle')}
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            onClick={onPatient}
            className="px-8 py-3.5 rounded-xl bg-gantly-gold text-gantly-navy font-heading font-semibold text-base hover:bg-gantly-gold/90 transition-all duration-200 cursor-pointer min-w-[200px]"
          >
            {t('landing.hero.cta_patient')}
          </button>
          <button
            onClick={onProfessional}
            className="px-8 py-3.5 rounded-xl border-2 border-gantly-cyan/50 text-gantly-cyan font-heading font-semibold text-base hover:bg-gantly-cyan/10 transition-all duration-200 cursor-pointer min-w-[200px]"
          >
            {t('landing.hero.cta_professional')}
          </button>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 1.8 }}>
          <ChevronDown className="text-white/40" size={28} />
        </motion.div>
      </motion.div>
    </section>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/landing/HeroSection.tsx frontend/src/components/landing/Hero3DScene.tsx
git commit -m "feat(landing): add hero section with 3D G logo, particles, kinetic headline"
```

---

### Task 6: WhatIsGantly section

**Files:**
- Create: `frontend/src/components/landing/WhatIsGantly.tsx`

- [ ] **Step 1: Create WhatIsGantly.tsx**

Text reveal on scroll, 3 animated stat counters, gradient blobs.

```tsx
import { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import SectionWrapper from './shared/SectionWrapper';
import ScrollReveal from './shared/ScrollReveal';

function AnimatedCounter({ target, label }: { target: number; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);

  return (
    <div ref={ref} className="text-center">
      <div className="font-heading text-4xl lg:text-5xl font-bold text-gantly-blue">
        {count.toLocaleString()}+
      </div>
      <div className="font-body text-gantly-muted mt-1 text-sm">{label}</div>
    </div>
  );
}

export default function WhatIsGantly() {
  const { t } = useTranslation();
  const words = t('landing.what.description').split(' ');

  return (
    <SectionWrapper id="what" className="relative">
      {/* Gradient blobs */}
      <div className="absolute top-20 -left-40 w-96 h-96 rounded-full bg-gantly-cyan/5 blur-3xl" />
      <div className="absolute bottom-20 -right-40 w-96 h-96 rounded-full bg-gantly-gold/5 blur-3xl" />

      <div className="relative max-w-4xl mx-auto">
        {/* Text reveal */}
        <p className="font-heading text-2xl lg:text-4xl font-semibold leading-relaxed text-gantly-text mb-16">
          {words.map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0.15 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-20%' }}
              transition={{ delay: i * 0.03, duration: 0.4 }}
              className="inline-block mr-[0.3em]"
            >
              {word}
            </motion.span>
          ))}
        </p>

        {/* Stat counters */}
        <ScrollReveal>
          <div className="grid grid-cols-3 gap-8">
            <AnimatedCounter target={2000} label={t('landing.what.stat_patients')} />
            <AnimatedCounter target={500} label={t('landing.what.stat_psychologists')} />
            <AnimatedCounter target={15000} label={t('landing.what.stat_sessions')} />
          </div>
        </ScrollReveal>
      </div>
    </SectionWrapper>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/landing/WhatIsGantly.tsx
git commit -m "feat(landing): add WhatIsGantly section — text reveal + animated counters"
```

---

### Task 7: PatientFlow — GSAP horizontal scroll pinning

**Files:**
- Create: `frontend/src/components/landing/PatientFlow.tsx`

- [ ] **Step 1: Create PatientFlow.tsx**

Horizontal scroll section pinned with GSAP ScrollTrigger. 4 panels slide horizontally as user scrolls. Falls back to vertical stack on mobile.

```tsx
import { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ClipboardList, Brain, Video, HeartPulse } from 'lucide-react';
import ScrollReveal from './shared/ScrollReveal';

gsap.registerPlugin(ScrollTrigger);

const icons = [ClipboardList, Brain, Video, HeartPulse];
const colors = ['#2E93CC', '#22D3EE', '#F0C930', '#059669'];

export default function PatientFlow() {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const panelsRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!isDesktop || !containerRef.current || !panelsRef.current) return;
    const panels = panelsRef.current;
    const totalWidth = panels.scrollWidth - window.innerWidth;

    const tween = gsap.to(panels, {
      x: -totalWidth,
      ease: 'none',
      scrollTrigger: {
        trigger: containerRef.current,
        pin: true,
        scrub: 1,
        end: () => `+=${totalWidth}`,
        onUpdate: (self) => setProgress(self.progress),
      },
    });

    return () => { tween.scrollTrigger?.kill(); tween.kill(); };
  }, [isDesktop]);

  const steps = [
    { key: 'step1', icon: icons[0], color: colors[0] },
    { key: 'step2', icon: icons[1], color: colors[1] },
    { key: 'step3', icon: icons[2], color: colors[2] },
    { key: 'step4', icon: icons[3], color: colors[3] },
  ];

  // Mobile: vertical layout
  if (!isDesktop) {
    return (
      <section id="flow" className="py-28 bg-white px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-heading text-3xl font-bold text-gantly-text mb-12 text-center">
            {t('landing.flow.title')}
          </h2>
          <div className="space-y-10">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <ScrollReveal key={step.key} delay={i * 0.1}>
                  <div className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: step.color + '1A' }}>
                      <Icon size={24} style={{ color: step.color }} />
                    </div>
                    <div>
                      <h3 className="font-heading text-lg font-semibold text-gantly-text">
                        {t(`landing.flow.${step.key}_title`)}
                      </h3>
                      <p className="font-body text-gantly-muted mt-1">
                        {t(`landing.flow.${step.key}_desc`)}
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // Desktop: horizontal scroll pinning
  return (
    <section id="flow" ref={containerRef} className="relative h-screen bg-white overflow-hidden">
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100 z-20">
        <div className="h-full bg-gantly-blue transition-none" style={{ width: `${progress * 100}%` }} />
      </div>

      {/* Section title */}
      <div className="absolute top-8 left-8 z-20">
        <h2 className="font-heading text-2xl font-bold text-gantly-text">{t('landing.flow.title')}</h2>
      </div>

      {/* Horizontal panels */}
      <div ref={panelsRef} className="flex h-full items-center">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={step.key} className="flex-shrink-0 w-screen h-full flex items-center justify-center px-20">
              <div className="max-w-lg">
                <div className="text-8xl font-heading font-bold mb-6" style={{ color: step.color + '20' }}>
                  0{i + 1}
                </div>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: step.color + '1A' }}>
                  <Icon size={32} style={{ color: step.color }} />
                </div>
                <h3 className="font-heading text-3xl font-bold text-gantly-text mb-4">
                  {t(`landing.flow.${step.key}_title`)}
                </h3>
                <p className="font-body text-lg text-gantly-muted leading-relaxed">
                  {t(`landing.flow.${step.key}_desc`)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/landing/PatientFlow.tsx
git commit -m "feat(landing): add patient flow section — GSAP horizontal scroll pinning"
```

---

### Task 8: SmartMatching section

**Files:**
- Create: `frontend/src/components/landing/SmartMatching.tsx`

- [ ] **Step 1: Create SmartMatching.tsx**

Dark section with animated SVG connection visualization and staggered stat data points.

```tsx
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { User, Stethoscope } from 'lucide-react';
import SectionWrapper from './shared/SectionWrapper';
import ScrollReveal from './shared/ScrollReveal';

export default function SmartMatching() {
  const { t } = useTranslation();

  const stats = [
    t('landing.matching.stat1'),
    t('landing.matching.stat2'),
    t('landing.matching.stat3'),
    t('landing.matching.stat4'),
  ];

  return (
    <SectionWrapper id="matching" dark className="bg-gradient-to-br from-gantly-navy via-gantly-navy to-[#0F2847]">
      <div className="text-center mb-16">
        <ScrollReveal>
          <h2 className="font-heading text-3xl lg:text-5xl font-bold text-white mb-4">
            {t('landing.matching.title')}
          </h2>
          <p className="font-body text-lg text-white/50">{t('landing.matching.subtitle')}</p>
        </ScrollReveal>
      </div>

      {/* Connection visualization */}
      <ScrollReveal>
        <div className="relative max-w-3xl mx-auto h-48 flex items-center justify-between px-8">
          {/* Patient node */}
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 rounded-full bg-gantly-blue/20 border-2 border-gantly-blue flex items-center justify-center z-10"
          >
            <User size={32} className="text-gantly-blue" />
          </motion.div>

          {/* Animated connection lines */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
            {[0, 1, 2].map((i) => (
              <motion.path
                key={i}
                d={`M 80 100 Q 300 ${60 + i * 40} 520 100`}
                fill="none"
                stroke="#22D3EE"
                strokeWidth="1.5"
                strokeOpacity={0.3 - i * 0.08}
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 + i * 0.2, duration: 1.5, ease: 'easeInOut' }}
              />
            ))}
            {/* Pulse dot traveling along the path */}
            <motion.circle
              r="4"
              fill="#22D3EE"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: [0, 1, 1, 0] }}
              viewport={{ once: true }}
              transition={{ delay: 1.5, duration: 2, repeat: Infinity, repeatDelay: 1 }}
            >
              <animateMotion dur="2s" repeatCount="indefinite" begin="1.5s" path="M 80 100 Q 300 100 520 100" />
            </motion.circle>
          </svg>

          {/* Psychologist node */}
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 rounded-full bg-gantly-gold/20 border-2 border-gantly-gold flex items-center justify-center z-10"
          >
            <Stethoscope size={32} className="text-gantly-gold" />
          </motion.div>
        </div>
      </ScrollReveal>

      {/* Staggered stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-16 max-w-3xl mx-auto">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8 + i * 0.15, duration: 0.5 }}
            className="text-center py-4 px-3 rounded-xl bg-white/5 border border-white/10"
          >
            <span className="font-body text-sm text-gantly-cyan">{stat}</span>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/landing/SmartMatching.tsx
git commit -m "feat(landing): add smart matching section — SVG connection anim + stats"
```

---

### Task 9: VideoChat section

**Files:**
- Create: `frontend/src/components/landing/VideoChat.tsx`

- [ ] **Step 1: Create VideoChat.tsx**

Split screen with CSS-built videocall + chat mockups, floating security badge.

```tsx
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Shield, Mic, Camera, PhoneOff, Video, MessageCircle, FileText } from 'lucide-react';
import SectionWrapper from './shared/SectionWrapper';
import ScrollReveal from './shared/ScrollReveal';

function VideoMockup() {
  return (
    <div className="rounded-2xl bg-gantly-navy overflow-hidden border border-white/10 shadow-2xl">
      {/* Video feeds */}
      <div className="relative aspect-video bg-gradient-to-br from-gantly-navy to-gantly-blue/20 p-4">
        <div className="absolute inset-4 rounded-xl bg-gradient-to-br from-gantly-blue/10 to-gantly-cyan/5 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gantly-blue/20 flex items-center justify-center">
            <span className="font-heading text-xl text-gantly-blue font-bold">P</span>
          </div>
        </div>
        {/* PiP */}
        <div className="absolute bottom-6 right-6 w-28 h-20 rounded-lg bg-gantly-navy/80 border border-white/10 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-gantly-gold/20 flex items-center justify-center">
            <span className="font-heading text-xs text-gantly-gold font-bold">Dr</span>
          </div>
        </div>
      </div>
      {/* Controls */}
      <div className="flex items-center justify-center gap-4 py-3 bg-gantly-navy/90 border-t border-white/10">
        <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center" aria-label="Mic"><Mic size={18} className="text-white" /></button>
        <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center" aria-label="Camera"><Camera size={18} className="text-white" /></button>
        <button className="w-12 h-10 rounded-full bg-red-500 flex items-center justify-center" aria-label="End call"><PhoneOff size={18} className="text-white" /></button>
      </div>
    </div>
  );
}

function ChatMockup() {
  const messages = [
    { from: 'psych', text: '¿Cómo te has sentido esta semana?', delay: 0.3 },
    { from: 'patient', text: 'Mejor que la anterior, he seguido los ejercicios.', delay: 0.8 },
    { from: 'psych', text: '¡Genial! Eso es un gran avance. Vamos a revisar tu diario de ánimo.', delay: 1.4 },
  ];

  return (
    <div className="rounded-2xl bg-white border border-gray-200 shadow-xl overflow-hidden">
      <div className="px-4 py-3 bg-gantly-cloud border-b border-gray-100 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gantly-blue/20 flex items-center justify-center">
          <span className="text-xs font-bold text-gantly-blue">Dr</span>
        </div>
        <span className="font-heading text-sm font-semibold text-gantly-text">Dr. García</span>
        <span className="ml-auto w-2 h-2 rounded-full bg-gantly-emerald" />
      </div>
      <div className="p-4 space-y-3 min-h-[240px]">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: msg.delay, duration: 0.4 }}
            className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
              msg.from === 'psych'
                ? 'bg-gantly-cloud text-gantly-text'
                : 'bg-gantly-blue text-white ml-auto'
            }`}
          >
            {msg.text}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function VideoChat() {
  const { t } = useTranslation();
  const chips = [
    { icon: Video, label: t('landing.videochat.chip1') },
    { icon: MessageCircle, label: t('landing.videochat.chip2') },
    { icon: FileText, label: t('landing.videochat.chip3') },
  ];

  return (
    <SectionWrapper id="videochat">
      <div className="text-center mb-16">
        <ScrollReveal>
          <h2 className="font-heading text-3xl lg:text-5xl font-bold text-gantly-text mb-4">
            {t('landing.videochat.title')}
          </h2>
          <p className="font-body text-lg text-gantly-muted">{t('landing.videochat.subtitle')}</p>
        </ScrollReveal>
      </div>

      <div className="grid lg:grid-cols-5 gap-8 items-center">
        <ScrollReveal direction="left" className="lg:col-span-3">
          <VideoMockup />
        </ScrollReveal>
        <ScrollReveal direction="right" className="lg:col-span-2">
          <ChatMockup />
          {/* Security badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 1.8, duration: 0.4 }}
            className="flex items-center gap-2 mt-4 bg-gantly-emerald/10 border border-gantly-emerald/20 rounded-xl px-4 py-2.5 w-fit"
          >
            <Shield size={16} className="text-gantly-emerald" />
            <span className="font-body text-sm font-medium text-gantly-emerald">{t('landing.videochat.badge')}</span>
          </motion.div>
        </ScrollReveal>
      </div>

      {/* Feature chips */}
      <ScrollReveal>
        <div className="flex flex-wrap justify-center gap-4 mt-12">
          {chips.map((chip) => {
            const Icon = chip.icon;
            return (
              <div key={chip.label} className="flex items-center gap-2 bg-white rounded-full px-5 py-2.5 border border-gray-200 shadow-sm">
                <Icon size={16} className="text-gantly-blue" />
                <span className="font-body text-sm text-gantly-text">{chip.label}</span>
              </div>
            );
          })}
        </div>
      </ScrollReveal>
    </SectionWrapper>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/landing/VideoChat.tsx
git commit -m "feat(landing): add videochat section — mockups + security badge"
```

---

### Task 10: ForProfessionals section

**Files:**
- Create: `frontend/src/components/landing/ForProfessionals.tsx`

- [ ] **Step 1: Create ForProfessionals.tsx**

Dark section with 4 GlowCards using TiltCard hover, plus CTA.

```tsx
import { useTranslation } from 'react-i18next';
import { Calendar, ClipboardCheck, Receipt, Users } from 'lucide-react';
import SectionWrapper from './shared/SectionWrapper';
import ScrollReveal from './shared/ScrollReveal';
import GlowCard from './shared/GlowCard';
import TiltCard from './shared/TiltCard';

const cards = [
  { key: 'card1', icon: Calendar, color: '#2E93CC' },
  { key: 'card2', icon: ClipboardCheck, color: '#22D3EE' },
  { key: 'card3', icon: Receipt, color: '#F0C930' },
  { key: 'card4', icon: Users, color: '#059669' },
];

interface ForProfessionalsProps {
  onJoin: () => void;
}

export default function ForProfessionals({ onJoin }: ForProfessionalsProps) {
  const { t } = useTranslation();

  return (
    <SectionWrapper id="professionals" dark className="bg-[#0F172A]">
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative">
        <div className="text-center mb-16">
          <ScrollReveal>
            <h2 className="font-heading text-3xl lg:text-5xl font-bold text-white mb-4">
              {t('landing.professionals.title')}
            </h2>
            <p className="font-body text-lg text-white/50">{t('landing.professionals.subtitle')}</p>
          </ScrollReveal>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <ScrollReveal key={card.key} delay={i * 0.1}>
                <TiltCard>
                  <GlowCard glowColor={card.color}>
                    <Icon size={28} style={{ color: card.color }} className="mb-4" />
                    <h3 className="font-heading text-lg font-semibold text-white mb-2">
                      {t(`landing.professionals.${card.key}_title`)}
                    </h3>
                    <p className="font-body text-sm text-white/60 leading-relaxed">
                      {t(`landing.professionals.${card.key}_desc`)}
                    </p>
                  </GlowCard>
                </TiltCard>
              </ScrollReveal>
            );
          })}
        </div>

        <ScrollReveal>
          <div className="text-center mt-12">
            <button
              onClick={onJoin}
              className="px-8 py-3.5 rounded-xl bg-gantly-gold text-gantly-navy font-heading font-semibold text-base hover:bg-gantly-gold/90 transition-all duration-200 cursor-pointer"
            >
              {t('landing.professionals.cta')}
            </button>
          </div>
        </ScrollReveal>
      </div>
    </SectionWrapper>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/landing/ForProfessionals.tsx
git commit -m "feat(landing): add professionals section — glow cards with 3D tilt"
```

---

### Task 11: ForClinics section

**Files:**
- Create: `frontend/src/components/landing/ForClinics.tsx`

- [ ] **Step 1: Create ForClinics.tsx**

Light section with feature checklist (left) and fake dashboard preview (right).

```tsx
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import SectionWrapper from './shared/SectionWrapper';
import ScrollReveal from './shared/ScrollReveal';

function DashboardPreview() {
  return (
    <div className="rounded-2xl bg-white border border-gray-200 shadow-xl overflow-hidden">
      {/* Fake top bar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gantly-navy border-b border-white/10">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <span className="text-xs text-white/50 font-body ml-2">clinic.gantly.com</span>
      </div>
      {/* Fake dashboard content */}
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-heading text-sm font-semibold text-gantly-text">Panel de clínica</span>
          <span className="text-xs bg-gantly-emerald/10 text-gantly-emerald px-2 py-1 rounded-md font-medium">Activa</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Psicólogos', value: '12' },
            { label: 'Pacientes', value: '184' },
            { label: 'Sesiones/mes', value: '340' },
          ].map((stat) => (
            <div key={stat.label} className="bg-gantly-cloud rounded-lg p-3 text-center">
              <div className="font-heading text-xl font-bold text-gantly-blue">{stat.value}</div>
              <div className="text-xs text-gantly-muted mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
        {/* Fake chart bars */}
        <div className="flex items-end gap-2 h-20 pt-4">
          {[40, 65, 55, 80, 70, 90, 75].map((h, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              whileInView={{ height: `${h}%` }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + i * 0.08, duration: 0.5, ease: 'easeOut' }}
              className="flex-1 rounded-t bg-gantly-blue/70"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ForClinics() {
  const { t } = useTranslation();
  const features = ['feature1', 'feature2', 'feature3', 'feature4', 'feature5'];

  return (
    <SectionWrapper id="clinics">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <ScrollReveal>
            <h2 className="font-heading text-3xl lg:text-5xl font-bold text-gantly-text mb-4">
              {t('landing.clinics.title')}
            </h2>
            <p className="font-body text-lg text-gantly-muted mb-8">{t('landing.clinics.subtitle')}</p>
          </ScrollReveal>

          <div className="space-y-4">
            {features.map((key, i) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
                className="flex items-center gap-3"
              >
                <div className="w-6 h-6 rounded-full bg-gantly-emerald/10 flex items-center justify-center flex-shrink-0">
                  <Check size={14} className="text-gantly-emerald" />
                </div>
                <span className="font-body text-gantly-text">{t(`landing.clinics.${key}`)}</span>
              </motion.div>
            ))}
          </div>

          <ScrollReveal>
            <button className="mt-8 px-8 py-3.5 rounded-xl border-2 border-gantly-blue text-gantly-blue font-heading font-semibold hover:bg-gantly-blue/5 transition-all duration-200 cursor-pointer">
              {t('landing.clinics.cta')}
            </button>
          </ScrollReveal>
        </div>

        <ScrollReveal direction="right">
          <DashboardPreview />
        </ScrollReveal>
      </div>
    </SectionWrapper>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/landing/ForClinics.tsx
git commit -m "feat(landing): add clinics section — feature list + dashboard preview"
```

---

### Task 12: TestsPreview section

**Files:**
- Create: `frontend/src/components/landing/TestsPreview.tsx`

- [ ] **Step 1: Create TestsPreview.tsx**

Radar chart SVG, animated bipolar bars, test type badges.

```tsx
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import SectionWrapper from './shared/SectionWrapper';
import ScrollReveal from './shared/ScrollReveal';

const radarData = [
  { label: 'A', value: 8 },
  { label: 'E', value: 7 },
  { label: 'F', value: 5 },
  { label: 'G', value: 7 },
  { label: 'H', value: 8 },
  { label: 'I', value: 4 },
  { label: 'L', value: 6 },
  { label: 'M', value: 8 },
];

function RadarChart() {
  const cx = 150, cy = 150, r = 110;
  const n = radarData.length;

  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / n - Math.PI / 2;
    const dist = (value / 10) * r;
    return { x: cx + Math.cos(angle) * dist, y: cy + Math.sin(angle) * dist };
  };

  const dataPoints = radarData.map((d, i) => getPoint(i, d.value));
  const pathD = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  return (
    <svg viewBox="0 0 300 300" className="w-full max-w-xs mx-auto">
      {/* Grid circles */}
      {[2, 4, 6, 8, 10].map((v) => (
        <circle key={v} cx={cx} cy={cy} r={(v / 10) * r} fill="none" stroke="#2E93CC" strokeOpacity={0.1} strokeWidth={1} />
      ))}
      {/* Axis lines */}
      {radarData.map((_, i) => {
        const p = getPoint(i, 10);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#2E93CC" strokeOpacity={0.15} strokeWidth={1} />;
      })}
      {/* Data polygon */}
      <motion.path
        d={pathD}
        fill="#2E93CC"
        fillOpacity={0.15}
        stroke="#2E93CC"
        strokeWidth={2}
        initial={{ opacity: 0, scale: 0.5 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />
      {/* Data points */}
      {dataPoints.map((p, i) => (
        <motion.circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={4}
          fill="#2E93CC"
          stroke="white"
          strokeWidth={2}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 + i * 0.05 }}
        />
      ))}
      {/* Labels */}
      {radarData.map((d, i) => {
        const p = getPoint(i, 12);
        return (
          <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" className="fill-gantly-muted text-xs font-heading font-bold">
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}

function BipolarBar({ label, value, maxLabel }: { label: string; value: number; maxLabel: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-24 text-right text-gantly-muted font-body truncate">{label}</span>
      <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gantly-blue rounded-full"
          initial={{ width: 0 }}
          whileInView={{ width: `${value * 10}%` }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      <span className="w-24 text-gantly-muted font-body truncate">{maxLabel}</span>
    </div>
  );
}

export default function TestsPreview() {
  const { t } = useTranslation();
  const badges = [t('landing.tests.badge1'), t('landing.tests.badge2'), t('landing.tests.badge3')];

  return (
    <SectionWrapper id="tests" className="bg-gradient-to-b from-gantly-cloud to-gantly-ice">
      <div className="text-center mb-16">
        <ScrollReveal>
          <h2 className="font-heading text-3xl lg:text-5xl font-bold text-gantly-text mb-4">
            {t('landing.tests.title')}
          </h2>
          <p className="font-body text-lg text-gantly-muted">{t('landing.tests.subtitle')}</p>
        </ScrollReveal>
      </div>

      <div className="grid lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
        <ScrollReveal>
          <RadarChart />
        </ScrollReveal>

        <ScrollReveal direction="right">
          <div className="space-y-4">
            <BipolarBar label="Reservado" value={8} maxLabel="Abierto" />
            <BipolarBar label="Sumiso" value={7} maxLabel="Dominante" />
            <BipolarBar label="Serio" value={5} maxLabel="Animado" />
            <BipolarBar label="Práctico" value={8} maxLabel="Imaginativo" />
            <BipolarBar label="Sereno" value={4} maxLabel="Aprensivo" />
          </div>

          <div className="flex flex-wrap gap-3 mt-8">
            {badges.map((badge) => (
              <span key={badge} className="bg-gantly-blue/10 text-gantly-blue font-heading text-xs font-semibold px-4 py-2 rounded-full">
                {badge}
              </span>
            ))}
          </div>

          <p className="font-body text-gantly-muted mt-6">{t('landing.tests.description')}</p>
        </ScrollReveal>
      </div>
    </SectionWrapper>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/landing/TestsPreview.tsx
git commit -m "feat(landing): add tests preview section — radar chart + bipolar bars"
```

---

### Task 13: TrustSecurity section

**Files:**
- Create: `frontend/src/components/landing/TrustSecurity.tsx`

- [ ] **Step 1: Create TrustSecurity.tsx**

```tsx
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Shield, Lock, HeartPulse, BadgeCheck, CreditCard, Video } from 'lucide-react';
import SectionWrapper from './shared/SectionWrapper';
import ScrollReveal from './shared/ScrollReveal';

const badges = [
  { key: 'badge1', icon: Shield, color: '#059669' },
  { key: 'badge2', icon: Lock, color: '#2E93CC' },
  { key: 'badge3', icon: HeartPulse, color: '#22D3EE' },
  { key: 'badge4', icon: BadgeCheck, color: '#F0C930' },
  { key: 'badge5', icon: CreditCard, color: '#2E93CC' },
  { key: 'badge6', icon: Video, color: '#059669' },
];

export default function TrustSecurity() {
  const { t } = useTranslation();

  return (
    <SectionWrapper id="trust" className="bg-white">
      <div className="text-center mb-16">
        <ScrollReveal>
          <h2 className="font-heading text-3xl lg:text-5xl font-bold text-gantly-text">
            {t('landing.trust.title')}
          </h2>
        </ScrollReveal>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {badges.map((badge, i) => {
          const Icon = badge.icon;
          return (
            <motion.div
              key={badge.key}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4, ease: 'easeOut' }}
              className="flex items-start gap-4 p-5 rounded-2xl bg-gantly-cloud border border-gray-100 hover:border-gray-200 transition-colors duration-200"
            >
              <div
                className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: badge.color + '15' }}
              >
                <Icon size={20} style={{ color: badge.color }} />
              </div>
              <div>
                <h3 className="font-heading text-sm font-semibold text-gantly-text mb-1">
                  {t(`landing.trust.${badge.key}_title`)}
                </h3>
                <p className="font-body text-xs text-gantly-muted leading-relaxed">
                  {t(`landing.trust.${badge.key}_desc`)}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </SectionWrapper>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/landing/TrustSecurity.tsx
git commit -m "feat(landing): add trust & security section — animated badge grid"
```

---

### Task 14: FinalCTA + Footer

**Files:**
- Create: `frontend/src/components/landing/FinalCTA.tsx`
- Create: `frontend/src/components/landing/Footer.tsx`

- [ ] **Step 1: Create FinalCTA.tsx**

Dark section with particle-like background (CSS), large headline, 2 CTAs.

```tsx
import { useTranslation } from 'react-i18next';
import ScrollReveal from './shared/ScrollReveal';

interface FinalCTAProps {
  onPatient: () => void;
  onProfessional: () => void;
}

export default function FinalCTA({ onPatient, onProfessional }: FinalCTAProps) {
  const { t } = useTranslation();

  return (
    <section className="relative py-32 bg-gantly-navy overflow-hidden">
      {/* CSS particle-like dots */}
      <div className="absolute inset-0">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-gantly-cyan/20"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Gradient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gantly-blue/5 blur-3xl" />

      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <ScrollReveal>
          <h2 className="font-heading text-4xl lg:text-6xl font-bold text-white mb-4">
            {t('landing.cta.title')}
          </h2>
          <p className="font-body text-lg text-white/50 mb-10">{t('landing.cta.subtitle')}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onPatient}
              className="px-8 py-4 rounded-xl bg-gantly-gold text-gantly-navy font-heading font-semibold text-lg hover:bg-gantly-gold/90 transition-all duration-200 cursor-pointer min-w-[220px]"
            >
              {t('landing.cta.cta_patient')}
            </button>
            <button
              onClick={onProfessional}
              className="px-8 py-4 rounded-xl border-2 border-gantly-cyan/50 text-gantly-cyan font-heading font-semibold text-lg hover:bg-gantly-cyan/10 transition-all duration-200 cursor-pointer min-w-[220px]"
            >
              {t('landing.cta.cta_professional')}
            </button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create Footer.tsx**

```tsx
import { useTranslation } from 'react-i18next';
import LogoSvg from '../../assets/logo-gantly.svg';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-[#070E1A] text-white/60 py-16 px-6">
      <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Logo + tagline */}
        <div>
          <img src={LogoSvg} alt="Gantly" className="h-6 brightness-0 invert mb-4" />
          <p className="font-body text-sm leading-relaxed">{t('landing.footer.tagline')}</p>
        </div>

        {/* Platform links */}
        <div>
          <h4 className="font-heading text-xs font-bold text-white uppercase tracking-wider mb-4">
            {t('landing.footer.platform')}
          </h4>
          <ul className="space-y-2 font-body text-sm">
            <li><a href="/about" className="hover:text-white transition-colors duration-200">{t('landing.footer.about')}</a></li>
            <li><a href="/pricing" className="hover:text-white transition-colors duration-200">{t('landing.footer.pricing')}</a></li>
            <li><a href="#" className="hover:text-white transition-colors duration-200">{t('landing.footer.blog')}</a></li>
            <li><a href="#" className="hover:text-white transition-colors duration-200">{t('landing.footer.contact')}</a></li>
          </ul>
        </div>

        {/* Legal links */}
        <div>
          <h4 className="font-heading text-xs font-bold text-white uppercase tracking-wider mb-4">
            {t('landing.footer.legal')}
          </h4>
          <ul className="space-y-2 font-body text-sm">
            <li><a href="#" className="hover:text-white transition-colors duration-200">{t('landing.footer.privacy')}</a></li>
            <li><a href="#" className="hover:text-white transition-colors duration-200">{t('landing.footer.terms')}</a></li>
            <li><a href="#" className="hover:text-white transition-colors duration-200">{t('landing.footer.cookies')}</a></li>
          </ul>
        </div>

        {/* Contact placeholder */}
        <div>
          <h4 className="font-heading text-xs font-bold text-white uppercase tracking-wider mb-4">
            {t('landing.footer.contact')}
          </h4>
          <p className="font-body text-sm">info@gantly.com</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl mt-12 pt-8 border-t border-white/10 text-center">
        <p className="font-body text-xs">{t('landing.footer.copyright')}</p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/landing/FinalCTA.tsx frontend/src/components/landing/Footer.tsx
git commit -m "feat(landing): add final CTA section + footer"
```

---

### Task 15: Landing orchestrator + App.tsx integration

**Files:**
- Create: `frontend/src/components/landing/Landing.tsx`
- Modify: `frontend/src/App.tsx` (lines 6, 443-448)

- [ ] **Step 1: Create Landing.tsx orchestrator**

Imports all sections and composes them. Receives navigation callbacks from App.tsx.

```tsx
import Navbar from './Navbar';
import HeroSection from './HeroSection';
import WhatIsGantly from './WhatIsGantly';
import PatientFlow from './PatientFlow';
import SmartMatching from './SmartMatching';
import VideoChat from './VideoChat';
import ForProfessionals from './ForProfessionals';
import ForClinics from './ForClinics';
import TestsPreview from './TestsPreview';
import TrustSecurity from './TrustSecurity';
import FinalCTA from './FinalCTA';
import Footer from './Footer';

interface LandingProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onShowAbout: () => void;
  onShowSoyProfesional: () => void;
}

export default function Landing({ onGetStarted, onLogin, onShowSoyProfesional }: LandingProps) {
  return (
    <div className="font-body">
      <Navbar onLogin={onLogin} onStart={onGetStarted} />
      <main>
        <HeroSection onPatient={onGetStarted} onProfessional={onShowSoyProfesional} />
        <WhatIsGantly />
        <PatientFlow />
        <SmartMatching />
        <VideoChat />
        <ForProfessionals onJoin={onShowSoyProfesional} />
        <ForClinics />
        <TestsPreview />
        <TrustSecurity />
        <FinalCTA onPatient={onGetStarted} onProfessional={onShowSoyProfesional} />
      </main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 2: Update App.tsx import**

In `frontend/src/App.tsx`, change line 6 from:
```tsx
import Landing from './components/Landing';
```
to:
```tsx
import Landing from './components/landing/Landing';
```

The route at lines 443-448 stays the same — the `LandingProps` interface matches the existing callback props.

- [ ] **Step 3: Verify build**

```bash
cd frontend && npx tsc --noEmit
```

Fix any TypeScript errors that come up (likely just the import path).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/landing/Landing.tsx frontend/src/App.tsx
git commit -m "feat(landing): add Landing orchestrator + update App.tsx import"
```

---

### Task 16: Final verification and cleanup

**Files:**
- Delete (optional): `frontend/src/components/Landing.tsx` (old landing page)

- [ ] **Step 1: Run TypeScript check**

```bash
cd frontend && npx tsc --noEmit
```

Expected: No errors related to landing components.

- [ ] **Step 2: Run dev server and visual check**

```bash
cd frontend && npm run dev
```

Open `http://localhost:5173` and verify:
- Navbar renders with glassmorphism, lang toggle works
- Hero: 3D G logo visible on desktop, gradient fallback on mobile
- Kinetic headline words animate in sequence
- Scroll down: sections reveal with animations
- Patient flow: horizontal scroll pins on desktop, vertical on mobile
- Smart matching: SVG lines animate, nodes scale in
- Video/chat mockups render correctly
- Professional cards have glow + tilt on hover
- Clinics dashboard preview bars animate
- Radar chart renders with animation
- Trust badges scale in on scroll
- Final CTA is visible
- Footer links are correct
- ES/EN toggle switches all text

- [ ] **Step 3: Delete old Landing.tsx**

```bash
rm frontend/src/components/Landing.tsx
```

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat(landing): complete landing page redesign — remove old Landing.tsx"
```
