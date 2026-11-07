package com.luv2code.springboot.cruddemo.dao;

import com.luv2code.springboot.cruddemo.entity.UserPassageCompletion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;

public interface UserPassageCompletionRepository extends JpaRepository<UserPassageCompletion, Long> {
    long countByUserIdAndCompletedAtGreaterThanEqualAndCompletedAtLessThan(
            Integer userId, LocalDateTime start, LocalDateTime end);
}
