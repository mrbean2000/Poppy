package com.luv2code.springboot.cruddemo.entity;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "user_chinese_passage")
public class UserPassage {

    @EmbeddedId
    private UserPassageId id;

    public UserPassage() {
    }

    public UserPassage(int userId, int passageId) {
        this.id = new UserPassageId(userId, passageId);
    }

    public UserPassageId getId() {
        return id;
    }
}
