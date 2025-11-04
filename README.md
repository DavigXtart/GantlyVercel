# Psico App

Aplicación web para servicios de psicología con registro, autenticación y tests que conectan a usuarios con psicólogos especializados.

## Estructura del Proyecto

```
alvaro/
├── psicoapp/          # Backend (Spring Boot + MySQL)
└── frontend/          # Frontend (React + TypeScript + Vite)
```

## Tecnologías

**Backend:**
- Spring Boot 3.4.x (Java 23)
- MySQL 8.4
- Flyway (migraciones)
- JWT (autenticación)
- Swagger UI

**Frontend:**
- React + TypeScript
- Vite
- Axios
- CSS custom (estilo Apple)

## Requisitos

- Java 23
- Maven 3.9+
- MySQL 8.4 (puerto 3306)
- Node.js 22+ (para el frontend)

## Configuración Backend

1. **Crear base de datos en MySQL:**
```sql
CREATE DATABASE psicoapp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. **Configurar credenciales** en `psicoapp/src/main/resources/application-local.yml`:
```yaml
spring:
  datasource:
    username: root
    password: 1234
```

3. **Arrancar el backend:**
```powershell
cd psicoapp
mvn -q clean spring-boot:run
```

El backend estará en `http://localhost:8080`

## Configuración Frontend

1. **Instalar dependencias:**
```bash
cd frontend
npm install
```

2. **Arrancar el frontend:**
```bash
npm run dev
```

El frontend estará en `http://localhost:5173`

## Endpoints API

### Autenticación
- `POST /api/auth/register` - Registro de usuarios
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Usuario autenticado

### Tests
- `GET /api/tests` - Listar tests
- `GET /api/tests/{id}` - Detalle de un test
- `POST /api/flow/submit` - Enviar respuestas

### Admin (requiere rol ADMIN)
- `POST /api/admin/tests` - Crear test
- `POST /api/admin/questions` - Crear pregunta
- `POST /api/admin/answers` - Crear opción de respuesta

### Documentación
- Swagger UI: `http://localhost:8080/swagger-ui.html`

## Roles

- **USER**: Registro y login normales
- **ADMIN**: Acceso a endpoints de administración

Para convertir un usuario en admin:
```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'tu@email.com';
```

## Despliegue

### Railway

1. **Backend:**
   - Conectar el repo a Railway
   - Configurar las variables de entorno MySQL
   - Railway detectará automáticamente el `pom.xml` y desplegará

2. **Frontend:**
   - Actualizar `API_URL` en `frontend/src/services/api.ts` con la URL del backend
   - Desplegar como sitio estático en Railway o Vercel

## Desarrollo Local

### Backend
- Puerto: 8080
- Base de datos: MySQL local (puerto 3306)
- Perfil activo: `local`

### Frontend
- Puerto: 5173
- Proxy API: http://localhost:8080
- Hot reload activo

## Próximas Mejoras

- [ ] Componente de test interactivo
- [ ] Panel de administración completo
- [ ] Matching con psicólogos
- [ ] Visualizaciones de resultados
- [ ] Sistema de notificaciones

## Licencia

Privado - Todos los derechos reservados
