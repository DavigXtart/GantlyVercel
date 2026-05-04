# Sesión 2026-05-05 — Landing Page Redesign

## Resumen
Rediseño completo de la landing page de Gantly. Se creó una estructura modular con 12 secciones, animaciones con Framer Motion, i18n ES/EN, y un design system propio.

## Lo que se hizo

### Diseño y planificación
- **Design spec**: `docs/superpowers/specs/2026-05-04-landing-page-design.md` (263 líneas)
- **Plan de implementación**: `docs/superpowers/plans/2026-05-04-landing-page.md` (16 tareas, 2185 líneas)
- **Design system**: `design-system/gantly/MASTER.md` + `design-system/gantly/pages/landing.md`
- Skills usados: brainstorming, writing-plans, subagent-driven-development, ui-ux-pro-max

### Infraestructura
- **Dependencias nuevas**: three, @react-three/fiber (v8), @react-three/drei (v9), gsap, @gsap/react, @types/three
- **Tailwind config**: Colores gantly-* (navy, blue, cyan, gold, cloud, ice, emerald, text, muted) + fontFamily heading/body
- **Google Fonts**: Outfit (headings) + Work Sans (body)
- **i18n**: Import añadido a `main.tsx` (faltaba — las traducciones no cargaban), keys `landing.*` en es.json y en.json
- **index.html**: Preconnect a Google Fonts

### Componentes creados (16 archivos nuevos)
```
frontend/src/components/landing/
├── Landing.tsx              — Orquestador principal
├── Navbar.tsx               — Glassmorphism flotante, lang toggle ES/EN
├── HeroSection.tsx          — Layout asimétrico: texto izq + mockup derecha
├── Hero3DScene.tsx          — Mockup del dashboard con stats, sesiones, 16PF
├── WhatIsGantly.tsx         — Text reveal + stat counters animados
├── PatientFlow.tsx          — 4 tarjetas dark con iconos y timeline
├── SmartMatching.tsx        — SVG animado patient→psychologist + stats
├── VideoChat.tsx            — Mockups CSS de videollamada + chat
├── ForProfessionals.tsx     — 4 GlowCards con TiltCard hover
├── ForClinics.tsx           — Feature list + dashboard preview animado
├── TestsPreview.tsx         — Radar chart SVG + bipolar bars + badges
├── TrustSecurity.tsx        — 6 badges de seguridad con animación
├── FinalCTA.tsx             — CTAs con partículas CSS
├── Footer.tsx               — 4 columnas, logo, links, copyright
└── shared/
    ├── ScrollReveal.tsx     — Wrapper Framer Motion whileInView
    ├── SectionWrapper.tsx   — Spacing + max-width consistente
    ├── GlowCard.tsx         — Card con borde glow en hover
    └── TiltCard.tsx         — Perspectiva 3D en hover
```

### Archivos modificados
- `frontend/src/main.tsx` — Añadido `import './i18n/config'`
- `frontend/src/App.tsx` — Import cambiado a `./components/landing/Landing`
- `frontend/tailwind.config.js` — Colores gantly-* + fontFamily
- `frontend/src/index.css` — Fonts Outfit+WorkSans, removed old landing vars
- `frontend/index.html` — Font preconnect
- `frontend/src/i18n/locales/es.json` — Keys `landing.*` completas
- `frontend/src/i18n/locales/en.json` — Keys `landing.*` completas

### Archivo eliminado
- `frontend/src/components/Landing.tsx` — Landing vieja monolítica (413 líneas)

## Problemas encontrados y resueltos
1. **i18n no cargaba** — `i18n/config.ts` existía pero nadie lo importaba en main.tsx → textos mostraban keys crudas
2. **3D G logo roto** — Three.js Shape con arcos hardcodeados no se parecía al logo real → reemplazado por mockup CSS del producto
3. **Hero genérico "de IA"** — Blobs+partículas genéricas → layout asimétrico con mockup del dashboard real
4. **PatientFlow blanco vacío** — GSAP horizontal scroll dejaba páginas de blanco → tarjetas compactas con fondo dark
5. **@react-three/fiber v9 requiere React 19** — Pinned a v8 para compatibilidad con React 18

## Estado actual — Pendientes de refinar
El usuario indicó que hay cosas que le gustan y otras que no. Para la próxima sesión:
- **Revisar visualmente** cada sección con el usuario y ajustar lo que no le convence
- **Hero**: el mockup del dashboard puede necesitar ajustes de tamaño/contenido
- **PatientFlow**: ahora es dark — verificar que el usuario prefiere esto al blanco
- **Secciones intermedias**: SmartMatching, VideoChat, ForProfessionals — revisar feedback
- **Three.js**: se instaló pero ya no se usa (hero es CSS). Considerar desinstalar o usar en otra sección
- **GSAP**: se instaló pero PatientFlow ya no usa horizontal scroll. Considerar desinstalar o usar en otro efecto
- **prefers-reduced-motion**: verificar que funciona en todas las secciones

## Palette Gantly
| Token | Hex | Uso |
|-------|-----|-----|
| gantly-navy | #0A1628 | Hero bg, dark sections, footer |
| gantly-blue | #2E93CC | Primary, links |
| gantly-cyan | #22D3EE | Accents, glowing borders |
| gantly-gold | #F0C930 | CTAs, highlights |
| gantly-cloud | #F0F8FF | Light section bg |
| gantly-ice | #ECFEFF | Cards, secondary bg |
| gantly-emerald | #059669 | Trust badges, verification |
| gantly-text | #0F172A | Headings on light bg |
| gantly-muted | #475569 | Body text |

## Commits (10)
- `715fdc2` refactor(landing): redesign hero + patient flow sections
- `843ac8e` fix(landing): initialize i18n + replace broken 3D hero
- `03845e0` fix(landing): destructure unused onShowAbout prop
- `99617fb` feat(landing): add FinalCTA, Footer, Landing orchestrator
- `54f291b` feat(landing): add ForProfessionals, ForClinics, TestsPreview, TrustSecurity
- `be2416b` feat(landing): add WhatIsGantly, PatientFlow, SmartMatching, VideoChat
- `0646663` feat(landing): add navbar + hero section with 3D
- `05a6b2e` feat(landing): add shared components
- `68048c4` feat: landing redesign foundations — deps, Tailwind tokens, fonts, i18n
- `8ae74b7` docs: add landing page implementation plan
