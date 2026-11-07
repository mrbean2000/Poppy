package com.luv2code.springboot.cruddemo.rest;

import com.luv2code.springboot.cruddemo.dto.PassageOnlyDto;
import com.luv2code.springboot.cruddemo.dto.StoryLikeDto;
import com.luv2code.springboot.cruddemo.entity.StoryLike;
import com.luv2code.springboot.cruddemo.service.PassageService;
import com.luv2code.springboot.cruddemo.service.StoryLikeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tools.jackson.databind.json.JsonMapper;

@RestController
@RequestMapping("/api")
public class StoryLikeController {
    private StoryLikeService storyLikeService;

    private JsonMapper jsonMapper;

    @Autowired
    public StoryLikeController(StoryLikeService theStoryLikeService, JsonMapper theJsonMapper) {
        storyLikeService = theStoryLikeService;
        jsonMapper = theJsonMapper;
    }

    @GetMapping("/story-like/user/{userId}/passage/{passageId}")
    public ResponseEntity<StoryLike> getByUserAndPassage(@PathVariable int userId, @PathVariable int passageId){
        StoryLike storyLike = storyLikeService.getByUserAndPassage(userId, passageId);
        return ResponseEntity.ok(storyLike);
    }

    @PutMapping("/story-like")
    public ResponseEntity<StoryLike> update(@RequestBody StoryLikeDto storyLikeDto){
        StoryLike storyLike = storyLikeService.update(storyLikeDto);
        return ResponseEntity.ok(storyLike);
    }
}
