# UI Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify the entire Gantly frontend under a single design system matching the landing page, eliminating emojis, generic text, color inconsistencies, contrast issues, and legacy CSS.

**Architecture:** All changes are frontend-only. We modify existing components — no new files except none. The EmptyState component API changes from `icon: string` to `icon: React.ReactNode`, cascading to all callsites. Color tokens already exist in tailwind.config.js — we just need to use them consistently.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Lucide React icons

**Spec:** `docs/superpowers/specs/2026-05-06-ui-unification-design.md`

---

### Task 1: EmptyState component — change icon API from string to ReactNode

**Files:**
- Modify: `frontend/src/components/ui/EmptyState.tsx`

This is the foundation — all subsequent EmptyState callsite changes depend on this.

- [ ] **Step 1: Update EmptyState interface and default icon**

```tsx
// frontend/src/components/ui/EmptyState.tsx
import React from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({
  icon = <Inbox className="w-12 h-12 text-slate-300" />,
  title,
  description,
  action,
  className
}: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-6 text-center',
      className
    )}>
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-heading font-semibold text-gantly-text mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-gantly-muted max-w-[400px] mb-6">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit 2>&1 | head -30`
Expected: Type errors in callsites that pass string icons (PsychDashboard, PsychPatientsTab). These will be fixed in Task 2.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/ui/EmptyState.tsx
git commit -m "refactor: change EmptyState icon prop from string to ReactNode"
```

---

### Task 2: Fix all EmptyState callsites with Lucide icons

**Files:**
- Modify: `frontend/src/components/PsychDashboard.tsx:1498,1636`
- Modify: `frontend/src/components/PsychPatientsTab.tsx:125`

- [ ] **Step 1: Fix PsychDashboard.tsx callsites**

Add import at top of file (with existing imports around line 8):
```tsx
import { User, BarChart3 } from 'lucide-react';
```

Line 1498 — change:
```tsx
// BEFORE
<EmptyState icon="👤" title="Paciente no encontrado" description="No se pudieron cargar los detalles del paciente." />
// AFTER
<EmptyState icon={<User className="w-12 h-12 text-slate-300" />} title="Paciente no encontrado" description="No se pudieron cargar los detalles del paciente." />
```

Line 1636 — change:
```tsx
// BEFORE
<EmptyState icon="📊" title="Test no encontrado" description="No se pudieron cargar los detalles del test." />
// AFTER
<EmptyState icon={<BarChart3 className="w-12 h-12 text-slate-300" />} title="Test no encontrado" description="No se pudieron cargar los detalles del test." />
```

- [ ] **Step 2: Fix PsychPatientsTab.tsx callsite**

Add import at top of file:
```tsx
import { Users } from 'lucide-react';
```

Line 125 — change:
```tsx
// BEFORE
icon="👥"
// AFTER
icon={<Users className="w-12 h-12 text-slate-300" />}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit 2>&1 | head -20`
Expected: No errors related to EmptyState.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/PsychDashboard.tsx frontend/src/components/PsychPatientsTab.tsx
git commit -m "fix: replace emoji icons in EmptyState callsites with Lucide"
```

---

### Task 3: Replace emojis in ChatWidget.tsx

**Files:**
- Modify: `frontend/src/components/ChatWidget.tsx:330,340,380,415,467,533`

- [ ] **Step 1: Add Lucide imports**

Add at top of file:
```tsx
import { MessageCircle, Users, User, Stethoscope } from 'lucide-react';
```

- [ ] **Step 2: Replace emoji at line 330 (waiting for assignment state)**

```tsx
// BEFORE
<div className="text-5xl mb-4">💬</div>
// AFTER
<MessageCircle className="w-12 h-12 text-white/80 mb-4" />
```

- [ ] **Step 3: Replace emoji at line 340 (select patient state)**

```tsx
// BEFORE
<div className="text-5xl mb-4">👥</div>
// AFTER
<Users className="w-12 h-12 text-white/80 mb-4" />
```

