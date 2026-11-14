CREATE TABLE setting (
     id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
     user_id BIGINT NOT NULL,
     darkmode BOOLEAN NOT NULL DEFAULT false,
     profile_picture_url TEXT,
     home_walkthrough_completed BOOLEAN NOT NULL DEFAULT false,
     createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)