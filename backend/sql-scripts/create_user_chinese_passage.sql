-- Table: public.user_chinese_passage

-- DROP TABLE IF EXISTS public.user_chinese_passage;

CREATE TABLE IF NOT EXISTS public.user_chinese_passage
(
    passage_id integer NOT NULL,
    user_id integer NOT NULL,
    CONSTRAINT user_passage_pkey PRIMARY KEY (passage_id, user_id)
    )

    TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.user_chinese_passage
    OWNER to postgres;
-- Index: idx_user_chinese_passage_passage_id

-- DROP INDEX IF EXISTS public.idx_user_chinese_passage_passage_id;

CREATE INDEX IF NOT EXISTS idx_user_chinese_passage_passage_id
    ON public.user_chinese_passage USING btree
    (passage_id ASC NULLS LAST)
    TABLESPACE pg_default;