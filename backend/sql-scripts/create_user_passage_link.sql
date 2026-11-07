ALTER TABLE public.passage
    ADD COLUMN IF NOT EXISTS source_url VARCHAR(2048) NULL;

CREATE TABLE IF NOT EXISTS public.user_passage (
    user_id INTEGER NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    passage_id BIGINT NOT NULL REFERENCES public.passage(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, passage_id)
);

CREATE INDEX IF NOT EXISTS idx_user_passage_passage_id
    ON public.user_passage(passage_id);

-- Carry over the single owner stored on passage, if that column still exists.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'passage'
          AND column_name = 'user_id'
    ) THEN
        INSERT INTO public.user_passage (user_id, passage_id)
        SELECT user_id, id FROM public.passage WHERE user_id IS NOT NULL
        ON CONFLICT DO NOTHING;

        ALTER TABLE public.passage DROP COLUMN user_id;
    END IF;
END $$;

-- Fails if duplicate source_url rows already exist; find them with:
--   SELECT source_url, COUNT(*) FROM public.passage
--   WHERE source_url IS NOT NULL GROUP BY source_url HAVING COUNT(*) > 1;
CREATE UNIQUE INDEX IF NOT EXISTS uq_passage_source_url
    ON public.passage(source_url) WHERE source_url IS NOT NULL;
