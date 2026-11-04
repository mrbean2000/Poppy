CREATE TABLE story_like (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
--      user_id BIGINT NOT NULL,
        post_id BIGINT NOT NULL,
        liked BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
--      CONSTRAINT uk_user_post UNIQUE (user_id, post_id)
);