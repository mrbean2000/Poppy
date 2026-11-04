package com.luv2code.springboot.cruddemo.dao;

import com.luv2code.springboot.cruddemo.dto.PassageTitleOnlyDto;
import com.luv2code.springboot.cruddemo.entity.Passage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface PassageRepository extends JpaRepository<Passage, Integer> {

    @Query("SELECT new com.luv2code.springboot.cruddemo.dto.PassageTitleOnlyDto(p.id, p.title, p.imageUrl) FROM Passage p")
    List<PassageTitleOnlyDto> findAllTitleOnly();}
