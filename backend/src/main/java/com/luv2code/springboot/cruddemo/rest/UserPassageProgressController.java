package com.luv2code.springboot.cruddemo.rest;

import com.luv2code.springboot.cruddemo.dto.LastReadPassageDto;
import com.luv2code.springboot.cruddemo.service.UserPassageProgressService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class UserPassageProgressController {

    private final UserPassageProgressService userPassageProgressService;

    @Autowired
    public UserPassageProgressController(UserPassageProgressService userPassageProgressService) {
        this.userPassageProgressService = userPassageProgressService;
    }

    @GetMapping("/UserPassageProgress/{userId}/last-read-passage")
    public ResponseEntity<LastReadPassageDto> getLastReadPassage(
            @PathVariable int userId,
            @RequestParam(name = "targetLanguageId", required = false) Integer targetLanguageId) {
        LastReadPassageDto passage = userPassageProgressService.getLastReadPassageByUserId(userId, targetLanguageId);
        return ResponseEntity.ok(passage);
    }

    @PutMapping("/UserPassageProgress/{userId}/last-read-passage/{passageId}")
    public ResponseEntity<Void> updateLastReadPassage(
            @PathVariable int userId, @PathVariable long passageId,
            @RequestParam(required = false) Integer targetLanguageId) {
        userPassageProgressService.updateLastReadPassage(userId, passageId, targetLanguageId);
        return ResponseEntity.noContent().build();
    }
}
