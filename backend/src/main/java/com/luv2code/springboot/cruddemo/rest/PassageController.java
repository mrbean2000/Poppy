package com.luv2code.springboot.cruddemo.rest;

import com.hankcs.hanlp.HanLP;
import com.luv2code.springboot.cruddemo.dto.PassageDto;
import com.luv2code.springboot.cruddemo.dto.PassageOnlyDto;
import com.luv2code.springboot.cruddemo.dto.PassageTitleOnlyDto;
import com.luv2code.springboot.cruddemo.dto.SegmentedWordDto;
import com.luv2code.springboot.cruddemo.dto.JapaneseSegmentedWordDto;
import com.luv2code.springboot.cruddemo.entity.Passage;
import com.luv2code.springboot.cruddemo.service.JapaneseSegmentationService;
import com.luv2code.springboot.cruddemo.service.PassageService;
import com.luv2code.springboot.cruddemo.service.VocabularyProgressService;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tools.jackson.databind.json.JsonMapper;

import java.util.List;

@RestController
@RequestMapping("/api")
public class PassageController {
    private PassageService passageService;
    private final JapaneseSegmentationService japaneseSegmentationService;
    private final VocabularyProgressService vocabularyProgressService;

    private JsonMapper jsonMapper;

    @Autowired
    public PassageController(PassageService thePassageService, JsonMapper theJsonMapper,
                             JapaneseSegmentationService japaneseSegmentationService,
                             VocabularyProgressService vocabularyProgressService) {
        passageService = thePassageService;
        jsonMapper = theJsonMapper;
        this.japaneseSegmentationService = japaneseSegmentationService;
        this.vocabularyProgressService = vocabularyProgressService;
    }

    @GetMapping("/passages")
    public ResponseEntity<List<PassageTitleOnlyDto>> getAllPassage(){
        List<PassageTitleOnlyDto> passages = passageService.findAllTitleOnly();
        return ResponseEntity.ok(passages); // Returns HTTP 200
    }

    @GetMapping("/passage/{passageId}")
    @Operation(description = "Retrieve a Chinese or Japanese passage by ID. "
            + "The language parameter defaults to Chinese when omitted.")
    public  ResponseEntity<PassageOnlyDto> getPassageId(
            @PathVariable long passageId,
            @RequestParam(required = false) String language){
        PassageOnlyDto passage = passageService.findById(passageId, language);
        return  ResponseEntity.ok(passage);
    }

    @GetMapping("/passage/{passageId}/segmented")
    public ResponseEntity<List<String>> getSegmentedPassageId(@PathVariable int passageId){
        List<String> words = passageService.getSegmentedPassageBy(passageId);
        return ResponseEntity.ok(words);
    }

    @GetMapping("/passage/{passageId}/segmented-with-pinyin")
    public ResponseEntity<List<SegmentedWordDto>> getSegmentedPassageWithPinyin(
            @PathVariable int passageId,
            @RequestParam(required = false) Long userId) {
        return ResponseEntity.ok(
                passageService.getSegmentedPassageWithPinyin(passageId, userId));
    }

    @GetMapping("/japanese-passage/{passageId}/segmented-with-furigana")
    public ResponseEntity<List<JapaneseSegmentedWordDto>> getJapanesePassageWithFurigana(
            @PathVariable long passageId,
            @RequestParam(name = "userId", required = false) Long userId) {
        List<JapaneseSegmentedWordDto> words = japaneseSegmentationService.segmentPassage(passageId);
        if (userId == null) return ResponseEntity.ok(words);
        var statuses = vocabularyProgressService.getStatusLevels(userId,
                words.stream().map(JapaneseSegmentedWordDto::word).toList(), "Japanese");
        return ResponseEntity.ok(words.stream()
                .map(word -> new JapaneseSegmentedWordDto(word.word(), word.furigana(), statuses.get(word.word())))
                .toList());
    }

    @PostMapping("/passage")
    public ResponseEntity<Passage> addPassage(@RequestBody PassageDto thePassage) {
        Passage dbPassage = passageService.create(thePassage);

        return new ResponseEntity<>(dbPassage, HttpStatus.CREATED);
    }

    @PutMapping("/passage")
    public ResponseEntity<Passage> updatePassage(@RequestBody PassageDto passage){
        Passage updatedPassage = passageService.update(passage);
        return ResponseEntity.ok(updatedPassage);
    }

    @DeleteMapping("/{passageId}")
    public ResponseEntity<Void> deletePassage(@PathVariable int passageId){
        passageService.deleteById(passageId);
        return ResponseEntity.noContent().build();
    }
}
