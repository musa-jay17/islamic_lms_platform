-- Insert sample courses (without instructor_id for now)
INSERT INTO public.courses_2025_11_15_16_09 (title, description, course_code, category, level, duration_weeks, credits, max_students, learning_objectives, status, start_date, end_date, schedule_days, schedule_time) VALUES
('Quranic Studies - Beginner', 'Introduction to Quranic recitation, basic Tajweed rules, and memorization of short Surahs', 'QUR101', 'quran', 'beginner', 16, 3, 25, ARRAY['Learn proper Quranic pronunciation', 'Understand basic Tajweed rules', 'Memorize Juz Amma'], 'active', '2024-01-15', '2024-05-15', ARRAY['monday', 'wednesday', 'friday'], '09:00:00'),

('Arabic Language - Level 1', 'Foundational Arabic grammar, vocabulary, and basic conversation skills', 'ARA101', 'arabic', 'beginner', 12, 4, 20, ARRAY['Master Arabic alphabet', 'Learn basic grammar rules', 'Build essential vocabulary'], 'active', '2024-01-15', '2024-04-15', ARRAY['tuesday', 'thursday'], '10:00:00'),

('Islamic Jurisprudence - Fundamentals', 'Introduction to Fiqh principles, worship rituals, and daily Islamic practices', 'FIQ201', 'fiqh', 'intermediate', 14, 3, 30, ARRAY['Understand Fiqh methodology', 'Learn worship regulations', 'Apply Islamic law in daily life'], 'active', '2024-02-01', '2024-05-01', ARRAY['monday', 'wednesday'], '14:00:00'),

('Hadith Sciences', 'Study of authentic Hadith collections, chain of narration, and Hadith classification', 'HAD301', 'hadith', 'advanced', 18, 4, 15, ARRAY['Analyze Hadith authenticity', 'Understand narration chains', 'Study major Hadith collections'], 'active', '2024-01-20', '2024-06-20', ARRAY['tuesday', 'thursday'], '11:00:00'),

('Islamic History - Early Period', 'Comprehensive study of early Islamic civilization, Prophetic era, and Rashidun Caliphate', 'HIS101', 'history', 'beginner', 12, 3, 35, ARRAY['Learn Prophetic biography', 'Understand early Islamic expansion', 'Study Rashidun Caliphate'], 'active', '2024-02-15', '2024-05-15', ARRAY['saturday'], '09:00:00'),

('Aqeedah - Islamic Creed', 'Fundamental beliefs in Islam, theology, and comparative religion studies', 'AQE101', 'aqeedah', 'beginner', 10, 2, 40, ARRAY['Understand Islamic beliefs', 'Learn about Allah attributes', 'Study comparative theology'], 'active', '2024-03-01', '2024-05-01', ARRAY['friday'], '15:00:00');

-- Insert sample course modules for Quranic Studies
INSERT INTO public.course_modules_2025_11_15_16_09 (course_id, title, description, module_order, content, is_published) VALUES
((SELECT id FROM public.courses_2025_11_15_16_09 WHERE course_code = 'QUR101'), 'Introduction to the Quran', 'Overview of the Holy Quran, its revelation, and significance', 1, 'The Holy Quran is the final revelation from Allah to humanity, revealed to Prophet Muhammad (PBUH) over 23 years. In this module, we will explore the structure, themes, and importance of the Quran in Islamic faith and practice.', true),

((SELECT id FROM public.courses_2025_11_15_16_09 WHERE course_code = 'QUR101'), 'Basic Tajweed Rules', 'Fundamental rules for proper Quranic recitation', 2, 'Tajweed is the art of reciting the Quran correctly. Learn the basic rules including proper pronunciation of Arabic letters, elongation (Madd), and stopping rules (Waqf).', true),

((SELECT id FROM public.courses_2025_11_15_16_09 WHERE course_code = 'QUR101'), 'Memorization Techniques', 'Effective methods for Quran memorization', 3, 'Discover proven techniques for memorizing the Quran, including repetition methods, understanding meanings, and maintaining what you have memorized.', true),

((SELECT id FROM public.courses_2025_11_15_16_09 WHERE course_code = 'ARA101'), 'Arabic Alphabet Mastery', 'Complete guide to Arabic letters and their forms', 1, 'Master the 28 letters of the Arabic alphabet, their different forms (initial, medial, final, isolated), and proper pronunciation. This foundation is essential for reading and writing Arabic.', true),

