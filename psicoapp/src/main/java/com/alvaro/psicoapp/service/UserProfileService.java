package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.RoleConstants;
import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.dto.UserProfileDtos;
import com.alvaro.psicoapp.repository.*;
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
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class UserProfileService {
    private final UserRepository userRepository;
    private final UserPsychologistRepository userPsychologistRepository;
    private final PsychologistProfileRepository psychologistProfileRepository;
    private final DailyMoodEntryRepository dailyMoodEntryRepository;
    private final UserAnswerRepository userAnswerRepository;
    private final AppointmentRepository appointmentRepository;
    private final TaskRepository taskRepository;
    private final EvaluationTestResultRepository evaluationTestResultRepository;
    private final PatientDataRetentionService patientDataRetentionService;
    private final AuditService auditService;

    public UserProfileService(UserRepository userRepository, UserPsychologistRepository userPsychologistRepository,
                              PsychologistProfileRepository psychologistProfileRepository,
                              DailyMoodEntryRepository dailyMoodEntryRepository,
                              UserAnswerRepository userAnswerRepository,
                              AppointmentRepository appointmentRepository,
                              TaskRepository taskRepository,
                              EvaluationTestResultRepository evaluationTestResultRepository,
                              PatientDataRetentionService patientDataRetentionService,
                              AuditService auditService) {
        this.userRepository = userRepository;
        this.userPsychologistRepository = userPsychologistRepository;
        this.psychologistProfileRepository = psychologistProfileRepository;
        this.dailyMoodEntryRepository = dailyMoodEntryRepository;
        this.userAnswerRepository = userAnswerRepository;
        this.appointmentRepository = appointmentRepository;
        this.taskRepository = taskRepository;
        this.evaluationTestResultRepository = evaluationTestResultRepository;
        this.patientDataRetentionService = patientDataRetentionService;
        this.auditService = auditService;
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
                user.getBirthDate(),
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

            userPsychologistRepository.delete(existingRel.get());
            userPsychologistRepository.flush();
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

    @Transactional
    public UserProfileDtos.UseReferralCodeResponse useReferralCode(UserEntity user, UserProfileDtos.UseReferralCodeRequest req) {
        var existingRel = userPsychologistRepository.findByUserId(user.getId());
        if (existingRel.isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ya tienes un psicólogo asignado");
        }
        String referralCode = req.referralCode();
        if (referralCode == null || referralCode.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se proporcionó el código de referencia");
        }
        String code = referralCode.trim().toLowerCase().replaceAll("[^a-z0-9-]", "");
        UserEntity psychologist = userRepository.findByReferralCode(code)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Código de referencia no válido"));
        if (!RoleConstants.PSYCHOLOGIST.equals(psychologist.getRole())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El código de referencia no pertenece a un psicólogo");
        }
        if (user.getId() == null || psychologist.getId() == null) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "IDs inválidos");
        }
        int rowsAffected = userPsychologistRepository.insertRelation(user.getId(), psychologist.getId());
        if (rowsAffected == 0) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "No se pudo crear la relación");
        }
        return new UserProfileDtos.UseReferralCodeResponse(true, "Te has unido correctamente a la consulta de " + psychologist.getName());
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
        if (req.birthDate() != null) {
            user.setBirthDate(req.birthDate());
            user.setAge((int) ChronoUnit.YEARS.between(req.birthDate(), LocalDate.now()));
        }
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

    @Transactional(readOnly = true)
    public Map<String, Object> exportUserData(UserEntity user) {
        auditService.logDataExport(user.getId(), user.getRole(), user.getId(), "RGPD_SELF_EXPORT", "JSON");

        Map<String, Object> data = new LinkedHashMap<>();

        // Profile
        Map<String, Object> profile = new LinkedHashMap<>();
        profile.put("name", user.getName());
        profile.put("email", user.getEmail());
        profile.put("gender", user.getGender());
        profile.put("age", user.getAge());
        profile.put("birthDate", user.getBirthDate());
        profile.put("createdAt", user.getCreatedAt());
        data.put("profile", profile);

        // Mood entries
        var moods = dailyMoodEntryRepository.findByUser_IdOrderByEntryDateDesc(user.getId());
        List<Map<String, Object>> moodList = new ArrayList<>();
        for (var mood : moods) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("date", mood.getEntryDate());
            m.put("moodRating", mood.getMoodRating());
            m.put("emotions", mood.getEmotions());
            m.put("activities", mood.getActivities());
            m.put("companions", mood.getCompanions());
            m.put("location", mood.getLocation());
            m.put("notes", mood.getNotes());
            moodList.add(m);
        }
        data.put("moodEntries", moodList);

        // Appointments
        var appointments = appointmentRepository.findByUser_IdOrderByStartTimeAsc(user.getId());
        List<Map<String, Object>> apptList = new ArrayList<>();
        for (var appt : appointments) {
            Map<String, Object> a = new LinkedHashMap<>();
            a.put("startTime", appt.getStartTime());
            a.put("endTime", appt.getEndTime());
            a.put("status", appt.getStatus());
            apptList.add(a);
        }
        data.put("appointments", apptList);

        // Tasks
        var tasks = taskRepository.findByUser_IdOrderByCreatedAtDesc(user.getId());
        List<Map<String, Object>> taskList = new ArrayList<>();
        for (var task : tasks) {
            Map<String, Object> t = new LinkedHashMap<>();
            t.put("title", task.getTitle());
            t.put("description", task.getDescription());
            t.put("completed", task.getCompletedAt() != null);
            t.put("completedAt", task.getCompletedAt());
            t.put("createdAt", task.getCreatedAt());
            taskList.add(t);
        }
        data.put("tasks", taskList);

        // Evaluation test results
        var evalResults = evaluationTestResultRepository.findByUser_IdOrderByCompletedAtDesc(user.getId());
        List<Map<String, Object>> evalList = new ArrayList<>();
        for (var r : evalResults) {
            Map<String, Object> e = new LinkedHashMap<>();
            e.put("testName", r.getTest() != null ? r.getTest().getTitle() : null);
            e.put("score", r.getScore());
            e.put("level", r.getLevel());
            e.put("completedAt", r.getCompletedAt());
            evalList.add(e);
        }
        data.put("evaluationResults", evalList);

        // Test answers
        var answers = userAnswerRepository.findByUser(user);
        List<Map<String, Object>> answerList = new ArrayList<>();
        for (var ua : answers) {
            Map<String, Object> ans = new LinkedHashMap<>();
            ans.put("question", ua.getQuestion() != null ? ua.getQuestion().getText() : null);
            ans.put("answer", ua.getAnswer() != null ? ua.getAnswer().getText() : null);
            ans.put("numericValue", ua.getNumericValue());
            ans.put("textValue", ua.getTextValue());
            answerList.add(ans);
        }
        data.put("testAnswers", answerList);

        return data;
    }

    @Transactional
    public void deleteAccount(UserEntity user) {
        if (!RoleConstants.USER.equals(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo usuarios pueden eliminar su cuenta desde aquí");
        }
        patientDataRetentionService.eraseOneUserInNewTx(user.getId());
    }
}
