package com.alvaro.psicoapp.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "task_files")
public class TaskFileEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "task_id")
    private TaskEntity task;

    @ManyToOne(optional = false)
    @JoinColumn(name = "uploader_user_id")
    private UserEntity uploader;

    @Column(name = "file_path", nullable = false, length = 1000)
    private String filePath;

    @Column(name = "original_name", nullable = false, length = 255)
    private String originalName;

    @Column(name = "content_type", length = 100)
    private String contentType;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "uploaded_at", nullable = false, updatable = false)
    private Instant uploadedAt = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public TaskEntity getTask() { return task; }
    public void setTask(TaskEntity task) { this.task = task; }
    public UserEntity getUploader() { return uploader; }
    public void setUploader(UserEntity uploader) { this.uploader = uploader; }
    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }
    public String getOriginalName() { return originalName; }
    public void setOriginalName(String originalName) { this.originalName = originalName; }
    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }
    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }
    public Instant getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(Instant uploadedAt) { this.uploadedAt = uploadedAt; }
}


