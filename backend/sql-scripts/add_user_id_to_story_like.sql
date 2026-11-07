DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'story_like' AND column_name = 'user_id'
    ) THEN
        -- Existing likes belong to no user, so they are discarded.
        DELETE FROM story_like;
        ALTER TABLE story_like ADD COLUMN user_id INT NOT NULL;
    END IF;
END $$;

ALTER TABLE story_like
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_story_like_user') THEN
        ALTER TABLE story_like
            ADD CONSTRAINT fk_story_like_user
            FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_story_like_passage') THEN
        ALTER TABLE story_like
            ADD CONSTRAINT fk_story_like_passage
            FOREIGN KEY (post_id) REFERENCES passage(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uk_user_post') THEN
        ALTER TABLE story_like
            ADD CONSTRAINT uk_user_post UNIQUE (user_id, post_id);
    END IF;
END $$;
