BEGIN;

CREATE TABLE public.story_like_chinese
    (LIKE public.story_like INCLUDING ALL);

ALTER TABLE public.story_like_chinese
    ADD CONSTRAINT fk_story_like_chinese_user
        FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_story_like_chinese_passage
        FOREIGN KEY (post_id) REFERENCES public.chinese_passage(id) ON DELETE CASCADE;

CREATE TABLE public.story_like_japanese
    (LIKE public.story_like INCLUDING ALL);

ALTER TABLE public.story_like_japanese
    ADD CONSTRAINT fk_story_like_japanese_user
        FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_story_like_japanese_passage
        FOREIGN KEY (post_id) REFERENCES public.japanese_passage(id) ON DELETE CASCADE;

COMMIT;
