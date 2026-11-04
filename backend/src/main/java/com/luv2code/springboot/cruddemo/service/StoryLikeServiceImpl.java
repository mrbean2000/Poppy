package com.luv2code.springboot.cruddemo.service;

import com.luv2code.springboot.cruddemo.dao.StoryLikeRepository;
import com.luv2code.springboot.cruddemo.dto.PassageDto;
import com.luv2code.springboot.cruddemo.dto.StoryLikeDto;
import com.luv2code.springboot.cruddemo.entity.StoryLike;
import com.luv2code.springboot.cruddemo.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class StoryLikeServiceImpl implements StoryLikeService {

    private StoryLikeRepository storyLikeRepository;

    @Autowired
    public StoryLikeServiceImpl(StoryLikeRepository theStoryLikeRepository){
        storyLikeRepository = theStoryLikeRepository;
    }

    @Override
    public StoryLike getByPassageId(int passageId){
        StoryLike storyLike = storyLikeRepository.findByPostId(passageId);

        if(storyLike == null){
            throw new ResourceNotFoundException("Like not found for passage id: " + passageId);
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

        int storyLikeId = storyLikeDto.getPostId();
        StoryLike storyLike = storyLikeRepository.findByPostId(storyLikeId);
        if(storyLike == null){
            throw new ResourceNotFoundException("Like not found for passage id: " + storyLikeId);
        }

        storyLike.setLike(storyLikeDto.getLike());

        return storyLikeRepository.save(storyLike);

    }
}
