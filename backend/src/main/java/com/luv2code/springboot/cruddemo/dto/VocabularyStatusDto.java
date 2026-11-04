package com.luv2code.springboot.cruddemo.dto;

import java.util.List;

public record VocabularyStatusDto(
        Long userId,
        String word,
        String pinyin,
        List<String> definitions,
        Integer statusLevel,
        Integer lookupCount,
        boolean favorite
) {
}