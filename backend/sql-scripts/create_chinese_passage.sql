-- Table: public.chinese_passage

-- DROP TABLE IF EXISTS public.chinese_passage;

CREATE TABLE IF NOT EXISTS public.chinese_passage
(
    id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
    title character varying(255) COLLATE pg_catalog."default",
    passage text COLLATE pg_catalog."default",
    image_url character varying(255) COLLATE pg_catalog."default",
    source_url character varying(255) COLLATE pg_catalog."default",
    CONSTRAINT passage_pkey PRIMARY KEY (id)
    )

    TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.chinese_passage
    OWNER to postgres;
-- Index: uq_chinese_passage_source_url

-- DROP INDEX IF EXISTS public.uq_chinese_passage_source_url;

CREATE UNIQUE INDEX IF NOT EXISTS uq_chinese_passage_source_url
    ON public.chinese_passage USING btree
    (source_url COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default
    WHERE source_url IS NOT NULL;