- [ ] **Step 4: Replace emoji at line 415 (empty messages state)**

```tsx
// BEFORE
<div style={{ fontSize: '32px', marginBottom: '8px' }}>💬</div>
// AFTER
<div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'center' }}><MessageCircle size={32} color="#9ca3af" /></div>
```

- [ ] **Step 5: Replace avatar fallbacks at lines 467 and 533**

Line ~467 (other user avatar fallback in message bubble):
```tsx
// BEFORE
'👤'
// AFTER
<User size={16} />
```

Line ~533 (avatar fallback conditional):
```tsx
// BEFORE
mode === 'USER' ? '👤' : '👨‍⚕️'
// AFTER
mode === 'USER' ? <User size={16} /> : <Stethoscope size={16} />
```

- [ ] **Step 6: Replace the onError fallback at line ~371**

The `parent.textContent = '\u{1F464}'` XSS-safe fallback needs a different approach. Replace the onError handler to use the initial letter instead:
```tsx
onError={(e) => {
  e.currentTarget.style.display = 'none';
  const parent = e.currentTarget.parentElement;
  if (parent) {
    parent.textContent = otherUser?.name?.charAt(0)?.toUpperCase() || '?';
    parent.style.fontSize = '18px';
    parent.style.display = 'flex';
    parent.style.alignItems = 'center';
    parent.style.justifyContent = 'center';
  }
}}
```

- [ ] **Step 7: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 8: Commit**

```bash
git add frontend/src/components/ChatWidget.tsx
git commit -m "fix: replace emoji icons with Lucide in ChatWidget"
```

---

### Task 4: Replace emojis in MatchingAnimation.tsx

**Files:**
- Modify: `frontend/src/components/MatchingAnimation.tsx:15-71,142-143,177-178,198,244`

- [ ] **Step 1: Add Lucide imports and change MatchingStep interface**

```tsx
import { useState, useEffect, type ReactNode } from 'react';
import { GraduationCap, Target, BarChart3, MessageCircle, Users, Zap, Pill, Scale, Calculator, Sparkles } from 'lucide-react';

interface MatchingStep {
  title: string;
  description: string;
  weight: string;
  icon: ReactNode;
  color: string;
}
```

- [ ] **Step 2: Replace icon values in matchingSteps array**

```tsx
const matchingSteps: MatchingStep[] = [
  {
    title: 'Experiencia Clinica',
    description: 'Analizando anos de experiencia del psicologo segun tu nivel de afectacion',
    weight: '15%',
    icon: <GraduationCap size={48} />,
    color: '#2E93CC'
  },
  {
    title: 'Areas de Trabajo',
    description: 'Comparando tus necesidades con las especialidades del psicologo',
    weight: '20%',
    icon: <Target size={48} />,
    color: '#059669'
  },
  {
    title: 'Complejidad Clinica',
    description: 'Evaluando si el psicologo maneja casos de tu nivel de complejidad',
    weight: '10%',
    icon: <BarChart3 size={48} />,
    color: '#F0C930'
  },
  {
    title: 'Estilo Terapeutico',
    description: 'Matching entre tu preferencia y el estilo del profesional',
    weight: '12%',
    icon: <MessageCircle size={48} />,
    color: '#22D3EE'
  },
  {
    title: 'Poblacion Objetivo',
    description: 'Verificando que el psicologo trabaje con tu rango de edad',
    weight: '8%',
    icon: <Users size={48} />,
    color: '#10b981'
  },
  {
    title: 'Crisis Vitales',
    description: 'Evaluando experiencia en situaciones de crisis si aplica',
    weight: '10%',
    icon: <Zap size={48} />,
    color: '#f97316'
  },
  {
    title: 'Medicacion Psiquiatrica',
    description: 'Comprobando experiencia con medicacion si la necesitas',
    weight: '10%',
    icon: <Pill size={48} />,
    color: '#8b5cf6'
  },
  {
    title: 'Preferencia de Genero',
    description: 'Respetando tu preferencia si la has indicado',
    weight: '5%',
    icon: <Scale size={48} />,
    color: '#0A1628'
  }
];
```

