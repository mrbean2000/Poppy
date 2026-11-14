BEGIN;

ALTER TABLE public.user_passage_progress
    DROP CONSTRAINT IF EXISTS ck_user_passage_progress_one_passage;

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
        USING last_read_passage_id::BIGINT;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_attribute
        WHERE attrelid = 'public.user_passage_progress'::regclass
          AND attname = 'japanese_passage_id'
          AND NOT attisdropped
    ) THEN
        UPDATE public.user_passage_progress
        SET last_read_passage_id = japanese_passage_id
        WHERE japanese_passage_id IS NOT NULL;
    END IF;
END $$;

ALTER TABLE public.user_passage_progress
    DROP COLUMN IF EXISTS japanese_passage_id;

COMMIT;
