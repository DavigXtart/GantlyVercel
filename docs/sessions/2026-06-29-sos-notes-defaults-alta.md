# Sesion 2026-06-29 — SOS, Crisis, Notas Chat, Defaults, Alta controlada

## Resumen
Sesion de 5 features: reactivar boton SOS para pacientes, aviso de crisis en test inicial, notas del psicologo en ficha del chat, defaults de servicio/precio en ajustes, y alta de paciente con motivo obligatorio.

## Commits realizados

| Commit | Descripcion |
|--------|-------------|
| `da88057` | Migracion V69: 5 columnas nuevas (psychologist_notes, discharge_reason, discharged_at, default_service, default_price) |
| `db873b7` | Boton SOS reactivado para pacientes (rol USER) + telefono 016 violencia de genero |
| `26b05b0` | Banner de crisis en InitialTestFlow con 024, 112, 016 antes de empezar el test |
| `e291095` | Backend: endpoints GET/PUT notas paciente, discharge reason en updatePatientStatus, campos default en PsychologistProfileEntity |
| `9413181` | Notas libres + notas de sesion en sidebar del chat (ChatWidget) |
| `fc0959c` | Default service/price en PsychSettingsTab, pre-fill en CalendarWeek y PsychCalendarTab |
| `0eb5350` | Alta movida de lista de pacientes a perfil individual, modal con motivo obligatorio (min 10 chars) |

## Detalle de cambios

### 1. Boton SOS (paciente)
- `CrisisButton.tsx` ya existia pero no se renderizaba
- Anadido en `App.tsx`: `{isAuthenticated && role === 'USER' && <CrisisButton />}`
- Anadido 016 (violencia de genero) con icono corazon y color purple-600

### 2. Aviso crisis en test inicial
- `InitialTestFlow.tsx`: estado `showCrisisInfo` (default true)
- Pantalla pre-test con telefonos 024, 112, 016 como enlaces clickables
- Boton "Continuar con el test" para proceder

### 3. Notas en ficha del chat
- **Backend**: `PUT/GET /api/psych/patients/{id}/notes` — campo `psychologistNotes` en UserPsychologistEntity
- **Frontend**: ChatWidget sidebar con textarea editable (notas libres) + seccion colapsable de notas de sesion (ultimas 5 citas)
- Boton guardar solo aparece si el texto cambio

### 4. Defaults servicio/precio
- **Backend**: `defaultService` y `defaultPrice` en PsychologistProfileEntity
- **Frontend**: seccion "Valores por defecto" en PsychSettingsTab > Servicios
- Pre-relleno automatico en CalendarWeek (crear slot) y PsychCalendarTab (nueva cita)

### 5. Alta controlada
- **Quitado** boton "Dar de Alta" de PsychPatientsTab (lista)
- **Anadido** en PsychPatientProfileView (perfil individual)
- Modal con motivo obligatorio (min 10 caracteres), boton rojo de confirmacion
- Backend guarda `dischargeReason` + `dischargedAt`, limpia al reactivar

## Migracion V69 (ejecutada en Supabase)
```sql
ALTER TABLE user_psychologist ADD COLUMN psychologist_notes TEXT;
ALTER TABLE user_psychologist ADD COLUMN discharge_reason TEXT;
ALTER TABLE user_psychologist ADD COLUMN discharged_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE psychologist_profiles ADD COLUMN default_service VARCHAR(100);
ALTER TABLE psychologist_profiles ADD COLUMN default_price DECIMAL(10,2);
```

## Archivos modificados
- Backend: UserPsychologistEntity, PsychologistProfileEntity, PsychologistDtos, PsychologistService, PsychologistController, V69 migration
- Frontend: App.tsx, CrisisButton.tsx, InitialTestFlow.tsx, ChatWidget.tsx, PsychSettingsTab.tsx, CalendarWeek.tsx, PsychCalendarTab.tsx, PsychPatientsTab.tsx, PsychPatientProfileView.tsx, api.ts
