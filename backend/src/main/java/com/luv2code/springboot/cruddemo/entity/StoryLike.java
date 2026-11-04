package com.luv2code.springboot.cruddemo.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name="story_like")
public class StoryLike {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="id")
    private int id;

//    @Column(name = "user_id", nullable = false)
//    private Long userId;

    @Column(name = "post_id", nullable = false)
    private int postId;

    @Column(name ="liked", nullable = false)
    private boolean like;

    private LocalDateTime createdAt = LocalDateTime.now();

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public int getPostId() {
        return postId;
    }

    public void setPostId(int postId) {
        this.postId = postId;
    }

    public boolean getLike() {
        return like;
    }

    public void setLike(boolean like) {
        this.like = like;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
