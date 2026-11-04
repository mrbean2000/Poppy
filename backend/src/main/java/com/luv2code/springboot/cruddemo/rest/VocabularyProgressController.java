package com.luv2code.springboot.cruddemo.rest;

import com.luv2code.springboot.cruddemo.dto.VocabularyStatusDto;
import com.luv2code.springboot.cruddemo.dto.VocabularyStatusRequest;
import com.luv2code.springboot.cruddemo.dto.VocabularyFavoriteRequest;
import com.luv2code.springboot.cruddemo.service.VocabularyProgressService;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/{userId}/vocabulary")
public class VocabularyProgressController {

    private final VocabularyProgressService vocabularyProgressService;

    public VocabularyProgressController(VocabularyProgressService vocabularyProgressService) {
        this.vocabularyProgressService = vocabularyProgressService;
    }

    @GetMapping
    public java.util.List<VocabularyStatusDto> getVocabulary(@PathVariable Long userId) {
        return vocabularyProgressService.getVocabulary(userId);
    }

    @PostMapping("/{word}/lookup")
    public VocabularyStatusDto recordLookup(
            @PathVariable Long userId,
            @PathVariable String word) {
        return vocabularyProgressService.recordLookup(userId, word);
    }

    @PutMapping("/{word}/status")
    public VocabularyStatusDto updateStatus(
            @PathVariable Long userId,
            @PathVariable String word,
            @RequestBody VocabularyStatusRequest request) {
        return vocabularyProgressService.updateStatus(userId, word, request.statusLevel());
    }

    @PutMapping("/{word}/favorite")
    public VocabularyStatusDto updateFavorite(
            @PathVariable Long userId,
            @PathVariable String word,
            @RequestBody VocabularyFavoriteRequest request) {
        if (request.favorite() == null) {
            throw new IllegalArgumentException("A favorite value is required.");
        }
        return vocabularyProgressService.updateFavorite(
                userId, word, request.favorite());
    }
}