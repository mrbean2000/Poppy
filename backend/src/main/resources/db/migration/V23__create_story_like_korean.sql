-- Table: public.story_like_korean

-- DROP TABLE IF EXISTS public.story_like_korean;

CREATE TABLE IF NOT EXISTS public.story_like_korean
(
    id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
    user_id integer NOT NULL,
    post_id bigint NOT NULL,
    liked boolean NOT NULL DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT story_like_korean_pkey PRIMARY KEY (id),
    CONSTRAINT korean_user_post UNIQUE (user_id, post_id),
    CONSTRAINT story_like_korean_post_id_fkey FOREIGN KEY (post_id)
    REFERENCES public.korean_passage (id) MATCH SIMPLE
                         ON UPDATE NO ACTION
                         ON DELETE CASCADE,
    CONSTRAINT story_like_korean_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES public."user" (id) MATCH SIMPLE
                         ON UPDATE NO ACTION
                         ON DELETE CASCADE
    )

    TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.story_like_korean
    OWNER to postgres;