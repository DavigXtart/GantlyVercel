# 🎯 Pasos Finales - Conectar Frontend y Backend

## ✅ Ya Completado:
- ✅ Backend desplegado en Railway
- ✅ Frontend desplegado en Vercel
- ✅ Build sin errores

## 🔗 Paso 1: Obtener URL del Frontend en Vercel

1. Ve a tu proyecto en [vercel.com](https://vercel.com)
2. En el dashboard del proyecto, verás la URL del despliegue
3. **Copia esa URL** (algo como: `https://tu-app.vercel.app` o `https://tu-app-xxxxx.vercel.app`)

## 🔧 Paso 2: Actualizar APP_BASE_URL en Railway

1. Ve a [railway.app](https://railway.app)
2. Selecciona tu proyecto → servicio Backend
3. Ve a la pestaña **"Variables"**
4. Busca la variable `APP_BASE_URL`
5. **Actualízala** con la URL de Vercel que copiaste:
   ```
   APP_BASE_URL=https://tu-app.vercel.app
   ```
   (reemplaza con tu URL real de Vercel)
6. Guarda los cambios
7. Railway redesplegará automáticamente

## ✅ Paso 3: Verificar que Todo Funciona

### 3.1 Verificar Backend
- Ve a: `https://gantlyvercel-production.up.railway.app/actuator/health`
- Debería mostrar: `{"status":"UP"}`

### 3.2 Verificar Frontend
- Ve a tu URL de Vercel
- La aplicación debería cargar
- Intenta hacer login o cualquier acción que llame al backend

### 3.3 Verificar Conexión
- Abre las herramientas de desarrollador (F12)
- Ve a la pestaña "Network" o "Red"
- Intenta hacer login o alguna acción
- Verifica que las peticiones al backend se hagan correctamente
- No debería haber errores de CORS

## 🎉 ¡Listo!

Tu aplicación debería estar funcionando completamente.

**URLs importantes:**
- Frontend: `https://tu-app.vercel.app` (tu URL de Vercel)
- Backend: `https://gantlyvercel-production.up.railway.app`

---

## 🐛 Si hay Problemas:

### Error: CORS
- Verifica que `APP_BASE_URL` en Railway sea la URL correcta de Vercel
- El backend ya tiene CORS configurado para permitir todos los orígenes

### Error: "No se puede conectar al backend"
- Verifica que `VITE_API_URL` en Vercel sea: `https://gantlyvercel-production.up.railway.app/api`
- Verifica que el backend esté corriendo en Railway

### Error: La aplicación no carga
- Revisa la consola del navegador (F12)
- Verifica los logs en Vercel y Railway

---

**¿Necesitas ayuda con algún paso específico?**

