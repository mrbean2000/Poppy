package com.luv2code.springboot.cruddemo.service;

import com.luv2code.springboot.cruddemo.dto.PassageDto;
import com.luv2code.springboot.cruddemo.dto.StoryLikeDto;
import com.luv2code.springboot.cruddemo.entity.StoryLike;

import java.util.List;

public interface StoryLikeService {
    StoryLike getByPassageId(int passageId);

//    StoryLike create(PassageDto thePassage);

    StoryLike update(StoryLikeDto storyLikeDto);
}
