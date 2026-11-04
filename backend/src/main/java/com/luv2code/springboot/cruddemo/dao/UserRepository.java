package com.luv2code.springboot.cruddemo.dao;

import com.luv2code.springboot.cruddemo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByFirebaseUid(String firebaseUid);
}
