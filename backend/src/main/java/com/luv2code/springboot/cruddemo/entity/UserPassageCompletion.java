package com.luv2code.springboot.cruddemo.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_passage_completion")
public class UserPassageCompletion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "passage_id", nullable = false)
    private Long passageId;

    @Column(name = "completed_at", nullable = false)
    private LocalDateTime completedAt;

    public UserPassageCompletion() {
    }

    public UserPassageCompletion(Integer userId, Long passageId, LocalDateTime completedAt) {
        this.userId = userId;
        this.passageId = passageId;
        this.completedAt = completedAt;
    }

    public Long getId() { return id; }
    public Integer getUserId() { return userId; }
    public Long getPassageId() { return passageId; }
    public LocalDateTime getCompletedAt() { return completedAt; }
}
