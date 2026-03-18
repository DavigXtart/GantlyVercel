# Musts antes de deploy a produccion

## BLOQUEANTES - Seguridad

### 1. Externalizar secrets hardcodeados
- **Que**: Gmail password, OAuth fallbacks, JWT secret estan en `application-prod.yml`. Moverlos todos a variables de entorno / `.env.prod`.
- **Ficheros**: `application-prod.yml`, `SecurityConfig.java`
- **Tiempo estimado**: 30 min

### 2. Restringir CORS al dominio
- **Que**: CORS esta con wildcard `*` + `credentials=true` en `SecurityConfig.java`. Cambiar a `https://gantly.es`.
- **Ficheros**: `SecurityConfig.java`
- **Tiempo estimado**: 15 min

### 3. Arreglar OAuth2 token en URL
- **Que**: El token se pasa por `sendRedirect(?token=...)`, visible en historial del navegador y logs del servidor. Mover a fragment (`#token=`) o cookie httpOnly.
- **Ficheros**: `OAuth2SuccessHandler.java`, `App.tsx`
- **Tiempo estimado**: 1 hora

### 4. WebSocket CORS + wss://
- **Que**: WebSocket tiene CORS wildcard y no fuerza `wss://`. Restringir allowed origins al dominio y forzar secure.
- **Ficheros**: `WebSocketConfig.java`
- **Tiempo estimado**: 20 min

### 5. Mejorar derivacion de clave de chat
- **Que**: La clave de cifrado del chat se deriva de user IDs sin salt ni PBKDF2. Deberia usar una derivacion mas robusta.
- **Ficheros**: `ChatWidget.tsx` o backend `ChatService.java`
- **Tiempo estimado**: 2 horas

### 6. Cifrar datos de salud en BD
- **Que**: Mood entries, test results, evaluaciones estan en texto plano en MySQL. Para cumplimiento RGPD estricto con datos de salud (categoria especial), deberian estar cifrados at rest.
- **Ficheros**: Entidades JPA (`DailyMoodEntryEntity`, `TestResultEntity`, etc.), posible `AttributeConverter` JPA
- **Tiempo estimado**: 4-6 horas

### 7. Verificar que SQL debug logging esta desactivado en prod
- **Que**: Puede loguear PII. Ya configuramos `logback-spring.xml` con Hibernate a WARN, pero verificar que `application-prod.yml` no lo sobreescribe.
- **Ficheros**: `application-prod.yml`, `logback-spring.xml`
- **Tiempo estimado**: 15 min

---

## BLOQUEANTES - Infraestructura

### 8. Dominio y DNS
- **Que**: Comprar/configurar dominio `gantly.es` y apuntar registros A al IP del servidor.
- **Tiempo estimado**: 30 min (si ya se tiene el dominio)

### 9. Servidor/VPS
- **Que**: Contratar servidor con Docker (DigitalOcean, Hetzner, AWS EC2...). Minimo 2GB RAM, 2 vCPU para MySQL + Spring Boot + Nginx.
- **Tiempo estimado**: 1 hora (provision + Docker install + firewall)

### 10. Crear fichero `.env.prod` con secretos reales
- **Que**: Crear con todos los valores de produccion:
  - `DB_PASSWORD` - Password segura para MySQL
  - `JWT_SECRET` - Clave secreta para JWT (min 256 bits)
  - `GMAIL_PASSWORD` - App password de Gmail (o credenciales SendGrid/SES)
  - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - OAuth2 de produccion
  - `STRIPE_SECRET_KEY` / `STRIPE_PUBLIC_KEY` / `STRIPE_WEBHOOK_SECRET` - Keys de Stripe live
  - `SENTRY_DSN` / `VITE_SENTRY_DSN` - DSN del proyecto Sentry
- **Tiempo estimado**: 1 hora (incluye crear cuentas Sentry, configurar Stripe live, generar app password Gmail)

### 11. Certificados SSL (Let's Encrypt)
- **Que**: Ejecutar `scripts/init-letsencrypt.sh` en el servidor una vez DNS apunte correctamente.
- **Tiempo estimado**: 15 min

