package com.alvaro.psicoapp.service;

import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.alvaro.psicoapp.config.StripeProperties;
import com.alvaro.psicoapp.domain.AppointmentEntity;
import com.alvaro.psicoapp.domain.AppointmentStatusEnum;
import com.alvaro.psicoapp.domain.PaymentStatusEnum;
import com.alvaro.psicoapp.domain.StripeEventEntity;
import com.alvaro.psicoapp.domain.UserSubscriptionEntity;
import com.alvaro.psicoapp.repository.AppointmentRepository;
import com.alvaro.psicoapp.repository.StripeEventRepository;
import com.alvaro.psicoapp.repository.UserRepository;
import com.alvaro.psicoapp.repository.UserSubscriptionRepository;
import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.model.Subscription;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.net.RequestOptions;
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
    private final UserRepository userRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;
    private final StripeEventRepository stripeEventRepository;
    private final StripeProperties stripeProperties;

    public StripeService(AppointmentRepository appointmentRepository, NotificationService notificationService,
                         UserRepository userRepository, UserSubscriptionRepository userSubscriptionRepository,
                         StripeEventRepository stripeEventRepository, StripeProperties stripeProperties) {
        this.appointmentRepository = appointmentRepository;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
        this.userSubscriptionRepository = userSubscriptionRepository;
        this.stripeEventRepository = stripeEventRepository;
        this.stripeProperties = stripeProperties;
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

            StripeProperties.PlanPrices planPrices;
            switch (planId.toLowerCase()) {
                case "basic":
                    planPrices = stripeProperties.getPrices().getBasic();
                    break;
                case "premium":
                    planPrices = stripeProperties.getPrices().getPremium();
                    break;
                case "enterprise":
                    planPrices = stripeProperties.getPrices().getEnterprise();
                    break;
                default:
                    throw new RuntimeException("Plan no válido: " + planId);
            }

            String priceId = isYearly ? planPrices.getYearly() : planPrices.getMonthly();
            if (priceId == null || priceId.isBlank()) {
                throw new RuntimeException("Price ID no configurado para el plan: " + planId + " (" + (isYearly ? "yearly" : "monthly") + ")");
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

            // Idempotency key to prevent duplicate session creation
            Long userId = userRepository.findByEmail(userEmail).map(u -> u.getId()).orElse(0L);
            RequestOptions requestOptions = RequestOptions.builder()
                    .setIdempotencyKey("sub-" + userId + "-" + priceId)
                    .build();

            Session session = Session.create(params, requestOptions);

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

        if (appointment.getStatus() != AppointmentStatusEnum.CONFIRMED && appointment.getStatus() != AppointmentStatusEnum.BOOKED) {
            throw new RuntimeException("La cita debe estar confirmada para poder pagarla");
        }
        if (appointment.getPaymentStatus() == PaymentStatusEnum.PAID) {
            throw new RuntimeException("Esta cita ya está pagada");
        }

        try {
            java.math.BigDecimal chargeAmount = appointment.getTotalAmount() != null ? appointment.getTotalAmount() : appointment.getPrice();
            long amountCents = chargeAmount.multiply(java.math.BigDecimal.valueOf(100)).longValue();

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

            // Idempotency key to prevent duplicate session creation
            RequestOptions requestOptions = RequestOptions.builder()
                    .setIdempotencyKey("apt-" + appointmentId)
                    .build();

            Session session = Session.create(params, requestOptions);

            // Amount validation: verify the session amount matches the appointment price
            Long sessionAmount = session.getAmountTotal();
            if (sessionAmount != null && sessionAmount != amountCents) {
                // Cancel the mismatched session
                try {
                    session.expire();
                } catch (Exception cancelEx) {
                    logger.error("Error cancelando sesión con monto incorrecto: {}", cancelEx.getMessage());
                }
                throw new RuntimeException("El monto de la sesión de pago (" + sessionAmount +
                        ") no coincide con el precio de la cita (" + amountCents + ")");
            }

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

            // Replay protection: skip already-processed events
            if (stripeEventRepository.existsById(event.getId())) {
                logger.info("Webhook duplicado ignorado: {}", event.getId());
                return;
            }
            StripeEventEntity stripeEvent = new StripeEventEntity();
            stripeEvent.setId(event.getId());
            stripeEvent.setEventType(event.getType());
            stripeEventRepository.save(stripeEvent);

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
                case "payment_intent.payment_failed":
                    PaymentIntent paymentIntent = (PaymentIntent) event.getDataObjectDeserializer().getObject().orElse(null);
                    if (paymentIntent != null) {
                        handlePaymentFailed(paymentIntent);
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

    @org.springframework.transaction.annotation.Transactional
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

        if (appointment.getPaymentStatus() == PaymentStatusEnum.PAID) {
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
                appointment.setPaymentStatus(PaymentStatusEnum.PAID);
                appointment.setStatus(AppointmentStatusEnum.BOOKED);
                appointmentRepository.save(appointment);
                logger.info("Pago verificado para cita {} via polling", appointmentId);

                if (appointment.getUser() != null) {
                    notificationService.createNotification(appointment.getUser().getId(), "PAYMENT",
                            "Pago confirmado", "Tu pago para la cita con " + appointment.getPsychologist().getName() + " ha sido confirmado.", appointment.getId());
                }
                if (appointment.getPsychologist() != null) {
                    notificationService.createNotification(appointment.getPsychologist().getId(), "PAYMENT",
                            "Pago recibido", "El pago de " + appointment.getUser().getName() + " para su cita ha sido confirmado.", appointment.getId());
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
                // Deduplication: skip if already processed
                if (appointment.getPaymentStatus() == PaymentStatusEnum.PAID) {
                    logger.info("Webhook duplicado ignorado para cita {} (ya pagada)", appointmentId);
                    return;
                }

                appointment.setPaymentStatus(PaymentStatusEnum.PAID);
                appointment.setStatus(AppointmentStatusEnum.BOOKED);
                appointment.setStripeSessionId(session.getId());
                appointmentRepository.save(appointment);
                logger.info("Pago completado para cita {}", appointmentId);

                if (appointment.getUser() != null) {
                    notificationService.createNotification(appointment.getUser().getId(), "PAYMENT",
                            "Pago confirmado", "Tu pago para la cita con " + appointment.getPsychologist().getName() + " ha sido confirmado.", appointment.getId());
                }
                if (appointment.getPsychologist() != null) {
                    notificationService.createNotification(appointment.getPsychologist().getId(), "PAYMENT",
                            "Pago recibido", "El pago de " + appointment.getUser().getName() + " para su cita ha sido confirmado.", appointment.getId());
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
        String subscriptionId = session.getSubscription();

        logger.info("Suscripción creada para: {}, Plan: {}, Anual: {}", customerEmail, planId, isYearly);

        if (subscriptionId != null && customerEmail != null) {
            userRepository.findByEmail(customerEmail).ifPresent(user -> {
                try {
                    // Retrieve subscription details from Stripe
                    Subscription sub = Subscription.retrieve(subscriptionId);

                    UserSubscriptionEntity entity = userSubscriptionRepository
                            .findByStripeSubscriptionId(subscriptionId)
                            .orElse(new UserSubscriptionEntity());

                    entity.setUserId(user.getId());
                    entity.setStripeSubscriptionId(subscriptionId);
                    entity.setStripeCustomerId(session.getCustomer());
                    entity.setStatus("ACTIVE");
                    entity.setUpdatedAt(java.time.Instant.now());

                    if (sub.getItems() != null && !sub.getItems().getData().isEmpty()) {
                        entity.setStripePriceId(sub.getItems().getData().get(0).getPrice().getId());
                    }
                    if (sub.getCurrentPeriodEnd() != null) {
                        entity.setCurrentPeriodEnd(java.time.Instant.ofEpochSecond(sub.getCurrentPeriodEnd()));
                    }

                    userSubscriptionRepository.save(entity);
                    logger.info("Suscripción {} persistida para usuario {}", subscriptionId, user.getEmail());
                } catch (Exception e) {
                    logger.error("Error persistiendo suscripción {}: {}", subscriptionId, e.getMessage());
                }
            });
        }
    }

    private void handleSubscriptionUpdate(Subscription subscription, String eventType) {
        String subscriptionId = subscription.getId();
        String stripeStatus = subscription.getStatus();

        logger.info("Suscripción actualizada: {}, Estado: {}, Evento: {}", subscriptionId, stripeStatus, eventType);

        userSubscriptionRepository.findByStripeSubscriptionId(subscriptionId).ifPresent(entity -> {
            // Map Stripe status to our status
            String mappedStatus;
            switch (stripeStatus) {
                case "active":
                    mappedStatus = "ACTIVE";
                    break;
                case "canceled":
                    mappedStatus = "CANCELLED";
                    break;
                case "past_due":
                    mappedStatus = "PAST_DUE";
                    break;
                default:
                    mappedStatus = stripeStatus.toUpperCase();
                    break;
            }

            entity.setStatus(mappedStatus);
            entity.setStripeCustomerId(subscription.getCustomer());
            entity.setUpdatedAt(java.time.Instant.now());

            if (subscription.getCurrentPeriodEnd() != null) {
                entity.setCurrentPeriodEnd(java.time.Instant.ofEpochSecond(subscription.getCurrentPeriodEnd()));
            }
            if (subscription.getItems() != null && !subscription.getItems().getData().isEmpty()) {
                entity.setStripePriceId(subscription.getItems().getData().get(0).getPrice().getId());
            }

            userSubscriptionRepository.save(entity);
            logger.info("Suscripción {} actualizada a estado {}", subscriptionId, mappedStatus);
        });
    }

    private void handlePaymentFailed(PaymentIntent paymentIntent) {
        Map<String, String> metadata = paymentIntent.getMetadata();
        if (metadata == null) return;

        String appointmentIdStr = metadata.get("appointmentId");
        if (appointmentIdStr == null) return;

        try {
            Long appointmentId = Long.parseLong(appointmentIdStr);
            appointmentRepository.findById(appointmentId).ifPresent(appointment -> {
                logger.warn("Pago fallido para cita {}", appointmentId);

                if (appointment.getUser() != null) {
                    notificationService.createNotification(
                            appointment.getUser().getId(),
                            "PAYMENT",
                            "Pago fallido",
                            "Tu pago para la cita con " + appointment.getPsychologist().getName() +
                                    " no se ha podido procesar. Por favor, inténtalo de nuevo.",
                            appointment.getId()
                    );
                }
            });
        } catch (NumberFormatException e) {
            logger.error("appointmentId inválido en metadata de payment_intent.payment_failed: {}", appointmentIdStr);
        }
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
