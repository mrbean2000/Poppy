package com.luv2code.springboot.cruddemo.service;

import com.luv2code.springboot.cruddemo.dao.JapanesePassageRepository;
import com.luv2code.springboot.cruddemo.dao.KoreanPassageRepository;
import com.luv2code.springboot.cruddemo.dao.LanguageRepository;
import com.luv2code.springboot.cruddemo.dao.PassageRepository;
import com.luv2code.springboot.cruddemo.dao.SettingsRepository;
import com.luv2code.springboot.cruddemo.dao.UserPassageProgressRepository;
import com.luv2code.springboot.cruddemo.dto.LastReadPassageDto;
import com.luv2code.springboot.cruddemo.dto.SettingsLanguageDto;
import com.luv2code.springboot.cruddemo.entity.JapanesePassage;
import com.luv2code.springboot.cruddemo.entity.KoreanPassage;
import com.luv2code.springboot.cruddemo.entity.Language;
import com.luv2code.springboot.cruddemo.entity.Passage;
import com.luv2code.springboot.cruddemo.entity.UserPassageProgress;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Locale;

@Service
public class UserPassageProgressImpl implements UserPassageProgressService {
    private final UserPassageProgressRepository progressRepository;
    private final PassageRepository passageRepository;
    private final JapanesePassageRepository japanesePassageRepository;
    private final KoreanPassageRepository koreanPassageRepository;
    private final LanguageRepository languageRepository;
    private final SettingsRepository settingsRepository;

    public UserPassageProgressImpl(UserPassageProgressRepository progressRepository,
                                   PassageRepository passageRepository,
                                   JapanesePassageRepository japanesePassageRepository,
                                   KoreanPassageRepository koreanPassageRepository,
                                   LanguageRepository languageRepository,
                                   SettingsRepository settingsRepository) {
        this.progressRepository = progressRepository;
        this.passageRepository = passageRepository;
        this.japanesePassageRepository = japanesePassageRepository;
        this.koreanPassageRepository = koreanPassageRepository;
        this.languageRepository = languageRepository;
        this.settingsRepository = settingsRepository;
    }

    private Language resolveLanguage(int userId, Integer targetLanguageId) {
        Integer languageId = targetLanguageId;
        if (languageId == null) {
            SettingsLanguageDto settings = settingsRepository.findByUserId(userId);
            if (settings == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User settings not found");
            }
            languageId = settings.getTargetlanguageid();
        }
        return languageRepository.findById(languageId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Target language not found"));
    }

    private String languageKey(Language language) {
        String name = language.getLanguage();
        if (name == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Target language has no name");
        }
        String normalized = name.toLowerCase(Locale.ROOT);
        if (normalized.contains("japanese")) return "Japanese";
        if (normalized.contains("korean")) return "Korean";
        if (normalized.contains("chinese") || normalized.contains("mandarin")) return "Chinese";
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reading progress is only supported for Chinese, Japanese and Korean");
    }

    @Override
    @Transactional
    public void updateLastReadPassage(int userId, long passageId, Integer targetLanguageId) {
        Language language = resolveLanguage(userId, targetLanguageId);
        String key = languageKey(language);
        UserPassageProgress progress = progressRepository
                .findByUserIdAndTargetLanguageId((long) userId, language.getId())
                .orElseGet(() -> new UserPassageProgress((long) userId, language.getId()));

        if (key.equals("Japanese")) {
            JapanesePassage passage = japanesePassageRepository.findById(passageId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Japanese passage not found"));
            progress.setLastReadPassageId(passage.getId());
        } else if (key.equals("Korean")) {
            KoreanPassage passage = koreanPassageRepository.findById(passageId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Korean passage not found"));
            progress.setLastReadPassageId(passage.getId());
        } else {
            if (passageId <= 0 || passageId > Integer.MAX_VALUE) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Chinese passage not found");
            }
            Passage passage = passageRepository.findById((int) passageId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chinese passage not found"));
            progress.setLastReadPassageId((long) passage.getId());
        }
        progress.setLastReadAt(LocalDateTime.now());
        progressRepository.save(progress);
    }

    @Override
    @Transactional(readOnly = true)
    public LastReadPassageDto getLastReadPassageByUserId(int userId, Integer targetLanguageId) {
        Language language = resolveLanguage(userId, targetLanguageId);
        String key = languageKey(language);
        return progressRepository.findByUserIdAndTargetLanguageId((long) userId, language.getId())
                .map(progress -> {
                    Long passageId = progress.getLastReadPassageId();
                    if (passageId == null) {
                        throw new IllegalStateException("Reading progress has no passage");
                    }
                    if (key.equals("Korean")) {
                        KoreanPassage passage = koreanPassageRepository.findById(passageId)
                                .orElseThrow(() -> new IllegalStateException("Korean reading progress references a missing passage"));
                        return new LastReadPassageDto(passage.getId(), passage.getPassage(), passage.getTitle(), passage.getImageUrl(), null);
                    }
                    if (key.equals("Japanese")) {
                        JapanesePassage passage = japanesePassageRepository.findById(passageId)
                                .orElseThrow(() -> new IllegalStateException("Japanese reading progress references a missing passage"));
                        return new LastReadPassageDto(passage.getId(), passage.getPassage(), passage.getTitle(), passage.getImageUrl(), null);
                    }
                    if (passageId <= 0 || passageId > Integer.MAX_VALUE) {
                        throw new IllegalStateException("Chinese reading progress references an invalid passage ID");
                    }
                    Passage passage = passageRepository.findById(passageId.intValue())
                            .orElseThrow(() -> new IllegalStateException("Chinese reading progress references a missing passage"));
                    return new LastReadPassageDto(passage.getId(), passage.getPassage(), passage.getTitle(), passage.getImageUrl(), null);
                })
                .orElse(null);
    }
}
