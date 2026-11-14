CREATE TABLE IF NOT EXISTS public.korean_passage (
                                                     id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                                                     title TEXT,
                                                     passage TEXT,
                                                     image_url VARCHAR(2048) NULL,
    source_url VARCHAR(2048) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

CREATE UNIQUE INDEX IF NOT EXISTS uq_korean_passage_source_url
    ON public.korean_passage(source_url) WHERE source_url IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.user_korean_passage (
                                                          user_id INTEGER NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    passage_id BIGINT NOT NULL REFERENCES public.korean_passage(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, passage_id)
    );

CREATE INDEX IF NOT EXISTS idx_user_korean_passage_passage_id
    ON public.user_korean_passage(passage_id);