ALTER TABLE public.setting
    ADD COLUMN IF NOT EXISTS daily_reading_goal INTEGER,
    ADD COLUMN IF NOT EXISTS daily_listening_goal INTEGER,
    ADD COLUMN IF NOT EXISTS date_of_birth DATE,
    ADD COLUMN IF NOT EXISTS practice_reminders_enabled BOOLEAN;
