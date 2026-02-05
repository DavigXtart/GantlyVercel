package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.RoleConstants;
import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.dto.AdminDtos;
import com.alvaro.psicoapp.repository.UserPsychologistRepository;
import com.alvaro.psicoapp.repository.UserRepository;
import jakarta.persistence.EntityManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class AdminUserService {
    private static final Logger logger = LoggerFactory.getLogger(AdminUserService.class);

    private final UserRepository userRepository;
    private final UserPsychologistRepository userPsychologistRepository;
    private final EntityManager entityManager;

    public AdminUserService(UserRepository userRepository,
                            UserPsychologistRepository userPsychologistRepository,
                            EntityManager entityManager) {
        this.userRepository = userRepository;
        this.userPsychologistRepository = userPsychologistRepository;
        this.entityManager = entityManager;
    }

    @Transactional
    public void setRole(AdminDtos.SetRoleRequest req) {
        if (req == null || req.userId() == null || req.role() == null) {
            throw new IllegalArgumentException("userId y role son obligatorios");
        }
        UserEntity u = userRepository.findById(req.userId())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no existe"));
        u.setRole(req.role());
        userRepository.save(u);
    }

    @Transactional(readOnly = true)
    public List<UserEntity> listPsychologists() {
        return userRepository.findByRole(RoleConstants.PSYCHOLOGIST);
    }

    @Transactional
    public AdminDtos.AssignPsychologistResponse assignPsychologist(AdminDtos.AssignPsychologistRequest req) {
        if (req == null || req.userId() == null || req.psychologistId() == null) {
            throw new IllegalArgumentException("Faltan userId o psychologistId");
        }
        Long userId = req.userId();
        Long psychologistId = req.psychologistId();

        if (userId.equals(psychologistId)) {
            throw new IllegalArgumentException("No puede asignarse a sí mismo");
        }

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no existe"));
        UserEntity psych = userRepository.findById(psychologistId)
                .orElseThrow(() -> new IllegalArgumentException("Psicólogo no existe"));

        if (!RoleConstants.PSYCHOLOGIST.equals(psych.getRole())) {
            throw new IllegalArgumentException("El destino no tiene rol PSYCHOLOGIST");
        }
        if (!RoleConstants.USER.equals(user.getRole())) {
            throw new IllegalArgumentException("Solo se pueden asignar usuarios con rol USER");
        }

        try {
            // Eliminar relación existente si existe
            userPsychologistRepository.deleteByUserId(userId);

            // Insertar nueva relación
            int inserted = userPsychologistRepository.insertRelation(userId, psychologistId);
            if (inserted == 0) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "No se pudo insertar la relación");
            }

            // Limpiar el caché de entidades para asegurar que la siguiente consulta lea de la BD
            entityManager.clear();

            // Verificar que se guardó correctamente
            var verify = userPsychologistRepository.findByUserId(userId);
            if (verify.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "La relación no se guardó correctamente");
            }

            return new AdminDtos.AssignPsychologistResponse(true, verify.get().getUserId(), verify.get().getPsychologist().getId());
        } catch (DataIntegrityViolationException e) {
            logger.error("Error de integridad al asignar psicólogo", e);
            String causeMsg = e.getMostSpecificCause() != null ? e.getMostSpecificCause().getMessage() : null;
            String errorMsg = causeMsg != null ? causeMsg : (e.getMessage() != null ? e.getMessage() : "Error de integridad");
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Conflicto de integridad: " + errorMsg);
        }
    }

    @Transactional
    public AdminDtos.UnassignPsychologistResponse unassignPsychologist(Long userId) {
        if (userId == null) {
            throw new IllegalArgumentException("userId es obligatorio");
        }
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no existe"));
        if (!RoleConstants.USER.equals(user.getRole())) {
            throw new IllegalArgumentException("Solo se pueden desvincular usuarios con rol USER");
        }

        int deleted = userPsychologistRepository.deleteByUserId(userId);
        entityManager.clear();
        return new AdminDtos.UnassignPsychologistResponse(true, userId, deleted > 0);
    }
}

