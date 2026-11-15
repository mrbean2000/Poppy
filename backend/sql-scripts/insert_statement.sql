-- 1. Insert languages first
INSERT INTO public.languages OVERRIDING SYSTEM VALUE VALUES
                                                         (1, 'English (US)', '🇺🇸', '2026-09-16 13:43:45.922715'),
                                                         (2, 'Japanese', '🇯🇵', '2026-09-16 13:43:45.922715'),
                                                         (4, 'Simplified Chinese', '🇨🇳', '2026-09-16 13:43:45.922715'),
                                                         (5, 'Traditional Chinese', '🇹🇼', '2026-09-16 13:43:45.922715'),
                                                         (6, 'Korean', '🇰🇷', '2026-09-16 13:43:45.922715');

-- 2. Insert user second (OVERRIDING SYSTEM VALUE placed right after table name)
INSERT INTO public."user"(
    id, created_at, date_of_birth, email, firebase_uid, first_name, last_name)
VALUES (3, '2026-11-10 11:00:12.197191', '2008-11-10', 'cmpqwdoq@gmail.com', 'wts54nLciHRLaNt5876cArYulXH3', 'Bubbles', 'Chua');

-- 3. Insert settings (OVERRIDING SYSTEM VALUE placed right after table name, duplicate columns cleaned up)
INSERT INTO public.setting (
    user_id, darkmode, created_at, "updatedAt", nativelanguageid, targetlanguageid, daily_listening_goal, daily_reading_goal, date_of_birth, practice_reminders_enabled, profile_picture_url, home_walkthrough_completed
)
VALUES (
           3, true, '2026-11-10 11:00:12.85733', '2026-11-10 11:00:12.875914+08', 1, 4, 5, 1, '2008-11-10', true, 'poppy-mascot://poppy_superman', true
       );
-- 4. Insert quotes
INSERT INTO public.quotes(
    user_id, quoter, quote, created_at) VALUES
                                            (1, 'Nelson Mandela', 'If you talk to a man in a language he understands, that goes to his head. If you talk to him in his language, that goes to his heart.', '2026-11-11 12:12:07.92203+08'),
                                            (2, 'Steve Kaufmann', 'Learning a language is like falling in love. In fact, you have to be in love to learn a language well... You just want to be with it, and even to imitate it, the highest form of appreciation.', '2026-11-11 12:12:07.92203+08'),
                                            (3, 'Steve Kaufmann', 'Only a vain fool strives for perfection. Whatever language you are learning, it is everywhere... Accept what you have achieved and you will achieve more.', '2026-11-11 12:12:07.92203+08'),
                                            (4, 'Steve Kaufmann', 'Don''t try and remember anything when''re learning a second language. You can''t force it. Let the language come to you...', '2026-11-11 12:12:07.92203+08'),
                                            (5, 'Stephen Krashen', 'We acquire language when we understand messages, when we understand what people tell us and when we understand what we read.', '2026-11-11 12:12:07.92203+08'),
                                            (6, 'Stephen Krashen', 'Language acquisition comes from input, not output; from comprehension, not production.', '2026-11-11 12:12:07.92203+08'),
                                            (7, 'Stephen Krashen', 'Language is best taught when it is being used to transmit messages, not when it is explicitly taught for conscious learning.', '2026-11-11 12:12:07.92203+08'),
                                            (8, 'Stephen Krashen', 'We acquire spoken fluency not by practicing talking but by understanding input, by listening and reading.', '2026-11-11 12:12:07.92203+08');