-- Table: public.user_japanese_passage

-- DROP TABLE IF EXISTS public.user_japanese_passage;

CREATE TABLE IF NOT EXISTS public.user_japanese_passage
(
    user_id integer NOT NULL,
    passage_id bigint NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT user_japanese_passage_pkey PRIMARY KEY (user_id, passage_id),
    CONSTRAINT user_japanese_passage_passage_id_fkey FOREIGN KEY (passage_id)
    REFERENCES public.japanese_passage (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE,
    CONSTRAINT user_japanese_passage_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES public."user" (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE
    )

    TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.user_japanese_passage
    OWNER to postgres;
-- Index: idx_user_japanese_passage_passage_id

-- DROP INDEX IF EXISTS public.idx_user_japanese_passage_passage_id;

CREATE INDEX IF NOT EXISTS idx_user_japanese_passage_passage_id
    ON public.user_japanese_passage USING btree
    (passage_id ASC NULLS LAST)
    TABLESPACE pg_default;