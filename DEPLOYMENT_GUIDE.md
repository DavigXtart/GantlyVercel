# 🚀 Guía de Despliegue - Railway y Vercel

Esta guía te ayudará a desplegar tu aplicación completa (backend + frontend) de forma gratuita.

## 📋 Resumen

- **Frontend (React + Vite)**: Se desplegará en **Vercel**
- **Backend (Java Spring Boot)**: Se desplegará en **Railway**
- **Base de Datos MySQL**: Se desplegará en **Railway** (gratis con plan Hobby)

---

## 🎯 PASO 1: Preparar el Repositorio

### 1.1 Verificar que tienes Git configurado

```bash
git init
git add .
git commit -m "Preparar para despliegue"
```

### 1.2 Crear repositorio en GitHub (si no lo tienes)

1. Ve a [GitHub](https://github.com) y crea un nuevo repositorio
2. Conecta tu repositorio local:
```bash
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
git push -u origin main
```

---

## 🚂 PASO 2: Desplegar Backend en Railway

### 2.1 Crear cuenta en Railway

1. Ve a [railway.app](https://railway.app)
2. Inicia sesión con tu cuenta de GitHub
3. En el dashboard, haz clic en **"New Project"**

### 2.2 Conectar Repositorio

1. Selecciona **"Deploy from GitHub repo"**
2. Conecta tu cuenta de GitHub si es necesario
3. Selecciona tu repositorio
4. Railway detectará automáticamente el Dockerfile en `psicoapp/`

### 2.3 Configurar Base de Datos MySQL

1. En el proyecto de Railway, haz clic en **"+ New"**
2. Selecciona **"Database"** → **"Add MySQL"**
3. Railway creará una base de datos MySQL automáticamente
4. **IMPORTANTE**: Copia las variables de conexión que te proporciona Railway

### 2.4 Configurar Variables de Entorno

En el servicio de tu backend en Railway, ve a la pestaña **"Variables"** y agrega:

```env
# Perfil de Spring (IMPORTANTE)
SPRING_PROFILES_ACTIVE=prod

# Base de Datos (Railway te las da automáticamente, pero verifica)
DATABASE_URL=jdbc:mysql://containers-us-west-XXX.railway.app:3306/railway?useSSL=true&requireSSL=true&serverTimezone=UTC
DATABASE_USER=root
DATABASE_PASSWORD=TU_PASSWORD_DE_RAILWAY

# JWT Secret (genera uno seguro)
JWT_SECRET=tu-clave-secreta-super-segura-de-al-menos-32-caracteres-1234567890123456

# URL del Frontend (la obtendrás después de desplegar en Vercel)
APP_BASE_URL=https://tu-app.vercel.app

# Email (opcional, si quieres mantener el actual)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=userapprovalgantly@gmail.com
MAIL_PASSWORD=xznhetmckdadxeib

# Stripe (opcional, si lo usas)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Puerto (Railway lo configura automáticamente, pero puedes dejarlo)
PORT=8080
```

### 2.5 Configurar el Servicio

1. En la pestaña **"Settings"** de tu servicio backend:
   - **Root Directory**: `psicoapp`
   - **Build Command**: (se usa Dockerfile, no necesario)
   - **Start Command**: (se usa Dockerfile, no necesario)

2. Haz clic en **"Deploy"** o espera a que Railway despliegue automáticamente

### 2.6 Obtener la URL del Backend

1. Una vez desplegado, Railway te dará una URL como: `https://tu-backend.railway.app`
2. **IMPORTANTE**: Copia esta URL, la necesitarás para el frontend

---

## ⚡ PASO 3: Desplegar Frontend en Vercel

### 3.1 Crear cuenta en Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Inicia sesión con tu cuenta de GitHub

### 3.2 Importar Proyecto

1. Haz clic en **"Add New"** → **"Project"**
2. Importa tu repositorio de GitHub
3. Vercel detectará automáticamente que es un proyecto Vite

### 3.3 Configurar el Proyecto

1. **Framework Preset**: Vite (debería detectarlo automáticamente)
2. **Root Directory**: `frontend`
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. **Install Command**: `npm install`

### 3.4 Configurar Variables de Entorno

En la sección **"Environment Variables"**, agrega:

```env
VITE_API_URL=https://tu-backend.railway.app/api
```

**⚠️ IMPORTANTE**: Reemplaza `https://tu-backend.railway.app` con la URL real de tu backend en Railway.

### 3.5 Desplegar

1. Haz clic en **"Deploy"**
2. Vercel construirá y desplegará tu frontend
3. Obtendrás una URL como: `https://tu-app.vercel.app`

---

## 🔄 PASO 4: Actualizar Configuraciones

### 4.1 Actualizar Backend con URL del Frontend

1. Vuelve a Railway
2. En las variables de entorno del backend, actualiza:
   ```env
   APP_BASE_URL=https://tu-app.vercel.app
   ```
3. Railway redesplegará automáticamente

### 4.2 Verificar CORS

El backend ya está configurado para permitir todos los orígenes, así que debería funcionar sin problemas.

---

## ✅ PASO 5: Verificar el Despliegue

### 5.1 Verificar Backend

1. Ve a `https://tu-backend.railway.app/actuator/health`
2. Deberías ver un JSON con `"status":"UP"`

### 5.2 Verificar Frontend

1. Ve a `https://tu-app.vercel.app`
2. La aplicación debería cargar
3. Intenta hacer login o alguna acción que llame al backend

### 5.3 Verificar Conexión

Abre las herramientas de desarrollador (F12) y verifica:
- Que no haya errores de CORS
- Que las peticiones al backend se hagan correctamente

---

## 🐛 Solución de Problemas

### Error: "No se puede conectar al backend"

**Solución:**
1. Verifica que la variable `VITE_API_URL` en Vercel sea correcta
2. Verifica que el backend esté corriendo en Railway
3. Revisa los logs en Railway para ver errores

### Error: "CORS Error"

**Solución:**
El backend ya tiene CORS configurado, pero si aún así tienes problemas:
1. Verifica que `APP_BASE_URL` en Railway apunte a tu dominio de Vercel
2. Los logs de Railway mostrarán más detalles

### Error: "Database connection failed"

**Solución:**
1. Verifica que las variables `DATABASE_URL`, `DATABASE_USER`, `DATABASE_PASSWORD` estén correctas
2. Asegúrate de que la base de datos MySQL esté corriendo en Railway
3. Verifica que el formato de la URL de la base de datos sea correcto

### Error: "JWT_SECRET is not set"

**Solución:**
1. Genera un secreto seguro: puedes usar un generador online o:
   ```bash
   openssl rand -base64 32
   ```
2. Agrégralo a las variables de entorno en Railway

---

## 📝 Notas Importantes

### Límites del Plan Gratuito

**Railway:**
- $5 de crédito gratis por mes
- Base de datos MySQL incluida
- El backend se "duerme" después de inactividad (se despierta en la primera petición)

**Vercel:**
- Despliegues ilimitados
- 100GB de ancho de banda por mes
- No se duerme

### Seguridad

⚠️ **IMPORTANTE**: 
- No subas archivos `.env` con credenciales reales a GitHub
- Usa variables de entorno en Railway/Vercel
- Genera un `JWT_SECRET` seguro y único

### Dominios Personalizados

Ambos servicios permiten agregar dominios personalizados si tienes uno:
- **Railway**: Settings → Networking → Custom Domain
- **Vercel**: Project Settings → Domains

---

## 🎉 ¡Listo!

Tu aplicación debería estar funcionando. Comparte la URL de Vercel con tu jefe para que la vea.

**URLs que necesitarás:**
- Frontend: `https://tu-app.vercel.app`
- Backend: `https://tu-backend.railway.app`

---

## 📞 Próximos Pasos (Opcional)

1. **Configurar dominio personalizado** si tienes uno
2. **Configurar Stripe** si necesitas pagos en producción
3. **Monitorear logs** en Railway y Vercel
4. **Configurar alertas** si algo falla

---

## 🔗 Enlaces Útiles

- [Documentación de Railway](https://docs.railway.app)
- [Documentación de Vercel](https://vercel.com/docs)
- [Documentación de Spring Boot](https://spring.io/projects/spring-boot)
- [Documentación de Vite](https://vitejs.dev)

---

**¡Éxito con el despliegue! 🚀**