- [ ] **Step 3: Update icon rendering in current step (line ~142)**

```tsx
// BEFORE
<div className="text-[64px] mb-5 relative z-10">
  {currentStepData.icon}
</div>
// AFTER
<div className="mb-5 relative z-10 flex justify-center" style={{ color: currentStepData.color }}>
  {currentStepData.icon}
</div>
```

- [ ] **Step 4: Update icon rendering in completed steps (line ~177)**

```tsx
// BEFORE
<div className="text-[32px] mb-2">
  {step.icon}
</div>
// AFTER
<div className="mb-2 flex justify-center" style={{ color: step.color }}>
  {React.cloneElement(step.icon as React.ReactElement, { size: 24 })}
</div>
```

Add `import React` at the top if not already present (it's not — the file uses `useState, useEffect` from react but not React itself). Update the import:

```tsx
import React, { useState, useEffect, type ReactNode } from 'react';
```

- [ ] **Step 5: Replace formula icon (line ~198)**

```tsx
// BEFORE
<div className="text-[64px] mb-6">🧮</div>
// AFTER
<div className="mb-6 flex justify-center text-gantly-navy"><Calculator size={48} /></div>
```

- [ ] **Step 6: Replace results icon (line ~244)**

```tsx
// BEFORE
<div className="text-[64px] mb-6">✨</div>
// AFTER
<div className="mb-6 flex justify-center text-gantly-blue"><Sparkles size={48} /></div>
```

- [ ] **Step 7: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 8: Commit**

```bash
git add frontend/src/components/MatchingAnimation.tsx
git commit -m "fix: replace emoji icons with Lucide in MatchingAnimation"
```

---

### Task 5: Replace emojis in RegisterPsychologist.tsx

**Files:**
- Modify: `frontend/src/components/RegisterPsychologist.tsx:131-136`

- [ ] **Step 1: Add Lucide imports**

```tsx
import { User, GraduationCap, Lock, CheckCircle } from 'lucide-react';
```

- [ ] **Step 2: Change steps array icon type and values**

```tsx
// BEFORE
const steps = [
  { number: 1, title: 'Información personal', icon: '👤' },
  { number: 2, title: 'Credenciales profesionales', icon: '🎓' },
  { number: 3, title: 'Contraseña', icon: '🔒' },
  { number: 4, title: 'Confirmación', icon: '✅' },
];
// AFTER
const steps = [
  { number: 1, title: 'Información personal', icon: <User size={18} /> },
  { number: 2, title: 'Credenciales profesionales', icon: <GraduationCap size={18} /> },
  { number: 3, title: 'Contraseña', icon: <Lock size={18} /> },
  { number: 4, title: 'Confirmación', icon: <CheckCircle size={18} /> },
];
```

- [ ] **Step 3: Verify the icon renders correctly in the step indicator**

Check how `step.icon` is rendered in the component (around line 160+). If it's inside a `<span>` or text node, it should work since ReactNode renders fine in JSX.

- [ ] **Step 4: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/RegisterPsychologist.tsx
git commit -m "fix: replace emoji icons with Lucide in RegisterPsychologist steps"
```

---

### Task 6: Replace emojis in ForgotPassword, ResetPassword, TestManager

**Files:**
- Modify: `frontend/src/components/ForgotPassword.tsx:98`
- Modify: `frontend/src/components/ResetPassword.tsx:62`
- Modify: `frontend/src/components/TestManager.tsx:934,949,999,1007`

- [ ] **Step 1: ForgotPassword.tsx — replace mail emoji**

Add import:
```tsx
import { Mail } from 'lucide-react';
```

Line 98:
```tsx
// BEFORE
<div className="text-6xl mb-6">✉️</div>
// AFTER
<div className="mb-6 flex justify-center"><Mail className="w-14 h-14 text-gantly-blue" /></div>
```

- [ ] **Step 2: ResetPassword.tsx — replace check emoji**

Add import:
```tsx
import { CheckCircle } from 'lucide-react';
```

Line 62:
```tsx
// BEFORE
<div className="text-6xl mb-6">✅</div>
// AFTER
<div className="mb-6 flex justify-center"><CheckCircle className="w-14 h-14 text-gantly-emerald" /></div>
```

- [ ] **Step 3: TestManager.tsx — replace edit/delete emojis**

Add import:
```tsx
import { Pencil, Trash2 } from 'lucide-react';
```

Lines 934, 999 (edit buttons):
```tsx
// BEFORE
✏️ Editar Pregunta
✏️
// AFTER
<Pencil size={14} className="inline mr-1" /> Editar Pregunta
<Pencil size={14} />
```

Lines 949, 1007 (delete buttons):
```tsx
// BEFORE
🗑️ Eliminar Pregunta
🗑️
// AFTER
<Trash2 size={14} className="inline mr-1" /> Eliminar Pregunta
<Trash2 size={14} />
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ForgotPassword.tsx frontend/src/components/ResetPassword.tsx frontend/src/components/TestManager.tsx
git commit -m "fix: replace emojis with Lucide in ForgotPassword, ResetPassword, TestManager"
```

---

### Task 7: Replace emojis in JitsiVideoCall.tsx and PsychDashboard avatar

**Files:**
- Modify: `frontend/src/components/JitsiVideoCall.tsx:688,778,846`
- Modify: `frontend/src/components/PsychDashboard.tsx:1282`

- [ ] **Step 1: JitsiVideoCall.tsx — add imports and replace emojis**

Add import:
```tsx
import { Video, AlertTriangle } from 'lucide-react';
```

Line 688:
```tsx
// BEFORE
📹 Videollamada - {roomName}
// AFTER
<span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Video size={18} /> Videollamada - {roomName}</span>
```

Line 778:
```tsx
// BEFORE
<div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
// AFTER
<div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}><AlertTriangle size={48} color="#f59e0b" /></div>
```

Line 846:
```tsx
// BEFORE
<div style={{ fontSize: '18px', marginBottom: '16px' }}>⚠️ Error al cargar videollamada</div>
// AFTER
<div style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}><AlertTriangle size={18} color="#f59e0b" /> Error al cargar videollamada</div>
```

- [ ] **Step 2: PsychDashboard.tsx line 1282 — avatar fallback**

```tsx
// BEFORE
<span>👤</span>
// AFTER
<User size={16} className="text-slate-400" />
```

(The `User` import was already added in Task 2.)

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/JitsiVideoCall.tsx frontend/src/components/PsychDashboard.tsx
git commit -m "fix: replace emojis with Lucide in JitsiVideoCall and PsychDashboard avatar"
```

