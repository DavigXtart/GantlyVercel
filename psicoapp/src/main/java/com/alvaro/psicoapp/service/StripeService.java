package com.alvaro.psicoapp.service;

import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.alvaro.psicoapp.domain.AppointmentEntity;
import com.alvaro.psicoapp.repository.AppointmentRepository;
import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.Subscription;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;

import jakarta.annotation.PostConstruct;

@Service
public class StripeService {
    private static final Logger logger = LoggerFactory.getLogger(StripeService.class);

    @Value("${stripe.secret.key:}")
    private String stripeSecretKey;

    @Value("${stripe.webhook.secret:}")
    private String webhookSecret;

    @Value("${app.base.url:http://localhost:5173}")
    private String baseUrl;

    private final AppointmentRepository appointmentRepository;
    private final NotificationService notificationService;

    public StripeService(AppointmentRepository appointmentRepository, NotificationService notificationService) {
        this.appointmentRepository = appointmentRepository;
        this.notificationService = notificationService;
    }

    @PostConstruct
    public void init() {

        if (stripeSecretKey != null && !stripeSecretKey.trim().isEmpty()) {
            Stripe.apiKey = stripeSecretKey;
        }
    }

    private boolean isStripeConfigured() {
        return stripeSecretKey != null && !stripeSecretKey.trim().isEmpty();
    }

    public Map<String, String> createCheckoutSession(String planId, boolean isYearly, String userEmail) {

        if (!isStripeConfigured()) {
            throw new RuntimeException("Stripe no está configurado. Por favor, configura las claves de Stripe en application.yml");
        }

        try {

            Map<String, Map<Boolean, String>> planPriceMap = new HashMap<>();

            Map<Boolean, String> basicPrices = new HashMap<>();
            basicPrices.put(false, "price_1TCOOsBfHWMdW4wSXIRiG7lM");
            basicPrices.put(true, "price_1TCOPQBfHWMdW4wSuVZyr0p5");

            Map<Boolean, String> premiumPrices = new HashMap<>();
            premiumPrices.put(false, "price_1TCOPkBfHWMdW4wSnhyfEba6");
            premiumPrices.put(true, "price_1TCOQ3BfHWMdW4wSI7G8R9ke");

            Map<Boolean, String> enterprisePrices = new HashMap<>();
            enterprisePrices.put(false, "price_1TCOQIBfHWMdW4wSz1NAbGt1");
            enterprisePrices.put(true, "price_1TCOQfBfHWMdW4wSH9zzro5X");

            planPriceMap.put("basic", basicPrices);
            planPriceMap.put("premium", premiumPrices);
            planPriceMap.put("enterprise", enterprisePrices);

            Map<Boolean, String> prices = planPriceMap.get(planId.toLowerCase());
            if (prices == null) {
                throw new RuntimeException("Plan no válido: " + planId);
            }

            String priceId = prices.get(isYearly);
            if (priceId == null) {
                throw new RuntimeException("Price ID no encontrado para el plan: " + planId);
            }

            SessionCreateParams.Builder paramsBuilder = SessionCreateParams.builder()
                    .setMode(SessionCreateParams.Mode.SUBSCRIPTION)
                    .addLineItem(
                            SessionCreateParams.LineItem.builder()
                                    .setPrice(priceId)
                                    .setQuantity(1L)
                                    .build()
                    )
                    .setSuccessUrl(baseUrl + "/pricing?success=true&session_id={CHECKOUT_SESSION_ID}")
                    .setCancelUrl(baseUrl + "/pricing?canceled=true")
                    .putMetadata("planId", planId)
                    .putMetadata("isYearly", String.valueOf(isYearly));

            if (userEmail != null && !userEmail.isEmpty()) {
                paramsBuilder.setCustomerEmail(userEmail);
            }

            SessionCreateParams params = paramsBuilder.build();

            Session session = Session.create(params);

            Map<String, String> response = new HashMap<>();
            response.put("sessionId", session.getId());
            response.put("url", session.getUrl());

            return response;
        } catch (Exception e) {
            throw new RuntimeException("Error creando sesión de checkout: " + e.getMessage(), e);
        }
    }

