package com.alvaro.psicoapp.domain;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.Instant;

@Entity
@Table(name = "daily_mood_entries", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "entry_date"})
})
public class DailyMoodEntryEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id")
    private UserEntity user;

    @Column(name = "entry_date", nullable = false)
    private LocalDate entryDate;

    @Column(name = "mood_rating", nullable = false)
    private Integer moodRating; // 1-5

    @Column(columnDefinition = "TEXT")
    private String emotions; // JSON array

    @Column(columnDefinition = "TEXT")
    private String activities; // JSON array

    @Column(columnDefinition = "TEXT")
    private String companions; // JSON array

    @Column(length = 100)
    private String location;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public UserEntity getUser() { return user; }
    public void setUser(UserEntity user) { this.user = user; }
    public LocalDate getEntryDate() { return entryDate; }
    public void setEntryDate(LocalDate entryDate) { this.entryDate = entryDate; }
    public Integer getMoodRating() { return moodRating; }
    public void setMoodRating(Integer moodRating) { this.moodRating = moodRating; }
    public String getEmotions() { return emotions; }
    public void setEmotions(String emotions) { this.emotions = emotions; }
    public String getActivities() { return activities; }
    public void setActivities(String activities) { this.activities = activities; }
    public String getCompanions() { return companions; }
    public void setCompanions(String companions) { this.companions = companions; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}

