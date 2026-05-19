package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.service.PublicClinicService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.format.DateTimeParseException;

@RestController
@RequestMapping("/api/public/clinic")
public class PublicClinicController {

    private final PublicClinicService publicClinicService;

    public PublicClinicController(PublicClinicService publicClinicService) {
        this.publicClinicService = publicClinicService;
    }

    @GetMapping("/{slug}")
    public ResponseEntity<?> getClinicInfo(@PathVariable String slug) {
        return ResponseEntity.ok(publicClinicService.getClinicPublicInfo(slug));
    }

    @GetMapping("/{slug}/available-slots")
    public ResponseEntity<?> getAvailableSlots(@PathVariable String slug,
                                                @RequestParam String from,
                                                @RequestParam String to,
                                                @RequestParam(required = false) Long psychologistId,
                                                @RequestParam(required = false) Long serviceId) {
        Instant fromI, toI;
        try {
            fromI = Instant.parse(from);
            toI = Instant.parse(to);
        } catch (DateTimeParseException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Formato de fecha invalido. Usa formato ISO-8601");
        }
        return ResponseEntity.ok(publicClinicService.getAvailableSlots(
                slug, fromI, toI, psychologistId, serviceId));
    }

    @PostMapping("/{slug}/request")
    public ResponseEntity<?> submitBookingRequest(@PathVariable String slug,
                                                   @RequestBody PublicClinicService.PublicBookingRequest req) {
        if (req == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body es obligatorio");
        }
        return ResponseEntity.ok(publicClinicService.submitBookingRequest(slug, req));
    }
}
