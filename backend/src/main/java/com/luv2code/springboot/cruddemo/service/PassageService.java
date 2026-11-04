package com.luv2code.springboot.cruddemo.service;

import com.luv2code.springboot.cruddemo.dto.PassageDto;
import com.luv2code.springboot.cruddemo.dto.PassageOnlyDto;
import com.luv2code.springboot.cruddemo.dto.PassageTitleOnlyDto;
import com.luv2code.springboot.cruddemo.dto.SegmentedWordDto;
import com.luv2code.springboot.cruddemo.entity.Passage;

import java.util.List;

public interface PassageService {
//    List<Passage> findAll();

    List<PassageTitleOnlyDto> findAllTitleOnly();

    PassageOnlyDto findById(int theId);
    List<String> getSegmentedPassageBy(int theId);
    List<SegmentedWordDto> getSegmentedPassageWithPinyin(int theId);
    List<SegmentedWordDto> getSegmentedPassageWithPinyin(int theId, Long userId);

    Passage create(PassageDto thePassage);

    Passage update(PassageDto thePassage);

    void deleteById(int theId);
}