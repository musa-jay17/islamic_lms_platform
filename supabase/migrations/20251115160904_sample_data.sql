-- =========================================================
-- 1) Insert sample courses (idempotent: skip if course_code exists)
-- =========================================================
INSERT INTO public.courses_2025_11_15_16_09
(title, description, course_code, category, level, duration_weeks, credits, max_students, learning_objectives, status, start_date, end_date, schedule_days, schedule_time)
SELECT
  v.title, v.description, v.course_code, v.category, v.level, v.duration_weeks, v.credits, v.max_students,
  v.learning_objectives, v.status, v.start_date, v.end_date, v.schedule_days, v.schedule_time
FROM (
  VALUES
  ('Quranic Studies - Beginner', 'Introduction to Quranic recitation, basic Tajweed rules, and memorization of short Surahs', 'QUR101', 'quran', 'beginner', 16, 3, 25, ARRAY['Learn proper Quranic pronunciation', 'Understand basic Tajweed rules', 'Memorize Juz Amma']::text[], 'active', '2024-01-15'::date, '2024-05-15'::date, ARRAY['monday','wednesday','friday']::text[], '09:00:00'::time),
  ('Arabic Language - Level 1', 'Foundational Arabic grammar, vocabulary, and basic conversation skills', 'ARA101', 'arabic', 'beginner', 12, 4, 20, ARRAY['Master Arabic alphabet', 'Learn basic grammar rules', 'Build essential vocabulary']::text[], 'active', '2024-01-15'::date, '2024-04-15'::date, ARRAY['tuesday','thursday']::text[], '10:00:00'::time),
  ('Islamic Jurisprudence - Fundamentals', 'Introduction to Fiqh principles, worship rituals, and daily Islamic practices', 'FIQ201', 'fiqh', 'intermediate', 14, 3, 30, ARRAY['Understand Fiqh methodology', 'Learn worship regulations', 'Apply Islamic law in daily life']::text[], 'active', '2024-02-01'::date, '2024-05-01'::date, ARRAY['monday','wednesday']::text[], '14:00:00'::time),
  ('Hadith Sciences', 'Study of authentic Hadith collections, chain of narration, and Hadith classification', 'HAD301', 'hadith', 'advanced', 18, 4, 15, ARRAY['Analyze Hadith authenticity', 'Understand narration chains', 'Study major Hadith collections']::text[], 'active', '2024-01-20'::date, '2024-06-20'::date, ARRAY['tuesday','thursday']::text[], '11:00:00'::time),
  ('Islamic History - Early Period', 'Comprehensive study of early Islamic civilization, Prophetic era, and Rashidun Caliphate', 'HIS101', 'history', 'beginner', 12, 3, 35, ARRAY['Learn Prophetic biography', 'Understand early Islamic expansion', 'Study Rashidun Caliphate']::text[], 'active', '2024-02-15'::date, '2024-05-15'::date, ARRAY['saturday']::text[], '09:00:00'::time),
  ('Aqeedah - Islamic Creed', 'Fundamental beliefs in Islam, theology, and comparative religion studies', 'AQE101', 'aqeedah', 'beginner', 10, 2, 40, ARRAY['Understand Islamic beliefs', 'Learn about Allah attributes', 'Study comparative theology']::text[], 'active', '2024-03-01'::date, '2024-05-01'::date, ARRAY['friday']::text[], '15:00:00'::time)
) AS v(title, description, course_code, category, level, duration_weeks, credits, max_students, learning_objectives, status, start_date, end_date, schedule_days, schedule_time)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.courses_2025_11_15_16_09 c
  WHERE c.course_code = v.course_code
);

-- Helper CTE for Quran course id
WITH qur AS (
  SELECT id AS course_id
  FROM public.courses_2025_11_15_16_09
  WHERE course_code = 'QUR101'
  LIMIT 1
)

