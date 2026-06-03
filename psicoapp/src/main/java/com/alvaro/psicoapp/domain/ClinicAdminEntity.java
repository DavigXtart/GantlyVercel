package com.alvaro.psicoapp.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "clinic_admins")
public class ClinicAdminEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private CompanyEntity company;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private UserEntity user;

    @Column(length = 20, nullable = false)
    private String role = "ADMIN"; // OWNER, ADMIN, VIEWER

    @Column(name = "invited_by_email", length = 255)
    private String invitedByEmail;

    @Column(name = "invited_at", nullable = false)
    private Instant invitedAt = Instant.now();

    @Column(name = "accepted_at")
    private Instant acceptedAt;

    @Column(length = 20, nullable = false)
    private String status = "INVITED"; // INVITED, ACTIVE, DEACTIVATED

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public CompanyEntity getCompany() { return company; }
    public void setCompany(CompanyEntity company) { this.company = company; }
    public UserEntity getUser() { return user; }
    public void setUser(UserEntity user) { this.user = user; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getInvitedByEmail() { return invitedByEmail; }
    public void setInvitedByEmail(String invitedByEmail) { this.invitedByEmail = invitedByEmail; }
    public Instant getInvitedAt() { return invitedAt; }
    public void setInvitedAt(Instant invitedAt) { this.invitedAt = invitedAt; }
    public Instant getAcceptedAt() { return acceptedAt; }
    public void setAcceptedAt(Instant acceptedAt) { this.acceptedAt = acceptedAt; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
