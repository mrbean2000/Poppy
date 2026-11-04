package com.luv2code.springboot.cruddemo.dto;

public record SegmentedWordDto(
        String word,
        String pinyin,
        Integer statusLevel
) {
}