-- =========================================================
-- 2) Insert sample course modules (idempotent)
--    Assumes uniqueness by (course_id, module_order)
-- =========================================================
INSERT INTO public.course_modules_2025_11_15_16_09
(course_id, title, description, module_order, content, is_published)
SELECT
  qur.course_id,
  v.title,
  v.description,
  v.module_order,
  v.content,
  v.is_published
FROM qur
JOIN (
  VALUES
  ('Introduction to the Quran', 'Overview of the Holy Quran, its revelation, and significance', 1,
   'The Holy Quran is the final revelation from Allah to humanity, revealed to Prophet Muhammad (PBUH) over 23 years. In this module, we will explore the structure, themes, and importance of the Quran in Islamic faith and practice.', true),
  ('Basic Tajweed Rules', 'Fundamental rules for proper Quranic recitation', 2,
   'Tajweed is the art of reciting the Quran correctly. Learn the basic rules including proper pronunciation of Arabic letters, elongation (Madd), and stopping rules (Waqf).', true),
  ('Memorization Techniques', 'Effective methods for Quran memorization', 3,
   'Discover proven techniques for memorizing the Quran, including repetition methods, understanding meanings, and maintaining what you have memorized.', true)
) AS v(title, description, module_order, content, is_published)
ON TRUE
WHERE NOT EXISTS (
  SELECT 1
  FROM public.course_modules_2025_11_15_16_09 m
  WHERE m.course_id = qur.course_id
    AND m.module_order = v.module_order
);

-- =========================================================
-- 3) Insert sample assignments (idempotent)
--    Assumes uniqueness by (course_id, title)
-- =========================================================
WITH c AS (
  SELECT id, course_code
  FROM public.courses_2025_11_15_16_09
  WHERE course_code IN ('QUR101','ARA101','FIQ201')
)
INSERT INTO public.assignments_2025_11_15_16_09
(course_id, title, description, instructions, assignment_type, max_points, due_date, is_published)
SELECT
  c.id,
  v.title,
  v.description,
  v.instructions,
  v.assignment_type,
  v.max_points,
  v.due_date,
  v.is_published
FROM c
JOIN (
  VALUES
  ('QUR101','Surah Al-Fatiha Recitation','Record yourself reciting Surah Al-Fatiha with proper Tajweed',
   'Please record a clear audio of yourself reciting Surah Al-Fatiha. Focus on proper pronunciation, Tajweed rules, and clear articulation. Submit the audio file along with a written reflection on the meaning of the Surah.',
   'practical', 100, '2024-02-15 23:59:00'::timestamptz, true),

  ('ARA101','Arabic Alphabet Essay','Write about the history and significance of Arabic script',
   'Compose a 500-word essay discussing the development of Arabic script, its unique features, and its importance in Islamic culture. Include examples of different Arabic calligraphy styles.',
   'essay', 100, '2024-02-20 23:59:00'::timestamptz, true),

  ('FIQ201','Prayer (Salah) Research Project','Comprehensive research on the five daily prayers',
   'Research and present the detailed rulings of the five daily prayers including times, conditions, and procedures. Include references from authentic Islamic sources.',
   'research', 150, '2024-03-01 23:59:00'::timestamptz, true)
) AS v(course_code, title, description, instructions, assignment_type, max_points, due_date, is_published)
ON v.course_code = c.course_code
WHERE NOT EXISTS (
  SELECT 1
  FROM public.assignments_2025_11_15_16_09 a
  WHERE a.course_id = c.id
    AND a.title = v.title
);

-- =========================================================
-- 4) Insert sample quizzes (idempotent)
--    Assumes uniqueness by (course_id, title)
-- =========================================================
WITH c AS (
  SELECT id, course_code
  FROM public.courses_2025_11_15_16_09
  WHERE course_code IN ('QUR101','ARA101','AQE101')
)
INSERT INTO public.quizzes_2025_11_15_16_09
(course_id, title, description, quiz_type, max_points, time_limit_minutes, attempts_allowed, show_correct_answers, is_published)
SELECT
  c.id,
  v.title,
  v.description,
  v.quiz_type,
  v.max_points,
  v.time_limit_minutes,
  v.attempts_allowed,
  v.show_correct_answers,
  v.is_published