    public Map<String, String> createAppointmentCheckoutSession(Long appointmentId, String userEmail) {
        if (!isStripeConfigured()) {
            throw new RuntimeException("Stripe no está configurado");
        }

        AppointmentEntity appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Cita no encontrada"));

        if (!"CONFIRMED".equals(appointment.getStatus()) && !"BOOKED".equals(appointment.getStatus())) {
            throw new RuntimeException("La cita debe estar confirmada para poder pagarla");
        }
        if ("PAID".equals(appointment.getPaymentStatus())) {
            throw new RuntimeException("Esta cita ya está pagada");
        }

        try {
            long amountCents = appointment.getPrice().multiply(java.math.BigDecimal.valueOf(100)).longValue();

            SessionCreateParams params = SessionCreateParams.builder()
                    .setMode(SessionCreateParams.Mode.PAYMENT)
                    .addLineItem(
                            SessionCreateParams.LineItem.builder()
                                    .setPriceData(
                                            SessionCreateParams.LineItem.PriceData.builder()
                                                    .setCurrency("eur")
                                                    .setUnitAmount(amountCents)
                                                    .setProductData(
                                                            SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                    .setName("Cita de psicología")
                                                                    .setDescription("Sesión con " + appointment.getPsychologist().getName())
                                                                    .build()
                                                    )
                                                    .build()
                                    )
                                    .setQuantity(1L)
                                    .build()
                    )
                    .setCustomerEmail(userEmail)
                    .setSuccessUrl(baseUrl + "/dashboard?payment=success&appointment=" + appointmentId)
                    .setCancelUrl(baseUrl + "/dashboard?payment=canceled&appointment=" + appointmentId)
                    .putMetadata("appointmentId", appointmentId.toString())
                    .putMetadata("type", "appointment")
                    .build();

            Session session = Session.create(params);

            appointment.setStripeSessionId(session.getId());
            appointmentRepository.save(appointment);

            Map<String, String> response = new HashMap<>();
            response.put("sessionId", session.getId());
            response.put("url", session.getUrl());
            return response;
        } catch (Exception e) {
            throw new RuntimeException("Error creando sesión de pago: " + e.getMessage(), e);
        }
    }

    public void handleWebhook(String payload, String sigHeader) {

        if (!isStripeConfigured()) {
            throw new RuntimeException("Stripe no está configurado. Por favor, configura las claves de Stripe en application.yml");
        }

        if (webhookSecret == null || webhookSecret.trim().isEmpty()) {
            throw new RuntimeException("Webhook secret no está configurado");
        }

        try {
            Event event = Webhook.constructEvent(payload, sigHeader, webhookSecret);

            switch (event.getType()) {
                case "checkout.session.completed":
                    Session session = (Session) event.getDataObjectDeserializer().getObject().orElse(null);
                    if (session != null) {
                        if ("subscription".equals(session.getMode())) {
                            handleSubscriptionCreated(session);
                        } else if ("payment".equals(session.getMode()) && "appointment".equals(session.getMetadata().get("type"))) {
                            handleAppointmentPaymentCompleted(session);
                        }
                    }
                    break;
                case "customer.subscription.updated":
                case "customer.subscription.deleted":
                    Subscription subscription = (Subscription) event.getDataObjectDeserializer().getObject().orElse(null);
                    if (subscription != null) {
                        handleSubscriptionUpdate(subscription, event.getType());
                    }
                    break;
                default:
                    logger.debug("Evento no manejado: {}", event.getType());
            }
        } catch (SignatureVerificationException e) {
            throw new RuntimeException("Error verificando firma del webhook", e);
        } catch (Exception e) {
            throw new RuntimeException("Error procesando webhook", e);
        }
    }

    public Map<String, String> verifyAppointmentPayment(Long appointmentId, String userEmail) {
        if (!isStripeConfigured()) {
            throw new RuntimeException("Stripe no está configurado");
        }

        AppointmentEntity appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Cita no encontrada"));

        if (!appointment.getUser().getEmail().equals(userEmail)) {
            throw new RuntimeException("No tienes permiso para verificar esta cita");
        }

        Map<String, String> result = new HashMap<>();

        if ("PAID".equals(appointment.getPaymentStatus())) {
            result.put("status", "PAID");
            return result;
        }

        String sessionId = appointment.getStripeSessionId();
        if (sessionId == null || sessionId.isEmpty()) {
            result.put("status", "PENDING");
            return result;
        }

        try {
            Session session = Session.retrieve(sessionId);
            if ("complete".equals(session.getStatus()) && "paid".equals(session.getPaymentStatus())) {
                appointment.setPaymentStatus("PAID");
                appointment.setStatus("BOOKED");
                appointmentRepository.save(appointment);
                logger.info("Pago verificado para cita {} via polling", appointmentId);

                if (appointment.getUser() != null) {
                    notificationService.createNotification(appointment.getUser().getId(), "PAYMENT",
                            "Pago confirmado", "Tu pago para la cita con " + appointment.getPsychologist().getName() + " ha sido confirmado.");
                }
                if (appointment.getPsychologist() != null) {
                    notificationService.createNotification(appointment.getPsychologist().getId(), "PAYMENT",
                            "Pago recibido", "El pago de " + appointment.getUser().getName() + " para su cita ha sido confirmado.");
                }

                result.put("status", "PAID");
            } else {
                result.put("status", "PENDING");
            }
        } catch (Exception e) {
            logger.error("Error verificando pago de cita {}: {}", appointmentId, e.getMessage());
            result.put("status", "PENDING");
        }

        return result;
    }

