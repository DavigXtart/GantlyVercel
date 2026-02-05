package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.dto.UserProfileDtos;
import com.alvaro.psicoapp.service.CurrentUserService;
import com.alvaro.psicoapp.service.UserProfileService;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;

@RestController
@RequestMapping("/api/profile")
public class UserProfileController {
    private final CurrentUserService currentUserService;
    private final UserProfileService userProfileService;

    public UserProfileController(CurrentUserService currentUserService, UserProfileService userProfileService) {
        this.currentUserService = currentUserService;
        this.userProfileService = userProfileService;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<UserProfileDtos.UserProfileDto> getMe(Principal principal) {
        return ResponseEntity.ok(userProfileService.getMe(currentUserService.getCurrentUser(principal)));
    }

    @GetMapping("/my-psychologist")
    @Transactional(readOnly = true)
    public ResponseEntity<UserProfileDtos.MyPsychologistResponse> myPsychologist(Principal principal) {
        return ResponseEntity.ok(userProfileService.myPsychologist(currentUserService.getCurrentUser(principal)));
    }

    @PostMapping("/select-psychologist")
    @Transactional
    public ResponseEntity<UserProfileDtos.SelectPsychologistResponse> selectPsychologist(Principal principal, @RequestBody UserProfileDtos.SelectPsychologistRequest req) {
        return ResponseEntity.ok(userProfileService.selectPsychologist(currentUserService.getCurrentUser(principal), req));
    }

    @GetMapping("/psychologist/{psychologistId}")
    @Transactional(readOnly = true)
    public ResponseEntity<UserProfileDtos.PsychologistProfileDetailDto> getPsychologistProfile(Principal principal, @PathVariable Long psychologistId) {
        return ResponseEntity.ok(userProfileService.getPsychologistProfile(currentUserService.getCurrentUser(principal), psychologistId));
    }

    @PutMapping
    @Transactional
    public ResponseEntity<Void> updateProfile(Principal principal, @RequestBody UserProfileDtos.UpdateProfileRequest req) {
        userProfileService.updateProfile(currentUserService.getCurrentUser(principal), req);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/avatar")
    public ResponseEntity<UserProfileDtos.AvatarResponse> uploadAvatar(Principal principal, @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(userProfileService.uploadAvatar(currentUserService.getCurrentUser(principal), file));
    }
}
