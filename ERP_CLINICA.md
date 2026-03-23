# ERP Clínica — Gantly

> Plataforma de gestión para clínicas y consultas psicológicas. Inspirado en Doctoralia pero orientado a la gestión interna de una clínica con sus psicólogos.

---

## Visión general

Una clínica (rol `EMPRESA`) accede a un panel ERP donde puede:
- Ver y gestionar todos sus psicólogos vinculados
- Ver la agenda de cada psicólogo
- Gestionar pacientes de la clínica
- Ver métricas y facturación global
- Invitar psicólogos (por código de referido o por email directo)

El psicólogo sigue siendo un usuario normal de Gantly (`PSYCHOLOGIST`) pero vinculado a la empresa. Conserva su propio panel, su agenda, sus pacientes y su autonomía. La clínica tiene visibilidad y control de gestión, no acceso clínico (no ve notas de sesión, ni historial terapéutico privado).

---

## Cómo se une un psicólogo a una clínica

### Opción A — Código de referido (ya existe)
- La clínica tiene un `referral_code` único
- El psicólogo se registra en Gantly con ese código → queda vinculado automáticamente

### Opción B — Invitación por email (a construir)
- Desde el panel ERP, la clínica escribe el email del psicólogo
- Gantly envía un email con un link de invitación con token único
- El psicólogo pincha el link → si ya tiene cuenta, queda vinculado; si no, va al registro pre-rellenado
- La invitación caduca en 7 días

---

## Módulos del ERP

### 1. Dashboard principal (home)
- KPIs globales de la clínica:
  - Total psicólogos activos
  - Total pacientes activos
  - Citas esta semana / este mes
  - Facturación del mes actual vs mes anterior
  - Tasa de ocupación (citas realizadas / slots disponibles)
- Gráfico de evolución mensual de citas y facturación
- Alertas: psicólogos sin actividad reciente, citas sin confirmar, pagos pendientes

### 2. Gestión de psicólogos
- Listado con: nombre, foto, especialidad, nº pacientes activos, valoración media, próximas citas, estado (activo/inactivo)
- Ficha individual:
  - Perfil completo
  - Su agenda semanal (solo lectura, sin editar slots)
  - Sus pacientes (nombre, estado, fecha de asignación)
  - Historial de citas (pasadas + futuras) con estado de pago
  - Facturación acumulada
  - Documentos y contratos subidos (PDF)
- Acciones de la clínica sobre el psicólogo:
  - Invitar (email) / Desvincular
  - Activar / Desactivar (bloquear nuevas citas sin eliminar las actuales)
  - Subir/ver documentos contractuales
  - Añadir nota interna (solo visible para la clínica)

### 3. Gestión de pacientes
- Listado de pacientes de la clínica (todos los asignados a sus psicólogos)
- Vista de paciente:
  - Psicólogo asignado
  - Estado (activo / alta / baja)
  - Historial de citas
  - Tests realizados (solo ver resultados, no contenido terapéutico)
- Acciones:
  - Asignar/reasignar psicólogo
  - Marcar como alta
  - Ver informe de tests (si el psicólogo lo ha autorizado)

### 4. Agenda global
- Vista calendario multi-psicólogo (filtrar por psicólogo)
- Vista semanal con slots ocupados/libres por colores
- Agendar cita en nombre de la clínica (para un paciente y un psicólogo de la clínica)
- Ver citas del día / de la semana

### 5. Facturación y reporting
- Tabla de citas con: psicólogo, paciente, fecha, duración, precio, estado de pago
- Filtros: psicólogo, rango de fechas, estado de pago
- Totales: facturado / pendiente / cancelado
- Resumen por psicólogo (tabla y gráfico de barras)
- Exportar CSV / PDF
- Vista mensual con comparativa vs mes anterior

### 6. Invitaciones
- Lista de invitaciones pendientes (email, fecha de envío, estado: pendiente/aceptada/caducada)
- Reenviar / Revocar invitación
- Historial de psicólogos desvinculados

### 7. Configuración de la clínica
- Datos básicos: nombre, logo, dirección, teléfono, web
- Código de referido visible y copiable
- Configuración de notificaciones
- Gestión de administradores de la clínica (si se quiere multi-admin en el futuro)

---

## Arquitectura técnica

### Lo que se mantiene
- `CompanyEntity` — entidad de empresa (ya existe)
- `CompanyRepository` — ya existe
- `CompanyAuthService` — ya existe
- `UserEntity.companyId` — ya existe (vinculación psicólogo → empresa)
- Registro por código de referido — ya existe
- `RegisterCompany.tsx` — ya existe

