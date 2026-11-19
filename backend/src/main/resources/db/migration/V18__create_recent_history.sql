-- Table: public.recent_history

-- DROP TABLE IF EXISTS public.recent_history;

CREATE TABLE IF NOT EXISTS public.recent_history
(
    id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
    user_id integer NOT NULL,
    kind character varying(16) COLLATE pg_catalog."default" NOT NULL,
    item_key_hash character(64) COLLATE pg_catalog."default" NOT NULL,
    item jsonb NOT NULL,
    viewed_at timestamp with time zone NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT recent_history_pkey PRIMARY KEY (id),
    CONSTRAINT recent_history_user_id_kind_item_key_hash_key UNIQUE (user_id, kind, item_key_hash),
    CONSTRAINT recent_history_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES public."user" (id) MATCH SIMPLE
                        ON UPDATE NO ACTION
                        ON DELETE CASCADE,
    CONSTRAINT recent_history_kind_check CHECK (kind::text = ANY (ARRAY['podcasts'::character varying, 'articles'::character varying]::text[]))
    )

    TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.recent_history
    OWNER to postgres;
-- Index: idx_recent_history_user_kind_viewed

-- DROP INDEX IF EXISTS public.idx_recent_history_user_kind_viewed;

CREATE INDEX IF NOT EXISTS idx_recent_history_user_kind_viewed
    ON public.recent_history USING btree
    (user_id ASC NULLS LAST, kind COLLATE pg_catalog."default" ASC NULLS LAST, viewed_at DESC NULLS FIRST, id DESC NULLS FIRST)
    TABLESPACE pg_default;