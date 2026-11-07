package com.luv2code.springboot.cruddemo.service;

import com.luv2code.springboot.cruddemo.dao.UserPassageProgressRepository;
import com.luv2code.springboot.cruddemo.dao.PassageRepository;
import com.luv2code.springboot.cruddemo.entity.Passage;
import com.luv2code.springboot.cruddemo.entity.UserPassageProgress;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class UserPassageProgressImpl implements UserPassageProgressService{

    private UserPassageProgressRepository userPassageProgressRepository;

    private PassageRepository passageRepository;

    @Autowired
    public UserPassageProgressImpl(UserPassageProgressRepository userPassageProgressRepository,
                                   PassageRepository passageRepository) {
        this.userPassageProgressRepository = userPassageProgressRepository;
        this.passageRepository = passageRepository;
    }

    @Override
    @Transactional
    public void updateLastReadPassage(int userId, int passageId) {
        Passage passage = passageRepository.findById(passageId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Passage not found"));

        List<UserPassageProgress> rows =
                userPassageProgressRepository.findByUserIdOrderByLastReadAtDescIdDesc((long) userId);
        UserPassageProgress progress = rows.isEmpty()
                ? new UserPassageProgress((long) userId, passage, null)
                : rows.get(0);

        progress.setLastReadPassage(passage);
        progress.setLastReadAt(LocalDateTime.now());
        userPassageProgressRepository.save(progress);
    }

    @Override
    public Passage getLastReadPassageByUserId(int userId) {
        return userPassageProgressRepository.findByUserId(userId);
    }

}
