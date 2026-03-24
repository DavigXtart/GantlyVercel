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

El psicólogo sigue siendo un usuario normal de Gantly (`PSYCHOLOGIST`) pero vinculado a la empresa. Conserva su propio panel, su agenda, sus pacientes y su autonomía. La clínica tiene visibilidad y control de gestión, no acceso clínico (no ve notas de sesión ni historial terapéutico privado).

---

## Estado de implementación (Mar 2026)

### Completado ✅

| Módulo | Descripción |
|--------|-------------|
| ClinicDashboard | 7 pestañas: Inicio, Estadísticas, Agenda, Equipo, Pacientes, Facturación, Config |
| ClinicAgenda | Calendario multi-psicólogo, crear/editar/cancelar citas |
| ClinicPatients | Listado + ficha con perfil clínico (ClinicPatientProfileEntity) |
| ClinicBilling | Tabla con filtros, export CSV, PDF de factura por cita (jsPDF) |
| ClinicStats | Tab de KPIs + barras por psicólogo + tendencia 6 meses |
| Notas de sesión | `clinicNotes` por cita, edición inline en ficha paciente |
| Documentos del paciente | Upload/download/delete en pestaña Documentos (V36 migration) |
| Sistema de invitaciones | Email con token UUID, flujo en Register.tsx (V35 migration) |
| Feature E: Link de pago | Botón Stripe Checkout desde cita PENDING en ficha paciente |
| Feature F: Chat clínica→paciente | Pestaña Chat en ficha paciente, polling 5s (V37 migration) |
| Feature G: Agenda psicólogo | Expandible en EquipoTab, próximos 30 días con colores |
| Estilo Gantly | material-symbols, bg-cream/forest/sage, sidebar-item CSS |
| NotificationBell | Para rol EMPRESA en App.tsx |

### API implementada

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/clinic/me | Info de la clínica |
| GET | /api/clinic/psychologists | Lista psicólogos |
| GET | /api/clinic/psychologists/{id}/schedule | Agenda psicólogo próximos 30d |
| GET | /api/clinic/agenda | Citas con filtro fecha |
| POST | /api/clinic/appointments | Crear cita |
| PUT | /api/clinic/appointments/{id} | Editar cita |
| DELETE | /api/clinic/appointments/{id} | Cancelar cita |
| PUT | /api/clinic/appointments/{id}/notes | Editar nota admin |
| POST | /api/clinic/appointments/{id}/payment-link | Generar link Stripe |
| GET | /api/clinic/patients | Lista pacientes |
| GET | /api/clinic/patients/{id} | Ficha paciente |
| PUT | /api/clinic/patients/{id} | Actualizar perfil clínico |
| POST | /api/clinic/patients/{id}/documents | Subir documento |
| GET | /api/clinic/patients/{id}/documents | Listar documentos |
| DELETE | /api/clinic/documents/{docId} | Eliminar documento |
| GET | /api/clinic/billing | Facturación con filtros |
| GET | /api/clinic/stats | KPIs + tendencias |
| POST | /api/clinic/invitations | Invitar psicólogo |
| GET | /api/clinic/invitations | Listar invitaciones |
| DELETE | /api/clinic/invitations/{id} | Cancelar invitación |
| GET | /api/clinic/chat/{patientId} | Historial de chat |
| POST | /api/clinic/chat/{patientId} | Enviar mensaje (CLINIC) |
| GET | /api/auth/invite-info | Info invitación por token (público) |

### Migraciones SQL aplicadas

| Versión | Contenido |
|---------|-----------|
| V35 | `clinic_invitations` table |
| V36 | `clinic_patient_documents` table |
| V37 | `clinic_chat_messages` table |

---

## Pendiente — por prioridad

### Alta prioridad

#### 1. Respuesta al chat del paciente
El paciente no tiene UI para contestar los mensajes de la clínica. El backend ya lo soporta (los mensajes con `sender=PATIENT` se guardarían igual). Falta:
- Endpoint accesible con JWT de rol USER: `GET/POST /api/clinic/chat/{patientId}` necesita admitir también rol USER autenticando por `patientId == currentUser.id`
- O crear endpoints públicos al paciente: `GET/POST /api/patient/clinic-chat`
- Nueva pestaña "Mensajes de mi clínica" en `UserDashboard`

