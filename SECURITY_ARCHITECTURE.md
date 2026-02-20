# Arquitectura de Seguridad y Cumplimiento RGPD
## PsicoApp - Sistema de Psicología Clínica

---

## Índice

1. [Introducción](#introducción)
2. [Arquitectura de Seguridad General](#arquitectura-de-seguridad-general)
3. [Autenticación y Autorización](#autenticación-y-autorización)
4. [Cifrado y Protección de Datos](#cifrado-y-protección-de-datos)
5. [Control de Acceso RGPD](#control-de-acceso-rgpd)
6. [Auditoría y Trazabilidad](#auditoría-y-trazabilidad)
7. [Retención y Eliminación de Datos](#retención-y-eliminación-de-datos)
8. [Protección de Infraestructura](#protección-de-infraestructura)
9. [Cumplimiento RGPD](#cumplimiento-rgpd)
10. [Mejores Prácticas de Ciberseguridad](#mejores-prácticas-de-ciberseguridad)

---

## Introducción

PsicoApp es una aplicación de psicología clínica que maneja datos sensibles de pacientes. La arquitectura de seguridad está diseñada para cumplir con:

- **RGPD (Reglamento General de Protección de Datos)**: Protección de datos personales de pacientes
- **Estándares de seguridad médica**: HIPAA-like security practices
- **Ciberseguridad moderna**: Defense in depth, encryption at rest and in transit
- **Principio de mínimo privilegio**: Solo el psicólogo asignado puede ver datos de su paciente

### Principios Fundamentales

1. **Confidencialidad**: Solo el psicólogo asignado y el paciente pueden acceder a sus datos
2. **Integridad**: Los datos no pueden ser modificados sin autorización
3. **Disponibilidad**: El sistema debe estar disponible para usuarios autorizados
4. **Trazabilidad**: Todos los accesos a datos sensibles están auditados
5. **Minimización**: Solo se almacenan los datos necesarios por el tiempo necesario

---

## Arquitectura de Seguridad General

### Diagrama de Capas de Seguridad

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                     │
│  - HTTPS obligatorio (producción)                       │
│  - Tokens en localStorage (access + refresh)            │
│  - Refresh automático de tokens                         │
└─────────────────────────────────────────────────────────┘
                          │ HTTPS/TLS 256-bit
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Rate Limit Filter (Capa 1)                 │
│  - Limita requests por IP                               │
│  - Previene DDoS y brute force                          │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│            JWT Auth Filter (Capa 2)                     │
│  - Valida tokens JWT                                    │
│  - Establece contexto de seguridad                     │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│         Spring Security Filter Chain (Capa 3)          │
│  - Autorización basada en roles                         │
│  - Validación de endpoints                              │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Controladores (Capa 4)                     │
│  - Validación de entrada                                │
│  - Sin lógica de negocio                                │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Servicios (Capa 5)                         │
│  - Validaciones RGPD                                    │
│  - Cifrado E2E                                          │
│  - Auditoría                                            │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│         Base de Datos (MySQL)                           │
│  - Datos cifrados (chat)                                │
│  - Logs de auditoría separados                          │
└─────────────────────────────────────────────────────────┘
```

---

## Autenticación y Autorización

### 1. JwtService

**Ubicación**: `com.alvaro.psicoapp.security.JwtService`

**Propósito**: Generación y validación de tokens JWT con soporte para access tokens y refresh tokens.

#### Funciones Principales

##### `generateAccessToken(String subject)`
- **Descripción**: Genera un access token de corta duración (15 minutos)
- **Seguridad**:
  - Incluye claim `type: "access"` para diferenciación
  - Firma con HMAC-SHA256 usando clave de 256 bits mínimo
  - Incluye `iat` (issued at) y `exp` (expiration)
- **Uso**: Tokens para requests normales de API

##### `generateRefreshToken(String subject)`
- **Descripción**: Genera un refresh token de larga duración (7 días)
- **Seguridad**:
  - Incluye claim `type: "refresh"` para diferenciación
  - Misma firma segura que access tokens
  - Permite renovar access tokens sin re-login
- **Uso**: Renovación automática de access tokens

##### `parseSubject(String token)`
- **Descripción**: Valida y extrae el subject (email) del token
- **Validaciones de Seguridad**:
  1. **Firma**: Verifica que el token esté firmado correctamente
  2. **Expiración**: Rechaza tokens expirados
  3. **Tipo**: Valida que sea un access token (no refresh)
  4. **Antigüedad**: Rechaza tokens con más de 24 horas (previene replay attacks)
  5. **Compatibilidad**: Acepta tokens antiguos sin claim `type` (migración gradual)
- **Manejo de Errores**:
  - `ExpiredJwtException` → "Token expirado"
  - `MalformedJwtException` → "Token inválido"
  - `SecurityException` → Errores de validación personalizados

##### `parseRefreshToken(String refreshToken)`
- **Descripción**: Valida específicamente refresh tokens
- **Validaciones**:
  - Requiere claim `type: "refresh"`
  - Verifica expiración
  - Valida firma

#### Cumplimiento RGPD
- Tokens de corta duración reducen ventana de exposición
- Validación de antigüedad previene uso de tokens robados antiguos
- Separación access/refresh permite revocación granular

---

### 2. JwtConfig

**Ubicación**: `com.alvaro.psicoapp.config.JwtConfig`

**Propósito**: Configuración centralizada de JWT con validaciones de seguridad.

#### Configuración

```java
// Access token: 15 minutos
ACCESS_TOKEN_EXPIRATION_MS = 1000L * 60 * 15

// Refresh token: 7 días
REFRESH_TOKEN_EXPIRATION_MS = 1000L * 60 * 60 * 24 * 7
```

#### Validaciones de Seguridad

1. **JWT_SECRET mínimo 32 bytes (256 bits)**:
   - Requerido para cumplir con estándares AES-256
   - Validación en tiempo de construcción
   - Error claro si no cumple requisitos

2. **Secret de desarrollo vs producción**:
   - Desarrollo: Secret hardcodeado (solo para desarrollo local)
   - Producción: **OBLIGATORIO** desde variable de entorno
   - Falla al arrancar si falta en producción

#### Cumplimiento RGPD
- Secret mínimo de 256 bits cumple con estándares de cifrado fuerte
- Separación dev/prod previene exposición accidental

---

### 3. JwtAuthFilter

**Ubicación**: `com.alvaro.psicoapp.security.JwtAuthFilter`

**Propósito**: Filtro de Spring Security que intercepta todas las requests y valida tokens JWT.

#### Flujo de Ejecución

```
Request → JwtAuthFilter.doFilterInternal()
    │
    ├─ ¿Header Authorization existe?
    │   ├─ NO → Continuar sin autenticación
    │   └─ SÍ → Extraer token
    │       │
    │       ├─ Validar token (JwtService.parseSubject)
    │       │   ├─ Inválido → Log y continuar sin auth
    │       │   └─ Válido → Extraer subject (email)
    │       │
    │       ├─ Determinar rol
    │       │   ├─ company:email → ROLE_EMPRESA
    │       │   └─ email normal → Consultar BD para rol
    │       │
    │       └─ Establecer Authentication en SecurityContext
    │
    └─ Continuar con filter chain
```

#### Funciones Principales

##### `doFilterInternal(HttpServletRequest, HttpServletResponse, FilterChain)`
- **Descripción**: Método principal del filtro
- **Proceso**:
  1. Extrae token del header `Authorization: Bearer <token>`
  2. Valida token con `JwtService.parseSubject()`
  3. Determina rol del usuario (USER, PSYCHOLOGIST, ADMIN, EMPRESA)
  4. Establece `Authentication` en `SecurityContextHolder`
  5. Permite que la request continúe

#### Manejo de Errores

- **Token inválido/expirado**: Log debug, continúa sin autenticación
- **Error inesperado**: Log warning, continúa sin autenticación
- **Sin token**: Request continúa normalmente (puede ser endpoint público)

#### Cumplimiento RGPD
- No expone información sensible en errores
- Logging adecuado para auditoría sin exponer tokens
- Manejo seguro de errores sin información leakage

---

### 4. SecurityConfig

**Ubicación**: `com.alvaro.psicoapp.security.SecurityConfig`

**Propósito**: Configuración centralizada de Spring Security con políticas de autorización.

#### Configuración de Seguridad

##### PasswordEncoder
```java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
}
```
- **Algoritmo**: BCrypt con salt automático
- **Seguridad**: Resistente a rainbow tables y timing attacks

##### SecurityFilterChain

**Orden de Filtros**:
1. `RateLimitFilter` (primero)
2. `JwtAuthFilter`
3. Spring Security filters

**Configuraciones de Producción**:
```java
// HTTPS obligatorio
.requiresChannel(channel -> {
    if (isProd) channel.anyRequest().requiresSecure();
})

// HSTS (HTTP Strict Transport Security)
.headers(headers -> {
    if (isProd) {
        headers.httpStrictTransportSecurity(hsts -> hsts
            .includeSubDomains(true)
            .preload(true)
            .maxAgeInSeconds(31536000) // 1 año
        );
    }
})
```

**Políticas de Autorización**:

| Endpoint | Acceso | Descripción |
|----------|--------|-------------|
| `/api/auth/**` | Público | Registro, login, verificación |
| `/api/tests/**` | Público | Listado de tests disponibles |
| `/api/initial-test/**` | Público | Test inicial sin registro |
| `/api/profile/**` | Autenticado | Perfil del usuario |
| `/api/psych/**` | Autenticado | Funcionalidades de psicólogo |
| `/api/chat/**` | Autenticado | Mensajes de chat |
| `/api/results/**` | Autenticado | Resultados de tests |
| `/api/admin/**` | ROLE_ADMIN | Solo administradores |
| `/api/company/**` | ROLE_EMPRESA | Solo empresas |

**CORS**:
- Configurado para permitir credenciales
- Orígenes permitidos configurables
- Headers y métodos permitidos: todos (configurable)

#### Cumplimiento RGPD
- HTTPS obligatorio en producción protege datos en tránsito
- HSTS previene downgrade attacks
- Autorización granular por rol
- CORS configurado para prevenir CSRF

---

### 5. RateLimitFilter

**Ubicación**: `com.alvaro.psicoapp.security.RateLimitFilter`

**Propósito**: Prevenir abuso de la API mediante rate limiting por IP y endpoint.

#### Configuración

```java
MAX_REQUESTS_PER_MINUTE = 60          // Endpoints generales
MAX_REQUESTS_PER_MINUTE_AUTH = 30     // Endpoints de autenticación
TIME_WINDOW_MS = 60_000               // Ventana de 1 minuto
```

#### Funciones Principales

##### `doFilterInternal(HttpServletRequest, HttpServletResponse, FilterChain)`
- **Descripción**: Implementa rate limiting por IP y endpoint
- **Proceso**:
  1. Extrae IP del cliente (considera proxies: X-Forwarded-For, X-Real-IP)
  2. Identifica endpoint
  3. Crea clave única: `IP:endpoint`
  4. Incrementa contador en ventana de tiempo
  5. Si excede límite → HTTP 429 (Too Many Requests)
  6. Agrega headers informativos: `X-RateLimit-Limit`, `X-RateLimit-Remaining`

##### `cleanupOldCounters()`
- **Descripción**: Limpia contadores antiguos cada 5 minutos
- **Propósito**: Prevenir memory leaks

#### Protecciones

- **Brute Force**: Límite más bajo en `/api/auth/**`
- **DDoS**: Límite general por IP
- **Abuso de endpoints específicos**: Límite por endpoint

#### Cumplimiento RGPD
- Previene ataques que podrían comprometer datos
- Headers informativos para transparencia
- No almacena datos personales, solo IPs temporales

---

### 6. OAuth2SuccessHandler

**Ubicación**: `com.alvaro.psicoapp.security.OAuth2SuccessHandler`

**Propósito**: Maneja el flujo de autenticación OAuth2 (Google) y genera tokens JWT.

#### Flujo OAuth2

```
Usuario → Google Login → OAuth2 Callback
    │
    ├─ Extraer datos de Google (email, name, picture, sub)
    │
    ├─ Validar datos requeridos
    │   ├─ Faltan datos → Redirect con error
    │   └─ Datos OK → Continuar
    │
    ├─ Procesar usuario (AuthService.processOAuth2User)
    │   ├─ Usuario existente → Actualizar datos
    │   └─ Usuario nuevo → Crear cuenta
    │
    └─ Generar token JWT y redirect a frontend
```

#### Funciones Principales

##### `onAuthenticationSuccess(...)`
- **Descripción**: Callback después de autenticación exitosa con Google
- **Proceso**:
  1. Extrae atributos de OAuth2User
  2. Valida datos requeridos (providerId, email)
  3. Llama a `AuthService.processOAuth2User()`
  4. Genera token JWT
  5. Redirige a frontend con token en query parameter

#### Seguridad

- **Validación de datos**: Verifica que email y providerId existan
- **Manejo de errores**: Redirect seguro sin exponer información
- **Token en URL**: Solo para desarrollo, en producción usar POST

#### Cumplimiento RGPD
- Procesa datos mínimos necesarios de OAuth2
- Manejo seguro de datos personales de terceros

---

## Cifrado y Protección de Datos

### 7. ChatEncryptionService

**Ubicación**: `com.alvaro.psicoapp.service.ChatEncryptionService`

**Propósito**: Cifrado End-to-End (E2E) de mensajes de chat usando AES-256-GCM.

#### Algoritmo de Cifrado

- **Algoritmo**: AES-256-GCM (Advanced Encryption Standard, 256 bits, Galois/Counter Mode)
- **Modo**: GCM proporciona cifrado autenticado (AEAD)
- **Tamaño de clave**: 256 bits (32 bytes)
- **IV (Initialization Vector)**: 96 bits (12 bytes), único por mensaje
- **Tag de autenticación**: 128 bits (16 bytes)

#### Funciones Principales

##### `getOrGenerateConversationKey(Long psychologistId, Long userId)`
- **Descripción**: Genera o recupera clave de cifrado para una conversación
- **Derivación de Clave**:
  ```java
  seed = "PSYCHO_CHAT_" + psychologistId + "_PATIENT_" + userId
  keyBytes = SHA-256(seed)
  aesKey = primeros 32 bytes de keyBytes
  ```
- **Características**:
  - Determinística: misma relación = misma clave
  - Cacheada en memoria para rendimiento
  - No se almacena en BD (se deriva cuando se necesita)

##### `encrypt(String plaintext, Long psychologistId, Long userId)`
- **Descripción**: Cifra un mensaje antes de guardarlo en BD
- **Proceso**:
  1. Obtiene clave de conversación
  2. Genera IV aleatorio (único por mensaje)
  3. Inicializa cipher en modo ENCRYPT con GCM
  4. Cifra mensaje (incluye tag de autenticación)
  5. Combina IV + ciphertext
  6. Codifica en Base64 para almacenamiento
- **Formato de salida**: `Base64(IV (12 bytes) + Ciphertext+Tag (variable))`

##### `decrypt(String encryptedMessage, Long psychologistId, Long userId)`
- **Descripción**: Descifra un mensaje cifrado
- **Proceso**:
  1. Decodifica Base64
  2. Extrae IV (primeros 12 bytes)
  3. Extrae ciphertext (resto)
  4. Obtiene clave de conversación
  5. Inicializa cipher en modo DECRYPT
  6. Descifra y verifica tag de autenticación
  7. Retorna texto plano

#### Seguridad

- **Cifrado autenticado**: GCM detecta modificaciones
- **IV único**: Cada mensaje tiene IV diferente (previene patrones)
- **Clave por conversación**: Solo psicólogo y paciente pueden descifrar
- **No almacenamiento de claves**: Se derivan cuando se necesitan

#### Cumplimiento RGPD

- **Cifrado en reposo**: Mensajes cifrados en BD
- **Acceso limitado**: Solo participantes de la conversación pueden descifrar
- **Ni admin puede ver**: Mensajes son ilegibles sin la clave correcta
- **Integridad**: Tag de autenticación detecta modificaciones

---

## Control de Acceso RGPD

### Principio Fundamental

**SOLO el psicólogo asignado puede ver datos de su paciente. Ni admin ni otros roles tienen acceso.**

### 8. Validaciones en Servicios

#### PsychologistService

**Método**: `requirePatientOf(Long psychologistId, Long patientId)`
- **Descripción**: Valida que un paciente pertenezca a un psicólogo
- **Validación**:
  ```java
  var rel = userPsychologistRepository.findByUserId(patientId);
  if (rel.isEmpty() || !rel.get().getPsychologist().getId().equals(psychologistId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Este usuario no es tu paciente");
  }
  ```
- **Uso**: En todos los métodos que acceden a datos de pacientes

**Métodos protegidos**:
- `getPatientDetails()`: Detalles completos del paciente
- `getPatientTestAnswers()`: Respuestas a tests específicos

#### TestResultService

**Método**: `getUserTestResults(UserEntity requester, Long userId, Long testId)`
- **Validaciones**:
  1. Requester debe ser PSYCHOLOGIST
  2. Paciente debe pertenecer al psicólogo
  3. Auditoría de acceso
- **Bloqueo**: Admin NO puede acceder

#### TestResultExportService

**Métodos protegidos**:
- `exportUserTestResults()`: Exporta resultados de un test
- `exportUserAllResults()`: Exporta todos los resultados

**Validaciones**:
- Solo psicólogos asignados
- Verificación de relación antes de exportar
- Auditoría de exportación (crítico RGPD)

#### ChatService

**Método**: `getChatHistory(UserEntity me, Long userId)`
- **Validaciones**:
  - Usuario: Solo puede ver chat con su psicólogo asignado
  - Psicólogo: Solo puede ver chat de SUS pacientes asignados
  - Admin: **BLOQUEADO** explícitamente
- **Cifrado**: Mensajes se descifran solo para usuarios autorizados

**Método**: `createMessage(...)`
- **Validaciones**:
  - Verifica relación psicólogo-paciente antes de enviar
  - Cifra mensaje antes de guardar

#### TaskService

**Método**: `requireTaskAccess(UserEntity user, TaskEntity task)`
- **Validación**:
  ```java
  boolean hasAccess = RoleConstants.PSYCHOLOGIST.equals(user.getRole())
      ? task.getPsychologist().getId().equals(user.getId())
      : task.getUser().getId().equals(user.getId());
  ```
- **Acceso**: Solo psicólogo asignado o el propio paciente

---

## Auditoría y Trazabilidad

### 9. AuditService

**Ubicación**: `com.alvaro.psicoapp.service.AuditService`

**Propósito**: Registra todos los accesos a datos sensibles para cumplimiento RGPD.

#### Logger Especializado

```java
private static final Logger auditLogger = LoggerFactory.getLogger("AUDIT");
```

**Configuración en `logback-spring.xml`**:
- Logger separado: `AUDIT`
- Archivo dedicado: `logs/audit/audit.log`
- Retención: **5 años** (1825 días)
- Rotación: Por tamaño (50MB) y tiempo (diario)
- Formato estructurado para fácil análisis

#### Funciones de Auditoría

##### `logPatientDataAccess(Long psychologistId, Long patientId, String dataType, String action)`
- **Descripción**: Registra acceso autorizado a datos de paciente
- **Formato de log**:
  ```
  RGPD_AUDIT|psychologistId=123|patientId=456|dataType=TEST_RESULTS|action=READ|timestamp=2026-02-16T10:30:00Z
  ```
- **Uso**: Cuando psicólogo accede a datos de su paciente

##### `logUnauthorizedAccess(Long requesterId, String requesterRole, Long targetPatientId, String dataType, String reason)`
- **Descripción**: Registra intentos de acceso no autorizados
- **Formato de log**:
  ```
  RGPD_UNAUTHORIZED|requesterId=789|requesterRole=ADMIN|targetPatientId=456|dataType=TEST_RESULTS|reason=Patient not assigned|timestamp=...
  ```
- **Uso**: Cuando alguien intenta acceder sin autorización

##### `logSelfDataAccess(Long userId, String dataType, String action)`
- **Descripción**: Registra acceso del propio paciente a sus datos
- **Formato de log**:
  ```
  RGPD_AUDIT|userId=456|dataType=CHAT_MESSAGES|action=READ|selfAccess=true|timestamp=...
  ```
- **Uso**: Cuando paciente accede a sus propios datos

##### `logDataExport(Long exporterId, String exporterRole, Long targetPatientId, String dataType, String format)`
- **Descripción**: Registra exportación de datos (crítico RGPD)
- **Formato de log**:
  ```
  RGPD_EXPORT|exporterId=123|exporterRole=PSYCHOLOGIST|targetPatientId=456|dataType=TEST_RESULTS|format=EXCEL|timestamp=...
  ```
- **Uso**: Cuando se exportan datos (requiere especial atención RGPD)

##### `logDataDeletion(Long deleterId, String deleterRole, Long targetPatientId, String dataType)`
- **Descripción**: Registra eliminación de datos (derecho al olvido)
- **Formato de log**:
  ```
  RGPD_DELETION|deleterId=SYSTEM|deleterRole=AUTOMATED|targetPatientId=456|dataType=PATIENT_DATA_ERASURE|timestamp=...
  ```
- **Uso**: Cuando se eliminan datos de pacientes

#### Integración en Servicios

**Servicios que usan auditoría**:
- `PsychologistService`: Accesos a detalles y respuestas
- `TestResultService`: Accesos a resultados
- `TestResultExportService`: Exportaciones
- `ChatService`: Accesos a mensajes
- `PatientDataRetentionService`: Eliminaciones

#### Cumplimiento RGPD

- **Artículo 30**: Registro de actividades de tratamiento
- **Artículo 33**: Notificación de violaciones de seguridad
- **Trazabilidad completa**: Quién, qué, cuándo, por qué
- **Retención**: Logs guardados 5 años (requisito legal)

---

## Retención y Eliminación de Datos

### 10. PatientDataRetentionService

**Ubicación**: `com.alvaro.psicoapp.service.PatientDataRetentionService`

**Propósito**: Implementa el derecho al olvido RGPD mediante borrado/anominización automática de datos de pacientes después de 5 años.

#### Configuración

```java
RETENTION_YEARS = 5  // Cumple con RGPD
```

#### Job Programado

**Cron**: `0 30 2 * * *` (Diario a las 02:30 AM)

**Proceso**:
```java
@Scheduled(cron = "0 30 2 * * *")
public void runRetentionJob() {
    Instant cutoff = Instant.now().minus(5, ChronoUnit.YEARS);
    List<UserEntity> candidates = userRepository.findByRoleAndCreatedAtBefore("USER", cutoff);
    
    for (UserEntity user : candidates) {
        eraseOneUserInNewTx(user.getId());
    }
}
```

#### Función Principal: `eraseOneUserInNewTx(Long userId)`

**Orden de Borrado** (respetando Foreign Keys):

1. **TaskCommentEntity** → Comentarios de tareas
2. **TaskFileEntity** → Archivos de tareas (y borrado físico en disco)
3. **TaskEntity** → Tareas
4. **AppointmentRatingEntity** → Ratings de citas
5. **AppointmentRequestEntity** → Solicitudes de citas
6. **AppointmentEntity** → Citas
7. **ChatMessageEntity** → Mensajes de chat (ya cifrados)
8. **UserAnswerEntity** → Respuestas a tests
9. **EvaluationTestResultEntity** → Resultados de tests de evaluación
10. **TestResultEntity** → Resultados de tests
11. **FactorResultEntity** → Resultados por factor
12. **AssignedTestEntity** → Tests asignados
13. **DailyMoodEntryEntity** → Entradas de ánimo diario
14. **UserPsychologistEntity** → Relación con psicólogo
15. **UserEntity** → Anonimización (no borrado completo)

#### Anonimización de Usuario

**Método**: `anonymizeUser(UserEntity user)`

**Campos anonimizados**:
```java
user.setName("Usuario eliminado");
user.setEmail("anon-" + id + "-" + nonce + "@deleted.local");
user.setPasswordHash(null);
user.setOauth2Provider(null);
user.setOauth2ProviderId(null);
user.setAvatarUrl(null);
user.setGender(null);
user.setAge(null);
// ... todos los campos PII
```

**Campos preservados**:
- `id`: Para mantener integridad referencial
- `createdAt`: Para estadísticas agregadas
- `role`: Para mantener estructura

#### Borrado de Archivos Físicos

**Método**: `deleteTaskFilesOnDisk(Long userId)`
- Lee archivos asociados a tareas del usuario
- Borra archivos físicos del sistema de archivos
- Maneja errores sin fallar el proceso completo

#### Auditoría

- Registra cada eliminación con `AuditService.logDataDeletion()`
- Logs incluyen: deleterId, role, targetPatientId, dataType, timestamp

#### Cumplimiento RGPD

- **Artículo 17**: Derecho al olvido (derecho de supresión)
- **Artículo 5(1)(e)**: Limitación del plazo de conservación
- **Borrado completo**: Todos los datos dependientes eliminados
- **Anonimización**: PII eliminada pero estructura preservada
- **Trazabilidad**: Todas las eliminaciones auditadas

---

## Protección de Infraestructura

### SSL/TLS 256-bit

**Configuración**: `application-prod.yml`

```yaml
server:
  ssl:
    enabled: true
    key-store: classpath:keystore.p12
    key-store-password: ${SSL_KEYSTORE_PASSWORD}
    enabled-protocols: TLSv1.2,TLSv1.3
    ciphers: TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,...
```

**Cipher Suites Permitidas** (solo 256-bit):
- `TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384`
- `TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384`
- `TLS_DHE_RSA_WITH_AES_256_GCM_SHA384`
- `TLS_AES_256_GCM_SHA384`
- `TLS_CHACHA20_POLY1305_SHA256`

**HSTS**:
- `maxAgeInSeconds: 31536000` (1 año)
- `includeSubDomains: true`
- `preload: true`

### Logging de Seguridad

**Archivos de Log**:
- `logs/audit/audit.log`: Auditoría RGPD (retención 5 años)
- `logs/error.log`: Errores de aplicación
- `logs/spring.log`: Logs generales

**Rotación**:
- Por tamaño: 50MB (audit), 10MB (error)
- Por tiempo: Diario
- Compresión: Automática (.gz)
- Limpieza: Automática después de retención

---

## Cumplimiento RGPD

### Principios RGPD Implementados

#### 1. Licitud, Lealtad y Transparencia (Art. 5(1)(a))
- ✅ Política de privacidad clara
- ✅ Consentimiento explícito para tratamiento de datos
- ✅ Transparencia en uso de datos

#### 2. Limitación de la Finalidad (Art. 5(1)(b))
- ✅ Datos solo para propósito terapéutico
- ✅ No se comparten con terceros sin consentimiento

#### 3. Minimización de Datos (Art. 5(1)(c))
- ✅ Solo se almacenan datos necesarios
- ✅ Anonimización después de 5 años

#### 4. Exactitud (Art. 5(1)(d))
- ✅ Usuarios pueden actualizar sus datos
- ✅ Validación de entrada

#### 5. Limitación del Plazo de Conservación (Art. 5(1)(e))
- ✅ Borrado automático después de 5 años
- ✅ `PatientDataRetentionService` implementa esto

#### 6. Integridad y Confidencialidad (Art. 5(1)(f))
- ✅ Cifrado E2E para chat
- ✅ SSL/TLS 256-bit para transporte
- ✅ Controles de acceso estrictos

### Derechos del Interesado

#### Derecho de Acceso (Art. 15)
- ✅ Usuarios pueden ver sus propios datos
- ✅ Endpoints: `/api/profile/me`, `/api/results/my-results`

#### Derecho de Rectificación (Art. 16)
- ✅ Usuarios pueden actualizar su perfil
- ✅ Endpoint: `/api/profile/update`

#### Derecho de Supresión (Art. 17)
- ✅ Implementado en `PatientDataRetentionService`
- ✅ Borrado automático después de 5 años
- ✅ Borrado manual posible (requiere implementación de endpoint)

#### Derecho a la Limitación del Tratamiento (Art. 18)
- ✅ Usuarios pueden desactivar cuenta
- ✅ Estado `DISCHARGED` en relación psicólogo-paciente

#### Derecho a la Portabilidad (Art. 20)
- ✅ Exportación de resultados en Excel
- ✅ Endpoint: `/api/results/export`

#### Derecho de Oposición (Art. 21)
- ✅ Usuarios pueden rechazar tratamiento
- ✅ Pueden eliminar cuenta

### Medidas Técnicas y Organizativas (Art. 32)

#### Pseudonimización
- ✅ Datos anonimizados después de 5 años
- ✅ Identificadores únicos para relaciones

#### Cifrado
- ✅ Cifrado en tránsito: SSL/TLS 256-bit
- ✅ Cifrado en reposo: AES-256-GCM para chat
- ✅ Contraseñas: BCrypt con salt

#### Confidencialidad
- ✅ Control de acceso estricto
- ✅ Solo psicólogo asignado puede ver datos
- ✅ Ni admin puede acceder

#### Integridad
- ✅ Validación de entrada
- ✅ Cifrado autenticado (GCM)
- ✅ Logs de auditoría

#### Disponibilidad
- ✅ Rate limiting previene DDoS
- ✅ Validaciones robustas
- ✅ Manejo de errores seguro

#### Resiliencia
- ✅ Transacciones atómicas
- ✅ Rollback en caso de error
- ✅ Logs para recuperación

---

## Mejores Prácticas de Ciberseguridad

### Defense in Depth

1. **Capa 1 - Red**: Rate limiting, firewall
2. **Capa 2 - Transporte**: HTTPS/TLS 256-bit, HSTS
3. **Capa 3 - Autenticación**: JWT con refresh tokens
4. **Capa 4 - Autorización**: Spring Security, roles
5. **Capa 5 - Aplicación**: Validaciones RGPD, cifrado E2E
6. **Capa 6 - Datos**: Cifrado en reposo, anonimización

### Principio de Mínimo Privilegio

- ✅ Usuarios solo ven sus propios datos
- ✅ Psicólogos solo ven datos de sus pacientes asignados
- ✅ Admin NO puede ver datos de pacientes
- ✅ Empresas solo ven datos agregados de sus psicólogos

### Seguridad por Diseño

- ✅ Validaciones en múltiples capas
- ✅ Cifrado desde el diseño
- ✅ Auditoría integrada
- ✅ Manejo seguro de errores

### Gestión de Secretos

- ✅ JWT_SECRET desde variables de entorno
- ✅ Validación de longitud mínima
- ✅ Secret diferente dev/prod
- ✅ No hardcodeado en código

### Gestión de Sesiones

- ✅ Tokens stateless (JWT)
- ✅ Access tokens de corta duración (15 min)
- ✅ Refresh tokens de larga duración (7 días)
- ✅ Validación de antigüedad (previene replay)

### Prevención de Ataques Comunes

#### SQL Injection
- ✅ JPA/Hibernate (parametrizado)
- ✅ Validación de entrada

#### XSS (Cross-Site Scripting)
- ✅ Sanitización de entrada (`InputSanitizer`)
- ✅ Headers de seguridad (X-Content-Type-Options)

#### CSRF (Cross-Site Request Forgery)
- ✅ CORS configurado
- ✅ Tokens en headers (no cookies)

#### Brute Force
- ✅ Rate limiting en `/api/auth/**`
- ✅ Límite de 30 requests/minuto

#### DDoS
- ✅ Rate limiting general
- ✅ Límite de 60 requests/minuto

#### Replay Attacks
- ✅ Validación de antigüedad de tokens (24 horas)
- ✅ Tokens de corta duración

---

## Resumen de Seguridad

### Checklist de Seguridad

- [x] Autenticación fuerte (JWT con refresh tokens)
- [x] Autorización basada en roles
- [x] Cifrado en tránsito (SSL/TLS 256-bit)
- [x] Cifrado en reposo (AES-256-GCM para chat)
- [x] Control de acceso estricto RGPD
- [x] Auditoría completa de accesos
- [x] Retención y eliminación de datos (5 años)
- [x] Rate limiting (previene DDoS y brute force)
- [x] Validación de entrada
- [x] Manejo seguro de errores
- [x] Logging estructurado
- [x] HSTS en producción
- [x] HTTPS obligatorio en producción

### Métricas de Seguridad

- **Cifrado**: AES-256-GCM (256 bits)
- **Transporte**: TLS 1.2/1.3 con cipher suites 256-bit
- **Tokens**: HMAC-SHA256 con secret mínimo 256 bits
- **Contraseñas**: BCrypt con salt automático
- **Retención de logs**: 5 años (auditoría RGPD)
- **Retención de datos**: 5 años (cumplimiento RGPD)
- **Rate limiting**: 30-60 requests/minuto según endpoint

---

## Conclusión

La arquitectura de seguridad de PsicoApp implementa múltiples capas de protección para cumplir con RGPD y estándares de ciberseguridad modernos. El sistema garantiza que:

1. **Solo el psicólogo asignado** puede ver datos de su paciente
2. **Ni siquiera el admin** puede acceder a datos de pacientes
3. **Todos los accesos** están auditados
4. **Los datos se eliminan** automáticamente después de 5 años
5. **El cifrado E2E** protege los mensajes de chat
6. **SSL/TLS 256-bit** protege todas las comunicaciones

Esta arquitectura cumple con los requisitos legales de RGPD y proporciona una base sólida para una aplicación de salud mental segura y confiable.

---

## Presentación: JWT y Filter Chain

### Estructura de Diapositivas para Presentación Técnica

---

#### **Diapositiva 1: Portada**
```
╔══════════════════════════════════════════════════════╗
║                                                      ║
║     AUTENTICACIÓN JWT Y FILTER CHAIN                 ║
║     Arquitectura de Seguridad en PsicoApp            ║
║                                                      ║
║     [Logo de la aplicación]                          ║
║                                                      ║
║     Equipo de Desarrollo                            ║
║     Febrero 2026                                     ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
```

---

#### **Diapositiva 2: Agenda**
```
┌─────────────────────────────────────────────────────┐
│  AGENDA DE LA PRESENTACIÓN                          │
├─────────────────────────────────────────────────────┤
│                                                      │
│  1. ¿Qué es JWT y por qué lo usamos?                │
│  2. Arquitectura del Filter Chain                   │
│  3. Generación de Tokens (Access + Refresh)         │
│  4. Validación y Autenticación                      │
│  5. Flujo Completo de una Request                   │
│  6. Seguridad y Mejores Prácticas                   │
│  7. Demo en vivo                                    │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

#### **Diapositiva 3: ¿Qué es JWT?**
```
┌─────────────────────────────────────────────────────┐
│  ¿QUÉ ES JWT?                                       │
├─────────────────────────────────────────────────────┤
│                                                      │
│  JSON Web Token (JWT) = Estándar abierto (RFC 7519) │
│                                                      │
│  Estructura:                                         │
│  ┌─────────────┬─────────────┬─────────────┐       │
│  │   HEADER    │   PAYLOAD   │   SIGNATURE │       │
│  └─────────────┴─────────────┴─────────────┘       │
│                                                      │
│  Ejemplo:                                            │
│  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.              │
│  eyJzdWIiOiJ1c2VyQGV4YW1wbGUuY29tIn0.              │
│  SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c       │
│                                                      │
│  ✅ Stateless (no requiere sesión en servidor)      │
│  ✅ Escalable                                        │
│  ✅ Portable (funciona entre servicios)              │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

#### **Diapositiva 4: Por qué JWT en PsicoApp**
```
┌─────────────────────────────────────────────────────┐
│  ¿POR QUÉ JWT EN PSICOAPP?                          │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Requisitos de Seguridad:                           │
│                                                      │
│  🔐 Aplicación de salud mental                      │
│     → Datos sensibles de pacientes                  │
│                                                      │
│  🔐 Cumplimiento RGPD                               │
│     → Trazabilidad y control de acceso              │
│                                                      │
│  🔐 Arquitectura distribuida                        │
│     → Frontend React + Backend Spring Boot           │
│                                                      │
│  🔐 Escalabilidad                                    │
│     → Sin estado en servidor                        │
│                                                      │
│  🔐 Seguridad robusta                              │
│     → Tokens firmados, expiración corta             │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

#### **Diapositiva 5: Arquitectura del Filter Chain**
```
┌─────────────────────────────────────────────────────┐
│  ARQUITECTURA DEL FILTER CHAIN                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Request → [Filter 1] → [Filter 2] → ... → Response │
│                                                      │
│  Orden de Ejecución:                                │
│                                                      │
│  1️⃣ RateLimitFilter                                 │
│     └─ Previene DDoS y brute force                  │
│                                                      │
│  2️⃣ JwtAuthFilter                                  │
│     └─ Valida token y establece autenticación       │
│                                                      │
│  3️⃣ Spring Security Filters                        │
│     └─ Autorización basada en roles                 │
│                                                      │
│  4️⃣ Controller                                      │
│     └─ Procesa request autenticado                  │
│                                                      │
│  ⚠️ Si un filtro rechaza → Request se detiene      │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

#### **Diapositiva 6: Tipos de Tokens**
```
┌─────────────────────────────────────────────────────┐
│  TIPOS DE TOKENS EN PSICOAPP                        │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │  ACCESS TOKEN                               │   │
│  ├─────────────────────────────────────────────┤   │
│  │  Duración: 15 minutos                       │   │
│  │  Uso: Requests normales de API              │   │
│  │  Claim: type = "access"                     │   │
│  │  Seguridad: ⭐⭐⭐⭐⭐ (alta)                │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │  REFRESH TOKEN                              │   │
│  ├─────────────────────────────────────────────┤   │
│  │  Duración: 7 días                           │   │
│  │  Uso: Renovar access tokens                 │   │
│  │  Claim: type = "refresh"                    │   │
│  │  Seguridad: ⭐⭐⭐⭐ (media-alta)            │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  ✅ Separación de responsabilidades                 │
│  ✅ Menor ventana de exposición                     │
│  ✅ Renovación automática sin re-login              │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

#### **Diapositiva 7: Generación de Tokens (JwtService)**
```
┌─────────────────────────────────────────────────────┐
│  GENERACIÓN DE TOKENS                               │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Clase: JwtService                                   │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │  generateAccessToken(subject)                │   │
│  │  ┌───────────────────────────────────────┐ │   │
│  │  │ 1. Crear claims                       │ │   │
│  │  │    - subject: email                   │ │   │
│  │  │    - iat: timestamp                   │ │   │
│  │  │    - exp: iat + 15 min                │ │   │
│  │  │    - type: "access"                   │ │   │
│  │  ├───────────────────────────────────────┤ │   │
│  │  │ 2. Firmar con HMAC-SHA256             │ │   │
│  │  │    Clave: 256 bits mínimo             │ │   │
│  │  ├───────────────────────────────────────┤ │   │
│  │  │ 3. Retornar token compacto            │ │   │
│  │  └───────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  Ejemplo de Payload:                                 │
│  {                                                   │
│    "sub": "usuario@ejemplo.com",                    │
│    "iat": 1708123456,                               │
│    "exp": 1708124356,                               │
│    "type": "access"                                 │
│  }                                                   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

#### **Diapositiva 8: Validación de Tokens**
```
┌─────────────────────────────────────────────────────┐
│  VALIDACIÓN DE TOKENS                               │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Método: parseSubject(token)                         │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │  VALIDACIONES DE SEGURIDAD                  │   │
│  ├─────────────────────────────────────────────┤   │
│  │                                             │   │
│  │  1️⃣ Verificar firma                        │   │
│  │     └─ ¿Token firmado correctamente?        │   │
│  │                                             │   │
│  │  2️⃣ Verificar expiración                   │   │
│  │     └─ ¿Token aún válido?                  │   │
│  │                                             │   │
│  │  3️⃣ Verificar tipo                         │   │
│  │     └─ ¿Es access token?                   │   │
│  │                                             │   │
│  │  4️⃣ Verificar antigüedad                   │   │
│  │     └─ ¿Menos de 24 horas?                 │   │
│  │        (previene replay attacks)            │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  ✅ Si pasa todas → Retorna subject (email)          │
│  ❌ Si falla alguna → SecurityException              │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

#### **Diapositiva 9: JwtAuthFilter - Flujo Completo**
```
┌─────────────────────────────────────────────────────┐
│  JWTAUTHFILTER - FLUJO COMPLETO                     │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Request llega → doFilterInternal()                  │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │  1. Extraer token del header                │   │
│  │     Authorization: Bearer <token>          │   │
│  └─────────────────────────────────────────────┘   │
│                    ↓                                 │
│  ┌─────────────────────────────────────────────┐   │
│  │  2. Validar token                           │   │
│  │     jwtService.parseSubject(token)          │   │
│  └─────────────────────────────────────────────┘   │
│                    ↓                                 │
│  ┌─────────────────────────────────────────────┐   │
│  │  3. Determinar rol                          │   │
│  │     - company:email → ROLE_EMPRESA          │   │
│  │     - email normal → Consultar BD           │   │
│  └─────────────────────────────────────────────┘   │
│                    ↓                                 │
│  ┌─────────────────────────────────────────────┐   │
│  │  4. Establecer Authentication               │   │
│  │     SecurityContextHolder.setAuthentication │   │
│  └─────────────────────────────────────────────┘   │
│                    ↓                                 │
│  ┌─────────────────────────────────────────────┐   │
│  │  5. Continuar con filter chain              │   │
│  │     filterChain.doFilter()                  │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

#### **Diapositiva 10: Flujo de Login Completo**
```
┌─────────────────────────────────────────────────────┐
│  FLUJO DE LOGIN COMPLETO                            │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────┐         ┌──────────┐    ┌──────────┐ │
│  │ Frontend │         │ Backend  │    │   BD     │ │
│  └────┬─────┘         └────┬─────┘    └────┬─────┘ │
│       │                     │                │       │
│       │ POST /api/auth/login│                │       │
│       ├─────────────────────>                │       │
│       │                     │                │       │
│       │                     │ Validar creds │       │
│       │                     ├───────────────>│       │
│       │                     │                │       │
│       │                     │<───────────────┤       │
│       │                     │                │       │
│       │                     │ Generar tokens │       │
│       │                     │ (JwtService)   │       │
│       │                     │                │       │
│       │{accessToken,        │                │       │
│       │ refreshToken}       │                │       │
│       │<────────────────────┤                │       │
│       │                     │                │       │
│       │ Guardar en          │                │       │
│       │ localStorage        │                │       │
│       │                     │                │       │
│  ┌────┴─────┐         ┌────┴─────┐    ┌────┴─────┐ │
│  │ Frontend │         │ Backend  │    │   BD     │ │
│  └──────────┘         └──────────┘    └──────────┘ │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

#### **Diapositiva 11: Flujo de Request Autenticada**
```
┌─────────────────────────────────────────────────────┐
│  FLUJO DE REQUEST AUTENTICADA                       │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────┐         ┌──────────┐    ┌──────────┐ │
│  │ Frontend │         │ Backend  │    │   BD     │ │
│  └────┬─────┘         └────┬─────┘    └────┬─────┘ │
│       │                     │                │       │
│       │ GET /api/psych/     │                │       │
│       │ patients            │                │       │
│       │ Authorization:      │                │       │
│       │ Bearer <token>      │                │       │
│       ├─────────────────────>                │       │
│       │                     │                │       │
│       │     RateLimitFilter │                │       │
│       │     └─ ¿Límite OK?  │                │       │
│       │                     │                │       │
│       │     JwtAuthFilter    │                │       │
│       │     └─ Validar token│                │       │
│       │     └─ Establecer   │                │       │
│       │        Authentication│                │       │
│       │                     │                │       │
│       │     SecurityConfig  │                │       │
│       │     └─ ¿Rol OK?     │                │       │
│       │                     │                │       │
│       │                     │ Consultar BD  │       │
│       │                     ├───────────────>│       │
│       │                     │                │       │
│       │                     │<───────────────┤       │
│       │                     │                │       │
│       │     [Datos]         │                │       │
│       │<────────────────────┤                │       │
│       │                     │                │       │
│  ┌────┴─────┐         ┌────┴─────┐    ┌────┴─────┐ │
│  │ Frontend │         │ Backend  │    │   BD     │ │
│  └──────────┘         └──────────┘    └──────────┘ │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

#### **Diapositiva 12: Refresh Token Flow**
```
┌─────────────────────────────────────────────────────┐
│  REFRESH TOKEN FLOW                                  │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Escenario: Access token expirado                    │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │  1. Request con access token expirado       │   │
│  │     → HTTP 401 Unauthorized                 │   │
│  └─────────────────────────────────────────────┘   │
│                    ↓                                 │
│  ┌─────────────────────────────────────────────┐   │
│  │  2. Frontend detecta 401                    │   │
│  │     Interceptor de Axios activa             │   │
│  └─────────────────────────────────────────────┘   │
│                    ↓                                 │
│  ┌─────────────────────────────────────────────┐   │
│  │  3. POST /api/auth/refresh                  │   │
│  │     Body: { refreshToken: "..." }          │   │
│  └─────────────────────────────────────────────┘   │
│                    ↓                                 │
│  ┌─────────────────────────────────────────────┐   │
│  │  4. Backend valida refresh token            │   │
│  │     jwtService.parseRefreshToken()          │   │
│  └─────────────────────────────────────────────┘   │
│                    ↓                                 │
│  ┌─────────────────────────────────────────────┐   │
│  │  5. Generar nuevo access token              │   │
│  │     jwtService.generateAccessToken()        │   │
│  └─────────────────────────────────────────────┘   │
│                    ↓                                 │
│  ┌─────────────────────────────────────────────┐   │
│  │  6. Retornar nuevo access token             │   │
│  │     Frontend actualiza localStorage          │   │
│  └─────────────────────────────────────────────┘   │
│                    ↓                                 │
│  ┌─────────────────────────────────────────────┐   │
│  │  7. Reintentar request original             │   │
│  │     Con nuevo access token                  │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  ✅ Usuario no nota interrupción                     │
│  ✅ Sin necesidad de re-login                        │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

#### **Diapositiva 13: Seguridad del Sistema JWT**
```
┌─────────────────────────────────────────────────────┐
│  SEGURIDAD DEL SISTEMA JWT                          │
├─────────────────────────────────────────────────────┤
│                                                      │
│  🔐 Validaciones Implementadas:                      │
│                                                      │
│  ✅ Firma HMAC-SHA256                                │
│     └─ Secret mínimo 256 bits                       │
│                                                      │
│  ✅ Expiración corta                                 │
│     └─ Access tokens: 15 minutos                    │
│                                                      │
│  ✅ Validación de antigüedad                         │
│     └─ Máximo 24 horas (previene replay)            │
│                                                      │
│  ✅ Separación de tipos                              │
│     └─ Access vs Refresh tokens                     │
│                                                      │
│  ✅ Validación de tipo                               │
│     └─ Solo access tokens en requests normales       │
│                                                      │
│  🔒 Protecciones Adicionales:                        │
│                                                      │
│  ✅ Rate limiting en endpoints de auth               │
│  ✅ HTTPS obligatorio en producción                  │
│  ✅ HSTS para prevenir downgrade attacks             │
│  ✅ Tokens nunca en logs                             │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

#### **Diapositiva 14: Manejo de Errores**
```
┌─────────────────────────────────────────────────────┐
│  MANEJO DE ERRORES                                  │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Escenarios y Respuestas:                            │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │ Token Expirado                              │   │
│  ├─────────────────────────────────────────────┤   │
│  │ Error: SecurityException("Token expirado") │   │
│  │ Acción: Frontend intenta refresh           │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │ Token Inválido                              │   │
│  ├─────────────────────────────────────────────┤   │
│  │ Error: SecurityException("Token inválido")  │   │
│  │ Acción: Log warning, request sin auth      │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │ Token Demasiado Antiguo                     │   │
│  ├─────────────────────────────────────────────┤   │
│  │ Error: SecurityException("Token antiguo")  │   │
│  │ Acción: Forzar re-login                     │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │ Sin Token                                   │   │
│  ├─────────────────────────────────────────────┤   │
│  │ Acción: Request continúa sin auth          │   │
│  │ Resultado: Spring Security decide acceso   │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  ⚠️ Nunca exponemos información sensible            │
│  ⚠️ Logs sin tokens completos                       │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

#### **Diapositiva 15: Configuración (JwtConfig)**
```
┌─────────────────────────────────────────────────────┐
│  CONFIGURACIÓN DE JWT                               │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Clase: JwtConfig                                    │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │  Parámetros Configurables                   │   │
│  ├─────────────────────────────────────────────┤   │
│  │                                             │   │
│  │  Access Token Expiration:                  │   │
│  │  └─ 15 minutos (900,000 ms)                │   │
│  │                                             │   │
│  │  Refresh Token Expiration:                 │   │
│  │  └─ 7 días (604,800,000 ms)                │   │
│  │                                             │   │
│  │  JWT_SECRET:                                │   │
│  │  └─ Variable de entorno                    │   │
│  │  └─ Mínimo 32 bytes (256 bits)             │   │
│  │  └─ Validación en startup                  │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  Validaciones:                                       │
│                                                      │
│  ✅ Secret no puede ser null en producción           │
│  ✅ Secret debe tener mínimo 256 bits               │
│  ✅ Error claro si no cumple requisitos              │
│                                                      │
│  Desarrollo vs Producción:                           │
│                                                      │
│  🔧 Dev: Secret hardcodeado (solo local)            │
│  🔒 Prod: Secret desde variable de entorno          │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

#### **Diapositiva 16: SecurityConfig - Filter Chain**
```
┌─────────────────────────────────────────────────────┐
│  SECURITYCONFIG - FILTER CHAIN                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Orden de Filtros:                                  │
│                                                      │
│  Request                                            │
│    │                                                 │
│    ├─> RateLimitFilter (Order 1)                   │
│    │   └─ Previene abuso                            │
│    │                                                 │
│    ├─> JwtAuthFilter                                │
│    │   └─ Valida token JWT                          │
│    │   └─ Establece Authentication                  │
│    │                                                 │
│    ├─> Spring Security Filters                      │
│    │   ├─ CORS Filter                               │
│    │   ├─ CSRF Protection                           │
│    │   └─ Authorization Filter                     │
│    │                                                 │
│    └─> Controller                                   │
│        └─ Procesa request                           │
│                                                      │
│  Configuración de Autorización:                     │
│                                                      │
│  /api/auth/**          → Público                    │
│  /api/tests/**         → Público                    │
│  /api/profile/**       → Autenticado               │
│  /api/psych/**         → Autenticado                │
│  /api/admin/**         → ROLE_ADMIN                 │
│  /api/company/**       → ROLE_EMPRESA               │
│                                                      │
│  Producción:                                         │
│  ✅ HTTPS obligatorio                                │
│  ✅ HSTS habilitado                                  │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

#### **Diapositiva 17: Diagrama de Secuencia Completo**
```
┌─────────────────────────────────────────────────────┐
│  DIAGRAMA DE SECUENCIA COMPLETO                     │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Frontend    RateLimit   JwtAuth   Security  Controller│
│     │           │           │          │          │   │
│     │──Request─>│           │          │          │   │
│     │           │──OK──────>│          │          │   │
│     │           │           │──Validate Token───>│   │
│     │           │           │<──Subject───────────│   │
│     │           │           │──Set Auth──────────>│   │
│     │           │           │          │──Check──>│   │
│     │           │           │          │  Role    │   │
│     │           │           │          │<──OK─────│   │
│     │           │           │          │          │──>│
│     │           │           │          │          │   │
│     │<──Response───────────────────────────────────│   │
│     │           │           │          │          │   │
│                                                      │
│  Si algún filtro rechaza:                           │
│                                                      │
│  Frontend    RateLimit   JwtAuth                    │
│     │           │           │                       │
│     │──Request─>│           │                       │
│     │           │──429──────>│                       │
│     │<──Error───│           │                       │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---


```

---



---

#### **Diapositiva 20: Demo en Vivo**
```
┌─────────────────────────────────────────────────────┐
│  DEMO EN VIVO                                       │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Escenarios a Demostrar:                            │
│                                                      │
│  1️⃣ Login Exitoso                                   │
│     └─ Generación de access + refresh tokens        │
│                                                      │
│  2️⃣ Request Autenticada                            │
│     └─ Token válido → Acceso permitido              │
│                                                      │
│  3️⃣ Token Expirado                                  │
│     └─ Refresh automático → Nuevo access token      │
│                                                      │
│  4️⃣ Token Inválido                                  │
│     └─ Error 401 → Re-login requerido              │
│                                                      │
│  5️⃣ Rate Limiting                                  │
│     └─ Demasiadas requests → HTTP 429               │
│                                                      │
│  6️⃣ Sin Token                                      │
│     └─ Endpoint público → Acceso permitido          │
│     └─ Endpoint privado → Error 401                │
│                                                      │
│  [Mostrar código y logs en tiempo real]             │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

#### **Diapositiva 21: Preguntas y Respuestas**
```
┌─────────────────────────────────────────────────────┐
│  PREGUNTAS Y RESPUESTAS                             │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ❓ ¿Por qué 15 minutos para access tokens?         │
│  ✅ Balance entre seguridad y UX                     │
│     └─ Menor ventana de exposición                  │
│     └─ Refresh automático sin interrupciones        │
│                                                      │
│  ❓ ¿Qué pasa si se roba un refresh token?           │
│  ✅ Acceso limitado a 7 días                        │
│     └─ Después expira automáticamente              │
│     └─ Logs de auditoría detectan actividad         │
│                                                      │
│  ❓ ¿Por qué validar antigüedad de tokens?          │
│  ✅ Previene replay attacks                         │
│     └─ Tokens robados antiguos no funcionan         │
│                                                      │
│  ❓ ¿Cómo se revocan tokens?                         │
│  ✅ Actualmente por expiración                      │
│     └─ Futuro: Token blacklist (en roadmap)         │
│                                                      │
│  ❓ ¿Es seguro almacenar tokens en localStorage?   │
│  ✅ Para esta aplicación sí                          │
│     └─ XSS mitigado con sanitización               │
│     └─ HTTPS previene interceptación                │
│     └─ Tokens de corta duración                     │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

#### **Diapositiva 22: Conclusiones**
```
┌─────────────────────────────────────────────────────┐
│  CONCLUSIONES                                       │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ✅ Sistema JWT robusto y seguro                    │
│     └─ Access + Refresh tokens                     │
│     └─ Validaciones múltiples                      │
│                                                      │
│  ✅ Filter Chain bien estructurado                  │
│     └─ Rate limiting primero                       │
│     └─ Autenticación después                       │
│     └─ Autorización final                          │
│                                                      │
│  ✅ Cumplimiento RGPD                               │
│     └─ Tokens de corta duración                     │
│     └─ Trazabilidad completa                       │
│                                                      │
│  ✅ Escalable y Mantenible                          │
│     └─ Stateless                                    │
│     └─ Código limpio y documentado                  │
│                                                      │
│  ✅ Listo para Producción                           │
│     └─ HTTPS obligatorio                           │
│     └─ Secrets desde variables de entorno           │
│     └─ Logging adecuado                            │
│                                                      │
│  🎯 Próximos Pasos:                                 │
│     └─ Token blacklist para revocación             │
│     └─ Rotación automática de secrets              │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

#### **Diapositiva 23: Contacto y Recursos**
```
┌─────────────────────────────────────────────────────┐
│  CONTACTO Y RECURSOS                                │
├─────────────────────────────────────────────────────┤
│                                                      │
│  📚 Documentación:                                  │
│     └─ SECURITY_ARCHITECTURE.md                     │
│     └─ SSL_SETUP.md                                │
│                                                      │
│  🔗 Referencias:                                    │
│     └─ RFC 7519 (JWT)                              │
│     └─ RGPD Artículos 5, 17, 32                    │
│     └─ OWASP JWT Best Practices                    │
│                                                      │
│  📧 Contacto:                                       │
│     └─ Equipo de Desarrollo PsicoApp                │
│                                                      │
│  💻 Repositorio:                                    │
│     └─ [URL del repositorio]                       │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │  ¡Gracias por su atención!                  │   │
│  │                                             │   │
│  │  ¿Preguntas?                                │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

### Notas para el Presentador

#### Tiempo Estimado por Diapositiva

- **Diapositivas 1-4**: Introducción (5 minutos)
- **Diapositivas 5-8**: Conceptos técnicos (10 minutos)
- **Diapositivas 9-12**: Flujos y procesos (10 minutos)
- **Diapositivas 13-16**: Seguridad y configuración (8 minutos)
- **Diapositivas 17-19**: Mejores prácticas (5 minutos)
- **Diapositivas 20-23**: Demo y cierre (7 minutos)

**Total**: ~45 minutos + tiempo para preguntas

#### Puntos Clave a Destacar

1. **Separación Access/Refresh**: Explicar por qué es importante
2. **Filter Chain**: Mostrar cómo cada filtro añade una capa de seguridad
3. **Validaciones múltiples**: No confiar en una sola validación
4. **Cumplimiento RGPD**: Cómo JWT ayuda a cumplir requisitos legales
5. **Demo en vivo**: Mostrar código real y logs

#### Material Adicional Recomendado

- Código fuente abierto en IDE
- Postman/Thunder Client con ejemplos de requests
- Logs de aplicación mostrando el flujo
- Diagrama interactivo del filter chain

---

**Documento generado**: 2026-02-16  
**Versión**: 1.0  
**Autor**: Equipo de Desarrollo PsicoApp
