package com.luv2code.springboot.cruddemo.rest;

import com.hankcs.hanlp.HanLP;
import com.luv2code.springboot.cruddemo.dto.PassageDto;
import com.luv2code.springboot.cruddemo.dto.PassageOnlyDto;
import com.luv2code.springboot.cruddemo.dto.PassageTitleOnlyDto;
import com.luv2code.springboot.cruddemo.dto.SegmentedWordDto;
import com.luv2code.springboot.cruddemo.entity.Passage;
import com.luv2code.springboot.cruddemo.service.PassageService;
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

    private JsonMapper jsonMapper;

    @Autowired
    public PassageController(PassageService thePassageService, JsonMapper theJsonMapper) {
        passageService = thePassageService;
        jsonMapper = theJsonMapper;
    }

    @GetMapping("/passages")
    public ResponseEntity<List<PassageTitleOnlyDto>> getAllPassage(){
        List<PassageTitleOnlyDto> passages = passageService.findAllTitleOnly();
        return ResponseEntity.ok(passages); // Returns HTTP 200
    }

    @GetMapping("/passage/{passageId}")
    public  ResponseEntity<PassageOnlyDto> getPassageId(@PathVariable int passageId){
        PassageOnlyDto passage = passageService.findById(passageId);
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