---

### Task 8: Rewrite generic texts and fix greeting

**Files:**
- Modify: `frontend/src/components/Login.tsx:269-286`
- Modify: `frontend/src/components/UserDashboard.tsx:394-395,628,630,633`
- Modify: `frontend/src/components/PsychDashboard.tsx:464,637`
- Modify: `frontend/src/components/OnboardingWizard.tsx:14,31`

- [ ] **Step 1: Login.tsx — rewrite left panel copy (line ~269-286)**

```tsx
// BEFORE (line 272)
'Conecta con tu espacio de bienestar emocional. Accede a tus evaluaciones, seguimiento personalizado y sesiones con profesionales de la psicología.'
// AFTER
'Inicia sesion para acceder a tus citas, tareas y chat con tu psicologo.'
```

```tsx
// BEFORE (lines 277-285) — feature list
<span>Evaluaciones personalizadas</span>
<span>Seguimiento emocional confidencial</span>
<span>Planes adaptados a ti</span>
// AFTER
<span>Citas y videollamadas</span>
<span>Tests y seguimiento</span>
<span>Chat directo con tu profesional</span>
```

- [ ] **Step 2: UserDashboard.tsx — add time-based greeting and fix loading**

Add greeting helper before the component return (around line 390):
```tsx
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos dias';
  if (h < 20) return 'Buenas tardes';
  return 'Buenas noches';
};
```

