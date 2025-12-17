package com.alvaro.psicoapp.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "psychologist_profiles")
public class PsychologistProfileEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private UserEntity user;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(columnDefinition = "TEXT")
    private String education; // JSON array: [{"institution": "...", "degree": "...", "field": "...", "startDate": "...", "endDate": "..."}]

    @Column(columnDefinition = "TEXT")
    private String certifications; // JSON array: [{"name": "...", "issuer": "...", "date": "...", "credentialId": "..."}]

    @Column(columnDefinition = "TEXT")
    private String interests; // JSON array: ["interés1", "interés2", ...]

    @Column(columnDefinition = "TEXT")
    private String specializations; // JSON array: ["especialización1", "especialización2", ...]

    @Column(columnDefinition = "TEXT")
    private String experience; // JSON array: [{"title": "...", "company": "...", "description": "...", "startDate": "...", "endDate": "..."}]

    @Column(columnDefinition = "TEXT")
    private String languages; // JSON array: [{"language": "...", "level": "..."}]

    @Column(name = "linkedin_url", length = 500)
    private String linkedinUrl;

    @Column(length = 500)
    private String website;

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public UserEntity getUser() { return user; }
    public void setUser(UserEntity user) { this.user = user; }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
    public String getEducation() { return education; }
    public void setEducation(String education) { this.education = education; }
    public String getCertifications() { return certifications; }
    public void setCertifications(String certifications) { this.certifications = certifications; }
    public String getInterests() { return interests; }
    public void setInterests(String interests) { this.interests = interests; }
    public String getSpecializations() { return specializations; }
    public void setSpecializations(String specializations) { this.specializations = specializations; }
    public String getExperience() { return experience; }
    public void setExperience(String experience) { this.experience = experience; }
    public String getLanguages() { return languages; }
    public void setLanguages(String languages) { this.languages = languages; }
    public String getLinkedinUrl() { return linkedinUrl; }
    public void setLinkedinUrl(String linkedinUrl) { this.linkedinUrl = linkedinUrl; }
    public String getWebsite() { return website; }
    public void setWebsite(String website) { this.website = website; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}

