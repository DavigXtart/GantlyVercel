# 🐛 Debug de Tests que No Funcionan

## ❌ Problema:
Los tests de matching no funcionan aunque puedes registrarte y crear cuenta.

## 🔍 Verificaciones:

### 1. Verificar en la Consola del Navegador (F12):

Abre la consola del navegador y busca errores:

1. Ve a la aplicación en Vercel
2. Abre las herramientas de desarrollador (F12)
3. Ve a la pestaña **"Console"**
4. Intenta iniciar un test
5. **Copia los errores que aparezcan**

### 2. Verificar en la Pestaña "Network":

1. Abre las herramientas de desarrollador (F12)
2. Ve a la pestaña **"Network"**
3. Intenta iniciar un test
4. Busca las peticiones a `/api/matching/` o `/api/initial-test/`
5. Haz clic en la petición que falla
6. Ve a la pestaña **"Headers"** y verifica:
   - **Request URL**: ¿Es correcta? ¿Va a Railway o a localhost?
   - **Authorization Header**: ¿Tiene el token `Bearer ...`?
7. Ve a la pestaña **"Response"** y copia el error

### 3. Verificar Token en localStorage:

1. En la consola del navegador, escribe:
```javascript
localStorage.getItem('token')
```
2. ¿Devuelve un token? Si es `null`, el problema es que no se guardó el token después del registro/login.

### 4. Verificar qué Test Estás Intentando:

- **"Comenzar evaluación"** → Usa `/api/initial-test/**` (público, no requiere autenticación)
- **"Hacer match con psicólogo"** → Usa `/api/matching/patient-test` (requiere autenticación)

## 📋 Información que Necesito:

Por favor, copia y pega:

1. **Errores de la consola** (si los hay)
2. **Status code de la petición que falla** (200, 401, 403, 500, etc.)
3. **Response de la petición** (el mensaje de error)
4. **¿Qué test específico estás intentando?** (test inicial público o test de matching)

## ✅ Posibles Soluciones:

### Si el token es `null`:
- El token no se guardó después del registro
- Necesitamos verificar que el registro devuelva el token

### Si el token existe pero la petición falla con 401/403:
- Problema con la autenticación en el backend
- El token puede estar expirado o ser inválido

### Si la petición va a `localhost:8080`:
- La variable `VITE_API_URL` no está configurada en Vercel

### Si hay errores de CORS:
- Problema con la configuración de CORS en el backend

---

**Por favor, realiza estas verificaciones y comparte los resultados.**

