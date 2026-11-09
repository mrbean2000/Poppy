CREATE TABLE passage (
     id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
     title TEXT,
     passage TEXT,
     image_url VARCHAR(2048) NULL
 )