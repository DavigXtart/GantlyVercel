# 📤 Instrucciones para Subir el Código

## Paso 1: Crear el Repositorio en GitHub

1. Ve a [github.com](https://github.com) e inicia sesión con tu cuenta **DavigXtart**
2. Haz clic en el botón **"+"** (arriba derecha) → **"New repository"**
3. Nombre del repositorio: `GantlyVercel`
4. **IMPORTANTE**: Deja el repositorio **vacío** (NO marques README, .gitignore ni licencia)
5. Haz clic en **"Create repository"**

## Paso 2: Subir el Código

Una vez creado el repositorio, ejecuta estos comandos:

```bash
cd C:\Users\david\Desktop\alvaro
git push -u origin main
```

Si te pide credenciales:
- Usuario: `DavigXtart`
- Contraseña: Usa un **Personal Access Token** (no tu contraseña de GitHub)

### Crear Personal Access Token (si es necesario)

1. Ve a GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click en "Generate new token (classic)"
3. Dale un nombre (ej: "Railway Deployment")
4. Selecciona el scope `repo` (acceso completo a repositorios)
5. Click en "Generate token"
6. **Copia el token** (solo se muestra una vez)
7. Úsalo como contraseña cuando Git te la pida

## Paso 3: Verificar

Después del push, verifica que el código esté en:
`https://github.com/DavigXtart/GantlyVercel`

---

## 🚀 Siguiente Paso: Desplegar

Una vez que el código esté en GitHub, sigue las instrucciones en `DEPLOYMENT_GUIDE.md` para desplegar en Railway y Vercel.

