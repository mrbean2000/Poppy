package com.luv2code.springboot.cruddemo.dao;

import com.luv2code.springboot.cruddemo.entity.StoryLike;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StoryLikeRepository extends JpaRepository<StoryLike, Integer> {
	StoryLike findByPostId(int postId);
}
