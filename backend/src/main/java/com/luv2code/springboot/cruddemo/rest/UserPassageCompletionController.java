package com.luv2code.springboot.cruddemo.rest;

import com.luv2code.springboot.cruddemo.dao.PassageRepository;
import com.luv2code.springboot.cruddemo.dao.UserPassageCompletionRepository;
import com.luv2code.springboot.cruddemo.entity.UserPassageCompletion;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class UserPassageCompletionController {

    private final UserPassageCompletionRepository completionRepository;
    private final PassageRepository passageRepository;

    public UserPassageCompletionController(UserPassageCompletionRepository completionRepository,
                                           PassageRepository passageRepository) {
        this.completionRepository = completionRepository;
        this.passageRepository = passageRepository;
    }

    @PostMapping("/UserPassageCompletion/{userId}/passage/{passageId}")
    public Map<String, Long> recordCompletion(@PathVariable int userId, @PathVariable int passageId) {
        if (!passageRepository.existsById(passageId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Passage not found");
        }

        completionRepository.save(
                new UserPassageCompletion(userId, (long) passageId, LocalDateTime.now()));
        return Map.of("completedToday", countToday(userId));
    }

    @GetMapping("/UserPassageCompletion/{userId}/today-count")
    public Map<String, Long> getTodayCount(@PathVariable int userId) {
        return Map.of("completedToday", countToday(userId));
    }

    private long countToday(int userId) {
        LocalDateTime start = LocalDate.now().atStartOfDay();
        return completionRepository
                .countByUserIdAndCompletedAtGreaterThanEqualAndCompletedAtLessThan(
                        userId, start, start.plusDays(1));
    }
}
