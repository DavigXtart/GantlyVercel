# ⚠️ Verificar DATABASE_URL en Railway

El backend no puede conectarse a la base de datos. Verifica lo siguiente:

## 🔍 En Railway:

1. Ve a Railway → Tu servicio Backend → Variables
2. Busca la variable `DATABASE_URL`
3. **Asegúrate de que tenga exactamente este valor:**

```
jdbc:mysql://root:QqkNNnIvzurdGtkgKorswoFZzeQhrIuw@tramway.proxy.rlwy.net:44767/railway
```

**IMPORTANTE:**
- Debe empezar con `jdbc:mysql://`
- Debe incluir las credenciales: `root:QqkNNnIvzurdGtkgKorswoFZzeQhrIuw@`
- Debe usar la URL pública: `tramway.proxy.rlwy.net:44767`
- Base de datos: `railway`

## 🔄 Si la variable no existe o está mal:

1. Elimina la variable `DATABASE_URL` si existe con valor incorrecto
2. Crea una nueva variable:
   - Nombre: `DATABASE_URL`
   - Valor: `jdbc:mysql://root:QqkNNnIvzurdGtkgKorswoFZzeQhrIuw@tramway.proxy.rlwy.net:44767/railway`
3. Guarda los cambios
4. Railway redesplegará automáticamente

## ✅ Verificar después:

Espera a que Railway redesplegue y verifica:
- Health check: `https://gantlyvercel-production.up.railway.app/actuator/health`
- Debería mostrar: `{"status":"UP"}`

---

**¿La variable DATABASE_URL está configurada correctamente en Railway?**

