package com.luv2code.springboot.cruddemo.service;

import com.luv2code.springboot.cruddemo.dao.UserWordProgressRepository;
import com.luv2code.springboot.cruddemo.dto.VocabularyStatusDto;
import com.luv2code.springboot.cruddemo.entity.UserWordProgress;
import com.luv2code.springboot.cruddemo.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class VocabularyProgressServiceImpl implements VocabularyProgressService {

    private final UserWordProgressRepository repository;
    private final DictionaryService dictionaryService;

    public VocabularyProgressServiceImpl(
            UserWordProgressRepository repository,
            DictionaryService dictionaryService) {
        this.repository = repository;
        this.dictionaryService = dictionaryService;
    }

    @Override
    public List<VocabularyStatusDto> getVocabulary(Long userId) {
        return repository.findAllByUserIdOrderByLastLookupAtDesc(userId).stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    public VocabularyStatusDto recordLookup(Long userId, String word) {
        UserWordProgress progress = getOrCreate(userId, word);
        progress.setLookupCount(progress.getLookupCount() + 1);
        progress.setLastLookupAt(LocalDateTime.now());
        return toDto(repository.save(progress));
    }

    @Override
    public VocabularyStatusDto updateStatus(Long userId, String word, int statusLevel) {
        if (statusLevel < 0 || statusLevel > 4) {
            throw new IllegalArgumentException("Status level must be between 0 and 4.");
        }

        UserWordProgress progress = getOrCreate(userId, word);
        progress.setStatusLevel(statusLevel);
        return toDto(repository.save(progress));
    }

    @Override
    public VocabularyStatusDto updateFavorite(Long userId, String word, boolean favorite) {
        UserWordProgress progress = getOrCreate(userId, word);
        progress.setFavorite(favorite);
        return toDto(repository.save(progress));
    }

    @Override
    public Map<String, Integer> getStatusLevels(Long userId, List<String> words) {
        return words.stream()
                .distinct()
                .map(word -> repository.findByUserIdAndWord(userId, word).orElse(null))
                .filter(progress -> progress != null)
                .collect(Collectors.toMap(
                        UserWordProgress::getWord,
                        UserWordProgress::getStatusLevel));
    }

    @Override
    public UserWordProgress getOrCreate(Long userId, String word) {
        if (userId == null || userId < 1 || word == null || word.isBlank()) {
            throw new IllegalArgumentException("A valid userId and word are required.");
        }

        return repository.findByUserIdAndWord(userId, word)
                .orElseGet(() -> repository.save(new UserWordProgress(userId, word)));
    }

    private VocabularyStatusDto toDto(UserWordProgress progress) {
        return new VocabularyStatusDto(
                progress.getUserId(),
                progress.getWord(),
                getPinyin(progress.getWord()),
                getDefinition(progress.getWord()),
                progress.getStatusLevel(),
                progress.getLookupCount(),
                progress.isFavorite());
    }

    private String getPinyin(String word) {
        try {
            return dictionaryService.findByWord(word).formattedPinyin();
        } catch (ResourceNotFoundException exception) {
            return null;
        }
    }

    private List<String> getDefinition(String word){
        try{
            return dictionaryService.findByWord(word).definitions();
        } catch (ResourceNotFoundException exception) {
            return null;
        }
    }
}