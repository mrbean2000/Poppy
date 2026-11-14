-- Updated table definition (removed UNIQUE from quoter)
CREATE TABLE quotes (
                        user_id SERIAL PRIMARY KEY,
                        quoter VARCHAR(100) NOT NULL,
                        quote VARCHAR(500) UNIQUE NOT NULL,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert script for all quotes
INSERT INTO quotes (quoter, quote) VALUES
-- Nelson Mandela
('Nelson Mandela', 'If you talk to a man in a language he understands, that goes to his head. If you talk to him in his language, that goes to his heart.'),

-- Steve Kaufmann
('Steve Kaufmann', 'Learning a language is like falling in love. In fact, you have to be in love to learn a language well... You just want to be with it, and even to imitate it, the highest form of appreciation.'),
('Steve Kaufmann', 'Only a vain fool strives for perfection. Whatever language you are learning, it is everywhere... Accept what you have achieved and you will achieve more.'),
('Steve Kaufmann', 'Don''t try and remember anything when you''re learning a second language. You can''t force it. Let the language come to you...'),

-- Stephen Krashen
('Stephen Krashen', 'We acquire language when we understand messages, when we understand what people tell us and when we understand what we read.'),
('Stephen Krashen', 'Language acquisition comes from input, not output; from comprehension, not production.'),
('Stephen Krashen', 'Language is best taught when it is being used to transmit messages, not when it is explicitly taught for conscious learning.'),
('Stephen Krashen', 'We acquire spoken fluency not by practicing talking but by understanding input, by listening and reading.');