Line 394 — fix loading background:
```tsx
// BEFORE
<div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
// AFTER
<div className="flex items-center justify-center min-h-screen bg-slate-50">
```

Line 395 — fix loading text:
```tsx
// BEFORE
<LoadingSpinner text="Cargando tu espacio..." />
// AFTER
<LoadingSpinner text="Cargando..." />
```

Line 628 — use dynamic greeting:
```tsx
// BEFORE
Buenos días, {me?.name?.split(' ')[0] || 'usuario'}
// AFTER
{getGreeting()}, {me?.name?.split(' ')[0] || 'usuario'}
```

Line 633 — remove generic subtitle:
```tsx
// BEFORE
: 'Tu espacio de bienestar'}
// AFTER
: ''}
```

- [ ] **Step 3: PsychDashboard.tsx — fix loading and greeting**

Line 464 — fix loading background:
```tsx
// BEFORE
<div className="min-h-screen bg-slate-900 flex items-center justify-center">
// AFTER
<div className="min-h-screen bg-slate-50 flex items-center justify-center">
```

Line 637 — use dynamic greeting (add same `getGreeting` helper before the return):
```tsx
// BEFORE
Hola, {me?.name || 'Profesional'}.
// AFTER
{getGreeting()}, {me?.name?.split(' ')[0] || 'Profesional'}
```

- [ ] **Step 4: OnboardingWizard.tsx — rewrite generic copy**

Line 14:
```tsx
// BEFORE
description: 'Gantly es tu espacio seguro para cuidar tu salud mental. Aqui encontraras herramientas, profesionales y apoyo personalizado.',
// AFTER
description: 'Gantly te conecta con psicologos verificados. Desde aqui gestionas citas, tareas terapeuticas y tu seguimiento.',
```

Line 31:
```tsx
// BEFORE
description: 'Desde tu panel podras gestionar citas, completar tareas, llevar un diario de bienestar, chatear con tu psicologo y mucho mas.',
// AFTER
description: 'Tu panel incluye agenda, tareas, diario de estado de animo y chat directo con tu profesional.',
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/Login.tsx frontend/src/components/UserDashboard.tsx frontend/src/components/PsychDashboard.tsx frontend/src/components/OnboardingWizard.tsx
git commit -m "fix: rewrite generic copy and add time-based greetings"
```

---

### Task 9: Unify colors in test flows (InitialTestFlow, TestFlow, PatientMatchingTest, PsychologistMatchingTest)

**Files:**
- Modify: `frontend/src/components/InitialTestFlow.tsx`
- Modify: `frontend/src/components/TestFlow.tsx`
- Modify: `frontend/src/components/PatientMatchingTest.tsx`
- Modify: `frontend/src/components/PsychologistMatchingTest.tsx`

These 4 files all use the same pattern: `blue-500` -> `gantly-blue`, `blue-600` -> `gantly-blue-600`, `blue-50` -> `gantly-blue-50`, `blue-400` -> `gantly-blue-400`.

- [ ] **Step 1: Replace colors in InitialTestFlow.tsx**

Global find-and-replace within the file:
- `bg-blue-500` -> `bg-gantly-blue`
- `hover:bg-blue-600` -> `hover:bg-gantly-blue-600`
- `bg-blue-50` -> `bg-gantly-blue-50`
- `border-blue-500` -> `border-gantly-blue`
- `border-blue-400` -> `border-gantly-blue-400`
- `text-blue-600` -> `text-gantly-blue`
- `text-blue-500` -> `text-gantly-blue`
- `focus:ring-blue-500/20` -> `focus:ring-gantly-blue/20`
- `focus:border-blue-400` -> `focus:border-gantly-blue-400`
- `focus:border-blue-500` -> `focus:border-gantly-blue`

