package com.luv2code.springboot.cruddemo.dto;

import java.util.List;

public record JapaneseDictionaryResultDto(
        String requestedWord,
        String matchedWord,
        List<JapaneseDictionaryEntryDto> entries
) {
}
