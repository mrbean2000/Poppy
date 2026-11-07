package com.luv2code.springboot.cruddemo.dao;

import com.luv2code.springboot.cruddemo.entity.UserPassage;
import com.luv2code.springboot.cruddemo.entity.UserPassageId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserPassageRepository extends JpaRepository<UserPassage, UserPassageId> {
}
