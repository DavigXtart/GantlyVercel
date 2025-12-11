# Guía de Manejo de Errores

Esta guía describe cómo implementar un sistema robusto de manejo de errores en la plataforma PSYmatch.

## Estado Actual

Actualmente el proyecto tiene:
- ✅ `GlobalExceptionHandler` básico en el backend
- ✅ Manejo de errores en interceptores de axios en el frontend
- ❌ Muchos `console.log` y `alert()` en el frontend (268+ instancias)
- ❌ Falta de logging estructurado
- ❌ Falta de notificaciones toast consistentes

## Objetivos

1. **Eliminar todos los `alert()` del frontend** y reemplazarlos por notificaciones toast
2. **Reducir `console.log`** a solo logs necesarios para debugging
3. **Implementar logging estructurado** en el backend
4. **Crear un sistema de notificaciones** consistente en el frontend
5. **Mejorar el manejo de errores** en todos los controladores

## Implementación Backend

### 1. Mejorar GlobalExceptionHandler

El archivo `psicoapp/src/main/java/com/alvaro/psicoapp/controller/GlobalExceptionHandler.java` debe mejorarse:

```java
@ControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException e) {
        logger.warn("Argumento inválido: {}", e.getMessage());
        return ResponseEntity.badRequest()
            .body(new ErrorResponse("VALIDATION_ERROR", e.getMessage()));
    }
    
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthentication(AuthenticationException e) {
        logger.warn("Error de autenticación: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(new ErrorResponse("AUTH_ERROR", "No autorizado"));
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception e) {
        logger.error("Error inesperado", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(new ErrorResponse("INTERNAL_ERROR", "Error interno del servidor"));
    }
}

class ErrorResponse {
    private String code;
    private String message;
    private String timestamp;
    // getters y setters
}
```

### 2. Agregar Logging Estructurado

Usar SLF4J con Logback para logging estructurado:

```xml
<!-- En pom.xml ya está incluido spring-boot-starter-logging -->
```

Configurar `logback-spring.xml`:

```xml
<configuration>
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <encoder class="net.logstash.logback.encoder.LoggingEventCompositeJsonEncoder">
            <providers>
                <timestamp/>
                <version/>
                <logLevel/>
                <message/>
                <mdc/>
                <stackTrace/>
            </providers>
        </encoder>
    </appender>
    <root level="INFO">
        <appender-ref ref="STDOUT" />
    </root>
</configuration>
```

## Implementación Frontend

### 1. Crear Sistema de Notificaciones Toast

Crear `frontend/src/components/ui/Toast.tsx`:

```typescript
import { useState, useEffect } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

let toastId = 0;
const listeners: Array<(toasts: Toast[]) => void> = [];
let toasts: Toast[] = [];

export const toast = {
  success: (message: string) => addToast(message, 'success'),
  error: (message: string) => addToast(message, 'error'),
  warning: (message: string) => addToast(message, 'warning'),
  info: (message: string) => addToast(message, 'info'),
};

function addToast(message: string, type: ToastType) {
  const id = `toast-${++toastId}`;
  const newToast: Toast = { id, message, type };
  toasts = [...toasts, newToast];
  notifyListeners();
  
  setTimeout(() => {
    removeToast(id);
  }, 5000);
}

function removeToast(id: string) {
  toasts = toasts.filter(t => t.id !== id);
  notifyListeners();
}

function notifyListeners() {
  listeners.forEach(listener => listener([...toasts]));
}

export function useToasts() {
  const [state, setState] = useState<Toast[]>([]);
  
  useEffect(() => {
    listeners.push(setState);
    setState([...toasts]);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);
  
  return state;
}

export function ToastContainer() {
  const toasts = useToasts();
  
  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 10000 }}>
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}
```

### 2. Reemplazar alert() y console.log

**Paso 1:** Buscar y reemplazar todos los `alert()`:

```bash
# En el directorio frontend/src
grep -r "alert(" --include="*.tsx" --include="*.ts"
```

**Paso 2:** Para cada `alert()`, reemplazar:

```typescript
// ANTES
alert('Error al cargar datos');

// DESPUÉS
import { toast } from '../components/ui/Toast';
toast.error('Error al cargar datos');
```

**Paso 3:** Para `console.log`, mantener solo los necesarios:

```typescript
// MANTENER solo para debugging crítico
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data);
}

// ELIMINAR logs innecesarios
// console.log('Tests cargados:', data); ❌
```

### 3. Mejorar Manejo de Errores en API

Actualizar `frontend/src/services/api.ts`:

```typescript
api.interceptors.response.use(
  response => response,
  error => {
    const message = error.response?.data?.message || 
                   error.response?.data?.error || 
                   error.message || 
                   'Error desconocido';
    
    // Log solo en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', error);
    }
    
    // Mostrar toast
    toast.error(message);
    
    return Promise.reject(error);
  }
);
```

## Plan de Migración

### Fase 1: Preparación (1-2 días)
1. Crear componente Toast
2. Integrar ToastContainer en App.tsx
3. Crear utilidad de logging para desarrollo

### Fase 2: Migración Backend (2-3 días)
1. Mejorar GlobalExceptionHandler
2. Agregar logging estructurado
3. Agregar códigos de error estándar

### Fase 3: Migración Frontend (3-5 días)
1. Reemplazar alert() por toast (archivo por archivo)
2. Eliminar console.log innecesarios
3. Mejorar manejo de errores en componentes

### Fase 4: Testing (1-2 días)
1. Probar todos los flujos de error
2. Verificar que los toasts funcionen correctamente
3. Asegurar que no se pierdan mensajes importantes

## Checklist de Archivos a Modificar

### Backend
- [ ] `GlobalExceptionHandler.java` - Mejorar
- [ ] `logback-spring.xml` - Crear configuración
- [ ] Todos los controladores - Agregar logging apropiado

### Frontend
- [ ] `components/ui/Toast.tsx` - Crear
- [ ] `App.tsx` - Agregar ToastContainer
- [ ] `services/api.ts` - Mejorar interceptores
- [ ] `components/PsychDashboard.tsx` - Reemplazar alert()
- [ ] `components/UserDashboard.tsx` - Reemplazar alert()
- [ ] `components/AdminPanel.tsx` - Reemplazar alert()
- [ ] `components/CalendarWeek.tsx` - Reemplazar alert()
- [ ] Todos los demás componentes con alert() o console.log

## Mejores Prácticas

1. **Nunca usar `alert()` en producción** - Usar toast siempre
2. **Logging estructurado** - Usar niveles apropiados (DEBUG, INFO, WARN, ERROR)
3. **Mensajes de error claros** - Que el usuario entienda qué pasó
4. **No exponer detalles técnicos** - En producción, mensajes genéricos
5. **Códigos de error consistentes** - Usar códigos estándar (VALIDATION_ERROR, AUTH_ERROR, etc.)

## Ejemplo Completo

### Backend
```java
@PostMapping("/slots")
public ResponseEntity<?> createSlot(Principal principal, @RequestBody Map<String, Object> body) {
    try {
        // Validaciones
        if (body.get("price") == null) {
            logger.warn("Intento de crear cita sin precio");
            return ResponseEntity.badRequest()
                .body(new ErrorResponse("VALIDATION_ERROR", "El precio es obligatorio"));
        }
        
        // Lógica...
        logger.info("Cita creada exitosamente: {}", appointment.getId());
        return ResponseEntity.ok(appointment);
        
    } catch (IllegalArgumentException e) {
        logger.warn("Error de validación: {}", e.getMessage());
        return ResponseEntity.badRequest()
            .body(new ErrorResponse("VALIDATION_ERROR", e.getMessage()));
    } catch (Exception e) {
        logger.error("Error inesperado al crear cita", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(new ErrorResponse("INTERNAL_ERROR", "Error al crear la cita"));
    }
}
```

### Frontend
```typescript
const createSlot = async (start, end, price) => {
  try {
    await calendarService.createSlot(start, end, price);
    toast.success('Cita creada exitosamente');
    await loadMySlots();
  } catch (error: any) {
    // El interceptor ya muestra el toast, pero podemos agregar lógica adicional
    if (error.response?.status === 403) {
      toast.error('No tienes permiso para realizar esta acción');
    }
  }
};
```

## Recursos Adicionales

- [Spring Boot Error Handling](https://spring.io/guides/gs/rest-service/)
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [SLF4J Documentation](http://www.slf4j.org/manual.html)