### 12. Proveedor de email para produccion
- **Que**: Gmail SMTP tiene limite de 500 emails/dia. Para produccion real, migrar a SendGrid, AWS SES o similar.
- **Ficheros**: `EmailService.java`, `application-prod.yml`
- **Tiempo estimado**: 2 horas (cuenta + config + tests)

---

## BLOQUEANTES - Legal/RGPD

### 13. Flow de consentimiento obligatorio al registrarse
- **Que**: Las paginas legales existen pero falta un checkbox obligatorio "Acepto la politica de privacidad y terminos de servicio" en el formulario de registro.
- **Ficheros**: `Register.tsx`, opcionalmente backend para guardar timestamp de aceptacion
- **Tiempo estimado**: 1 hora

### 14. DPO real y email funcional
- **Que**: El email `dpo@gantly.es` de la politica de privacidad debe existir y tener a alguien responsable detras. Configurar buzones: `dpo@`, `soporte@`, `legal@`, `contacto@`.
- **Tiempo estimado**: 30 min (config email con dominio)

---

## RECOMENDADOS (no bloqueantes)

### 15. Mas tests (unitarios + integracion)
- **Que**: Solo hay 33 tests unitarios backend. Faltan tests de integracion (endpoints reales) y tests frontend (vitest/testing-library).
- **Tiempo estimado**: 8-16 horas

### 16. Verificar restauracion de backups
- **Que**: El servicio de backup diario existe en docker-compose pero hay que probar que la restauracion funciona.
- **Tiempo estimado**: 1 hora

### 17. Verificar rate limiting
- **Que**: `RateLimitFilter` existe. Verificar que los limites son adecuados para trafico real y que no bloquea usos legitimos.
- **Tiempo estimado**: 30 min

### 18. Configurar Sentry real
- **Que**: Sentry esta integrado pero hay que crear el proyecto en sentry.io, obtener DSN y ponerlo en `.env.prod`.
- **Tiempo estimado**: 30 min

### 19. Limpiar URLs hardcodeadas a localhost
- **Que**: Revisar si quedan `localhost` en componentes React (file download links, etc.) y reemplazar por rutas relativas.
- **Tiempo estimado**: 30 min

### 20. Stripe modo live
- **Que**: Cambiar de test keys a live keys, verificar webhooks en produccion, configurar endpoint de webhook en dashboard de Stripe.
- **Tiempo estimado**: 1 hora

---

## Resumen de tiempos

| Categoria | Items | Tiempo total estimado |
|-----------|-------|-----------------------|
| Seguridad (bloqueante) | 7 items | ~8-10 horas |
| Infraestructura (bloqueante) | 5 items | ~5 horas |
| Legal/RGPD (bloqueante) | 2 items | ~1.5 horas |
| **Total bloqueantes** | **14 items** | **~15-17 horas** |
| Recomendados | 6 items | ~12-20 horas |
| **Total completo** | **20 items** | **~27-37 horas** |

---

## Pasos de deploy (orden sugerido)

```
1. Servidor + dominio + DNS                    (items 8, 9)
2. Crear .env.prod con secretos reales         (item 10)
3. Externalizar secrets del codigo             (item 1)
4. Fijar CORS al dominio                       (items 2, 4)
5. Arreglar OAuth2 token                       (item 3)
6. Verificar logging en prod                   (item 7)
7. Consentimiento en registro                  (item 13)
8. git clone en servidor
9. docker-compose -f docker-compose.prod.yml up -d
10. ./scripts/init-letsencrypt.sh              (item 11)
11. Configurar email de produccion             (items 12, 14)
12. Verificar HTTPS, login, pagos, chat
13. Configurar Sentry + Stripe live            (items 18, 20)
```

> Los items 5 (cifrado chat) y 6 (cifrado BD) pueden hacerse post-launch si el servidor ya esta protegido con HTTPS + acceso restringido a la BD, pero son importantes para cumplimiento RGPD completo.
