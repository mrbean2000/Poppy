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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "last_read_passage_id", nullable = false)
    private Passage lastReadPassage;

    @Column(name = "last_read_at")
    private LocalDateTime lastReadAt;

    // Constructors, Getters, and Setters
    public UserPassageProgress() {}

    public UserPassageProgress(Long userId, Passage lastReadPassage, LocalDateTime lastReadAt) {
        this.userId = userId;
        this.lastReadPassage = lastReadPassage;
        this.lastReadAt = lastReadAt;
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Passage getLastReadPassage() { return lastReadPassage; }
    public void setLastReadPassage(Passage lastReadPassage) { this.lastReadPassage = lastReadPassage; }
    public LocalDateTime getLastReadAt() { return lastReadAt; }
    public void setLastReadAt(LocalDateTime lastReadAt) { this.lastReadAt = lastReadAt; }
}
