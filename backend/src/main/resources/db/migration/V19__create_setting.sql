-- Table: public.setting

-- DROP TABLE IF EXISTS public.setting;

CREATE TABLE IF NOT EXISTS public.setting
(
    id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
    user_id bigint NOT NULL,
    darkmode boolean NOT NULL DEFAULT false,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp(6) without time zone,
    "updatedAt" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            nativelanguageid bigint,
                            targetlanguageid bigint,
                            daily_listening_goal integer,
                            daily_reading_goal integer,
                            date_of_birth date,
                            practice_reminders_enabled boolean,
                            profile_picture_url text COLLATE pg_catalog."default",
                            home_walkthrough_completed boolean NOT NULL DEFAULT false,
                            CONSTRAINT setting_pkey PRIMARY KEY (id)
    )

    TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.setting
    OWNER to postgres;