((SELECT id FROM public.courses_2025_11_15_16_09 WHERE course_code = 'ARA101'), 'Basic Grammar Rules', 'Introduction to Arabic grammar fundamentals', 2, 'Learn the basic rules of Arabic grammar including noun and verb patterns, sentence structure, and essential grammatical concepts that will help you understand Arabic texts.', true),

((SELECT id FROM public.courses_2025_11_15_16_09 WHERE course_code = 'FIQ201'), 'Principles of Fiqh', 'Understanding the methodology of Islamic jurisprudence', 1, 'Explore the fundamental principles and sources of Islamic law including Quran, Sunnah, Ijma, and Qiyas. Learn how Islamic scholars derive legal rulings.', true);

-- Insert sample assignments
INSERT INTO public.assignments_2025_11_15_16_09 (course_id, title, description, instructions, assignment_type, max_points, due_date, is_published) VALUES
((SELECT id FROM public.courses_2025_11_15_16_09 WHERE course_code = 'QUR101'), 'Surah Al-Fatiha Recitation', 'Record yourself reciting Surah Al-Fatiha with proper Tajweed', 'Please record a clear audio of yourself reciting Surah Al-Fatiha. Focus on proper pronunciation, Tajweed rules, and clear articulation. Submit the audio file along with a written reflection on the meaning of the Surah.', 'practical', 100, '2024-02-15 23:59:00', true),

((SELECT id FROM public.courses_2025_11_15_16_09 WHERE course_code = 'ARA101'), 'Arabic Alphabet Essay', 'Write about the history and significance of Arabic script', 'Compose a 500-word essay discussing the development of Arabic script, its unique features, and its importance in Islamic culture. Include examples of different Arabic calligraphy styles.', 'essay', 100, '2024-02-20 23:59:00', true),

((SELECT id FROM public.courses_2025_11_15_16_09 WHERE course_code = 'FIQ201'), 'Prayer (Salah) Research Project', 'Comprehensive research on the five daily prayers', 'Research and present the detailed rulings of the five daily prayers including times, conditions, and procedures. Include references from authentic Islamic sources.', 'research', 150, '2024-03-01 23:59:00', true),

((SELECT id FROM public.courses_2025_11_15_16_09 WHERE course_code = 'HAD301'), 'Hadith Authentication Analysis', 'Analyze the authenticity of selected Hadiths', 'Choose 5 Hadiths from different collections and analyze their chains of narration (Isnad). Discuss the reliability of narrators and classify each Hadith according to its authenticity level.', 'research', 200, '2024-03-15 23:59:00', true);

-- Insert sample quizzes
INSERT INTO public.quizzes_2025_11_15_16_09 (course_id, title, description, quiz_type, max_points, time_limit_minutes, attempts_allowed, show_correct_answers, is_published) VALUES
((SELECT id FROM public.courses_2025_11_15_16_09 WHERE course_code = 'QUR101'), 'Quran Basics Quiz', 'Test your knowledge of basic Quranic concepts', 'graded', 50, 30, 2, true, true),

((SELECT id FROM public.courses_2025_11_15_16_09 WHERE course_code = 'ARA101'), 'Arabic Alphabet Test', 'Assessment of Arabic letter recognition and pronunciation', 'graded', 40, 25, 1, true, true),

((SELECT id FROM public.courses_2025_11_15_16_09 WHERE course_code = 'AQE101'), 'Islamic Beliefs Quiz', 'Quiz on fundamental Islamic beliefs and concepts', 'practice', 30, 20, 3, true, true),

((SELECT id FROM public.courses_2025_11_15_16_09 WHERE course_code = 'FIQ201'), 'Fiqh Fundamentals Quiz', 'Test your understanding of basic Fiqh principles', 'graded', 60, 45, 2, true, true);

-- Insert sample quiz questions for Quran Basics Quiz
INSERT INTO public.quiz_questions_2025_11_15_16_09 (quiz_id, question_text, question_type, options, correct_answer, points, explanation, question_order) VALUES
((SELECT id FROM public.quizzes_2025_11_15_16_09 WHERE title = 'Quran Basics Quiz'), 'How many chapters (Surahs) are in the Holy Quran?', 'multiple_choice', '{"A": "110", "B": "114", "C": "116", "D": "120"}', 'B', 10, 'The Holy Quran contains 114 chapters (Surahs), starting with Al-Fatiha and ending with An-Nas.', 1),

