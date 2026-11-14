ALTER TABLE public.passage RENAME TO chinese_passage;
ALTER TABLE public.user_passage RENAME TO user_chinese_passage;

ALTER INDEX IF EXISTS public.uq_passage_source_url RENAME TO uq_chinese_passage_source_url;
ALTER INDEX IF EXISTS public.idx_user_passage_passage_id RENAME TO idx_user_chinese_passage_passage_id;
