# Configuración de Stripe

## Variables de Entorno Necesarias

### Backend (application.yml o application-local.yml)

Agrega las siguientes propiedades en tu archivo de configuración:

```yaml
stripe:
  secret:
    key: sk_test_... # Tu clave secreta de Stripe (obténla en https://dashboard.stripe.com/apikeys)
  public:
    key: pk_test_... # Tu clave pública de Stripe
  webhook:
    secret: whsec_... # Secreto del webhook (obténlo después de crear el webhook)

app:
  base:
    url: http://localhost:5173 # URL de tu frontend (cambia en producción)
```

### Frontend (opcional - si necesitas la clave pública en el frontend)

Si necesitas usar la clave pública de Stripe directamente en el frontend, crea un archivo `.env` en la carpeta `frontend/`:

```env
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

## Pasos para Configurar Stripe

### 1. Crear una cuenta en Stripe
- Ve a https://stripe.com y crea una cuenta
- Activa el modo de prueba (Test Mode) para desarrollo

### 2. Obtener las claves API
- Ve a https://dashboard.stripe.com/test/apikeys
- Copia tu **Publishable key** (clave pública) y **Secret key** (clave secreta)

### 3. Crear Productos y Precios en Stripe
- Ve a https://dashboard.stripe.com/test/products
- Crea productos para cada plan (Basic, Premium, Enterprise)
- Para cada producto, crea dos precios:
  - Uno para facturación mensual
  - Uno para facturación anual
- Copia los **Price IDs** (comienzan con `price_...`)

### 4. Actualizar el código con los Price IDs
Edita el archivo `psicoapp/src/main/java/com/alvaro/psicoapp/service/StripeService.java` y reemplaza los Price IDs de ejemplo con los reales:

```java
Map<Boolean, String> basicPrices = new HashMap<>();
basicPrices.put(false, "price_TU_PRICE_ID_MENSUAL"); // Reemplaza con tu Price ID mensual
basicPrices.put(true, "price_TU_PRICE_ID_ANUAL");   // Reemplaza con tu Price ID anual
```

### 5. Configurar Webhooks (Opcional pero recomendado)
- Ve a https://dashboard.stripe.com/test/webhooks
- Haz clic en "Add endpoint"
- URL del endpoint: `https://tu-dominio.com/api/stripe/webhook`
- Para desarrollo local, usa Stripe CLI: `stripe listen --forward-to localhost:8080/api/stripe/webhook`
- Selecciona los eventos:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
- Copia el **Signing secret** (comienza con `whsec_...`)

### 6. Usar Stripe en tus Planes
Cuando uses el componente `Pricing`, agrega las propiedades necesarias:

```typescript
const plans: PricingPlan[] = [
  {
    name: "Básico",
    price: "29",
    yearlyPrice: "290",
    period: "mes",
    features: ["Característica 1", "Característica 2"],
    description: "Plan básico",
    buttonText: "Suscribirse",
    isPopular: false,
    planId: "basic", // ID del plan (debe coincidir con el mapeo en StripeService)
    useStripe: true  // Activa la integración con Stripe
  },
  // ... más planes
];
```

## Instalación de Dependencias

### Frontend
```bash
cd frontend
npm install @stripe/stripe-js
```

### Backend
Las dependencias de Maven se descargarán automáticamente al compilar el proyecto.

## Notas Importantes

1. **Modo de Prueba vs Producción**: 
   - Las claves que comienzan con `pk_test_` y `sk_test_` son para desarrollo
   - Las claves que comienzan con `pk_live_` y `sk_live_` son para producción
   - Cambia a claves de producción solo cuando estés listo para recibir pagos reales

2. **Webhooks en Desarrollo Local**:
   - Usa Stripe CLI para reenviar webhooks a tu servidor local
   - Instala: `npm install -g stripe-cli` o descarga desde https://stripe.com/docs/stripe-cli
   - Ejecuta: `stripe listen --forward-to localhost:8080/api/stripe/webhook`

3. **URLs de Éxito y Cancelación**:
   - Asegúrate de que las URLs en `StripeService` apunten a las rutas correctas de tu aplicación
   - La URL de éxito puede incluir parámetros de consulta para mostrar mensajes al usuario

4. **Seguridad**:
   - NUNCA expongas tu clave secreta (`sk_...`) en el frontend
   - Solo usa la clave pública (`pk_...`) en el frontend si es necesario
   - El webhook debe verificar la firma para asegurar que los eventos vienen de Stripe

