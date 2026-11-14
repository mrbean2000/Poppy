package com.luv2code.springboot.cruddemo.rest;

import com.luv2code.springboot.cruddemo.dto.StoryLikeDto;
import com.luv2code.springboot.cruddemo.dto.StoryLikeResponse;
import com.luv2code.springboot.cruddemo.service.StoryLikeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class StoryLikeController {
    private StoryLikeService storyLikeService;

    @Autowired
    public StoryLikeController(StoryLikeService theStoryLikeService) {
        storyLikeService = theStoryLikeService;
    }

    @GetMapping("/story-like/user/{userId}/passage/{passageId}")
    public ResponseEntity<StoryLikeResponse> getByUserAndPassage(
            @PathVariable int userId, @PathVariable long passageId,
            @RequestParam(name = "language", required = false) String language){
        StoryLikeResponse storyLike = storyLikeService.getByUserAndPassage(userId, passageId, language);
        return ResponseEntity.ok(storyLike);
    }

    @PutMapping("/story-like")
    public ResponseEntity<StoryLikeResponse> update(
            @RequestBody StoryLikeDto storyLikeDto,
            @RequestParam(name = "language", required = false) String language){
        StoryLikeResponse storyLike = storyLikeService.update(storyLikeDto, language);
        return ResponseEntity.ok(storyLike);
    }
}