### Lo que se elimina (código actual)
- `CompanyController` — endpoints obsoletos (booking, availability)
- `CompanyService` — lógica obsoleta
- `CompanyDashboard.tsx` — UI obsoleta

### Lo que se construye nuevo

#### Backend
- `ClinicController` — nuevo controlador ERP (reemplaza CompanyController)
  - `GET /clinic/dashboard` — KPIs globales
  - `GET /clinic/psychologists` — listado psicólogos
  - `GET /clinic/psychologists/{id}` — ficha psicólogo
  - `GET /clinic/psychologists/{id}/agenda` — agenda semanal
  - `GET /clinic/patients` — listado pacientes
  - `GET /clinic/patients/{id}` — ficha paciente
  - `POST /clinic/patients/{id}/reassign` — reasignar psicólogo
  - `GET /clinic/appointments` — todas las citas (con filtros)
  - `GET /clinic/billing` — resumen facturación
  - `POST /clinic/invitations` — invitar psicólogo por email
  - `GET /clinic/invitations` — listar invitaciones
  - `DELETE /clinic/invitations/{id}` — revocar
  - `POST /clinic/invitations/{token}/accept` — aceptar invitación (público)
  - `POST /clinic/psychologists/{id}/deactivate` — desactivar psicólogo
  - `POST /clinic/psychologists/{id}/unlink` — desvincular psicólogo

- `ClinicInvitationEntity` — nueva entidad:
  - `id`, `companyId`, `email`, `token` (UUID), `status` (PENDING/ACCEPTED/EXPIRED), `createdAt`, `expiresAt`

- `ClinicService` — lógica del ERP

#### Frontend
- `ClinicDashboard.tsx` — componente principal con tabs
  - `ClinicOverviewTab.tsx` — KPIs + gráficos
  - `ClinicPsychologistsTab.tsx` — listado + ficha
  - `ClinicPatientsTab.tsx` — pacientes
  - `ClinicAgendaTab.tsx` — calendario multi-psicólogo
  - `ClinicBillingTab.tsx` — facturación
  - `ClinicInvitationsTab.tsx` — invitaciones

---

## Modelo de datos adicional

### Tabla `clinic_invitations`
```sql
CREATE TABLE clinic_invitations (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  company_id BIGINT NOT NULL,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(64) NOT NULL UNIQUE,
  status ENUM('PENDING','ACCEPTED','EXPIRED') DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  FOREIGN KEY (company_id) REFERENCES companies(id)
);
```

### Columna adicional en `users`
- `clinic_active` BOOLEAN DEFAULT TRUE — para activar/desactivar psicólogo sin desvincularlo

---

## Fases de desarrollo

### Fase 1 — Base (prioridad alta)
- [ ] Eliminar CompanyController/CompanyService/CompanyDashboard actuales
- [ ] Crear ClinicInvitationEntity + tabla + migraciones SQL
- [ ] Endpoint invitar por email + template email invitación
- [ ] Endpoint aceptar invitación (token público)
- [ ] ClinicController: dashboard KPIs, listado psicólogos, ficha psicólogo
- [ ] ClinicDashboard.tsx con tabs básicos: overview, psicólogos, invitaciones

### Fase 2 — Gestión completa
- [ ] Ficha psicólogo con agenda read-only
- [ ] Gestión pacientes (listado, reasignación, alta)
- [ ] Desactivar / desvincular psicólogo
- [ ] Agenda global multi-psicólogo

### Fase 3 — Facturación y reporting
- [ ] Módulo de facturación con filtros
- [ ] Gráficos (BarChart existente + nuevos)
- [ ] Exportar CSV / PDF

### Fase 4 — Configuración y pulido
- [ ] Configuración de la clínica (logo, datos)
- [ ] Notas internas sobre psicólogos
- [ ] Documentos contractuales (subida PDF)

---

## Notas de diseño

- El psicólogo NO pierde su autonomía: sigue gestionando sus slots, sus pacientes y sus notas
- La clínica NO ve notas de sesión ni contenido clínico privado
- La clínica SÍ puede ver resultados de tests si el psicólogo lo autoriza (fase futura)
- Multi-clínica no está en scope ahora: un psicólogo = una clínica
- El rol `EMPRESA` inicia sesión igual que ahora (LoginForm → JWT)
