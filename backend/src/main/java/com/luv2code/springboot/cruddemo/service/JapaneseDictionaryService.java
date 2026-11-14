package com.luv2code.springboot.cruddemo.service;

import com.luv2code.springboot.cruddemo.dto.JapaneseDictionaryEntryDto;
import com.luv2code.springboot.cruddemo.dto.JapaneseDictionaryResultDto;
import com.luv2code.springboot.cruddemo.exception.ResourceNotFoundException;
import jakarta.annotation.PostConstruct;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.Charset;
import java.nio.charset.CodingErrorAction;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class JapaneseDictionaryService {

    private final JapaneseSegmentationService segmentationService;
    private Map<String, List<JapaneseDictionaryEntryDto>> entries = Map.of();

    public JapaneseDictionaryService(JapaneseSegmentationService segmentationService) {
        this.segmentationService = segmentationService;
    }

    @PostConstruct
    void loadDictionary() {
        var decoder = Charset.forName("EUC-JP").newDecoder()
                .onMalformedInput(CodingErrorAction.REPORT)
                .onUnmappableCharacter(CodingErrorAction.REPORT);
        Map<String, List<JapaneseDictionaryEntryDto>> index = new HashMap<>();
        ClassPathResource resource = new ClassPathResource("edict2");
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(resource.getInputStream(), decoder))) {
            String header = reader.readLine();
            if (header == null || !header.contains("EDICT2")) {
                throw new IllegalStateException("EDICT2 dictionary header is missing or invalid.");
            }
            String line;
            int lineNumber = 1;
            while ((line = reader.readLine()) != null) {
                lineNumber++;
                if (line.isBlank()) {
                    continue;
                }
                JapaneseDictionaryEntryDto entry = parseEntry(line, lineNumber);
                Set<String> keys = new LinkedHashSet<>(entry.writtenForms());
                keys.addAll(entry.readings());
                for (String key : keys) {
                    index.computeIfAbsent(key, ignored -> new ArrayList<>()).add(entry);
                }
            }
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to load or decode the EDICT2 dictionary.", exception);
        }
        if (index.isEmpty()) {
            throw new IllegalStateException("EDICT2 dictionary contains no entries.");
        }
        index.replaceAll((key, value) -> List.copyOf(new LinkedHashSet<>(value)));
        entries = Map.copyOf(index);
    }

    public JapaneseDictionaryResultDto findByWord(String word) {
        if (word == null || word.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dictionary word must not be blank.");
        }
        String requestedWord = word.trim();
        String matchedWord = requestedWord;
        List<JapaneseDictionaryEntryDto> matches = entries.get(matchedWord);
        if (matches == null) {
            String baseForm = segmentationService.findBaseForm(requestedWord);
            if (baseForm != null && !baseForm.equals(requestedWord)) {
                matches = entries.get(baseForm);
                if (matches != null) {
                    matchedWord = baseForm;
                }
            }
        }
        if (matches == null) {
            throw new ResourceNotFoundException("No Japanese dictionary entry found for word: " + requestedWord);
        }
        List<JapaneseDictionaryEntryDto> formattedMatches = matches.stream()
                .map(entry -> new JapaneseDictionaryEntryDto(
                        entry.id(), entry.writtenForms(), entry.readings(), entry.definitions(),
                        JapaneseSenseFormatter.format(entry.definitions())))
                .toList();
        return new JapaneseDictionaryResultDto(
                requestedWord, matchedWord, formattedMatches);
    }

    private JapaneseDictionaryEntryDto parseEntry(String line, int lineNumber) {
        int separator = line.indexOf(" /");
        if (separator <= 0 || !line.endsWith("/")) {
            throw invalidEntry(lineNumber);
        }
        String headword = line.substring(0, separator);
        int readingStart = headword.indexOf(" [");
        String written = readingStart < 0 ? headword : headword.substring(0, readingStart);
        String reading = null;
        if (readingStart >= 0) {
            if (!headword.endsWith("]")) {
                throw invalidEntry(lineNumber);
            }
            reading = headword.substring(readingStart + 2, headword.length() - 1);
        }
        List<String> writtenForms = parseVariants(written);
        List<String> readings = reading == null ? List.of() : parseVariants(reading);
        List<String> parts = Arrays.asList(line.substring(separator + 2, line.length() - 1).split("/"));
        String id = parts.get(parts.size() - 1);
        if (writtenForms.isEmpty() || (reading != null && readings.isEmpty())
                || !id.matches("EntL\\d+X?")) {
            throw invalidEntry(lineNumber);
        }
        List<String> definitions = parts.subList(0, parts.size() - 1).stream()
                .filter(part -> !part.isBlank() && !part.equals("(P)"))
                .toList();
        if (definitions.isEmpty()) {
            throw invalidEntry(lineNumber);
        }
        return new JapaneseDictionaryEntryDto(id, writtenForms, readings, definitions, List.of());
    }

    private List<String> parseVariants(String text) {
        return Arrays.stream(text.split(";"))
                .map(variant -> variant.replaceAll("\\([^)]*\\)", "").trim())
                .filter(variant -> !variant.isEmpty())
                .distinct()
                .toList();
    }

    private IllegalStateException invalidEntry(int lineNumber) {
        return new IllegalStateException("Invalid EDICT2 dictionary entry at line " + lineNumber + ".");
    }
}
