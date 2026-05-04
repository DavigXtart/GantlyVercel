# Batch Fixes Design — Mayo 2026

Fixes agrupados por sistema. Excluye: tests/scoring, env vars, tokens expuestos.

## Grupo 1: Stripe/Payments

1. **Scheduled job 48h deadline**: `@Scheduled(cron="0 */15 * * * *")` revisa citas con `paymentStatus=PENDING` y `paymentDeadline < now()` → revertir a `status=FREE`, limpiar patient/payment fields
2. **Webhook deduplication**: En `handleAppointmentPaymentCompleted()`, check `if (appointment.getPaymentStatus().equals("PAID")) return;` antes de procesar
3. **Idempotency key**: `SessionCreateParams.builder().setIdempotencyKey("apt-" + appointmentId)`
4. **Subscription persistence**: Nueva entidad `UserSubscriptionEntity(userId, stripeSubscriptionId, planId, status, currentPeriodEnd)`. En `handleSubscriptionCreated()` persistir. En `handleSubscriptionUpdate()` actualizar status.
5. **Amount validation**: Tras crear session, verificar `session.getAmountTotal() == appointment.getPrice().multiply(BigDecimal.valueOf(100)).longValue()`
6. **Payment failure handler**: Añadir `payment_intent.payment_failed` al webhook switch. Crear notificación al usuario con mensaje de fallo.

## Grupo 2: ERP Clinic

1. **Chat bidireccional**: `GET/POST /api/patient/clinic-chat` accesible por rol USER. Filtra por `patientId == currentUser.id`. Nueva pestaña "Mensajes Clínica" en UserDashboard.
2. **Chat notifications**: En `ClinicService.sendChatMessage()`, crear `NotificationEntity` para el paciente tras guardar mensaje.
3. **Jitsi bypass ERP**: En `JitsiService`, si la cita fue creada por una empresa (`appointment.getCreatedByCompanyId() != null`), skip payment check. Alternativa: en ClinicService al crear cita, auto-set `paymentStatus=PAID` si `paymentMethod=CASH`.
4. **Clinic name en PDF**: `ClinicBilling` recibe `clinicName` como prop desde `ClinicDashboard`. Pasar a `generateInvoicePdf()`.
5. **File validation backend**: En endpoint de upload de documentos, validar extensión (whitelist: pdf, doc, docx, jpg, png) y tamaño máximo (10MB) antes de guardar.

## Grupo 3: Auth/Security

1. **File access control**: SecurityConfig añadir `/uploads/**` como ruta protegida. Nuevo `FileAccessFilter` que verifica que el usuario tiene acceso al recurso (task owner/psychologist para task files, company member para clinic docs).
2. **Password 8 chars**: En `AuthService.resetPassword()`, cambiar `length < 6` a `length < 8`.
3. **TOTP encryption**: Usar `ChatEncryptionService` pattern (AES-256-GCM) para encriptar `totp_secret` antes de persistir. Desencriptar en `TotpService.verifyCode()`.
4. **Token blacklist + logout**: `TokenBlacklistService` con `ConcurrentHashMap<String, Instant>`. `POST /auth/logout` añade token al blacklist. `JwtAuthFilter` consulta blacklist antes de validar. Cleanup scheduled cada 15min para tokens expirados.
5. **WebSocket rate limit**: En `WebSocketConfig` o interceptor custom, limitar a 10 mensajes/minuto por usuario. Descartar mensajes excedentes.

## Grupo 4: Calendar

1. **Timezone**: Cambiar `ZoneId.systemDefault()` a `ZoneOffset.UTC` en `CalendarService.isTodayOrFuture()`. Frontend envía timestamps ISO con offset.
2. **Race condition**: En `bookAppointment()`, usar `@Lock(LockModeType.PESSIMISTIC_WRITE)` en query de appointment o `SELECT ... FOR UPDATE`. Verificar status=FREE dentro de la transacción.
3. **Cascade delete**: En `AppointmentEntity`, añadir `@OneToMany(mappedBy="appointment", cascade=CascadeType.REMOVE, orphanRemoval=true)` para requests.
4. **Audit logging**: Llamar `auditService.log()` en create/update/cancel de appointments con userId, action, appointmentId.

## Grupo 5: Dashboard/Logic

1. **Matching fix**: En `MatchingService`, eliminar el fallback que muestra psicólogos al 15%. Si no pasan filtros absolutos → excluir completamente (`score = 0`, no incluir en resultados).
2. **UserDashboard state fix**: Buscar `setEditProfileForm`/`setPasswordForm` en UserDashboard.tsx. Si se usan como handlers de botón del header, mover esa lógica a `UserSettingsTab` o declarar los states faltantes.
3. **WebSocket reconnect**: En `ChatWidget.tsx`, implementar backoff exponencial: `reconnectDelay` empieza en 3s, duplica hasta 30s max. Reset a 3s en conexión exitosa.
4. **Task file cleanup**: Endpoint `DELETE /admin/cleanup/orphaned-files` que compara archivos en `/uploads/tasks/` con `TaskFileEntity` y elimina los huérfanos.
5. **Reopen task**: `PUT /api/tasks/{id}/reopen` que pone `completedAt = null`. Solo el psicólogo asignado puede reabrir.
