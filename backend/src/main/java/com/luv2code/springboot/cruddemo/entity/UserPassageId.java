package com.luv2code.springboot.cruddemo.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class UserPassageId implements Serializable {

    @Column(name = "user_id")
    private int userId;

    @Column(name = "passage_id")
    private int passageId;

    public UserPassageId() {
    }

    public UserPassageId(int userId, int passageId) {
        this.userId = userId;
        this.passageId = passageId;
    }

    public int getUserId() {
        return userId;
    }

    public int getPassageId() {
        return passageId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof UserPassageId that)) return false;
        return userId == that.userId && passageId == that.passageId;
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, passageId);
    }
}
