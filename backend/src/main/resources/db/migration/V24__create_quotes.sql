-- Table: public.quotes

-- DROP TABLE IF EXISTS public.quotes;

CREATE TABLE IF NOT EXISTS public.quotes
(
    user_id serial NOT NULL,
    quoter character varying(255) COLLATE pg_catalog."default" NOT NULL,
    quote character varying(255) COLLATE pg_catalog."default" NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
                             CONSTRAINT quotes_pkey PRIMARY KEY (user_id),
    CONSTRAINT quotes_quote_key UNIQUE (quote)
    )

    TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.quotes
    OWNER to postgres;