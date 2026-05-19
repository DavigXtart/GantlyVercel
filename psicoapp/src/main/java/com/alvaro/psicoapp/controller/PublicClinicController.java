package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.service.PublicClinicService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

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
        return ResponseEntity.ok(publicClinicService.getAvailableSlots(
                slug, Instant.parse(from), Instant.parse(to), psychologistId, serviceId));
    }

    @PostMapping("/{slug}/request")
    public ResponseEntity<?> submitBookingRequest(@PathVariable String slug,
                                                   @RequestBody PublicClinicService.PublicBookingRequest req) {
        return ResponseEntity.ok(publicClinicService.submitBookingRequest(slug, req));
    }
}
