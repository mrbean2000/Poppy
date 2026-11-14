CREATE TABLE IF NOT EXISTS recent_history (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    kind VARCHAR(16) NOT NULL CHECK (kind IN ('podcasts', 'articles')),
    item_key_hash CHAR(64) NOT NULL,
    item JSONB NOT NULL,
    viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT clock_timestamp(),
    UNIQUE (user_id, kind, item_key_hash)
);

CREATE INDEX IF NOT EXISTS idx_recent_history_user_kind_viewed
    ON recent_history (user_id, kind, viewed_at DESC, id DESC);
