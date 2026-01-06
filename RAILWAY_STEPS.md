# 🚂 Pasos para Desplegar en Railway

## Paso 1: Crear Nuevo Proyecto
1. En Railway, haz clic en **"New Project"**
2. Selecciona **"Deploy from GitHub repo"**
3. Conecta tu cuenta de GitHub si es necesario
4. Selecciona el repositorio: **`DavigXtart/GantlyVercel`**

## Paso 2: Railway detectará automáticamente
- Railway debería detectar el Dockerfile en `psicoapp/`
- Si no lo detecta, ve a Settings → Root Directory y pon: `psicoapp`

## Paso 3: Añadir Base de Datos MySQL
1. En el proyecto, haz clic en **"+ New"**
2. Selecciona **"Database"**
3. Elige **"Add MySQL"**
4. Railway creará la base de datos automáticamente

## Paso 4: Configurar Variables de Entorno
Ve a tu servicio backend → pestaña **"Variables"** y agrega:

```env
SPRING_PROFILES_ACTIVE=prod
JWT_SECRET=genera-una-clave-segura-de-32-caracteres-minimo-1234567890123456
APP_BASE_URL=https://tu-app.vercel.app
```

**IMPORTANTE**: Railway configura automáticamente:
- `DATABASE_URL`
- `DATABASE_USER`
- `DATABASE_PASSWORD`
- `PORT`
- `RAILWAY_ENVIRONMENT`

## Paso 5: Obtener la URL del Backend
1. Ve a la pestaña **"Settings"** de tu servicio
2. En **"Networking"** verás la URL pública
3. O en la pestaña **"Deployments"** verás el dominio
4. Copia esa URL (algo como: `https://tu-backend.railway.app`)

## Paso 6: Verificar el Despliegue
1. Espera a que termine el build (puede tardar 5-10 minutos la primera vez)
2. Ve a `https://tu-backend.railway.app/actuator/health`
3. Deberías ver: `{"status":"UP"}`

---

## ⚠️ Si hay problemas:

### Error: "Root Directory not found"
- Ve a Settings → Root Directory → Pon: `psicoapp`

### Error: "Build failed"
- Revisa los logs en Railway
- Verifica que el Dockerfile esté en `psicoapp/Dockerfile`

### Error: "Database connection failed"
- Verifica que la base de datos MySQL esté corriendo
- Las variables de base de datos se configuran automáticamente

---

**¿En qué paso estás? Dime y te ayudo con el siguiente.**

