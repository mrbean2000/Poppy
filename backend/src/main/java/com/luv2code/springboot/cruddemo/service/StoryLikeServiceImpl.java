package com.luv2code.springboot.cruddemo.service;

import com.luv2code.springboot.cruddemo.dto.StoryLikeDto;
import com.luv2code.springboot.cruddemo.dto.StoryLikeResponse;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class StoryLikeServiceImpl implements StoryLikeService {
    private final JdbcTemplate jdbcTemplate;

    private static final RowMapper<StoryLikeResponse> ROW_MAPPER = (row, rowNumber) ->
            new StoryLikeResponse(row.getLong("id"), row.getInt("user_id"), row.getLong("post_id"),
                    row.getBoolean("liked"), row.getObject("created_at", LocalDateTime.class),
                    row.getObject("updated_at", LocalDateTime.class));

    public StoryLikeServiceImpl(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private String tableFor(String language) {
        if (language == null || language.equalsIgnoreCase("Chinese")) {
            return "public.story_like_chinese";
        }
        if (language.equalsIgnoreCase("Japanese")) {
            return "public.story_like_japanese";
        }
        if (language.equalsIgnoreCase("Korean")) {
            return "public.story_like_korean";
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Language must be Chinese, Japanese or Korean.");
    }

    @Override
    public StoryLikeResponse getByUserAndPassage(int userId, long passageId, String language) {
        String table = tableFor(language);
        List<StoryLikeResponse> matches = jdbcTemplate.query(
                "SELECT id, user_id, post_id, liked, created_at, updated_at FROM " + table
                        + " WHERE user_id = ? AND post_id = ?",
                ROW_MAPPER, userId, passageId);
        if (!matches.isEmpty()) {
            return matches.getFirst();
        }
        LocalDateTime now = LocalDateTime.now();
        return new StoryLikeResponse(0, userId, passageId, false, now, now);
    }

    @Override
    public StoryLikeResponse update(StoryLikeDto request, String language) {
        if (request == null || request.getUserId() == null || request.getUserId() <= 0
                || request.getPostId() == null || request.getPostId() <= 0 || request.getLike() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A valid userId, postId and like value are required.");
        }
        String table = tableFor(language);
        return jdbcTemplate.queryForObject(
                "INSERT INTO " + table + " (user_id, post_id, liked) VALUES (?, ?, ?)"
                        + " ON CONFLICT (user_id, post_id) DO UPDATE"
                        + " SET liked = EXCLUDED.liked, updated_at = CURRENT_TIMESTAMP"
                        + " RETURNING id, user_id, post_id, liked, created_at, updated_at",
                ROW_MAPPER, request.getUserId(), request.getPostId(), request.getLike());
    }
}
