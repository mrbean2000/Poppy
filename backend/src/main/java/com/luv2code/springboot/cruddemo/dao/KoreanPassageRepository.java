package com.luv2code.springboot.cruddemo.dao;

import com.luv2code.springboot.cruddemo.entity.KoreanPassage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface KoreanPassageRepository extends JpaRepository<KoreanPassage, Long> {
}