    private void handleAppointmentPaymentCompleted(Session session) {
        String appointmentIdStr = session.getMetadata().get("appointmentId");
        if (appointmentIdStr == null) return;

        try {
            Long appointmentId = Long.parseLong(appointmentIdStr);
            appointmentRepository.findById(appointmentId).ifPresent(appointment -> {
                appointment.setPaymentStatus("PAID");
                appointment.setStatus("BOOKED");
                appointment.setStripeSessionId(session.getId());
                appointmentRepository.save(appointment);
                logger.info("Pago completado para cita {}", appointmentId);

                if (appointment.getUser() != null) {
                    notificationService.createNotification(appointment.getUser().getId(), "PAYMENT",
                            "Pago confirmado", "Tu pago para la cita con " + appointment.getPsychologist().getName() + " ha sido confirmado.");
                }
                if (appointment.getPsychologist() != null) {
                    notificationService.createNotification(appointment.getPsychologist().getId(), "PAYMENT",
                            "Pago recibido", "El pago de " + appointment.getUser().getName() + " para su cita ha sido confirmado.");
                }
            });
        } catch (NumberFormatException e) {
            logger.error("appointmentId inválido en metadata: {}", appointmentIdStr);
        }
    }

    private void handleSubscriptionCreated(Session session) {

        String customerEmail = session.getCustomerEmail();
        String planId = session.getMetadata().get("planId");
        boolean isYearly = Boolean.parseBoolean(session.getMetadata().get("isYearly"));

        logger.info("Suscripción creada para: {}, Plan: {}, Anual: {}", customerEmail, planId, isYearly);

    }

    private void handleSubscriptionUpdate(Subscription subscription, String eventType) {
        String customerId = subscription.getCustomer();
        String status = subscription.getStatus();

        logger.info("Suscripción actualizada: {}, Estado: {}, Evento: {}", customerId, status, eventType);

    }

    public Map<String, String> createBillingPortalSession(String customerEmail) {
        if (!isStripeConfigured()) {
            throw new RuntimeException("Stripe no está configurado");
        }
        try {
            var customers = com.stripe.model.Customer.list(
                    com.stripe.param.CustomerListParams.builder()
                            .setEmail(customerEmail)
                            .setLimit(1L)
                            .build()
            );
            if (customers.getData().isEmpty()) {
                throw new RuntimeException("No se encontró un cliente con ese email");
            }
            String customerId = customers.getData().get(0).getId();
            var params = com.stripe.param.billingportal.SessionCreateParams.builder()
                    .setCustomer(customerId)
                    .setReturnUrl(baseUrl + "/dashboard")
                    .build();
            var session = com.stripe.model.billingportal.Session.create(params);
            Map<String, String> response = new HashMap<>();
            response.put("url", session.getUrl());
            return response;
        } catch (Exception e) {
            throw new RuntimeException("Error creando portal de facturación: " + e.getMessage(), e);
        }
    }

    public java.util.List<Map<String, Object>> getPaymentHistory(String customerEmail) {
        if (!isStripeConfigured()) {
            throw new RuntimeException("Stripe no está configurado");
        }
        try {
            var customers = com.stripe.model.Customer.list(
                    com.stripe.param.CustomerListParams.builder()
                            .setEmail(customerEmail)
                            .setLimit(1L)
                            .build()
            );
            if (customers.getData().isEmpty()) {
                return java.util.List.of();
            }
            String customerId = customers.getData().get(0).getId();
            var invoices = com.stripe.model.Invoice.list(
                    com.stripe.param.InvoiceListParams.builder()
                            .setCustomer(customerId)
                            .setLimit(20L)
                            .build()
            );
            java.util.List<Map<String, Object>> result = new java.util.ArrayList<>();
            for (var invoice : invoices.getData()) {
                Map<String, Object> inv = new HashMap<>();
                inv.put("id", invoice.getId());
                inv.put("date", invoice.getCreated());
                inv.put("amount", invoice.getAmountPaid());
                inv.put("currency", invoice.getCurrency());
                inv.put("status", invoice.getStatus());
                inv.put("invoicePdf", invoice.getInvoicePdf());
                result.add(inv);
            }
            return result;
        } catch (Exception e) {
            throw new RuntimeException("Error obteniendo historial de pagos: " + e.getMessage(), e);
        }
    }
}
