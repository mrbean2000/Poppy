package com.luv2code.springboot.cruddemo.service;

import com.luv2code.springboot.cruddemo.dao.SettingsRepository;
import com.luv2code.springboot.cruddemo.dto.VocabularyStatusDto;
import com.luv2code.springboot.cruddemo.exception.ResourceNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class VocabularyProgressServiceImpl implements VocabularyProgressService {
    private record Progress(Long userId, String word, int status, int count, boolean favorite) {}
    private enum Operation { LOOKUP, STATUS, FAVORITE }

    private static final RowMapper<Progress> PROGRESS_MAPPER = (row, n) ->
            new Progress(row.getLong("user_id"), row.getString("word"), row.getInt("status_level"),
                    row.getInt("lookup_count"), row.getBoolean("is_favorite"));

    private final JdbcTemplate jdbc;
    private final DictionaryService dictionary;
    private final JapaneseDictionaryService japaneseDictionary;
    private final SettingsRepository settingsRepository;

    public VocabularyProgressServiceImpl(JdbcTemplate jdbc, DictionaryService dictionary,
                                         JapaneseDictionaryService japaneseDictionary,
                                         SettingsRepository settingsRepository) {
        this.jdbc = jdbc;
        this.dictionary = dictionary;
        this.japaneseDictionary = japaneseDictionary;
        this.settingsRepository = settingsRepository;
    }

    private String resolveLanguage(Long userId, String language) {
        if (userId == null || userId < 1 || userId > Integer.MAX_VALUE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A valid userId is required.");
        }
        if (language == null) {
            var settings = settingsRepository.findByUserId(userId.intValue());
            if (settings == null || settings.getTargetlanguage() == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User target language not found.");
            }
            language = settings.getTargetlanguage();
        }
        String normalized = language.toLowerCase(Locale.ROOT);
        if (normalized.contains("japanese")) return "Japanese";
        if (normalized.contains("korean")) return "Korean";
        if (normalized.contains("chinese") || normalized.contains("mandarin")) return "Chinese";
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Language must be Chinese, Japanese or Korean.");
    }

    private String table(String language) {
        return switch (language) {
            case "Japanese" -> "public.user_word_progress_japanese";
            case "Korean" -> "public.user_word_progress_korean";
            default -> "public.user_word_progress_chinese";
        };
    }

    private void validateWord(String word) {
        if (word == null || word.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A valid word is required.");
        }
    }

    private VocabularyStatusDto toDto(Progress progress, String language) {
        String word = progress.word();
        String reading = null;
        List<String> definitions = null;
        try {
            if (language.equals("Japanese")) {
                var result = japaneseDictionary.findByWord(word);
                var entry = result.entries().getFirst();
                reading = entry.readings().isEmpty() ? null : String.join(", ", entry.readings());
                definitions = result.entries().stream().flatMap(e -> e.senses().stream())
                        .map(sense -> String.join("; ", sense.meanings())).toList();
            } else if (!language.equals("Korean")) {
                var entry = dictionary.findByWord(word);
                reading = entry.formattedPinyin();
                definitions = entry.definitions();
            }
        } catch (ResourceNotFoundException ignored) {
        }
        return new VocabularyStatusDto(progress.userId(), word, reading, definitions,
                progress.status(), progress.count(), progress.favorite());
    }

    @Override
    public List<VocabularyStatusDto> getVocabulary(Long userId, String language) {
        String resolved = resolveLanguage(userId, language);
        return jdbc.query("SELECT user_id, word, status_level, lookup_count, is_favorite FROM "
                        + table(resolved) + " WHERE user_id = ? ORDER BY last_lookup_at DESC",
                PROGRESS_MAPPER, userId).stream().map(progress -> toDto(progress, resolved)).toList();
    }

    private VocabularyStatusDto upsert(Long userId, String word, String language,
                                       Operation action, int status, boolean favorite) {
        validateWord(word);
        String resolved = resolveLanguage(userId, language);
        String table = table(resolved);
        String update = switch (action) {
            case LOOKUP -> "lookup_count = progress.lookup_count + 1, last_lookup_at = CURRENT_TIMESTAMP";
            case STATUS -> "status_level = EXCLUDED.status_level";
            case FAVORITE -> "is_favorite = EXCLUDED.is_favorite";
        };
        int count = action == Operation.LOOKUP ? 1 : 0;
        String sql = "INSERT INTO " + table + " AS progress"
                + " (user_id, word, status_level, lookup_count, is_favorite, last_lookup_at)"
                + " VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)"
                + " ON CONFLICT (user_id, word) DO UPDATE SET " + update
                + " RETURNING user_id, word, status_level, lookup_count, is_favorite";
        Progress progress = jdbc.queryForObject(sql, PROGRESS_MAPPER, userId, word, status, count, favorite);
        return toDto(progress, resolved);
    }

    @Override
    public VocabularyStatusDto recordLookup(Long userId, String word, String language) {
        return upsert(userId, word, language, Operation.LOOKUP, 1, false);
    }

    @Override
    public VocabularyStatusDto updateStatus(Long userId, String word, int statusLevel, String language) {
        if (statusLevel < 0 || statusLevel > 4) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status level must be between 0 and 4.");
        }
        return upsert(userId, word, language, Operation.STATUS, statusLevel, false);
    }

    @Override
    public VocabularyStatusDto updateFavorite(Long userId, String word, boolean favorite, String language) {
        return upsert(userId, word, language, Operation.FAVORITE, 1, favorite);
    }

    @Override
    public Map<String, Integer> getStatusLevels(Long userId, List<String> words, String language) {
        String resolved = resolveLanguage(userId, language);
        Set<String> requested = Set.copyOf(words);
        return jdbc.query("SELECT word, status_level FROM " + table(resolved) + " WHERE user_id = ?",
                        (row, n) -> Map.entry(row.getString("word"), row.getInt("status_level")), userId)
                .stream().filter(entry -> requested.contains(entry.getKey()))
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
    }
}
