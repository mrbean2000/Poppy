CREATE TABLE user_passage_progress (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL,
    target_language_id INTEGER NOT NULL REFERENCES languages(id),
    last_read_passage_id BIGINT,
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

   CONSTRAINT uq_user_passage_progress_user_language
       UNIQUE (user_id, target_language_id)
);