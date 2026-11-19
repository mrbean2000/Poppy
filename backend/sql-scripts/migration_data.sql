INSERT INTO public.quotes (user_id, quoter, quote)
VALUES
    (1, 'Nelson Mandela', 'If you talk to a man in a language he understands, that goes to his head. If you talk to him in his language, that goes to his heart.'),
    (2, 'Steve Kaufmann', 'Learning a language is like falling in love. In fact, you have to be in love to learn a language well... You just want to be with it, and even to imitate it, the highest form of appreciation.'),
    (3, 'Steve Kaufmann', 'Only a vain fool strives for perfection. Whatever language you are learning, it is everywhere... Accept what you have achieved and you will achieve more.'),
    (4, 'Steve Kaufmann', 'Don''t try and remember anything when you''re learning a second language. You can''t force it. Let the language come to you...'),
    (5, 'Stephen Krashen', 'We acquire language when we understand messages, when we understand what people tell us and when we understand what we read.'),
    (6, 'Stephen Krashen', 'Language acquisition comes from input, not output; from comprehension, not production.'),
    (7, 'Stephen Krashen', 'Language is best taught when it is being used to transmit messages, not when it is explicitly taught for conscious learning.'),
    (8, 'Stephen Krashen', 'We acquire spoken fluency not by practicing talking but by understanding input, by listening and reading.');

INSERT INTO public.languages (id, language, countryflag)
VALUES
    (1, 'English (US)', '🇺🇸' ),
    (2, 'Japanese', '🇯🇵'),
    (3, 'Simplified Chinese', '🇨🇳');
