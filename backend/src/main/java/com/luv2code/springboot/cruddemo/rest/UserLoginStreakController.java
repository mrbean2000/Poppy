package com.luv2code.springboot.cruddemo.rest;

import com.luv2code.springboot.cruddemo.dao.UserLoginStreakRepository;
import com.luv2code.springboot.cruddemo.dto.UserLoginStreakResponse;
import com.luv2code.springboot.cruddemo.entity.UserLoginStreak;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/users")
public class UserLoginStreakController {
    private final UserLoginStreakRepository streakRepository;

    public UserLoginStreakController(UserLoginStreakRepository streakRepository) {
        this.streakRepository = streakRepository;
    }

    @PostMapping("/{firebaseUid}/login-streak")
    @Transactional
    public ResponseEntity<UserLoginStreakResponse> recordLogin(
            @PathVariable String firebaseUid
    ) {
        if (firebaseUid.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A Firebase UID is required."
            );
        }

        LocalDate today = LocalDate.now();
        UserLoginStreak streak = streakRepository.findByFirebaseUid(firebaseUid)
                .orElseGet(() -> {
                    UserLoginStreak newStreak = new UserLoginStreak();
                    newStreak.setFirebaseUid(firebaseUid);
                    newStreak.setCurrentStreak(0);
                    newStreak.setLongestStreak(0);
                    return newStreak;
                });
        boolean isNewLoginDay = !today.equals(streak.getLastLoginDate());

        if (isNewLoginDay) {
            int updatedStreak = today.minusDays(1).equals(streak.getLastLoginDate())
                    ? streak.getCurrentStreak() + 1
                    : 1;
            streak.setCurrentStreak(updatedStreak);
            streak.setLongestStreak(
                    Math.max(streak.getLongestStreak(), updatedStreak)
            );
            streak.setLastLoginDate(today);
            streak.setUpdatedAt(LocalDateTime.now());
            streak = streakRepository.save(streak);
        }

        return ResponseEntity.ok(toResponse(streak));
    }

    private UserLoginStreakResponse toResponse(UserLoginStreak streak) {
        return new UserLoginStreakResponse(
                streak.getCurrentStreak(),
                streak.getLongestStreak(),
                streak.getLastLoginDate()
        );
    }
}