- [ ] **Step 2: Replace colors in TestFlow.tsx**

Same replacements as Step 1.

- [ ] **Step 3: Replace colors in PatientMatchingTest.tsx**

Same replacements as Step 1.

- [ ] **Step 4: Replace colors in PsychologistMatchingTest.tsx**

Same replacements as Step 1.

- [ ] **Step 5: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/InitialTestFlow.tsx frontend/src/components/TestFlow.tsx frontend/src/components/PatientMatchingTest.tsx frontend/src/components/PsychologistMatchingTest.tsx
git commit -m "fix: unify test flow colors to gantly brand tokens"
```

---

### Task 10: Unify colors in dashboard tabs (PsychEditProfileTab, PsychPatientsTab, PsychTestsTab, UserSettingsTab)

**Files:**
- Modify: `frontend/src/components/PsychEditProfileTab.tsx`
- Modify: `frontend/src/components/PsychPatientsTab.tsx`
- Modify: `frontend/src/components/PsychTestsTab.tsx`
- Modify: `frontend/src/components/UserSettingsTab.tsx`

- [ ] **Step 1: Replace colors in PsychEditProfileTab.tsx**

Global find-and-replace:
- `text-blue-600` -> `text-gantly-blue`
- `border-blue-300` -> `border-gantly-blue-300`
- `border-blue-200` -> `border-gantly-blue-200`
- `hover:bg-blue-50` -> `hover:bg-gantly-blue-50`
- `focus:ring-blue-500/20` -> `focus:ring-gantly-blue/20`
- `focus:border-blue-500` -> `focus:border-gantly-blue`
- `focus:border-blue-400` -> `focus:border-gantly-blue-400`
- `from-blue-50 to-indigo-50` -> `from-gantly-blue-50 to-gantly-blue-100`
- `from-blue-500 to-indigo-500` -> `from-gantly-blue to-gantly-blue-600`
- `bg-blue-50` -> `bg-gantly-blue-50`
- `bg-blue-100` -> `bg-gantly-blue-100`

- [ ] **Step 2: Replace colors in PsychPatientsTab.tsx**

Same `blue-*` -> `gantly-blue-*` replacements.

- [ ] **Step 3: Replace colors in PsychTestsTab.tsx**

Same `blue-*` -> `gantly-blue-*` replacements.

- [ ] **Step 4: Replace colors in UserSettingsTab.tsx**

Same `blue-*` -> `gantly-blue-*` replacements. Also:
- `from-blue-600 to-indigo-600` -> `from-gantly-blue to-gantly-blue-600` (active tab gradient)

- [ ] **Step 5: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/PsychEditProfileTab.tsx frontend/src/components/PsychPatientsTab.tsx frontend/src/components/PsychTestsTab.tsx frontend/src/components/UserSettingsTab.tsx
git commit -m "fix: unify dashboard tab colors to gantly brand tokens"
```

---

### Task 11: Unify colors in Evaluaciones, Descubrimiento, AdminSectionsManager, BillingPortal, MatchingPsychologists

**Files:**
- Modify: `frontend/src/components/Evaluaciones.tsx`
- Modify: `frontend/src/components/Descubrimiento.tsx`
- Modify: `frontend/src/components/AdminSectionsManager.tsx`
- Modify: `frontend/src/components/BillingPortal.tsx`
- Modify: `frontend/src/components/MatchingPsychologists.tsx`

- [ ] **Step 1: Evaluaciones.tsx**

