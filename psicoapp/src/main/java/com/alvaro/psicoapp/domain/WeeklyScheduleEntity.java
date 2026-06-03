package com.alvaro.psicoapp.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "weekly_schedules", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"psychologist_id", "day_of_week"})
})
public class WeeklyScheduleEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "psychologist_id")
    private UserEntity psychologist;

    @Column(name = "day_of_week", nullable = false)
    private Integer dayOfWeek; // 0=Monday...6=Sunday

    @Column(name = "start_time_1", nullable = false, length = 5)
    private String startTime1; // "HH:mm"

    @Column(name = "end_time_1", nullable = false, length = 5)
    private String endTime1;

    @Column(name = "start_time_2", length = 5)
    private String startTime2; // nullable - afternoon block

    @Column(name = "end_time_2", length = 5)
    private String endTime2;

    @Column(nullable = false)
    private Boolean enabled = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public UserEntity getPsychologist() { return psychologist; }
    public void setPsychologist(UserEntity psychologist) { this.psychologist = psychologist; }
    public Integer getDayOfWeek() { return dayOfWeek; }
    public void setDayOfWeek(Integer dayOfWeek) { this.dayOfWeek = dayOfWeek; }
    public String getStartTime1() { return startTime1; }
    public void setStartTime1(String startTime1) { this.startTime1 = startTime1; }
    public String getEndTime1() { return endTime1; }
    public void setEndTime1(String endTime1) { this.endTime1 = endTime1; }
    public String getStartTime2() { return startTime2; }
    public void setStartTime2(String startTime2) { this.startTime2 = startTime2; }
    public String getEndTime2() { return endTime2; }
    public void setEndTime2(String endTime2) { this.endTime2 = endTime2; }
    public Boolean getEnabled() { return enabled; }
    public void setEnabled(Boolean enabled) { this.enabled = enabled; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
