package com.luv2code.springboot.cruddemo.service;

import com.luv2code.springboot.cruddemo.entity.Passage;

public interface UserPassageProgressService {
    Passage getLastReadPassageByUserId(int userId);

    void updateLastReadPassage(int userId, int passageId);
}
