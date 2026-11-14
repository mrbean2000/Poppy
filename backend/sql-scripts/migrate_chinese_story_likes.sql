INSERT INTO public.story_like_chinese
    (user_id, post_id, liked, created_at, updated_at)
SELECT user_id, post_id, liked, created_at, updated_at
FROM public.story_like
ON CONFLICT (user_id, post_id) DO NOTHING;
