package com.alvaro.psicoapp.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    
    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseBody
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException e) {
        logger.warn("Argumento inválido: {}", e.getMessage());
        return ResponseEntity.badRequest()
            .body(createErrorResponse("VALIDATION_ERROR", e.getMessage()));
    }
    
    @ExceptionHandler(AuthenticationException.class)
    @ResponseBody
    public ResponseEntity<Map<String, Object>> handleAuthentication(AuthenticationException e) {
        logger.warn("Error de autenticación: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(createErrorResponse("AUTH_ERROR", "No autorizado"));
    }
    
    @ExceptionHandler(NoResourceFoundException.class)
    @ResponseBody
    public ResponseEntity<Map<String, Object>> handleNoResourceFound(NoResourceFoundException e) {
        logger.debug("Recurso no encontrado: {}", e.getResourcePath());
        String msg = "Recurso no encontrado: " + (e.getResourcePath() != null ? e.getResourcePath() : e.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(createErrorResponse("NOT_FOUND", msg));
    }
    
    @ExceptionHandler(Exception.class)
    @ResponseBody
    public ResponseEntity<Map<String, Object>> handleException(Exception e) {
        logger.error("Error inesperado", e);
        String msg = e.getMessage() != null ? e.getMessage() : "Error interno del servidor";
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(createErrorResponse("INTERNAL_ERROR", "Error interno del servidor"));
    }
    
    private Map<String, Object> createErrorResponse(String code, String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("error", code);
        response.put("message", message);
        response.put("timestamp", Instant.now().toString());
        return response;
    }
}

