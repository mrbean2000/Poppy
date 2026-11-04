package com.luv2code.springboot.cruddemo.service;

import com.luv2code.springboot.cruddemo.dto.VocabularyStatusDto;
import com.luv2code.springboot.cruddemo.entity.UserWordProgress;

import java.util.List;
import java.util.Map;

public interface VocabularyProgressService {
    List<VocabularyStatusDto> getVocabulary(Long userId);

    VocabularyStatusDto recordLookup(Long userId, String word);

    VocabularyStatusDto updateStatus(Long userId, String word, int statusLevel);

    VocabularyStatusDto updateFavorite(Long userId, String word, boolean favorite);

    Map<String, Integer> getStatusLevels(Long userId, List<String> words);

    UserWordProgress getOrCreate(Long userId, String word);
}