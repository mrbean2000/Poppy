package com.luv2code.springboot.cruddemo.dto;

import java.time.LocalDateTime;

public record StoryLikeResponse(
        long id,
        int userId,
        long postId,
        boolean like,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
