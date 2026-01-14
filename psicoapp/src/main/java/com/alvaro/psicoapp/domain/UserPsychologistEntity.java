package com.alvaro.psicoapp.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "user_psychologist")
public class UserPsychologistEntity {
    @Id
    private Long userId;

    @OneToOne(optional = false, fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private UserEntity user;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "psychologist_id")
    private UserEntity psychologist;

    @Column(name = "assigned_at", nullable = false, updatable = false)
    private Instant assignedAt;

    @Column(name = "status", length = 20)
    private String status = "ACTIVE"; // ACTIVE o DISCHARGED

    @PrePersist
    protected void onCreate() {
        if (assignedAt == null) {
            assignedAt = Instant.now();
        }
        if (status == null) {
            status = "ACTIVE";
        }
    }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    
    public UserEntity getUser() { return user; }
    public void setUser(UserEntity user) { 
        this.user = user; 
        if (user != null && user.getId() != null) {
            this.userId = user.getId();
        }
    }
    
    public UserEntity getPsychologist() { return psychologist; }
    public void setPsychologist(UserEntity psychologist) { this.psychologist = psychologist; }
    
    public Instant getAssignedAt() { return assignedAt; }
    public void setAssignedAt(Instant assignedAt) { this.assignedAt = assignedAt; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
