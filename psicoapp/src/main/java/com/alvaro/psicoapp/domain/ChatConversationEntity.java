package com.alvaro.psicoapp.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "chat_conversations", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"psychologist_id", "user_id"})
})
public class ChatConversationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "psychologist_id", nullable = false)
    private Long psychologistId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "encryption_salt", nullable = false, length = 44)
    private String encryptionSalt;

    public ChatConversationEntity() {}

    public ChatConversationEntity(Long psychologistId, Long userId, String encryptionSalt) {
        this.psychologistId = psychologistId;
        this.userId = userId;
        this.encryptionSalt = encryptionSalt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getPsychologistId() { return psychologistId; }
    public void setPsychologistId(Long psychologistId) { this.psychologistId = psychologistId; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getEncryptionSalt() { return encryptionSalt; }
    public void setEncryptionSalt(String encryptionSalt) { this.encryptionSalt = encryptionSalt; }
}
