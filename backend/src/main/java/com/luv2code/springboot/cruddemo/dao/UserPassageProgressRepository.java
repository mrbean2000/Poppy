package com.luv2code.springboot.cruddemo.dao;

import com.luv2code.springboot.cruddemo.entity.Passage;
import com.luv2code.springboot.cruddemo.entity.UserPassageProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserPassageProgressRepository extends JpaRepository<UserPassageProgress, Integer> {
    @Query("select new Passage(" +
            "passage.id, passage.passage, passage.title, " +
            "passage.imageUrl) " +
            "from UserPassageProgress progress " +
            "join progress.lastReadPassage passage " +
            "where progress.userId = :userId")
    Passage findByUserId(@Param("userId") int userId);
}
