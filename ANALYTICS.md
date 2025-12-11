# Guía de Implementación de Analytics

Esta guía describe cómo implementar un sistema de analytics para la plataforma PSYmatch.

## Objetivos

1. **Tracking de eventos importantes** (registros, citas, pagos, etc.)
2. **Métricas de negocio** (conversión, retención, engagement)
3. **Análisis de comportamiento** de usuarios
4. **Dashboard de métricas** para administradores

## Opciones de Herramientas

### 1. Google Analytics 4 (Recomendado para empezar)
- ✅ Gratis
- ✅ Fácil de implementar
- ✅ Dashboard completo
- ✅ Integración con Google Ads
- ❌ Limitaciones en privacidad (GDPR)

### 2. Plausible Analytics
- ✅ Enfocado en privacidad
- ✅ GDPR compliant
- ✅ Ligero y rápido
- ❌ De pago (€9/mes)

### 3. Mixpanel
- ✅ Muy potente para eventos
- ✅ Funnels y cohortes
- ❌ De pago (plan gratuito limitado)

### 4. PostHog
- ✅ Open source
- ✅ Muy completo
- ✅ Self-hosted disponible
- ❌ Más complejo de configurar

## Recomendación: Google Analytics 4

Para empezar, recomendamos Google Analytics 4 por su facilidad y gratuidad.

## Implementación con Google Analytics 4

### Paso 1: Crear Cuenta de Google Analytics

