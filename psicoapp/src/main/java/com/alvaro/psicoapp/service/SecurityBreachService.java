package com.alvaro.psicoapp.service;

import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class SecurityBreachService {
    private static final Logger logger = LoggerFactory.getLogger(SecurityBreachService.class);

    public void logPotentialBreach(String type, String details, String ipAddress) {
        logger.error("SECURITY_BREACH type={} details={} ip={} timestamp={}",
            type, details, ipAddress, Instant.now());
    }
}
