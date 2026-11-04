package com.luv2code.springboot.cruddemo.rest;

import com.luv2code.springboot.cruddemo.dto.MandarinDictionaryEntryDto;
import com.luv2code.springboot.cruddemo.service.DictionaryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class DictionaryController {

    private final DictionaryService dictionaryService;

    public DictionaryController(DictionaryService dictionaryService) {
        this.dictionaryService = dictionaryService;
    }

    @GetMapping("/mandarinDictionary")
    public ResponseEntity<MandarinDictionaryEntryDto> getDefinition(
            @RequestParam String word) {
        return ResponseEntity.ok(dictionaryService.findByWord(word));
    }
}
