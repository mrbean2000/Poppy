package com.luv2code.springboot.cruddemo.service;

import com.luv2code.springboot.cruddemo.dto.MandarinDictionaryEntryDto;
import com.luv2code.springboot.cruddemo.exception.ResourceNotFoundException;
import jakarta.annotation.PostConstruct;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DictionaryServiceImpl implements DictionaryService {

    private final Map<String, MandarinDictionaryEntryDto> entries = new HashMap<>();

    @PostConstruct
    void loadDictionary() {
        ClassPathResource resource = new ClassPathResource("cedict_ts.u8");

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                parseEntry(line);
            }
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to load CC-CEDICT dictionary.", exception);
        }
    }

    @Override
    public MandarinDictionaryEntryDto findByWord(String word) {
        if (word == null || word.isBlank()) {
            throw new ResourceNotFoundException("Dictionary word must not be blank.");
        }

        MandarinDictionaryEntryDto entry = entries.get(word.trim());
        if (entry == null) {
            throw new ResourceNotFoundException(
                    "No dictionary entry found for word: " + word);
        }

        return entry;
    }

    private void parseEntry(String line) {
        if (line.isBlank() || line.startsWith("#")) {
            return;
        }

        int pinyinStart = line.indexOf("[");
        int pinyinEnd = line.indexOf("]", pinyinStart);
        int definitionStart = line.indexOf("/", pinyinEnd);
        int definitionEnd = line.lastIndexOf("/");

        if (pinyinStart <= 0 || pinyinEnd < 0 || definitionStart < 0
                || definitionEnd <= definitionStart) {
            return;
        }

        String headwords = line.substring(0, pinyinStart).trim();
        String[] words = headwords.split("\\s+");
        if (words.length < 2) {
            return;
        }

        String pinyin = line.substring(pinyinStart + 1, pinyinEnd).trim();
        String formattedPinyin = formatPinyin(pinyin);
        List<String> definitions = List.of(line
                .substring(definitionStart + 1, definitionEnd)
                .split("/"));

        MandarinDictionaryEntryDto entry = new MandarinDictionaryEntryDto(
                words[0],
                words[1],
                pinyin,
                formattedPinyin,
                new ArrayList<>(definitions));

        entries.putIfAbsent(words[0], entry);
        entries.putIfAbsent(words[1], entry);
    }

    private String formatPinyin(String pinyin) {
        StringBuilder formatted = new StringBuilder();

        for (String syllable : pinyin.split("\\s+")) {
            if (formatted.length() > 0) {
                formatted.append(' ');
            }
            formatted.append(formatSyllable(syllable));
        }

        return formatted.toString();
    }

    private String formatSyllable(String syllable) {
        if (syllable.isEmpty()) {
            return syllable;
        }

        char toneCharacter = syllable.charAt(syllable.length() - 1);
        if (toneCharacter < '1' || toneCharacter > '4') {
            return syllable.replace("u:", "ü");
        }

        int tone = toneCharacter - '0';
        String normalized = syllable.substring(0, syllable.length() - 1)
                .replace("u:", "ü");

        int vowelIndex = findToneVowel(normalized);
        if (vowelIndex < 0) {
            return normalized;
        }

        char vowel = normalized.charAt(vowelIndex);
        String[] marks = switch (vowel) {
            case 'a' -> new String[]{"a", "ā", "á", "ǎ", "à"};
            case 'e' -> new String[]{"e", "ē", "é", "ě", "è"};
            case 'i' -> new String[]{"i", "ī", "í", "ǐ", "ì"};
            case 'o' -> new String[]{"o", "ō", "ó", "ǒ", "ò"};
            case 'u' -> new String[]{"u", "ū", "ú", "ǔ", "ù"};
            case 'ü' -> new String[]{"ü", "ǖ", "ǘ", "ǚ", "ǜ"};
            default -> new String[]{String.valueOf(vowel)};
        };

        return normalized.substring(0, vowelIndex)
                + marks[tone]
                + normalized.substring(vowelIndex + 1);
    }

    private int findToneVowel(String syllable) {
        int aIndex = syllable.indexOf('a');
        if (aIndex >= 0) {
            return aIndex;
        }

        int eIndex = syllable.indexOf('e');
        if (eIndex >= 0) {
            return eIndex;
        }

        int ouIndex = syllable.indexOf("ou");
        if (ouIndex >= 0) {
            return ouIndex;
        }

        for (int index = syllable.length() - 1; index >= 0; index--) {
            if ("iouü".indexOf(syllable.charAt(index)) >= 0) {
                return index;
            }
        }

        return -1;
    }
}
