-- Table: public.story_like_chinese

-- DROP TABLE IF EXISTS public.story_like_chinese;

CREATE TABLE IF NOT EXISTS public.story_like_chinese
(
    id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
    post_id bigint NOT NULL,
    liked boolean NOT NULL DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    user_id integer NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT story_like_chinese_pkey PRIMARY KEY (id),
    CONSTRAINT story_like_chinese_user_id_post_id_key UNIQUE (user_id, post_id),
    CONSTRAINT fk_story_like_chinese_passage FOREIGN KEY (post_id)
    REFERENCES public.chinese_passage (id) MATCH SIMPLE
                         ON UPDATE NO ACTION
                         ON DELETE CASCADE,
    CONSTRAINT fk_story_like_chinese_user FOREIGN KEY (user_id)
    REFERENCES public."user" (id) MATCH SIMPLE
                         ON UPDATE NO ACTION
                         ON DELETE CASCADE
    )

    TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.story_like_chinese
    OWNER to postgres;