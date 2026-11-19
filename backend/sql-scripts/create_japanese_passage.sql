-- Table: public.japanese_passage

-- DROP TABLE IF EXISTS public.japanese_passage;

CREATE TABLE IF NOT EXISTS public.japanese_passage
(
    id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
    title text COLLATE pg_catalog."default",
    passage text COLLATE pg_catalog."default",
    image_url character varying(2048) COLLATE pg_catalog."default",
    source_url character varying(2048) COLLATE pg_catalog."default",
    created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
                             CONSTRAINT japanese_passage_pkey PRIMARY KEY (id)
    )

    TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.japanese_passage
    OWNER to postgres;
-- Index: uq_japanese_passage_source_url

-- DROP INDEX IF EXISTS public.uq_japanese_passage_source_url;

CREATE UNIQUE INDEX IF NOT EXISTS uq_japanese_passage_source_url
    ON public.japanese_passage USING btree
    (source_url COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default
    WHERE source_url IS NOT NULL;