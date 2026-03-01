package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.service.JitsiService;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/jitsi")
public class JitsiController {
    private final JitsiService jitsiService;

    public JitsiController(JitsiService jitsiService) {
        this.jitsiService = jitsiService;
    }

    @GetMapping("/room-info")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getRoomInfo(Principal principal, @RequestParam @NotBlank String otherUserEmail) {
        return ResponseEntity.ok(jitsiService.getRoomInfo(principal.getName(), otherUserEmail));
    }
}
