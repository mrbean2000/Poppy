package com.luv2code.springboot.cruddemo.dto;

import java.time.LocalDate;

public record UserLoginStreakResponse(
        int currentStreak,
        int longestStreak,
        LocalDate lastLoginDate
) {
}
