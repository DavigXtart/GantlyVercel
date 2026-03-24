package com.alvaro.psicoapp.domain;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "clinic_patient_documents")
public class ClinicPatientDocumentEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "company_id", nullable = false) private Long companyId;
    @Column(name = "patient_id", nullable = false) private Long patientId;
    @Column(name = "file_name", nullable = false, length = 500) private String fileName;
    @Column(name = "original_name", nullable = false, length = 255) private String originalName;
    @Column(name = "file_size") private Long fileSize;
    @Column(name = "uploaded_by_email", length = 255) private String uploadedByEmail;
    @Column(name = "uploaded_at", nullable = false, updatable = false) private Instant uploadedAt = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }
    public Long getPatientId() { return patientId; }
    public void setPatientId(Long patientId) { this.patientId = patientId; }
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public String getOriginalName() { return originalName; }
    public void setOriginalName(String originalName) { this.originalName = originalName; }
    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }
    public String getUploadedByEmail() { return uploadedByEmail; }
    public void setUploadedByEmail(String uploadedByEmail) { this.uploadedByEmail = uploadedByEmail; }
    public Instant getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(Instant uploadedAt) { this.uploadedAt = uploadedAt; }
}