- `from-blue-500 to-indigo-500` -> `from-gantly-blue to-gantly-blue-600`
- `from-blue-600 to-indigo-600` -> `from-gantly-blue-600 to-gantly-blue-700`
- `hover:bg-blue-50` -> `hover:bg-gantly-blue-50`
- `hover:text-blue-600` -> `hover:text-gantly-blue`
- `hover:text-blue-500` -> `hover:text-gantly-blue`
- `text-blue-600` -> `text-gantly-blue`
- `text-slate-300 group-hover:text-blue-500` -> `text-slate-400 group-hover:text-gantly-blue`

- [ ] **Step 2: Descubrimiento.tsx**

- `from-purple-500 to-fuchsia-500` -> `from-gantly-blue to-gantly-cyan`
- `from-purple-600 to-fuchsia-600` -> `from-gantly-blue-600 to-gantly-cyan-600`
- `hover:text-purple-600` -> `hover:text-gantly-blue`
- `hover:text-purple-500` -> `hover:text-gantly-blue`
- `text-purple-600` -> `text-gantly-blue`
- `text-slate-300 group-hover:text-purple-500` -> `text-slate-400 group-hover:text-gantly-blue`

- [ ] **Step 3: AdminSectionsManager.tsx**

- `text-indigo-500` -> `text-gantly-blue`
- `text-slate-400` (at 11px size) -> `text-slate-500`

- [ ] **Step 4: BillingPortal.tsx**

- `bg-green-100 text-green-800` -> `bg-gantly-emerald-50 text-gantly-emerald-700`
- `text-gray-400` -> `text-slate-500`
- `text-gray-300` -> `text-slate-400` (placeholder only)
- `border-gray-200` -> `border-slate-200`
- `border-gray-100` -> `border-slate-100`
- `bg-gray-50` -> `bg-slate-50`
- `text-gray-500` -> `text-slate-500`
- `text-gray-600` -> `text-slate-600`
- `text-gray-800` -> `text-slate-800`
- `text-gray-900` -> `text-slate-900`

- [ ] **Step 5: MatchingPsychologists.tsx**

Replace all `gray-*` with `slate-*`:
- `bg-gray-50` -> `bg-slate-50`
- `bg-gray-100` -> `bg-slate-100`
- `bg-gray-200` -> `bg-slate-200`
- `text-gray-400` -> `text-slate-500`
- `text-gray-500` -> `text-slate-500`
- `text-gray-600` -> `text-slate-600`
- `text-gray-700` -> `text-slate-700`
- `text-gray-800` -> `text-slate-800`
- `border-gray-200` -> `border-slate-200`
- `border-gray-100` -> `border-slate-100`

- [ ] **Step 6: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/Evaluaciones.tsx frontend/src/components/Descubrimiento.tsx frontend/src/components/AdminSectionsManager.tsx frontend/src/components/BillingPortal.tsx frontend/src/components/MatchingPsychologists.tsx
git commit -m "fix: unify remaining component colors to brand tokens"
```

---

### Task 12: Fix contrast issues in Clinic ERP components

**Files:**
- Modify: `frontend/src/components/ClinicDashboard.tsx`
- Modify: `frontend/src/components/ClinicBilling.tsx`
- Modify: `frontend/src/components/ClinicPatients.tsx`

- [ ] **Step 1: ClinicDashboard.tsx — fix contrast and colors**

Global replacements:
- `text-violet-500` -> `text-gantly-blue`
- `text-slate-300` (on white bg) -> `text-slate-400` (only decorative) or `text-slate-500` (readable text)
- `text-slate-400` (readable text, not decorative icons) -> `text-slate-500`

Be careful: `text-slate-400` is acceptable for large decorative icons (like empty state placeholders) but NOT for readable text labels.

- [ ] **Step 2: ClinicBilling.tsx — fix table header contrast**

Replace table headers pattern:
- `text-[11px] text-slate-400` -> `text-xs text-slate-500`
- `text-slate-300` -> `text-slate-400` (dividers only)

- [ ] **Step 3: ClinicPatients.tsx — fix contrast**

- `text-slate-400` (readable labels) -> `text-slate-500`
- `text-4xl text-slate-300` (decorative icon) -> keep as-is (acceptable for decorative)

- [ ] **Step 4: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ClinicDashboard.tsx frontend/src/components/ClinicBilling.tsx frontend/src/components/ClinicPatients.tsx
git commit -m "fix: improve contrast in Clinic ERP components"
```

