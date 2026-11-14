package com.luv2code.springboot.cruddemo.dto;

import java.util.List;

public record JapaneseDictionaryEntryDto(
        String id,
        List<String> writtenForms,
        List<String> readings,
        List<String> definitions,
        List<JapaneseDictionarySenseDto> senses
) {
}
