package com.alvaro.psicoapp.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(NoResourceFoundException.class)
    @ResponseBody
    public ResponseEntity<Map<String, String>> handleNoResourceFound(NoResourceFoundException e) {
        e.printStackTrace();
        String msg = "Recurso no encontrado: " + (e.getResourcePath() != null ? e.getResourcePath() : e.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(Map.of("error", "NoResourceFoundException", "message", msg));
    }
    
    @ExceptionHandler(Exception.class)
    @ResponseBody
    public ResponseEntity<Map<String, String>> handleException(Exception e) {
        e.printStackTrace();
        String msg = e.getMessage() != null ? e.getMessage() : "Error desconocido";
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(Map.of("error", e.getClass().getSimpleName(), "message", msg));
    }
}

