CREATE TABLE user_word_progress (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    word VARCHAR(255) NOT NULL,
    status_level INTEGER NOT NULL DEFAULT 1 CHECK (status_level BETWEEN 0 AND 4),
    lookup_count INTEGER NOT NULL DEFAULT 0,
    is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
    last_lookup_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_user_word_progress UNIQUE (user_id, word)
);