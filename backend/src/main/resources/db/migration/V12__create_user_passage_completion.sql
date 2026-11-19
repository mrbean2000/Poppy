-- Table: public.user_passage_completion

-- DROP TABLE IF EXISTS public.user_passage_completion;

CREATE TABLE IF NOT EXISTS public.user_passage_completion
(
    id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
    user_id integer NOT NULL,
    passage_id bigint NOT NULL,
    completed_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT user_passage_completion_pkey PRIMARY KEY (id),
    CONSTRAINT user_passage_completion_passage_id_fkey FOREIGN KEY (passage_id)
    REFERENCES public.chinese_passage (id) MATCH SIMPLE
                           ON UPDATE NO ACTION
                           ON DELETE CASCADE,
    CONSTRAINT user_passage_completion_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES public."user" (id) MATCH SIMPLE
                           ON UPDATE NO ACTION
                           ON DELETE CASCADE
    )

    TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.user_passage_completion
    OWNER to postgres;
-- Index: idx_user_passage_completion_user_completed

-- DROP INDEX IF EXISTS public.idx_user_passage_completion_user_completed;

CREATE INDEX IF NOT EXISTS idx_user_passage_completion_user_completed
    ON public.user_passage_completion USING btree
    (user_id ASC NULLS LAST, completed_at ASC NULLS LAST)
    TABLESPACE pg_default;