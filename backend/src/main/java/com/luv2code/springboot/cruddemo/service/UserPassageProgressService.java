package com.luv2code.springboot.cruddemo.service;

import com.luv2code.springboot.cruddemo.dto.LastReadPassageDto;

public interface UserPassageProgressService {
    LastReadPassageDto getLastReadPassageByUserId(int userId, Integer targetLanguageId);

    void updateLastReadPassage(int userId, long passageId, Integer targetLanguageId);
}
