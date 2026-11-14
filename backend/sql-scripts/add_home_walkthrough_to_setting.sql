ALTER TABLE public.setting
    ADD COLUMN IF NOT EXISTS home_walkthrough_completed BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE public.setting
    SET home_walkthrough_completed = TRUE
    WHERE home_walkthrough_completed IS NULL;

ALTER TABLE public.setting
    ALTER COLUMN home_walkthrough_completed SET NOT NULL,
    ALTER COLUMN home_walkthrough_completed SET DEFAULT FALSE;
