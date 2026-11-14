package com.luv2code.springboot.cruddemo.dto;

import java.util.List;

public record JapaneseDictionarySenseDto(String category, List<String> meanings) {
}
