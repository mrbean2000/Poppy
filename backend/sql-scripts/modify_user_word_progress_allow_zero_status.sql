ALTER TABLE user_word_progress
    DROP CONSTRAINT IF EXISTS user_word_progress_status_level_check;

ALTER TABLE user_word_progress
    ADD CONSTRAINT user_word_progress_status_level_check
    CHECK (status_level BETWEEN 0 AND 4);