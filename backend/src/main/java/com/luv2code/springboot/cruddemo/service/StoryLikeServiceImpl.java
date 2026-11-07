package com.luv2code.springboot.cruddemo.service;

import com.luv2code.springboot.cruddemo.dao.StoryLikeRepository;
import com.luv2code.springboot.cruddemo.dto.PassageDto;
import com.luv2code.springboot.cruddemo.dto.StoryLikeDto;
import com.luv2code.springboot.cruddemo.entity.StoryLike;
import com.luv2code.springboot.cruddemo.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

@Service
public class StoryLikeServiceImpl implements StoryLikeService {

    private StoryLikeRepository storyLikeRepository;

    @Autowired
    public StoryLikeServiceImpl(StoryLikeRepository theStoryLikeRepository){
        storyLikeRepository = theStoryLikeRepository;
    }

    @Override
    public StoryLike getByUserAndPassage(int userId, int passageId){
        StoryLike storyLike = storyLikeRepository.findByUserIdAndPostId(userId, passageId);

        if(storyLike == null){
            StoryLike notLiked = new StoryLike();
            notLiked.setUserId(userId);
            notLiked.setPostId(passageId);
            notLiked.setLike(false);
            return notLiked;
        }

        return storyLike;
    }

//    public StoryLike findById(int theId){
//        Passage passage = new Passage(0, thePassage.getPassage(), thePassage.getTitle(), thePassage.getImageUrl());
//
//        return passageRepository.save(passage);
//
//    }

    @Override
    public StoryLike update(StoryLikeDto storyLikeDto){

        if(storyLikeDto.getUserId() == null){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "userId is required");
        }

        int userId = storyLikeDto.getUserId();
        int postId = storyLikeDto.getPostId();

        StoryLike storyLike = storyLikeRepository.findByUserIdAndPostId(userId, postId);
        if(storyLike == null){
            storyLike = new StoryLike();
            storyLike.setUserId(userId);
            storyLike.setPostId(postId);
        }

        storyLike.setLike(storyLikeDto.getLike());
        storyLike.setUpdatedAt(LocalDateTime.now());

        return storyLikeRepository.save(storyLike);

    }
}
