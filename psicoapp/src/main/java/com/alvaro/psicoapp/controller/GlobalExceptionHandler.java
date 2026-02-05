package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.dto.ErrorDtos;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.time.Instant;
import java.util.stream.Collectors;

@ControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseBody
    public ResponseEntity<ErrorDtos.ErrorResponse> handleValidation(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
            .map(err -> err.getField() + ": " + (err.getDefaultMessage() != null ? err.getDefaultMessage() : "inválido"))
            .collect(Collectors.joining("; "));
        logger.warn("Validación fallida: {}", message);
        return ResponseEntity.badRequest().body(createErrorResponse("VALIDATION_ERROR", message));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseBody
    public ResponseEntity<ErrorDtos.ErrorResponse> handleIllegalArgument(IllegalArgumentException e) {
        logger.warn("Argumento inválido: {}", e.getMessage());
        return ResponseEntity.badRequest().body(createErrorResponse("VALIDATION_ERROR", e.getMessage()));
    }
    
    @ExceptionHandler(AuthenticationException.class)
    @ResponseBody
    public ResponseEntity<ErrorDtos.ErrorResponse> handleAuthentication(AuthenticationException e) {
        logger.warn("Error de autenticación: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(createErrorResponse("AUTH_ERROR", "No autorizado"));
    }
    
    @ExceptionHandler(ResponseStatusException.class)
    @ResponseBody
    public ResponseEntity<ErrorDtos.ErrorResponse> handleResponseStatus(ResponseStatusException e) {
        String message = e.getReason() != null ? e.getReason() : "Error";
        logger.warn("ResponseStatus: {} - {}", e.getStatusCode(), message);
        return ResponseEntity.status(e.getStatusCode()).body(createErrorResponse("ERROR", message));
    }

    @ExceptionHandler(NoResourceFoundException.class)
    @ResponseBody
    public ResponseEntity<ErrorDtos.ErrorResponse> handleNoResourceFound(NoResourceFoundException e) {
        logger.debug("Recurso no encontrado: {}", e.getResourcePath());
        String msg = "Recurso no encontrado: " + (e.getResourcePath() != null ? e.getResourcePath() : e.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse("NOT_FOUND", msg));
    }
    
    @ExceptionHandler(Exception.class)
    @ResponseBody
    public ResponseEntity<ErrorDtos.ErrorResponse> handleException(Exception e) {
        logger.error("Error inesperado", e);
        String msg = e.getMessage() != null ? e.getMessage() : "Error interno del servidor";
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(createErrorResponse("INTERNAL_ERROR", msg));
    }
    
    private ErrorDtos.ErrorResponse createErrorResponse(String code, String message) {
        return new ErrorDtos.ErrorResponse(code, message, Instant.now().toString());
    }
}

