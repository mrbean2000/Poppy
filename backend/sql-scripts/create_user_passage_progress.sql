CREATE TABLE user_passage_progress (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL,
    last_read_passage_id INT NOT NULL,
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Key linkage to Passage
   CONSTRAINT fk_user_passage_progress_passage
       FOREIGN KEY (last_read_passage_id)
           REFERENCES passage(id)
           ON DELETE CASCADE
);