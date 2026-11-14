package com.luv2code.springboot.cruddemo.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_passage_progress")
public class UserPassageProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "last_read_passage_id")
    private Long lastReadPassageId;

    @Column(name = "target_language_id", nullable = false)
    private Integer targetLanguageId;

    @Column(name = "last_read_at")
    private LocalDateTime lastReadAt;

    // Constructors, Getters, and Setters
    public UserPassageProgress() {}

    public UserPassageProgress(Long userId, Integer targetLanguageId) {
        this.userId = userId;
        this.targetLanguageId = targetLanguageId;
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getLastReadPassageId() { return lastReadPassageId; }
    public void setLastReadPassageId(Long lastReadPassageId) { this.lastReadPassageId = lastReadPassageId; }
    public Integer getTargetLanguageId() { return targetLanguageId; }
    public LocalDateTime getLastReadAt() { return lastReadAt; }
    public void setLastReadAt(LocalDateTime lastReadAt) { this.lastReadAt = lastReadAt; }
}
