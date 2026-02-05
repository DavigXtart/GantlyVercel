# Configuración OAuth2 (Google) para Gantly

## 1. Crear credenciales en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un proyecto o selecciona uno existente
3. Ve a **APIs y servicios** → **Credenciales**
4. Haz clic en **Crear credenciales** → **ID de cliente de OAuth**
5. Tipo de aplicación: **Aplicación web**
6. Nombre: `Gantly` (o el que prefieras)
7. **URIs de redirección autorizados**:
   - Local: `http://localhost:8080/login/oauth2/code/google`
   - Producción: `https://tu-dominio-backend.com/login/oauth2/code/google`
8. Copia el **ID de cliente** y el **Secreto del cliente**

## 2. Configurar variables de entorno

### Local (application-local.yml)

Crea un archivo `.env` en la raíz del proyecto o define las variables antes de arrancar:

```bash
export GOOGLE_OAUTH_CLIENT_ID="tu-client-id.apps.googleusercontent.com"
export GOOGLE_OAUTH_CLIENT_SECRET="tu-client-secret"
```

O añade directamente en `application-local.yml` (no recomendado para producción):

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: "tu-client-id.apps.googleusercontent.com"
            client-secret: "tu-client-secret"
```

### Producción

Configura en tu plataforma (Railway, Vercel, etc.):

- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `APP_BASE_URL` (URL del frontend, ej: `https://gantly.app`)

## 3. Migración de base de datos (si usas ddl-auto: validate)

Si tu perfil local usa `ddl-auto: validate`, ejecuta este SQL para añadir las columnas OAuth2:

```sql
ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN oauth2_provider VARCHAR(50) NULL;
ALTER TABLE users ADD COLUMN oauth2_provider_id VARCHAR(255) NULL;
CREATE INDEX idx_oauth2_provider ON users(oauth2_provider, oauth2_provider_id);
```

## 4. Flujo de login

1. El usuario hace clic en **Continuar con Google** en la pantalla de login
2. Se redirige a Google para autenticarse
3. Google redirige de vuelta al backend con el código de autorización
4. El backend crea o actualiza el usuario y genera un JWT
5. El backend redirige al frontend con el token: `{APP_BASE_URL}/login?token=xxx`
6. El frontend guarda el token y el usuario queda autenticado

## 5. Notas

- Los usuarios que se registran con Google no tienen contraseña; deben usar siempre "Continuar con Google"
- Si un email ya existe (registro con contraseña), al hacer login con Google se vincula la cuenta OAuth a ese usuario
- La foto de perfil de Google se guarda automáticamente como avatar
