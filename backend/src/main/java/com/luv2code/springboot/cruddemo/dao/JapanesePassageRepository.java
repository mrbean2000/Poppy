package com.luv2code.springboot.cruddemo.dao;

import com.luv2code.springboot.cruddemo.entity.JapanesePassage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JapanesePassageRepository extends JpaRepository<JapanesePassage, Long> {
}
