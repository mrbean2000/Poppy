package com.luv2code.springboot.cruddemo.service;

import com.luv2code.springboot.cruddemo.dto.StoryLikeDto;
import com.luv2code.springboot.cruddemo.dto.StoryLikeResponse;

public interface StoryLikeService {
    StoryLikeResponse getByUserAndPassage(int userId, long passageId, String language);

    StoryLikeResponse update(StoryLikeDto storyLikeDto, String language);
}
