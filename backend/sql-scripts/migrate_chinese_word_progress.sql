INSERT INTO public.user_word_progress_chinese
    (user_id, word, status_level, lookup_count, is_favorite, last_lookup_at)
SELECT user_id, word, status_level, lookup_count, is_favorite, last_lookup_at
FROM public.user_word_progress
ON CONFLICT (user_id, word) DO NOTHING;
