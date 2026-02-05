package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.dto.AdminDtos;
import com.alvaro.psicoapp.service.AdminUserService;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {
    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @PostMapping("/role")
    @Transactional
    public ResponseEntity<Void> setRole(@RequestBody AdminDtos.SetRoleRequest req) {
        adminUserService.setRole(req);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/psychologists")
    public ResponseEntity<List<UserEntity>> listPsychologists() {
        return ResponseEntity.ok(adminUserService.listPsychologists());
    }

    @PostMapping("/assign")
    @Transactional
    public ResponseEntity<AdminDtos.AssignPsychologistResponse> assignPsychologist(@RequestBody AdminDtos.AssignPsychologistRequest req) {
        return ResponseEntity.ok(adminUserService.assignPsychologist(req));
    }

    @DeleteMapping("/assign/{userId}")
    @Transactional
    public ResponseEntity<AdminDtos.UnassignPsychologistResponse> unassignPsychologist(@PathVariable Long userId) {
        return ResponseEntity.ok(adminUserService.unassignPsychologist(userId));
    }
}


