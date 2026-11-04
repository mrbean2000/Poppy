package com.luv2code.springboot.cruddemo.dao;

import com.luv2code.springboot.cruddemo.entity.UserLoginStreak;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserLoginStreakRepository extends JpaRepository<UserLoginStreak, Integer> {
    Optional<UserLoginStreak> findByFirebaseUid(String firebaseUid);
}