FROM c
JOIN (
  VALUES
  ('QUR101','Quran Basics Quiz','Test your knowledge of basic Quranic concepts','graded', 50, 30, 2, true, true),
  ('ARA101','Arabic Alphabet Test','Assessment of Arabic letter recognition and pronunciation','graded', 40, 25, 1, true, true),
  ('AQE101','Islamic Beliefs Quiz','Quiz on fundamental Islamic beliefs and concepts','practice', 30, 20, 3, true, true)
) AS v(course_code, title, description, quiz_type, max_points, time_limit_minutes, attempts_allowed, show_correct_answers, is_published)
ON v.course_code = c.course_code
WHERE NOT EXISTS (
  SELECT 1
  FROM public.quizzes_2025_11_15_16_09 q
  WHERE q.course_id = c.id
    AND q.title = v.title
);

-- =========================================================
-- 5) Insert quiz questions (idempotent)
--    Assumes uniqueness by (quiz_id, question_order)
-- =========================================================
WITH qur_course AS (
  SELECT id AS course_id
  FROM public.courses_2025_11_15_16_09
  WHERE course_code = 'QUR101'
  LIMIT 1
),
quiz AS (
  SELECT q.id AS quiz_id
  FROM public.quizzes_2025_11_15_16_09 q
  JOIN qur_course c ON q.course_id = c.course_id
  WHERE q.title = 'Quran Basics Quiz'
  LIMIT 1
)
INSERT INTO public.quiz_questions_2025_11_15_16_09
(quiz_id, question_text, question_type, options, correct_answer, points, explanation, question_order)
SELECT
  quiz.quiz_id,
  v.question_text,
  v.question_type,
  v.options,
  v.correct_answer,
  v.points,
  v.explanation,
  v.question_order
FROM quiz
JOIN (
  VALUES
  ('How many chapters (Surahs) are in the Holy Quran?', 'multiple_choice', '{"A":"110","B":"114","C":"116","D":"120"}'::jsonb, 'B', 10, 'The Holy Quran contains 114 chapters (Surahs), starting with Al-Fatiha and ending with An-Nas.', 1),
  ('What is the first Surah in the Quran?', 'multiple_choice', '{"A":"Al-Baqarah","B":"Al-Fatiha","C":"An-Nas","D":"Al-Ikhlas"}'::jsonb, 'B', 10, 'Al-Fatiha (The Opening) is the first chapter of the Holy Quran and is recited in every unit of prayer.', 2),
  ('The Quran was revealed in which language?', 'multiple_choice', '{"A":"Hebrew","B":"Aramaic","C":"Arabic","D":"Persian"}'::jsonb, 'C', 10, 'The Holy Quran was revealed in Arabic, and this is considered part of its miraculous nature.', 3),
  ('True or False: The Quran was revealed all at once.', 'true_false', '{"True":"True","False":"False"}'::jsonb, 'False', 10, 'The Quran was revealed gradually over a period of approximately 23 years during the Prophet Muhammad (PBUH) mission.', 4),
  ('What does "Tajweed" mean?', 'short_answer', NULL::jsonb, 'proper recitation', 10, 'Tajweed refers to the proper way of reciting the Quran with correct pronunciation, intonation, and rhythm.', 5)
) AS v(question_text, question_type, options, correct_answer, points, explanation, question_order)
ON TRUE
WHERE NOT EXISTS (
  SELECT 1
  FROM public.quiz_questions_2025_11_15_16_09 qq
  WHERE qq.quiz_id = quiz.quiz_id
    AND qq.question_order = v.question_order
);

