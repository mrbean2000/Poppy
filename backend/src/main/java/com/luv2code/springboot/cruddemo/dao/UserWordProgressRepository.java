package com.luv2code.springboot.cruddemo.dao;

import com.luv2code.springboot.cruddemo.entity.UserWordProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserWordProgressRepository extends JpaRepository<UserWordProgress, Long> {
    Optional<UserWordProgress> findByUserIdAndWord(Long userId, String word);

    List<UserWordProgress> findAllByUserIdOrderByLastLookupAtDesc(Long userId);
}