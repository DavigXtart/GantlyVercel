package com.alvaro.psicoapp.domain;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "consent_requests")
public class ConsentRequestEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private UserEntity user;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "psychologist_id")
    private UserEntity psychologist;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "document_type_id")
    private ConsentDocumentTypeEntity documentType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ConsentRequestStatus status = ConsentRequestStatus.DRAFT;

    @Column(name = "place", length = 200)
    private String place;

    @Column(name = "sent_at")
    private Instant sentAt;

    @Column(name = "signed_at")
    private Instant signedAt;

    @Column(name = "signer_name", length = 200)
    private String signerName;

    @Lob
    @Column(name = "rendered_content", columnDefinition = "TEXT")
    private String renderedContent;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
        updatedAt = createdAt;
        if (status == null) status = ConsentRequestStatus.DRAFT;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public UserEntity getUser() { return user; }
    public void setUser(UserEntity user) { this.user = user; }
    public UserEntity getPsychologist() { return psychologist; }
    public void setPsychologist(UserEntity psychologist) { this.psychologist = psychologist; }
    public ConsentDocumentTypeEntity getDocumentType() { return documentType; }
    public void setDocumentType(ConsentDocumentTypeEntity documentType) { this.documentType = documentType; }
    public ConsentRequestStatus getStatus() { return status; }
    public void setStatus(ConsentRequestStatus status) { this.status = status; }
    public String getPlace() { return place; }
    public void setPlace(String place) { this.place = place; }
    public Instant getSentAt() { return sentAt; }
    public void setSentAt(Instant sentAt) { this.sentAt = sentAt; }
    public Instant getSignedAt() { return signedAt; }
    public void setSignedAt(Instant signedAt) { this.signedAt = signedAt; }
    public String getSignerName() { return signerName; }
    public void setSignerName(String signerName) { this.signerName = signerName; }
    public String getRenderedContent() { return renderedContent; }
    public void setRenderedContent(String renderedContent) { this.renderedContent = renderedContent; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
