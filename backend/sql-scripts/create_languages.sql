-- Table: public.languages

-- DROP TABLE IF EXISTS public.languages;

CREATE TABLE IF NOT EXISTS public.languages
(
    id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
    language character varying(255) COLLATE pg_catalog."default",
    countryflag character varying(255) COLLATE pg_catalog."default",
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT languages_pkey PRIMARY KEY (id)
    )

    TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.languages
    OWNER to postgres;