---

### Task 13: Replace legacy CSS classes in Admin components

**Files:**
- Modify: `frontend/src/components/AdminPanel.tsx`
- Modify: `frontend/src/components/AddQuestions.tsx`
- Modify: `frontend/src/components/TestImporter.tsx`
- Modify: `frontend/src/components/AdminUsersPanel.tsx`

- [ ] **Step 1: AdminPanel.tsx — replace legacy classes**

Replacements:
- `className="admin-container"` -> `className="max-w-7xl mx-auto px-6"`
- `className="btn ..."` -> `className="px-4 py-2 bg-gantly-blue text-white rounded-xl font-medium hover:bg-gantly-blue-600 transition-colors cursor-pointer ..."`
- `className="btn-secondary ..."` -> `className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl font-medium hover:bg-slate-50 transition-colors cursor-pointer ..."`
- `className="btn-muted ..."` -> `className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200 transition-colors cursor-pointer ..."`
- `className="form-group"` -> `className="flex flex-col gap-1.5"`
- `className="test-card-admin ..."` -> `className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 ..."`

- [ ] **Step 2: AddQuestions.tsx — replace legacy classes**

- `className="container"` -> `className="max-w-4xl mx-auto px-6"`
- `className="card"` -> `className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6"`
- `className="btn"` -> same as Step 1
- `className="btn-secondary"` -> same as Step 1
- `className="form-group"` -> `className="flex flex-col gap-1.5"`
- `className="test-card"` -> `className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6"`

- [ ] **Step 3: TestImporter.tsx — replace legacy classes**

- `className="btn-secondary"` -> same as Step 1
- `className="form-group"` -> `className="flex flex-col gap-1.5"`
- `className="btn"` -> same as Step 1

- [ ] **Step 4: AdminUsersPanel.tsx — replace legacy class**

- `className="btn-secondary text-xs px-3 py-1.5"` -> `className="bg-white text-slate-700 border border-slate-200 rounded-xl font-medium hover:bg-slate-50 transition-colors cursor-pointer text-xs px-3 py-1.5"`

- [ ] **Step 5: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/AdminPanel.tsx frontend/src/components/AddQuestions.tsx frontend/src/components/TestImporter.tsx frontend/src/components/AdminUsersPanel.tsx
git commit -m "refactor: replace legacy CSS classes with Tailwind utilities in admin components"
```

---

### Task 14: Final verification — typecheck and visual smoke test

**Files:** None (verification only)

- [ ] **Step 1: Full TypeScript check**

Run: `cd frontend && npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 2: Verify no remaining emojis in component files (except allowed)**

Run: `cd frontend && grep -rn '[📭💬👥👤👨🎓🎯📊💊⚖️🧮✨✉️✅📹⚠️✏️🗑️🔒]' src/components/ --include="*.tsx" | grep -v AgendaPersonal | grep -v "console\."`
Expected: No matches (AgendaPersonal mood emojis and console logs excluded).

- [ ] **Step 3: Verify no remaining generic blue-500 in dashboard/test components**

Run: `cd frontend && grep -rn 'blue-500\|blue-600\|indigo-500\|indigo-600\|violet-500\|purple-500\|fuchsia-500' src/components/ --include="*.tsx" | grep -v node_modules | grep -v landing/`
Expected: No matches outside landing components.

- [ ] **Step 4: Commit all remaining changes (if any unstaged fixes)**

```bash
git status
# If clean, no commit needed
```
