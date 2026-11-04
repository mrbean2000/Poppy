package com.luv2code.springboot.cruddemo.service;

import com.luv2code.springboot.cruddemo.dto.MandarinDictionaryEntryDto;

public interface DictionaryService {
    MandarinDictionaryEntryDto findByWord(String word);
}
