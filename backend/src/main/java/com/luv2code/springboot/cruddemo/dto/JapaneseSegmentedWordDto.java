package com.luv2code.springboot.cruddemo.dto;

public record JapaneseSegmentedWordDto(String word, String furigana, Integer statusLevel) {
    public JapaneseSegmentedWordDto(String word, String furigana) {
        this(word, furigana, null);
    }
}
