# 2026-05-10 — Auditoría de Ciberseguridad + RGPD + Fixes Arquitecturales

## Resumen
Auditoría completa de seguridad (backend + frontend), implementación de fixes CRITICAL/HIGH, compliance RGPD para datos de salud, y fixes arquitecturales pendientes.

## Commits realizados

### 1. `8d2d9bf` — PostgreSQL compat + UTF-8 + MatchingAnimation
- Remove @Lob de ConsentRequestEntity/ConsentDocumentTypeEntity (PostgreSQL OID fix)
- Remove readOnly de ChatService.getChatHistory()
- Fix export MySQL con --default-character-set=utf8mb4
- Rediseño completo MatchingAnimation (orbital ring + partículas + Framer Motion)
- Fix TestResultsView radar chart (smart labels + layout side-by-side)

### 2. `bec622c` — Security hardening base
- OAuth2 code exchange (UUID 30s, no token en URL hash)
- WebSocket CONNECT auth + destination validation + 10KB limit
- Password 10 chars + mayúscula + símbolo
- Rate limit per email en verificación (5 intentos → 15min lock)
- Lockout escalado 15min → 1h → 4h → 24h
- FileController IDOR fix (ownership verification)
- CSP header, InputSanitizer sin blacklist SQL, request limits
- Frontend: safeStorage, Stripe URL whitelist, npm audit fix

### 3. `5c66a6a` — Arquitectura: GDPR + PII + encryption + double-booking
- GDPR: export data + delete account + consent flow + privacy policy
- PII encryption at-rest (AES-256-GCM, email determinístico)
- Clinic chat encryption (AES-256-GCM)
- Refresh token rotation
- Double-booking prevention (unique index)
- Appointment expiration 48h (scheduler)
- Timezone Europe/Madrid centralizado (6 servicios)

### 4. `f9dfffe` — Features: chat + matching + ERP video + TOTP + IVA
- Chat clínica↔paciente: fix polling bug + auto-scroll
- Matching: hard exclude para menores, zero floor score
- Videollamada ERP: bypass payment gate para clínica/efectivo
- TOTP encryption con PiiEncryptConverter
- IVA/impuestos: campos tax, billing Base/IVA/Total, PDF/CSV

### 5. `c7ead4b` — RGPD health data compliance
- Consentimiento separado datos de salud (Art. 9.2.a)
- Data retention: job diario 3AM (cuentas no verificadas 30d, notificaciones 90d)
- SecurityBreachService (rate limit + lockout logging)
- Privacy policy actualizada (14 secciones)
- CookieBanner global (almacenamiento local)

## Archivos nuevos creados
- `OAuthCodeStoreService.java` — almacén de códigos OAuth temporales
- `GdprController.java` + `GdprService.java` — endpoints RGPD
- `PiiEncryptionService.java` — encriptación PII AES-256-GCM
- `PiiEncryptConverter.java` + `PiiDeterministicConverter.java` — JPA converters
- `PiiConverterInitializer.java` — bridge Spring → JPA static
- `AppTimezone.java` — constante Europe/Madrid centralizada
- `SecurityBreachService.java` — logging de brechas
- Migrations V39-V45

## Auditoría de seguridad
- **Backend**: 8 CRITICAL, 9 HIGH, 11 MEDIUM, 3 LOW encontrados
- **Frontend**: 5 CRITICAL, 12 HIGH, 12 MEDIUM, 5 LOW encontrados
- **Resueltos hoy**: 13 CRITICAL, 15 HIGH, 6 MEDIUM
- **Pendientes**: Requieren terceros (Stripe config), infra (env vars, Redis), o decisión (JWT cookies)

## Lo que queda pendiente
Ver sección "Pending Features" actualizada en CLAUDE.md
