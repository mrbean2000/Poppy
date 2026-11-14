package com.luv2code.springboot.cruddemo.service;

import com.luv2code.springboot.cruddemo.dao.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.json.JsonMapper;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;

@Service
public class RecentHistoryService {
    private final JdbcTemplate jdbc;
    private final UserRepository users;
    private final JsonMapper json;

    public RecentHistoryService(JdbcTemplate jdbc, UserRepository users, JsonMapper json) {
        this.jdbc = jdbc;
        this.users = users;
        this.json = json;
    }

    private int userId(String uid) {
        return users.findByFirebaseUid(uid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User profile not found."))
                .getId();
    }

    private void validateKind(String kind) {
        if (!"articles".equals(kind) && !"podcasts".equals(kind)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid history type.");
        }
    }

    public List<Object> list(String uid, String kind) {
        validateKind(kind);
        return jdbc.query("""
                SELECT (item || jsonb_build_object('viewedAt',
                    to_char(viewed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')))::text
                FROM recent_history WHERE user_id = ? AND kind = ?
                ORDER BY viewed_at DESC, id DESC
                """, (row, index) -> json.readValue(row.getString(1), Object.class), userId(uid), kind);
    }

    @Transactional
    public void record(String uid, String kind, Map<String, Object> item) {
        validateKind(kind);
        if (item == null || !(item.get("key") instanceof String key) || key.isBlank() || key.length() > 8192) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A valid history item key is required.");
        }
        if ("podcasts".equals(kind)) {
            if (!(item.get("channel") instanceof Map<?, ?>)
                    || !(item.get("episode") instanceof Map<?, ?> episode)
                    || !(episode.get("episodeUrl") instanceof String audioUrl)
                    || audioUrl.isBlank() || !key.equals(audioUrl)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A valid podcast episode is required.");
            }
        } else {
            if (!(item.get("id") instanceof Number id) || id.longValue() <= 0
                    || id.doubleValue() != id.longValue()
                    || !(item.get("languageId") instanceof Number languageId) || languageId.longValue() <= 0
                    || languageId.doubleValue() != languageId.longValue()
                    || !(item.get("language") instanceof String language)
                    || (!"Chinese".equals(language) && !"Japanese".equals(language) && !"Korean".equals(language))
                    || !key.equals(languageId.longValue() + ":" + id.longValue())
                    || !(item.get("title") instanceof String)
                    || !(item.get("imageUrl") instanceof String)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A valid article is required.");
            }
        }
        String encoded = json.writeValueAsString(item);
        if (encoded.getBytes(StandardCharsets.UTF_8).length > 65536) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "History item is too large.");
        }
        int userId = userId(uid);
        jdbc.queryForObject("SELECT id FROM \"user\" WHERE id = ? FOR UPDATE", Integer.class, userId);
        jdbc.update("""
                INSERT INTO recent_history (user_id, kind, item_key_hash, item, viewed_at)
                VALUES (?, ?, ?, CAST(? AS jsonb), clock_timestamp())
                ON CONFLICT (user_id, kind, item_key_hash)
                DO UPDATE SET item = EXCLUDED.item, viewed_at = EXCLUDED.viewed_at
                """, userId, kind, sha256(key), encoded);
    }

    private String sha256(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable.", exception);
        }
    }
}
