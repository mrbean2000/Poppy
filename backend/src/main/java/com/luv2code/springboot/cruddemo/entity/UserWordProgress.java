package com.luv2code.springboot.cruddemo.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_word_progress", uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_word_progress", columnNames = {"user_id", "word"})
})
public class UserWordProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String word;

    @Column(name = "status_level", nullable = false)
    private Integer statusLevel = 1;

    @Column(name = "lookup_count", nullable = false)
    private Integer lookupCount = 0;

    @Column(name = "is_favorite", nullable = false)
    private boolean favorite = false;

    @Column(name = "last_lookup_at", nullable = false)
    private LocalDateTime lastLookupAt;

    public UserWordProgress() {
    }

    public UserWordProgress(Long userId, String word) {
        this.userId = userId;
        this.word = word;
        this.lastLookupAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public String getWord() {
        return word;
    }

    public Integer getStatusLevel() {
        return statusLevel;
    }

    public void setStatusLevel(Integer statusLevel) {
        this.statusLevel = statusLevel;
    }

    public Integer getLookupCount() {
        return lookupCount;
    }

    public void setLookupCount(Integer lookupCount) {
        this.lookupCount = lookupCount;
    }

    public boolean isFavorite() {
        return favorite;
    }

    public void setFavorite(boolean favorite) {
        this.favorite = favorite;
    }

    public LocalDateTime getLastLookupAt() {
        return lastLookupAt;
    }

    public void setLastLookupAt(LocalDateTime lastLookupAt) {
        this.lastLookupAt = lastLookupAt;
    }
}