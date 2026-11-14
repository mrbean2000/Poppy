package com.luv2code.springboot.cruddemo.service;

import com.atilika.kuromoji.ipadic.Token;
import com.atilika.kuromoji.ipadic.Tokenizer;
import com.luv2code.springboot.cruddemo.dao.JapanesePassageRepository;
import com.luv2code.springboot.cruddemo.dto.JapaneseSegmentedWordDto;
import com.luv2code.springboot.cruddemo.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class JapaneseSegmentationService {
    private final JapanesePassageRepository passageRepository;
    private final Tokenizer tokenizer = new Tokenizer();

    public JapaneseSegmentationService(JapanesePassageRepository passageRepository) {
        this.passageRepository = passageRepository;
    }

    public String findBaseForm(String word) {
        List<Token> tokens = tokenizer.tokenize(word);
        if (tokens.size() != 1) {
            return null;
        }
        Token token = tokens.get(0);
        if (!token.isKnown() || token.getPosition() != 0 || !token.getSurface().equals(word)) {
            return null;
        }
        String baseForm = token.getBaseForm();
        return baseForm == null || baseForm.isBlank() || baseForm.equals("*") ? null : baseForm;
    }

    @Transactional(readOnly = true)
    public List<JapaneseSegmentedWordDto> segmentPassage(long passageId) {
        String text = passageRepository.findById(passageId)
                .orElseThrow(() -> new ResourceNotFoundException("Japanese passage not found"))
                .getPassage();
        if (text == null) {
            throw new IllegalStateException("Japanese passage has no text");
        }

        List<JapaneseSegmentedWordDto> result = new ArrayList<>();
        int position = 0;
        for (Token token : tokenizer.tokenize(text)) {
            int start = token.getPosition();
            String word = token.getSurface();
            if (start < position || !text.startsWith(word, start)) {
                throw new IllegalStateException("Japanese token does not match passage text");
            }
            if (start > position) {
                result.add(new JapaneseSegmentedWordDto(text.substring(position, start), null));
            }
            result.add(new JapaneseSegmentedWordDto(word, getFurigana(token)));
            position = start + word.length();
        }
        if (position < text.length()) {
            result.add(new JapaneseSegmentedWordDto(text.substring(position), null));
        }
        return result;
    }

    private String getFurigana(Token token) {
        if (!token.isKnown() || token.getSurface().codePoints().noneMatch(
                codePoint -> Character.UnicodeScript.of(codePoint) == Character.UnicodeScript.HAN)) {
            return null;
        }
        String reading = token.getReading();
        if (reading == null || reading.isBlank() || reading.equals("*")) {
            return null;
        }
        StringBuilder hiragana = new StringBuilder();
        reading.codePoints().forEach(codePoint -> hiragana.appendCodePoint(
                codePoint >= 0x30A1 && codePoint <= 0x30F6 ? codePoint - 0x60 : codePoint));
        return hiragana.toString();
    }
}
