package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.RoleConstants;
import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.dto.UserProfileDtos;
import com.alvaro.psicoapp.repository.PsychologistProfileRepository;
import com.alvaro.psicoapp.repository.UserPsychologistRepository;
import com.alvaro.psicoapp.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class UserProfileService {
    private final UserRepository userRepository;
    private final UserPsychologistRepository userPsychologistRepository;
    private final PsychologistProfileRepository psychologistProfileRepository;

    public UserProfileService(UserRepository userRepository, UserPsychologistRepository userPsychologistRepository,
                              PsychologistProfileRepository psychologistProfileRepository) {
        this.userRepository = userRepository;
        this.userPsychologistRepository = userPsychologistRepository;
        this.psychologistProfileRepository = psychologistProfileRepository;
    }

    @Transactional(readOnly = true)
    public UserProfileDtos.UserProfileDto getMe(UserEntity user) {
        if (user == null) return null;
        return new UserProfileDtos.UserProfileDto(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getAvatarUrl(),
                user.getDarkMode(),
                user.getGender(),
                user.getAge(),
                user.getCreatedAt()
        );
    }

    @Transactional(readOnly = true)
    public UserProfileDtos.MyPsychologistResponse myPsychologist(UserEntity user) {
        var rel = userPsychologistRepository.findByUserId(user.getId());
        if (rel.isEmpty()) return new UserProfileDtos.MyPsychologistResponse("PENDING", null);
        var p = rel.get().getPsychologist();
        return new UserProfileDtos.MyPsychologistResponse("ASSIGNED",
                new UserProfileDtos.PsychologistSummary(p.getId(), p.getName(), p.getEmail(), p.getAvatarUrl() != null ? p.getAvatarUrl() : ""));
    }

    @Transactional
    public UserProfileDtos.SelectPsychologistResponse selectPsychologist(UserEntity user, UserProfileDtos.SelectPsychologistRequest req) {
        var existingRel = userPsychologistRepository.findByUserId(user.getId());
        if (existingRel.isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ya tienes un psicólogo asignado");
        }
        Long psychologistId = req.psychologistId();
        if (psychologistId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se proporcionó el ID del psicólogo");
        }
        UserEntity psychologist = userRepository.findById(psychologistId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Psicólogo no encontrado"));
        if (!RoleConstants.PSYCHOLOGIST.equals(psychologist.getRole())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El usuario seleccionado no es un psicólogo");
        }
        if (user.getId() == null || psychologist.getId() == null) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "IDs inválidos");
        }
        int rowsAffected = userPsychologistRepository.insertRelation(user.getId(), psychologist.getId());
        if (rowsAffected == 0) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "No se pudo crear la relación");
        }
        return new UserProfileDtos.SelectPsychologistResponse(true, "Psicólogo seleccionado correctamente");
    }

    @Transactional(readOnly = true)
    public UserProfileDtos.PsychologistProfileDetailDto getPsychologistProfile(UserEntity currentUser, Long psychologistId) {
        UserEntity psychologist = userRepository.findById(psychologistId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        if (!RoleConstants.PSYCHOLOGIST.equals(psychologist.getRole())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado");
        }
        if (!RoleConstants.USER.equals(currentUser.getRole())) {
            var rel = userPsychologistRepository.findByUserId(currentUser.getId());
            if (rel.isEmpty() || !rel.get().getPsychologist().getId().equals(psychologistId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Este psicólogo no está asignado a tu cuenta");
            }
        }
        var profileOpt = psychologistProfileRepository.findByUser_Id(psychologistId);
        if (profileOpt.isPresent()) {
            var profile = profileOpt.get();
            return new UserProfileDtos.PsychologistProfileDetailDto(
                    psychologist.getId(),
                    psychologist.getName(),
                    psychologist.getEmail(),
                    psychologist.getAvatarUrl(),
                    psychologist.getGender(),
                    psychologist.getAge(),
                    profile.getBio(),
                    profile.getEducation(),
                    profile.getCertifications(),
                    profile.getInterests(),
                    profile.getSpecializations(),
                    profile.getExperience(),
                    profile.getLanguages(),
                    profile.getLinkedinUrl(),
                    profile.getWebsite(),
                    profile.getUpdatedAt()
            );
        }
        return new UserProfileDtos.PsychologistProfileDetailDto(
                psychologist.getId(),
                psychologist.getName(),
                psychologist.getEmail(),
                psychologist.getAvatarUrl(),
                psychologist.getGender(),
                psychologist.getAge(),
                null, null, null, null, null, null, null, null, null, null
        );
    }

    @Transactional
    public void updateProfile(UserEntity user, UserProfileDtos.UpdateProfileRequest req) {
        if (req.name() != null) user.setName(req.name());
        if (req.darkMode() != null) user.setDarkMode(req.darkMode());
        if (req.gender() != null) user.setGender(req.gender());
        if (req.age() != null) user.setAge(req.age());
        userRepository.save(user);
    }

    @Transactional
    public UserProfileDtos.AvatarResponse uploadAvatar(UserEntity user, MultipartFile file) {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El archivo está vacío");
        }
        if (file.getContentType() == null || !file.getContentType().startsWith("image/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Solo se permiten archivos de imagen");
        }
        File uploadsDir = new File("uploads");
        if (!uploadsDir.exists() && !uploadsDir.mkdirs()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "No se pudo crear el directorio uploads");
        }
        File dir = new File(uploadsDir, "avatars");
        if (!dir.exists() && !dir.mkdirs()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "No se pudo crear el directorio uploads/avatars");
        }
        if (!dir.canWrite()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "No se tienen permisos de escritura");
        }
        String originalFilename = file.getOriginalFilename();
        String ext = StringUtils.getFilenameExtension(originalFilename);
        String name = UUID.randomUUID() + (ext != null ? ("." + ext) : "");
        File dest = new File(dir, name);
        File absoluteDest = dest.getAbsoluteFile();
        try {
            File parentDir = absoluteDest.getParentFile();
            if (parentDir != null && !parentDir.exists()) parentDir.mkdirs();
            Files.copy(file.getInputStream(), absoluteDest.toPath(), StandardCopyOption.REPLACE_EXISTING);
            if (!absoluteDest.exists() || !absoluteDest.canRead()) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "El archivo no se guardó correctamente");
            }
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error al escribir el archivo: " + e.getMessage());
        }
        String publicPath = "/uploads/avatars/" + name;
        user.setAvatarUrl(publicPath);
        userRepository.save(user);
        return new UserProfileDtos.AvatarResponse(publicPath);
    }
}
