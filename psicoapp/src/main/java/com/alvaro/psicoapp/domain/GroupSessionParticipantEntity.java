package com.alvaro.psicoapp.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "group_session_participants",
       uniqueConstraints = @UniqueConstraint(columnNames = {"group_session_id", "user_id"}))
public class GroupSessionParticipantEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "group_session_id")
    private GroupSessionEntity groupSession;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id")
    private UserEntity user;

    @Column(name = "joined_at", nullable = false)
    private Instant joinedAt = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public GroupSessionEntity getGroupSession() { return groupSession; }
    public void setGroupSession(GroupSessionEntity groupSession) { this.groupSession = groupSession; }
    public UserEntity getUser() { return user; }
    public void setUser(UserEntity user) { this.user = user; }
    public Instant getJoinedAt() { return joinedAt; }
    public void setJoinedAt(Instant joinedAt) { this.joinedAt = joinedAt; }
}
