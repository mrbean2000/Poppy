package com.luv2code.springboot.cruddemo.service;

import com.hankcs.hanlp.HanLP;
import com.luv2code.springboot.cruddemo.dao.PassageRepository;
import com.luv2code.springboot.cruddemo.dto.PassageDto;
import com.luv2code.springboot.cruddemo.dto.PassageOnlyDto;
import com.luv2code.springboot.cruddemo.dto.PassageTitleOnlyDto;
import com.luv2code.springboot.cruddemo.dto.SegmentedWordDto;
import com.luv2code.springboot.cruddemo.entity.Passage;
import com.luv2code.springboot.cruddemo.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PassageServiceImpl implements PassageService {

    private PassageRepository passageRepository;
    private DictionaryService dictionaryService;
    private VocabularyProgressService vocabularyProgressService;

    @Autowired
    public PassageServiceImpl(
            PassageRepository thePassageRepository,
            DictionaryService theDictionaryService,
            VocabularyProgressService theVocabularyProgressService) {
        passageRepository = thePassageRepository;
        dictionaryService = theDictionaryService;
        vocabularyProgressService = theVocabularyProgressService;
    }

    @Override
    public List<PassageTitleOnlyDto> findAllTitleOnly() {
        return passageRepository.findAllTitleOnly();
    }

    @Override
    public PassageOnlyDto findById(int theId) {
        Passage passage = passageRepository.findById(theId).orElse(null);

        if(passage == null){
         // we didn't find the employee
            throw new RuntimeException("Passage not found");
        }

        return new PassageOnlyDto(passage.getId(), passage.getPassage());
    }

    @Override
    public List<String> getSegmentedPassageBy(int theId) {
        Passage passage = passageRepository.findById(theId).orElse(null);

        if(passage == null){
            // we didn't find the employee
            throw new RuntimeException("Passage not found");
        }

        List<String> words = HanLP.segment(passage.getPassage())
                .stream()
                .map(term -> term.word)
                .toList();
        return words;
    }

    @Override
    public List<SegmentedWordDto> getSegmentedPassageWithPinyin(int theId) {
        return getSegmentedPassageWithPinyin(theId, null);
    }

    @Override
    public List<SegmentedWordDto> getSegmentedPassageWithPinyin(int theId, Long userId) {
        List<String> words = getSegmentedPassageBy(theId);
        var statusLevels = userId == null
                ? java.util.Map.<String, Integer>of()
                : vocabularyProgressService.getStatusLevels(userId, words);

        return words.stream()
                .map(word -> {
                    Integer statusLevel = statusLevels.get(word);
                    try {
                        return new SegmentedWordDto(
                                word,
                                dictionaryService.findByWord(word).formattedPinyin(),
                                statusLevel);
                    } catch (ResourceNotFoundException exception) {
                        return new SegmentedWordDto(word, getFallbackPinyin(word), statusLevel);
                    }
                })
                .toList();
    }

    private String getFallbackPinyin(String word) {
        List<String> pinyinSyllables = word.codePoints()
                .filter(codePoint -> Character.UnicodeScript.of(codePoint)
                        == Character.UnicodeScript.HAN)
                .mapToObj(codePoint -> new String(Character.toChars(codePoint)))
                .map(this::findCharacterPinyin)
                .filter(pinyin -> pinyin != null && !pinyin.isBlank())
                .toList();

        return pinyinSyllables.isEmpty() ? null : String.join(" ", pinyinSyllables);
    }

    private String findCharacterPinyin(String character) {
        try {
            return dictionaryService.findByWord(character).formattedPinyin();
        } catch (ResourceNotFoundException exception) {
            return HanLP.convertToPinyinString(character, " ", true);
        }
    }

    public Passage create(PassageDto thePassage){

        Passage passage = new Passage(0, thePassage.getPassage(), thePassage.getTitle(), thePassage.getImageUrl());

        return passageRepository.save(passage);
    }

    public Passage update(PassageDto thePassage){

        int passageId = thePassage.getId();
        Passage passage = passageRepository.findById(passageId)
                .orElse(null);
        if(passage == null){
            // we didn't find the employee
            throw new RuntimeException("Passage not found");
        }

        passage.setPassage(thePassage.getPassage());

        return passageRepository.save(passage);
    }

    public void deleteById(int theId) {

        Passage passage = passageRepository.findById(theId).orElse(null);

        if(passage == null){
            // we didn't find the employee
            throw new RuntimeException("Passage not found");
        }

        passageRepository.deleteById(theId);
    }



}