1. Ve a [Google Analytics](https://analytics.google.com/)
2. Crea una cuenta nueva
3. Crea una propiedad para PSYmatch
4. Obtén el **Measurement ID** (formato: `G-XXXXXXXXXX`)

### Paso 2: Instalar en el Frontend

**Instalar dependencia:**

```bash
cd frontend
npm install gtag
```

**Crear utilidad de analytics:**

`frontend/src/utils/analytics.ts`:

```typescript
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || '';

export const initAnalytics = () => {
  if (!GA_MEASUREMENT_ID) {
    console.warn('Google Analytics ID no configurado');
    return;
  }

  // Cargar script de Google Analytics
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script1);

  // Inicializar dataLayer
  window.dataLayer = window.dataLayer || [];
  window.gtag = function() {
    window.dataLayer.push(arguments);
  };

  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: window.location.pathname,
  });
};

export const trackEvent = (
  eventName: string,
  eventParams?: {
    [key: string]: any;
  }
) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, eventParams);
  }
};

export const trackPageView = (path: string) => {
  if (typeof window.gtag === 'function') {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: path,
    });
  }
};

// Eventos específicos de la aplicación
export const analytics = {
  // Autenticación
  userRegistered: (role: string) => {
    trackEvent('user_registered', { role });
  },
  userLoggedIn: (role: string) => {
    trackEvent('user_logged_in', { role });
  },
  
  // Citas
  appointmentCreated: (price: number) => {
    trackEvent('appointment_created', { price, currency: 'EUR' });
  },
  appointmentRequested: (appointmentId: number) => {
    trackEvent('appointment_requested', { appointment_id: appointmentId });
  },
  appointmentConfirmed: (appointmentId: number, price: number) => {
    trackEvent('appointment_confirmed', { 
      appointment_id: appointmentId, 
      price, 
      currency: 'EUR' 
    });
  },
  appointmentCancelled: (appointmentId: number) => {
    trackEvent('appointment_cancelled', { appointment_id: appointmentId });
  },
  
  // Tests
  testStarted: (testId: number, testTitle: string) => {
    trackEvent('test_started', { test_id: testId, test_title: testTitle });
  },
  testCompleted: (testId: number, testTitle: string) => {
    trackEvent('test_completed', { test_id: testId, test_title: testTitle });
  },
  
  // Tareas
  taskCreated: (taskId: number) => {
    trackEvent('task_created', { task_id: taskId });
  },
  taskCompleted: (taskId: number) => {
    trackEvent('task_completed', { task_id: taskId });
  },
  
  // Chat
  messageSent: () => {
    trackEvent('message_sent');
  },
  
  // Videollamadas
  videoCallStarted: (appointmentId: number) => {
    trackEvent('video_call_started', { appointment_id: appointmentId });
  },
  
  // Pagos (cuando se implemente Stripe)
  paymentInitiated: (amount: number, appointmentId: number) => {
    trackEvent('payment_initiated', { 
      value: amount, 
      currency: 'EUR',
      appointment_id: appointmentId 
    });
  },
  paymentCompleted: (amount: number, appointmentId: number) => {
    trackEvent('purchase', { 
      value: amount, 
      currency: 'EUR',
      appointment_id: appointmentId 
    });
  },
};
```

**Integrar en App.tsx:**

```typescript
import { useEffect } from 'react';
import { initAnalytics } from './utils/analytics';

function App() {
  useEffect(() => {
    initAnalytics();
  }, []);
  
  // ... resto del código
}
```

**Agregar variable de entorno:**

`.env`:
```
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Paso 3: Implementar Tracking en Componentes

**Ejemplo en registro:**

```typescript
import { analytics } from '../utils/analytics';

const handleRegister = async (data) => {
  try {
    await authService.register(data);
    analytics.userRegistered(data.role);
    // ...
  } catch (error) {
    // ...
  }
};
```

**Ejemplo en creación de citas:**

```typescript
import { analytics } from '../utils/analytics';

const createSlot = async (start, end, price) => {
  try {
    const result = await calendarService.createSlot(start, end, price);
    analytics.appointmentCreated(price);
    // ...
  } catch (error) {
    // ...
  }
};
```

## Eventos a Trackear

### Eventos de Usuario
- ✅ `user_registered` - Usuario se registra
- ✅ `user_logged_in` - Usuario inicia sesión
- ✅ `email_verified` - Email verificado
- ✅ `profile_updated` - Perfil actualizado

### Eventos de Citas
- ✅ `appointment_created` - Cita creada
- ✅ `appointment_requested` - Solicitud de cita
- ✅ `appointment_confirmed` - Cita confirmada
- ✅ `appointment_cancelled` - Cita cancelada
- ✅ `appointment_paid` - Cita pagada (cuando se implemente)

### Eventos de Tests
- ✅ `test_started` - Test iniciado
- ✅ `test_completed` - Test completado
- ✅ `test_assigned` - Test asignado

### Eventos de Tareas
- ✅ `task_created` - Tarea creada
- ✅ `task_completed` - Tarea completada

### Eventos de Comunicación
- ✅ `message_sent` - Mensaje enviado
- ✅ `video_call_started` - Videollamada iniciada

## Métricas Clave a Medir

### Métricas de Negocio
1. **Tasa de conversión de registro** - % de visitantes que se registran
2. **Tasa de activación** - % de usuarios que completan el test inicial
3. **Tasa de retención** - % de usuarios que vuelven después de 7 días
4. **Tasa de conversión de citas** - % de usuarios que solicitan una cita
5. **Tasa de confirmación** - % de solicitudes que se convierten en citas confirmadas
6. **Tasa de pago** - % de citas confirmadas que se pagan (cuando se implemente)

### Métricas de Engagement
1. **Tests completados por usuario**
2. **Tareas completadas por usuario**
3. **Mensajes enviados por usuario**
4. **Citas solicitadas por usuario**
5. **Tiempo promedio en la plataforma**

### Métricas de Producto
1. **Tests más populares**
2. **Horarios de citas más solicitados**
3. **Precios promedio de citas**
4. **Tasa de cancelación**
5. **Tiempo promedio hasta primera cita**

## Dashboard de Métricas (Futuro)

Crear un panel de administración con métricas en tiempo real:

```typescript
// frontend/src/components/AdminAnalytics.tsx
export default function AdminAnalytics() {
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    activeUsers: 0,
    appointmentsToday: 0,
    revenue: 0,
    // ...
  });
  
  // Usar Google Analytics Reporting API o crear endpoints propios
  // ...
}
```

## Privacidad y GDPR

### Consideraciones Importantes

1. **Consentimiento del Usuario**
   - Mostrar banner de cookies
   - Permitir opt-out
   - Documentar en política de privacidad

2. **Datos Personales**
   - No enviar emails, nombres completos, etc. a GA
   - Usar IDs anónimos
   - Considerar IP anonymization

3. **Implementar Banner de Cookies**

```typescript
// frontend/src/components/CookieBanner.tsx
export function CookieBanner() {
  const [accepted, setAccepted] = useState(
    localStorage.getItem('cookies_accepted') === 'true'
  );
  
  if (accepted) return null;
  
  return (
    <div className="cookie-banner">
      <p>Usamos cookies para mejorar tu experiencia...</p>
      <button onClick={() => {
        localStorage.setItem('cookies_accepted', 'true');
        setAccepted(true);
        initAnalytics(); // Inicializar solo después del consentimiento
      }}>
        Aceptar
      </button>
    </div>
  );
}
```

## Alternativa: Analytics Propio

Si prefieres no usar servicios externos, puedes crear tu propio sistema:

### Backend: Endpoint de Tracking

```java
@PostMapping("/api/analytics/track")
public ResponseEntity<?> trackEvent(@RequestBody AnalyticsEvent event) {
    // Guardar en base de datos
    analyticsRepository.save(event);
    return ResponseEntity.ok().build();
}
```

### Frontend: Cliente de Analytics

```typescript
export const trackEvent = async (eventName: string, params: any) => {
  try {
    await api.post('/api/analytics/track', {
      event: eventName,
      params,
      timestamp: new Date().toISOString(),
      userId: getCurrentUserId(),
    });
  } catch (error) {
    // Silenciar errores de analytics
  }
};
```

## Plan de Implementación

### Fase 1: Setup Básico (1 día)
1. Crear cuenta de Google Analytics
2. Instalar script en frontend
3. Configurar eventos básicos (registro, login)

### Fase 2: Eventos Principales (2-3 días)
1. Implementar tracking de citas
2. Implementar tracking de tests
3. Implementar tracking de tareas

### Fase 3: Métricas y Dashboard (3-5 días)
1. Crear endpoints de métricas en backend
2. Crear dashboard de administración
3. Configurar alertas y reportes

### Fase 4: Optimización (1-2 días)
1. Revisar y optimizar eventos
2. Configurar goals y conversiones
3. Documentar métricas importantes

## Checklist

- [ ] Crear cuenta de Google Analytics
- [ ] Obtener Measurement ID
- [ ] Instalar script en frontend
- [ ] Crear utilidad de analytics
- [ ] Implementar tracking de eventos principales
- [ ] Agregar banner de cookies
- [ ] Configurar goals en GA
- [ ] Crear dashboard de métricas (opcional)
- [ ] Documentar en política de privacidad

## Recursos

- [Google Analytics 4 Documentation](https://developers.google.com/analytics/devguides/collection/ga4)
- [GDPR Compliance Guide](https://gdpr.eu/)
- [Google Tag Manager](https://tagmanager.google.com/) (alternativa más avanzada)

