CREATE TABLE IF NOT EXISTS user_passage_completion (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    passage_id BIGINT NOT NULL REFERENCES passage(id) ON DELETE CASCADE,
    completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_passage_completion_user_completed
    ON user_passage_completion (user_id, completed_at);
