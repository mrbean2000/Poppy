-- Table: public.story_like_japanese

-- DROP TABLE IF EXISTS public.story_like_japanese;

CREATE TABLE IF NOT EXISTS public.story_like_japanese
(
    id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
    post_id bigint NOT NULL,
    liked boolean NOT NULL DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    user_id integer NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT story_like_japanese_pkey PRIMARY KEY (id),
    CONSTRAINT story_like_japanese_user_id_post_id_key UNIQUE (user_id, post_id),
    CONSTRAINT fk_story_like_japanese_passage FOREIGN KEY (post_id)
    REFERENCES public.japanese_passage (id) MATCH SIMPLE
                         ON UPDATE NO ACTION
                         ON DELETE CASCADE,
    CONSTRAINT fk_story_like_japanese_user FOREIGN KEY (user_id)
    REFERENCES public."user" (id) MATCH SIMPLE
                         ON UPDATE NO ACTION
                         ON DELETE CASCADE
    )

    TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.story_like_japanese
    OWNER to postgres;