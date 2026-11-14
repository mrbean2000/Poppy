package com.luv2code.springboot.cruddemo.dao;

import com.luv2code.springboot.cruddemo.entity.UserPassageProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserPassageProgressRepository extends JpaRepository<UserPassageProgress, Long> {
    Optional<UserPassageProgress> findByUserIdAndTargetLanguageId(Long userId, Integer targetLanguageId);
}
