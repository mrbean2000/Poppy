package com.luv2code.springboot.cruddemo.dto;

import java.util.List;

public record DictionaryEntryDto(
        String traditional,
        String simplified,
        String pinyin,
        List<String> definitions
) {
}
