package com.luv2code.springboot.cruddemo.service;

import com.luv2code.springboot.cruddemo.dto.VocabularyStatusDto;

import java.util.List;
import java.util.Map;

public interface VocabularyProgressService {
    List<VocabularyStatusDto> getVocabulary(Long userId, String language);

    VocabularyStatusDto recordLookup(Long userId, String word, String language);

    VocabularyStatusDto updateStatus(Long userId, String word, int statusLevel, String language);

    VocabularyStatusDto updateFavorite(Long userId, String word, boolean favorite, String language);

    Map<String, Integer> getStatusLevels(Long userId, List<String> words, String language);
}