#### 2. Notificación de chat
Cuando la clínica envía un mensaje, el paciente no recibe notificación. Usar el `NotificationService` existente para crear una `NotificationEntity` al paciente cuando se guarda un mensaje `CLINIC`.

#### 3. Videollamada en citas del ERP
Las citas creadas por la clínica no tienen botón Jitsi. `JitsiService` bloquea si `paymentStatus != PAID`. Opciones:
- Al crear una cita desde el ERP con `paymentStatus=PAID`, ya debería funcionar
- O añadir un bypass para citas donde la clínica es la creadora

---

### Media prioridad

#### 4. Recordatorios automáticos de cita
Email 24h antes de la cita usando `EmailService` existente y un `@Scheduled` job. Configurar en `application.yml`:
```java
@Scheduled(cron = "0 0 8 * * *") // cada día a las 8:00
public void sendAppointmentReminders() { ... }
```

#### 5. Catálogo de servicios con precios
Tabla `clinic_services` (id, company_id, name, duration_min, price). Al crear una cita, seleccionar servicio del catálogo en lugar de escribirlo a mano. Nuevo endpoint `GET/POST /api/clinic/services`.

#### 6. Citas recurrentes
Al crear una cita, opción "Repetir" (semanal/quincenal, N sesiones). Genera N `AppointmentEntity` en bucle.

#### 7. Portal del paciente — vista de clínica
En `UserDashboard`, nueva sección "Mi clínica" (si el paciente está asignado a una clínica) que muestra:
- Sus próximas citas de la clínica
- Sus facturas/recibos
- Sus documentos compartidos por la clínica
- Chat con la clínica

#### 8. Informe de psicólogo PDF
Botón "Generar informe" en la ficha del psicólogo (EquipoTab) que descarga PDF con: citas del mes, ingresos, tasa de asistencia. Frontend-only con jsPDF (igual que factura).

---

### Baja prioridad

#### 9. Configuración avanzada de la clínica
- Logo, dirección, teléfono, web, CIF/NIF (datos fiscales para facturas)
- Actualmente la Config tab solo muestra datos readonly

#### 10. Desvincular / desactivar psicólogo
- `POST /api/clinic/psychologists/{id}/deactivate` — bloquea nuevas citas sin eliminar las actuales
- `POST /api/clinic/psychologists/{id}/unlink` — desvincula completamente (setea `companyId = null`)
- Botones en tarjeta del psicólogo en EquipoTab

#### 11. Lista de espera
Tabla `clinic_waitlist` (company_id, patient_id, psychologist_id, requested_at). Cuando un psicólogo libera un slot, notificar al primer paciente en cola.

#### 12. Multi-administrador
Varios usuarios con rol EMPRESA para la misma clínica. Requiere nueva tabla `clinic_admins` (company_id, user_id, role).

#### 13. Facturación a aseguradoras
Campo `insurance_company` en `ClinicPatientProfileEntity`. Exportar facturas agrupadas por aseguradora. Flujo de pago distinto (no Stripe, sino remesa mensual).

#### 14. Firma digital de consentimientos RGPD
Enviar formulario por email al paciente con token único. Al abrirlo, marcar `consentSigned = true` en `ClinicPatientProfileEntity`. Email template necesario.

#### 15. Gestión de bajas/ausencias del psicólogo
Bloquear rangos de fechas en la agenda de un psicólogo desde el ERP (ej. vacaciones). Crearía `AppointmentEntity` con `status=BLOCKED` en el rango.

#### 16. Página pública de la clínica con reserva online
URL pública `/{clinicSlug}` con perfil de la clínica y botón "Reservar cita". Requiere campo `slug` en `CompanyEntity` y landing page pública.

---

## Notas de diseño

- El psicólogo NO pierde su autonomía: sigue gestionando sus slots, sus pacientes y sus notas
- La clínica NO ve notas de sesión ni contenido clínico privado
- La clínica SÍ puede ver resultados de tests si el psicólogo lo autoriza (fase futura)
- Multi-clínica no está en scope ahora: un psicólogo = una clínica
- El rol `EMPRESA` inicia sesión igual que ahora (LoginForm → JWT con prefijo `company:`)
- Chat de clínica usa REST polling (5s), NO WebSocket (evita conflicto con ChatConversationEntity que tiene UNIQUE en psychologist_id+user_id)
