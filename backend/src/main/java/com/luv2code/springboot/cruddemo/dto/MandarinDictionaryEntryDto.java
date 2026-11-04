package com.luv2code.springboot.cruddemo.dto;

import java.util.List;

public record MandarinDictionaryEntryDto(
        String traditional,
        String simplified,
        String pinyin,
        String formattedPinyin,
        List<String> definitions
) {
}
