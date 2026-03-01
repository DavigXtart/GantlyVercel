package com.alvaro.psicoapp.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "group_sessions")
public class GroupSessionEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 1000)
    private String description;

    @ManyToOne(optional = false)
    @JoinColumn(name = "psychologist_id")
    private UserEntity psychologist;

    @Column(name = "max_participants", nullable = false)
    private Integer maxParticipants = 10;

    @Column(name = "start_time", nullable = false)
    private Instant startTime;

    @Column(name = "end_time", nullable = false)
    private Instant endTime;

    @Column(length = 20, nullable = false)
    private String status = "SCHEDULED";

    @Column(name = "jitsi_room_name", length = 100)
    private String jitsiRoomName;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public UserEntity getPsychologist() { return psychologist; }
    public void setPsychologist(UserEntity psychologist) { this.psychologist = psychologist; }
    public Integer getMaxParticipants() { return maxParticipants; }
    public void setMaxParticipants(Integer maxParticipants) { this.maxParticipants = maxParticipants; }
    public Instant getStartTime() { return startTime; }
    public void setStartTime(Instant startTime) { this.startTime = startTime; }
    public Instant getEndTime() { return endTime; }
    public void setEndTime(Instant endTime) { this.endTime = endTime; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getJitsiRoomName() { return jitsiRoomName; }
    public void setJitsiRoomName(String jitsiRoomName) { this.jitsiRoomName = jitsiRoomName; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
