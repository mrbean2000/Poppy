package com.luv2code.springboot.cruddemo.rest;

import com.luv2code.springboot.cruddemo.entity.Passage;
import com.luv2code.springboot.cruddemo.service.UserPassageProgressService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
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
    public ResponseEntity<Passage> getLastReadPassage(@PathVariable int userId) {
        Passage passage = userPassageProgressService.getLastReadPassageByUserId(userId);
        return ResponseEntity.ok(passage);
    }
}
