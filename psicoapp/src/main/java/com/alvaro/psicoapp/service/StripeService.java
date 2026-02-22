package com.alvaro.psicoapp.service;

import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

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
            basicPrices.put(false, "price_basic_monthly");
            basicPrices.put(true, "price_basic_yearly");

            Map<Boolean, String> premiumPrices = new HashMap<>();
            premiumPrices.put(false, "price_premium_monthly");
            premiumPrices.put(true, "price_premium_yearly");

            Map<Boolean, String> enterprisePrices = new HashMap<>();
            enterprisePrices.put(false, "price_enterprise_monthly");
            enterprisePrices.put(true, "price_enterprise_yearly");

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
                    if (session != null && "subscription".equals(session.getMode())) {
                        handleSubscriptionCreated(session);
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
}