((SELECT id FROM public.quizzes_2025_11_15_16_09 WHERE title = 'Quran Basics Quiz'), 'What is the first Surah in the Quran?', 'multiple_choice', '{"A": "Al-Baqarah", "B": "Al-Fatiha", "C": "An-Nas", "D": "Al-Ikhlas"}', 'B', 10, 'Al-Fatiha (The Opening) is the first chapter of the Holy Quran and is recited in every unit of prayer.', 2),

((SELECT id FROM public.quizzes_2025_11_15_16_09 WHERE title = 'Quran Basics Quiz'), 'The Quran was revealed in which language?', 'multiple_choice', '{"A": "Hebrew", "B": "Aramaic", "C": "Arabic", "D": "Persian"}', 'C', 10, 'The Holy Quran was revealed in Arabic, and this is considered part of its miraculous nature.', 3),

((SELECT id FROM public.quizzes_2025_11_15_16_09 WHERE title = 'Quran Basics Quiz'), 'True or False: The Quran was revealed all at once.', 'true_false', '{"True": "True", "False": "False"}', 'False', 10, 'The Quran was revealed gradually over a period of approximately 23 years during the Prophet Muhammad (PBUH) mission.', 4),

((SELECT id FROM public.quizzes_2025_11_15_16_09 WHERE title = 'Quran Basics Quiz'), 'What does "Tajweed" mean?', 'short_answer', null, 'proper recitation', 10, 'Tajweed refers to the proper way of reciting the Quran with correct pronunciation, intonation, and rhythm.', 5);

-- Insert quiz questions for Arabic Alphabet Test
INSERT INTO public.quiz_questions_2025_11_15_16_09 (quiz_id, question_text, question_type, options, correct_answer, points, explanation, question_order) VALUES
((SELECT id FROM public.quizzes_2025_11_15_16_09 WHERE title = 'Arabic Alphabet Test'), 'How many letters are in the Arabic alphabet?', 'multiple_choice', '{"A": "26", "B": "28", "C": "30", "D": "32"}', 'B', 10, 'The Arabic alphabet consists of 28 letters, each with different forms depending on their position in a word.', 1),

((SELECT id FROM public.quizzes_2025_11_15_16_09 WHERE title = 'Arabic Alphabet Test'), 'Arabic is written from:', 'multiple_choice', '{"A": "Left to right", "B": "Right to left", "C": "Top to bottom", "D": "Bottom to top"}', 'B', 10, 'Arabic is written from right to left, which is the opposite direction from English.', 2),

((SELECT id FROM public.quizzes_2025_11_15_16_09 WHERE title = 'Arabic Alphabet Test'), 'What is the first letter of the Arabic alphabet?', 'short_answer', null, 'alif', 10, 'Alif (ا) is the first letter of the Arabic alphabet and represents the long vowel "a".', 3);

-- Insert sample exams
INSERT INTO public.exams_2025_11_15_16_09 (course_id, title, description, exam_type, max_points, duration_minutes, exam_date, location, instructions, materials_allowed, is_published) VALUES
((SELECT id FROM public.courses_2025_11_15_16_09 WHERE course_code = 'QUR101'), 'Quranic Studies Midterm Exam', 'Comprehensive midterm examination covering Quran basics and Tajweed', 'midterm', 200, 120, '2024-03-15 10:00:00', 'Main Examination Hall', 'This exam covers all material from modules 1-3. Please bring your student ID and arrive 15 minutes early. No electronic devices allowed except approved calculators.', ARRAY['Pen', 'Pencil', 'Eraser', 'Mushaf (Quran)'], true),

((SELECT id FROM public.courses_2025_11_15_16_09 WHERE course_code = 'FIQ201'), 'Islamic Jurisprudence Final Exam', 'Final comprehensive examination on Fiqh principles and applications', 'final', 300, 180, '2024-05-20 09:00:00', 'Main Examination Hall', 'Final exam covering all course material. Students must demonstrate understanding of Fiqh methodology and practical applications.', ARRAY['Pen', 'Pencil', 'Reference books'], true),

((SELECT id FROM public.courses_2025_11_15_16_09 WHERE course_code = 'ARA101'), 'Arabic Language Comprehensive Exam', 'Final assessment of Arabic language skills', 'final', 250, 150, '2024-04-25 14:00:00', 'Language Lab', 'Comprehensive exam testing reading, writing, and comprehension skills in Arabic. Includes both written and oral components.', ARRAY['Pen', 'Pencil', 'Arabic dictionary'], true);