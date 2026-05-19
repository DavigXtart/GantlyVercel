# Sesion 2026-05-19 noche: Plan 12 Features Post-Launch

## Estado
**COMPLETADO** (implementado en commit f7056f1, 2026-05-19). Seguido de 4 commits de fixes: seguridad (f43cf46), DTOs (6afe96a), UX/UI audit 26 fixes (05b9193 + 99a4762 + c3d3763).

## Resumen
Plan para implementar 12 features pendientes organizadas en 4 waves. El plan completo esta en `.claude/plans/flickering-skipping-map.md`.

## 12 Features y su estado actual

| # | Feature | Estado | Wave |
|---|---------|--------|------|
| 1 | Refactor PsychDashboard + SaaS flat | **100% DONE** — 2013→728 lin, 6 tabs extraídos | Wave 1 |
| 2 | Citas recurrentes | **100% DONE** — ClinicAgenda + ClinicService | Wave 0 |
| 3 | Catálogo servicios con precios | **100% DONE** — servicios dinámicos en agendas | Wave 2 |
| 4 | Recordatorios cita (email 24h) | **100% DONE** — ya implementado | SKIP |
| 5 | Portal paciente clínica | **100% DONE** — UserClinicPortalTab completo | Wave 2 |
| 6 | Página pública clínica + reserva | **100% DONE** — /clinica/:slug | Wave 3 |
| 7 | Lista de espera | **100% DONE** — WaitingListEntity + UI | Wave 3 |
| 8 | Multi-admin clínica | **100% DONE** — ClinicAdminEntity | Wave 3 |
| 9 | Facturación aseguradoras | **100% DONE** — InsuranceCompanyEntity + policies | Wave 3 |
| 10 | Firma digital consentimientos | **100% DONE** — SignaturePad + consent tabs | Wave 2 |
| 11 | Gestión ausencias psicólogo | **100% DONE** — diagonal stripes + notificaciones | Wave 0 |
| 12 | Auditoría calendario | **100% DONE** — AuditLogEntity + viewer | Wave 1 |

## Waves

### Wave 0: Polish (Features 2, 11)
- Recurrencia en ClinicAgenda + ClinicService
- Ausencias en ClinicAgenda + notificacion pacientes
- 2 agentes: backend + frontend (ui-ux-pro-max)

### Wave 1: Refactor + Audit (Features 1, 12)
- PsychDashboard: extraer PsychHomeTab, PsychCalendarTab, PsychPastAppointmentsTab, PsychChatTab, PsychPatientProfileView, PsychTestDetailsView
- Rediseno SaaS flat del PsychDashboard
- AuditLogEntity + tabla audit_logs + viewer
- 2 agentes: frontend refactor + backend audit

### Wave 2: Portal + Servicios + Consentimientos (Features 3, 5, 10)
- Servicios dinamicos en agendas (reemplazar hardcoded)
- Portal paciente clinica (UserClinicPortalTab)
- Firma digital: PsychConsentTab, UserConsentTab, SignaturePad.tsx
- V52 (company slug), V53 (consent signature)
- 3 agentes: backend + 2 frontend

### Wave 3: Nuevos subsistemas (Features 6, 7, 8, 9)
- Pagina publica clinica (/clinica/:slug)
- Lista espera (WaitingListEntity + UI)
- Multi-admin (ClinicAdminEntity + auth changes)
- Facturacion aseguradoras (InsuranceCompanyEntity + policies)
- V54 (waiting_list), V55 (clinic_admins), V56 (insurance)
- 4 agentes: 2 backend + 2 frontend

## Migraciones SQL previstas
- V51: audit_logs
- V52: companies.slug, description, public_visible
- V53: consent_requests.signature_data, pdf_url
- V54: waiting_list
- V55: clinic_admins
- V56: insurance_companies, insurance_patient_policies

## Archivos criticos
- `PsychDashboard.tsx` (2013 lin) — refactor prioritario
- `ClinicController.java` (344 lin) — mas endpoints nuevos
- `ClinicService.java` (848 lin) — mas logica nueva
- `CalendarService.java` (747 lin) — audit + notificaciones
- `ClinicDashboard.tsx` (1179 lin) — nuevos tabs
- `ClinicAgenda.tsx` — recurrencia + servicios + ausencias
- `api.ts` (1350 lin) — todos los nuevos services

## Como retomar
1. Leer este archivo + `.claude/plans/flickering-skipping-map.md`
2. Empezar por Wave 0 (polish features 2 + 11)
3. Luego Wave 1 (refactor PsychDashboard + audit)
4. Luego Wave 2 y Wave 3
5. Cada wave usa agentes paralelos (backend + frontend con ui-ux-pro-max)

## Diseno SaaS flat (referencia para todos los componentes nuevos)
- Cards: `bg-white rounded-xl border border-slate-200/80`
- Card headers: `px-5 py-3 border-b border-slate-100`
- Inputs: `h-9 px-3 rounded-md border border-slate-200`
- Buttons: flat `bg-gantly-blue text-white rounded-md` (NO gradients, NO shadow-lg)
- Labels: `text-[11px] text-slate-500`
- Table hover: `hover:bg-slate-50`
- Badges: `rounded-full text-xs px-2.5 py-1`
- NO gradients, NO glass effects, NO shadow-2xl
