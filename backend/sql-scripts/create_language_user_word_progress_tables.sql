BEGIN;

CREATE TABLE public.user_word_progress_chinese
    (LIKE public.user_word_progress INCLUDING ALL);

CREATE TABLE public.user_word_progress_japanese
    (LIKE public.user_word_progress INCLUDING ALL);

COMMIT;
