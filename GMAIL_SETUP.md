# Configuración de Gmail para Verificación de Email

## Pasos para Configurar Gmail

### 1. Habilitar la verificación en dos pasos
1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. Ve a **Seguridad**
3. Activa la **Verificación en 2 pasos** si no está activada

### 2. Generar una Contraseña de Aplicación
1. En la misma página de **Seguridad**, busca **Contraseñas de aplicaciones**
2. O ve directamente a: https://myaccount.google.com/apppasswords
3. Selecciona **Aplicación**: "Correo"
4. Selecciona **Dispositivo**: "Otro (nombre personalizado)"
5. Escribe: "PSYmatch Backend"
6. Haz clic en **Generar**
7. **Copia la contraseña de 16 caracteres** que aparece (sin espacios)

### 3. Configurar en la Aplicación

Agrega la contraseña de aplicación como variable de entorno o en `application-local.yml`:

**Opción 1: Variable de entorno (Recomendado)**
```bash
# Windows PowerShell
$env:GMAIL_APP_PASSWORD="tu-contraseña-de-16-caracteres"

# Linux/Mac
export GMAIL_APP_PASSWORD="tu-contraseña-de-16-caracteres"
```

**Opción 2: En application-local.yml**
```yaml
spring:
  mail:
    password: tu-contraseña-de-16-caracteres  # Reemplaza directamente
```

**⚠️ IMPORTANTE:** 
- NO uses tu contraseña normal de Gmail
- Usa SOLO la contraseña de aplicación de 16 caracteres
- No compartas esta contraseña públicamente

### 4. Verificar la Configuración

Una vez configurado, cuando un usuario se registre:
1. Se generará un token de verificación único
2. Se enviará un correo desde `userapprovalgantly@gmail.com`
3. El usuario recibirá un enlace para verificar su cuenta
4. El token expira en 24 horas

### 5. Endpoint de Verificación

Los usuarios pueden verificar su cuenta accediendo a:
```
GET /api/auth/verify-email?token=TOKEN_GENERADO
```

O desde el frontend:
```
http://localhost:5173/verify-email?token=TOKEN_GENERADO
```

## Solución de Problemas

### Error: "Authentication failed"
- Verifica que estés usando la contraseña de aplicación, no tu contraseña normal
- Asegúrate de que la verificación en 2 pasos esté activada

### Error: "Could not connect to SMTP host"
- Verifica que el puerto 587 no esté bloqueado por el firewall
- Verifica la conexión a internet

### El correo no se envía
- Revisa los logs del servidor para ver el error específico
- Verifica que la variable de entorno `GMAIL_APP_PASSWORD` esté configurada correctamente
- Asegúrate de que el correo `userapprovalgantly@gmail.com` tenga acceso habilitado para aplicaciones menos seguras (aunque con contraseña de aplicación no debería ser necesario)

