package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.domain.RoleConstants;
import com.alvaro.psicoapp.domain.TaskEntity;
import com.alvaro.psicoapp.domain.TaskFileEntity;
import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.repository.ClinicPatientDocumentRepository;
import com.alvaro.psicoapp.repository.CompanyRepository;
import com.alvaro.psicoapp.repository.TaskFileRepository;
import com.alvaro.psicoapp.repository.TaskRepository;
import com.alvaro.psicoapp.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/files")
public class FileController {
    private static final Logger logger = LoggerFactory.getLogger(FileController.class);

    private final TaskFileRepository taskFileRepository;
    private final TaskRepository taskRepository;
    private final ClinicPatientDocumentRepository clinicPatientDocumentRepository;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;

    public FileController(TaskFileRepository taskFileRepository, TaskRepository taskRepository,
                          ClinicPatientDocumentRepository clinicPatientDocumentRepository,
                          CompanyRepository companyRepository, UserRepository userRepository) {
        this.taskFileRepository = taskFileRepository;
        this.taskRepository = taskRepository;
        this.clinicPatientDocumentRepository = clinicPatientDocumentRepository;
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/tasks/{filename}")
    public ResponseEntity<Resource> getTaskFile(Principal principal, @PathVariable String filename) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No autenticado");
        }
        String email = principal.getName();
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"));

        // Find the task file by matching the filename in the stored path
        String expectedPath = "/uploads/tasks/" + filename;
        List<TaskFileEntity> allFiles;
        if (RoleConstants.PSYCHOLOGIST.equals(user.getRole())) {
            // Get all files for tasks where user is the psychologist
            List<TaskEntity> tasks = taskRepository.findByPsychologist_IdOrderByCreatedAtDesc(user.getId());
            allFiles = tasks.stream()
                    .flatMap(t -> taskFileRepository.findByTask_Id(t.getId()).stream())
                    .toList();
        } else {
            allFiles = taskFileRepository.findByTask_User_Id(user.getId());
        }

        boolean hasAccess = allFiles.stream()
                .anyMatch(f -> expectedPath.equals(f.getFilePath()));

        if (!hasAccess) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes acceso a este archivo");
        }

        return serveFile("uploads/tasks", filename);
    }

    @GetMapping("/clinic-docs/{filename}")
    public ResponseEntity<Resource> getClinicDoc(Principal principal, @PathVariable String filename) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No autenticado");
        }
        String subject = principal.getName();

        // Clinic docs are accessed by company users (EMPRESA role)
        String companyEmail = subject.startsWith("company:") ? subject.substring("company:".length()) : subject;
        var company = companyRepository.findByEmail(companyEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "No autorizado"));

        // Verify the document belongs to this company
        String storedFileName = "clinic-docs/" + filename;
        if (!clinicPatientDocumentRepository.existsByCompanyIdAndFileName(company.getId(), storedFileName)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes acceso a este documento");
        }

        return serveFile("uploads/clinic-docs", filename);
    }

    private ResponseEntity<Resource> serveFile(String directory, String filename) {
        // Sanitize filename to prevent path traversal
        if (filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nombre de archivo no válido");
        }

        Path uploadsPath = Paths.get(directory).toAbsolutePath();
        if (!uploadsPath.toFile().exists()) {
            Path altPath = Paths.get("psicoapp", directory).toAbsolutePath();
            if (altPath.toFile().exists()) {
                uploadsPath = altPath;
            }
        }

        Path filePath = uploadsPath.resolve(filename).normalize();
        // Ensure the resolved path is still within the uploads directory
        if (!filePath.startsWith(uploadsPath)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nombre de archivo no válido");
        }

        try {
            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Archivo no encontrado");
            }

            String contentType = determineContentType(filename);
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);
        } catch (MalformedURLException e) {
            logger.error("Error al resolver archivo: {}", filename, e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error al leer el archivo");
        }
    }

    private String determineContentType(String filename) {
        String lower = filename.toLowerCase();
        if (lower.endsWith(".pdf")) return "application/pdf";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".gif")) return "image/gif";
        if (lower.endsWith(".doc")) return "application/msword";
        if (lower.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        if (lower.endsWith(".xls")) return "application/vnd.ms-excel";
        if (lower.endsWith(".xlsx")) return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        if (lower.endsWith(".txt")) return "text/plain";
        return "application/octet-stream";
    }
}