-- =========================================================
-- 6) Insert sample exams (idempotent)
--    Assumes uniqueness by (course_id, title)
-- =========================================================
WITH c AS (
  SELECT id, course_code
  FROM public.courses_2025_11_15_16_09
  WHERE course_code IN ('QUR101','FIQ201')
)
INSERT INTO public.exams_2025_11_15_16_09
(course_id, title, description, exam_type, max_points, duration_minutes, exam_date, location, instructions, materials_allowed, is_published)
SELECT
  c.id,
  v.title,
  v.description,
  v.exam_type,
  v.max_points,
  v.duration_minutes,
  v.exam_date,
  v.location,
  v.instructions,
  v.materials_allowed,
  v.is_published
FROM c
JOIN (
  VALUES
  ('QUR101','Quranic Studies Midterm Exam','Comprehensive midterm examination covering Quran basics and Tajweed','midterm', 200, 120, '2024-03-15 10:00:00'::timestamptz, 'Main Examination Hall',
   'This exam covers all material from modules 1-3. Please bring your student ID and arrive 15 minutes early. No electronic devices allowed except approved calculators.',
   ARRAY['Pen','Pencil','Eraser','Mushaf (Quran)']::text[], true),

  ('FIQ201','Islamic Jurisprudence Final Exam','Final comprehensive examination on Fiqh principles and applications','final', 300, 180, '2024-05-20 09:00:00'::timestamptz, 'Main Examination Hall',
   'Final exam covering all course material. Students must demonstrate understanding of Fiqh methodology and practical applications.',
   ARRAY['Pen','Pencil','Reference books']::text[], true)
) AS v(course_code, title, description, exam_type, max_points, duration_minutes, exam_date, location, instructions, materials_allowed, is_published)
ON v.course_code = c.course_code
WHERE NOT EXISTS (
  SELECT 1
  FROM public.exams_2025_11_15_16_09 e
  WHERE e.course_id = c.id
    AND e.title = v.title
);

-- =========================================================
-- 7) Insert sample announcements only if an admin exists
-- =========================================================
WITH admin_user AS (
  SELECT user_id
  FROM public.user_profiles_2025_11_15_16_09
  WHERE role = 'admin'
  LIMIT 1
)
INSERT INTO public.announcements_2025_11_15_16_09
(title, content, announcement_type, target_audience, author_id, is_published, is_pinned)
SELECT
  v.title, v.content, v.announcement_type, v.target_audience,
  admin_user.user_id, v.is_published, v.is_pinned
FROM admin_user
JOIN (
  VALUES
  ('Welcome to New Academic Year 1446H',
   'Assalamu Alaikum dear students and faculty. We welcome you to the new academic year 1446H. May Allah bless our studies and grant us beneficial knowledge. Classes begin on January 15th, 2024. Please check your course schedules and prepare accordingly.',
   'academic','all', true, true),

  ('Library Hours Extended During Ramadan',
   'During the blessed month of Ramadan, our library will extend its hours to accommodate students who prefer studying during evening hours. New hours: 8:00 AM - 11:00 PM. May Allah accept our worship and studies during this holy month.',
   'general','students', true, false),

  ('Upcoming Islamic History Lecture Series',
   'We are pleased to announce a special lecture series on "Golden Age of Islamic Civilization" starting next month. Guest speakers include renowned historians and scholars. All students and faculty are welcome to attend.',
   'event','all', true, false)
) AS v(title, content, announcement_type, target_audience, is_published, is_pinned)
ON TRUE
WHERE NOT EXISTS (
  SELECT 1
  FROM public.announcements_2025_11_15_16_09 a
  WHERE a.title = v.title
);

-- =========================================================
-- 8) Optional: Assign instructor_id only if an admin exists
-- =========================================================
WITH admin_user AS (
  SELECT user_id
  FROM public.user_profiles_2025_11_15_16_09
  WHERE role = 'admin'
  LIMIT 1
)
UPDATE public.courses_2025_11_15_16_09 c
SET instructor_id = admin_user.user_id
FROM admin_user
WHERE c.instructor_id IS NULL
  AND admin_user.user_id IS NOT NULL;
