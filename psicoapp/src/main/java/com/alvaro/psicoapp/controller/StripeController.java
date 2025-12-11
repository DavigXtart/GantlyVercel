package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.service.StripeService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/stripe")
@CrossOrigin(origins = "*")
public class StripeController {
    private final StripeService stripeService;
    
    @Value("${stripe.public.key:}")
    private String stripePublicKey;

    public StripeController(StripeService stripeService) {
        this.stripeService = stripeService;
    }

    @GetMapping("/public-key")
    public ResponseEntity<Map<String, String>> getPublicKey() {
        Map<String, String> response = new HashMap<>();
        response.put("publicKey", stripePublicKey != null ? stripePublicKey : "");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/create-checkout-session")
    public ResponseEntity<Map<String, String>> createCheckoutSession(
            @RequestBody Map<String, Object> request,
            Principal principal) {
        String planId = (String) request.get("planId");
        Boolean isYearly = (Boolean) request.get("isYearly");
        
        if (planId == null) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "planId es requerido");
            return ResponseEntity.badRequest().body(error);
        }
        
        String userEmail = principal != null ? principal.getName() : null;
        
        try {
            Map<String, String> session = stripeService.createCheckoutSession(
                planId, 
                isYearly != null && isYearly,
                userEmail
            );
            return ResponseEntity.ok(session);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(@RequestBody String payload, @RequestHeader("Stripe-Signature") String sigHeader) {
        try {
            stripeService.handleWebhook(payload, sigHeader);
            return ResponseEntity.ok("Webhook procesado correctamente");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error procesando webhook: " + e.getMessage());
        }
    }
}

