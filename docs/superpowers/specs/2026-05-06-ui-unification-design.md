# UI Unification Design — Gantly Frontend

**Fecha:** 2026-05-06
**Objetivo:** Eliminar aspecto "hecho con IA", unificar sistema de diseno, mejorar cohesion visual tomando la landing como referencia.

---

## 1. Sistema de Diseno Unificado

### Tokens de color (ya definidos en tailwind.config.js)

| Token | Hex | Uso |
|-------|-----|-----|
| `gantly-blue` | `#2E93CC` | Primary actions, links, active states, focus rings |
| `gantly-cyan` | `#22D3EE` | Sidebar accent, highlight borders |
| `gantly-navy` | `#0A1628` | Sidebar bg, dark surfaces |
| `gantly-gold` | `#F0C930` | Warnings, star ratings |
| `gantly-emerald` | `#059669` | Success, paid badges, positive states |
| `gantly-cloud` | `#F0F8FF` | Light section backgrounds |
| `gantly-text` | `#0F172A` | Primary text |
| `gantly-muted` | `#475569` | Secondary text (minimum contrast on white) |

### Regla: NO usar colores genericos de Tailwind

Eliminar completamente:
- `blue-500`, `blue-600`, `indigo-500`, `indigo-600` -> `gantly-blue`
- `violet-500`, `purple-500`, `fuchsia-500` -> `gantly-blue` o `gantly-cyan`
- `green-500`, `green-600` -> `gantly-emerald`
- `gray-*` -> `slate-*` (consistency)

### Card pattern unico

```
bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6
```

- Hover interactivo: `hover:shadow-md hover:border-gantly-blue/20 transition-all duration-200`
- No usar: `rounded-xl`, `shadow-soft`, `shadow-card`, `shadow-elevated` para cards normales
- Modales: `rounded-2xl shadow-xl` (elevation mayor)

### Contraste minimo

