package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.repository.UserPsychologistRepository;
import com.alvaro.psicoapp.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.HashMap;
import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api/psych")
public class PsychologistController {
    private final UserRepository userRepository;
    private final UserPsychologistRepository userPsychologistRepository;

    public PsychologistController(UserRepository userRepository, UserPsychologistRepository userPsychologistRepository) {
        this.userRepository = userRepository;
        this.userPsychologistRepository = userPsychologistRepository;
    }

    @GetMapping("/patients")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> myPatients(Principal principal) {
        var me = userRepository.findByEmail(principal.getName()).orElseThrow();
        if (!"PSYCHOLOGIST".equals(me.getRole())) return ResponseEntity.status(403).build();
        var rels = userPsychologistRepository.findByPsychologist_Id(me.getId());
        List<Map<String, Object>> out = new ArrayList<>();
        for (var r : rels) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", r.getUser().getId());
            m.put("name", r.getUser().getName());
            m.put("email", r.getUser().getEmail());
            m.put("avatarUrl", r.getUser().getAvatarUrl() != null ? r.getUser().getAvatarUrl() : "");
            out.add(m);
        }
        return ResponseEntity.ok(out);
    }

    // Nota: la asignación de usuarios a psicólogos solo la realiza el admin via /api/admin/users/assign
}


