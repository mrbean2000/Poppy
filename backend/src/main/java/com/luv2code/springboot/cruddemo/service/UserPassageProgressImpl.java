package com.luv2code.springboot.cruddemo.service;

import com.luv2code.springboot.cruddemo.dao.UserPassageProgressRepository;
import com.luv2code.springboot.cruddemo.entity.Passage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserPassageProgressImpl implements UserPassageProgressService{

    private UserPassageProgressRepository userPassageProgressRepository;

    @Autowired
    public UserPassageProgressImpl(UserPassageProgressRepository userPassageProgressRepository) {
        this.userPassageProgressRepository = userPassageProgressRepository;
    }

    @Override
    public Passage getLastReadPassageByUserId(int userId) {
        return userPassageProgressRepository.findByUserId(userId);
    }

}
