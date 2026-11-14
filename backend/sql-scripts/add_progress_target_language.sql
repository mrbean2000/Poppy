BEGIN;

ALTER TABLE public.user_passage_progress
    ADD COLUMN IF NOT EXISTS target_language_id INTEGER,
    ALTER COLUMN last_read_passage_id DROP NOT NULL;

DO $$
DECLARE
    chinese_language_id INTEGER;
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.user_passage_progress
        WHERE target_language_id IS NOT NULL
    ) THEN
        RAISE EXCEPTION 'Progress already contains target language data; migration requires review';
    END IF;

    SELECT MIN(id) INTO chinese_language_id
    FROM public.languages
    WHERE lower(trim(language)) = 'simplified chinese'
    HAVING COUNT(*) = 1;

    IF chinese_language_id IS NULL THEN
        RAISE EXCEPTION 'Expected exactly one Simplified Chinese language';
    END IF;

    UPDATE public.user_passage_progress
    SET target_language_id = chinese_language_id;
END $$;

DO $$
DECLARE
    fk RECORD;
    passage_attnum SMALLINT;
BEGIN
    SELECT attnum INTO passage_attnum
    FROM pg_attribute
    WHERE attrelid = 'public.user_passage_progress'::regclass
      AND attname = 'last_read_passage_id'
      AND NOT attisdropped;

    FOR fk IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.user_passage_progress'::regclass
          AND contype = 'f'
          AND conkey = ARRAY[passage_attnum]::smallint[]
    LOOP
        EXECUTE format('ALTER TABLE public.user_passage_progress DROP CONSTRAINT %I', fk.conname);
    END LOOP;
END $$;

ALTER TABLE public.user_passage_progress
    ALTER COLUMN last_read_passage_id TYPE BIGINT
        USING last_read_passage_id::BIGINT,
    ALTER COLUMN target_language_id SET NOT NULL,
    ADD CONSTRAINT fk_user_passage_progress_language
        FOREIGN KEY (target_language_id) REFERENCES public.languages(id),
    ADD CONSTRAINT uq_user_passage_progress_user_language
        UNIQUE (user_id, target_language_id);

ALTER TABLE public.user_passage_progress
    DROP COLUMN IF EXISTS japanese_passage_id;

COMMIT;
