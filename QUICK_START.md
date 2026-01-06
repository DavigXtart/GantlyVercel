# ⚡ Inicio Rápido - Despliegue

## 📦 Archivos Creados/Modificados

### Frontend (Vercel)
✅ `frontend/vercel.json` - Configuración de Vercel
✅ `frontend/src/services/api.ts` - Ahora usa variable de entorno `VITE_API_URL`

### Backend (Railway)
✅ `psicoapp/Dockerfile` - Dockerfile para construir la app Java
✅ `psicoapp/.dockerignore` - Archivos a ignorar en Docker
✅ `psicoapp/railway.json` - Configuración de Railway
✅ `psicoapp/src/main/resources/application.yml` - Usa perfil dinámico
✅ `psicoapp/src/main/resources/application-prod.yml` - Configurado con variables de entorno

### Documentación
✅ `DEPLOYMENT_GUIDE.md` - Guía completa paso a paso

---

## 🚀 Pasos Siguientes

1. **Sube tu código a GitHub** (si aún no lo has hecho)
   ```bash
   git add .
   git commit -m "Configurar despliegue Railway + Vercel"
   git push
   ```

2. **Despliega el Backend en Railway**
   - Ve a [railway.app](https://railway.app)
   - Crea proyecto desde GitHub
   - Añade MySQL database
   - Configura variables de entorno (ver DEPLOYMENT_GUIDE.md)
   - Copia la URL del backend

3. **Despliega el Frontend en Vercel**
   - Ve a [vercel.com](https://vercel.com)
   - Importa tu repositorio
   - Configura `VITE_API_URL` con la URL de Railway
   - Despliega

4. **Actualiza el Backend**
   - Vuelve a Railway
   - Actualiza `APP_BASE_URL` con la URL de Vercel

---

## 📋 Variables de Entorno Necesarias

### Railway (Backend)
```env
SPRING_PROFILES_ACTIVE=prod
DATABASE_URL=... (Railway te lo da)
DATABASE_USER=... (Railway te lo da)
DATABASE_PASSWORD=... (Railway te lo da)
JWT_SECRET=... (genera uno seguro)
APP_BASE_URL=https://tu-app.vercel.app
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=userapprovalgantly@gmail.com
MAIL_PASSWORD=xznhetmckdadxeib
```

### Vercel (Frontend)
```env
VITE_API_URL=https://tu-backend.railway.app/api
```

---

**📖 Consulta `DEPLOYMENT_GUIDE.md` para la guía detallada.**