- Body text: `text-gantly-text` (#0F172A) o `text-slate-700` minimo
- Secondary text: `text-gantly-muted` (#475569) o `text-slate-500` minimo
- NUNCA: `text-slate-400` ni `text-slate-300` para texto legible (solo placeholders/decorativo)
- Table headers: `text-xs font-medium text-slate-500 uppercase tracking-wider`
- Sidebar disabled: `text-slate-400` (no `text-slate-600` en fondo oscuro)

### Focus states

```
focus:outline-none focus:ring-2 focus:ring-gantly-blue/20 focus:border-gantly-blue
```

No usar: `focus:ring-blue-500/20`, `focus:border-blue-400`

---

## 2. Reemplazo de Emojis por Lucide Icons

### EmptyState.tsx — Cambio de API

```tsx
// ANTES
icon = '📭'
<div className="text-6xl mb-4">{icon}</div>

// DESPUES
icon: React.ReactNode = <Inbox className="w-12 h-12 text-slate-300" />
<div className="mb-4">{icon}</div>
```

Cambiar prop `icon` de `string` a `React.ReactNode`. Actualizar todos los callsites.

### Tabla de reemplazos

| Archivo | Emoji | Icono Lucide | Import |
|---------|-------|-------------|--------|
| `EmptyState.tsx` | 📭 | `<Inbox>` | `Inbox` |
| `ChatWidget.tsx:330` | 💬 | `<MessageCircle>` | `MessageCircle` |
| `ChatWidget.tsx:340` | 👥 | `<Users>` | `Users` |
| `ChatWidget.tsx:380,467` | 👤 | `<User>` | `User` |
| `ChatWidget.tsx:533` | 👨‍⚕️ | `<Stethoscope>` | `Stethoscope` |
| `MatchingAnimation.tsx:20` | 🎓 | `<GraduationCap>` | `GraduationCap` |
| `MatchingAnimation.tsx:27` | 🎯 | `<Target>` | `Target` |
| `MatchingAnimation.tsx:34` | 📊 | `<BarChart3>` | `BarChart3` |
| `MatchingAnimation.tsx:41` | 💬 | `<MessageCircle>` | `MessageCircle` |
| `MatchingAnimation.tsx:48` | 👥 | `<Users>` | `Users` |
| `MatchingAnimation.tsx:55` | ⚡ | `<Zap>` | `Zap` |
| `MatchingAnimation.tsx:62` | 💊 | `<Pill>` | `Pill` |
| `MatchingAnimation.tsx:69` | ⚖️ | `<Scale>` | `Scale` |
| `MatchingAnimation.tsx:198` | 🧮 | `<Calculator>` | `Calculator` |
| `MatchingAnimation.tsx:244` | ✨ | `<Sparkles>` | `Sparkles` |
| `RegisterPsychologist.tsx:132` | 👤 | `<User>` | `User` |
| `RegisterPsychologist.tsx:133` | 🎓 | `<GraduationCap>` | `GraduationCap` |
| `RegisterPsychologist.tsx:134` | 🔒 | `<Lock>` | `Lock` |
| `RegisterPsychologist.tsx:135` | ✅ | `<CheckCircle>` | `CheckCircle` |
| `TestManager.tsx:934,999` | ✏️ | `<Pencil>` | `Pencil` |
| `TestManager.tsx:949,1007` | 🗑️ | `<Trash2>` | `Trash2` |
| `ForgotPassword.tsx:98` | ✉️ | `<Mail>` | `Mail` |
| `ResetPassword.tsx:62` | ✅ | `<CheckCircle>` | `CheckCircle` |
| `JitsiVideoCall.tsx:688` | 📹 | `<Video>` | `Video` |
| `JitsiVideoCall.tsx:778,846` | ⚠️ | `<AlertTriangle>` | `AlertTriangle` |
| `PsychDashboard.tsx:1282` | 👤 | `<User>` | `User` |
| `PsychDashboard.tsx:1498` | 👤 | `<User>` | `User` |
| `PsychDashboard.tsx:1636` | 📊 | `<BarChart3>` | `BarChart3` |
| `PsychPatientsTab.tsx:125` | 👥 | `<Users>` | `Users` |

### Emojis que se mantienen

- `AgendaPersonal.tsx` mood faces (😢😔😐🙂😄) — semanticamente correctos para mood picker
- `★`/`☆` star ratings — patron estandar, aceptable

---

## 3. Reescritura de Textos Genericos

### Login.tsx (panel izquierdo)

```
// ANTES
"Conecta con tu espacio de bienestar emocional. Accede a tus evaluaciones,
seguimiento personalizado y sesiones con tu profesional de confianza."

// DESPUES
"Inicia sesion para acceder a tus citas, tareas y chat con tu psicologo."
```

### UserDashboard hero subtitle

```
// ANTES: "Tu espacio de bienestar"
// DESPUES: (sin subtitulo generico — solo el saludo con hora real)
```

### Saludo con hora real (UserDashboard + PsychDashboard)

```tsx
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos dias';
  if (h < 20) return 'Buenas tardes';
  return 'Buenas noches';
};
```

### OnboardingWizard.tsx

```
// ANTES
"Gantly es tu espacio seguro para cuidar tu salud mental. Aqui encontraras
herramientas, profesionales y apoyo personalizado."

// DESPUES
"Gantly te conecta con psicologos verificados. Desde aqui gestionas citas,
tareas terapeuticas y tu seguimiento."
```

```
// ANTES
"Desde tu panel podras gestionar citas, completar tareas, llevar un diario
de bienestar, chatear con tu psicologo y mucho mas."

// DESPUES
"Tu panel incluye agenda, tareas, diario de estado de animo y chat directo
con tu profesional."
```

---

## 4. Eliminacion de Legacy CSS

### Archivos afectados

- `AdminPanel.tsx` — `.admin-container`, `.btn`, `.btn-secondary`, `.btn-muted`, `.form-group`, `.test-card-admin`
- `AddQuestions.tsx` — `.container`, `.card`, `.btn`, `.btn-secondary`, `.form-group`, `.test-card`
- `TestImporter.tsx` — `.btn-secondary`, `.form-group`, `.btn`
- `AdminUsersPanel.tsx` — `.btn-secondary`

### Estrategia

Reemplazar cada clase legacy por su equivalente Tailwind:

| Legacy | Tailwind |
|--------|----------|
| `.btn` | `px-4 py-2 bg-gantly-blue text-white rounded-xl font-medium hover:bg-gantly-blue-600 transition-colors cursor-pointer` |
| `.btn-secondary` | `px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl font-medium hover:bg-slate-50 transition-colors cursor-pointer` |
| `.btn-muted` | `px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200 transition-colors cursor-pointer` |
| `.form-group` | `flex flex-col gap-1.5` |
| `.admin-container` | `max-w-7xl mx-auto px-6` |
| `.card` / `.test-card` | `bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6` |

---

## 5. Loading States Unificados

Ambos dashboards usaran el mismo loading:

```tsx
<div className="min-h-screen bg-slate-50 flex items-center justify-center">
  <div className="flex flex-col items-center gap-3">
    <div className="w-8 h-8 border-2 border-gantly-blue/30 border-t-gantly-blue rounded-full animate-spin" />
    <span className="text-sm text-slate-500">Cargando...</span>
  </div>
</div>
```

No mas `bg-slate-900` para PsychDashboard loading.

---

## 6. Unificacion de Colores por Archivo

### Prioridad ALTA (flujos de test — mas visibles)

| Archivo | Cambio |
|---------|--------|
| `InitialTestFlow.tsx` | `blue-500` -> `gantly-blue`, `blue-600` -> `gantly-blue-600`, `blue-50` -> `gantly-blue-50`, `focus:ring-blue-500/20` -> `focus:ring-gantly-blue/20` |
| `TestFlow.tsx` | Idem |
| `PatientMatchingTest.tsx` | Idem |
| `PsychologistMatchingTest.tsx` | Idem |
| `PsychEditProfileTab.tsx` | `blue-*` -> `gantly-blue-*`, `indigo-*` section gradients -> `gantly-blue-*` |
| `UserSettingsTab.tsx` | `blue-600` -> `gantly-blue`, `blue-50` -> `gantly-blue-50` |
| `Evaluaciones.tsx` | `from-blue-500 to-indigo-500` -> `from-gantly-blue to-gantly-blue-600` |
| `Descubrimiento.tsx` | `from-purple-500 to-fuchsia-500` -> `from-gantly-blue to-gantly-cyan` |

### Prioridad MEDIA (tabs y patients)

| Archivo | Cambio |
|---------|--------|
| `PsychPatientsTab.tsx` | `blue-*` -> `gantly-blue-*` |
| `PsychTestsTab.tsx` | `blue-*` -> `gantly-blue-*` |
| `AdminSectionsManager.tsx` | `indigo-500` -> `gantly-blue` |

### Prioridad BAJA (ERP clinic + billing)

| Archivo | Cambio |
|---------|--------|
| `ClinicDashboard.tsx` | `violet-500` -> `gantly-blue`, `text-slate-400/300` -> `text-slate-500` min |
| `BillingPortal.tsx` | `green-100/800` -> `gantly-emerald-50/700`, `gray-*` -> `slate-*` |
| `MatchingPsychologists.tsx` | `gray-*` -> `slate-*` |

---

## 7. Scope de Archivos a Modificar

### Total: ~25 archivos

**Capa 1 — Componentes compartidos (cascada):**
1. `EmptyState.tsx` — cambio de API (afecta 4+ callsites)

**Capa 2 — Auth (primera impresion):**
2. `Login.tsx` — copy
3. `ForgotPassword.tsx` — emoji
4. `ResetPassword.tsx` — emoji
5. `RegisterPsychologist.tsx` — emojis de steps

**Capa 3 — Dashboards (uso diario):**
6. `UserDashboard.tsx` — greeting, copy, loading
7. `PsychDashboard.tsx` — greeting, loading, EmptyState callsites
8. `UserSettingsTab.tsx` — colores
9. `PsychEditProfileTab.tsx` — colores
10. `PsychPatientsTab.tsx` — colores, EmptyState
11. `PsychTestsTab.tsx` — colores
12. `PsychBillingTab.tsx` — contraste
13. `OnboardingWizard.tsx` — copy

**Capa 4 — Flujos de test:**
14. `InitialTestFlow.tsx` — colores
15. `TestFlow.tsx` — colores
16. `PatientMatchingTest.tsx` — colores
17. `PsychologistMatchingTest.tsx` — colores
18. `MatchingAnimation.tsx` — emojis
19. `MatchingPsychologists.tsx` — colores

**Capa 5 — Admin:**
20. `AdminPanel.tsx` — legacy CSS, colores
21. `AddQuestions.tsx` — legacy CSS
22. `TestImporter.tsx` — legacy CSS
23. `AdminUsersPanel.tsx` — legacy CSS
24. `AdminSectionsManager.tsx` — colores, contraste

**Capa 6 — ERP Clinic:**
25. `ClinicDashboard.tsx` — colores, contraste
26. `ClinicBilling.tsx` — contraste
27. `ClinicPatients.tsx` — contraste

**Capa 7 — Otros:**
28. `ChatWidget.tsx` — emojis
29. `JitsiVideoCall.tsx` — emojis
30. `TestManager.tsx` — emojis
31. `Evaluaciones.tsx` — colores
32. `Descubrimiento.tsx` — colores
33. `BillingPortal.tsx` — colores

---

## 8. Lo que NO se toca

- Landing page (ya es la referencia)
- `AgendaPersonal.tsx` mood emojis (semanticos)
- Star ratings `★`/`☆` (patron estandar)
- Tailwind config (tokens ya correctos)
- Backend
- Routing
- Funcionalidad
