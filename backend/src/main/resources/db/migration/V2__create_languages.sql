CREATE TABLE IF NOT EXISTS public.languages
(
    id bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
    language character varying(255),
    countryflag character varying(255),
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT languages_pkey PRIMARY KEY (id)
);