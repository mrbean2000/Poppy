package com.luv2code.springboot.cruddemo.rest;

import com.luv2code.springboot.cruddemo.dto.MandarinDictionaryEntryDto;
import com.luv2code.springboot.cruddemo.dto.JapaneseDictionaryResultDto;
import com.luv2code.springboot.cruddemo.service.DictionaryService;
import com.luv2code.springboot.cruddemo.service.JapaneseDictionaryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class DictionaryController {

    private final DictionaryService dictionaryService;
    private final JapaneseDictionaryService japaneseDictionaryService;

    public DictionaryController(DictionaryService dictionaryService,
                                JapaneseDictionaryService japaneseDictionaryService) {
        this.dictionaryService = dictionaryService;
        this.japaneseDictionaryService = japaneseDictionaryService;
    }

    @GetMapping("/mandarinDictionary")
    public ResponseEntity<MandarinDictionaryEntryDto> getDefinition(
            @RequestParam String word) {
        return ResponseEntity.ok(dictionaryService.findByWord(word));
    }

    @GetMapping("/japaneseDictionary")
    public ResponseEntity<JapaneseDictionaryResultDto> getJapaneseDefinition(
            @RequestParam(name = "word") String word) {
        return ResponseEntity.ok(japaneseDictionaryService.findByWord(word));
    }
}
