-- Create assignments table
CREATE TABLE IF NOT EXISTS  public.assignments_2025_11_15_16_09 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses_2025_11_15_16_09(id) ON DELETE CASCADE,
    module_id UUID REFERENCES public.course_modules_2025_11_15_16_09(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    instructions TEXT,
    assignment_type TEXT DEFAULT 'essay' CHECK (assignment_type IN ('essay', 'research', 'presentation', 'practical', 'memorization')),
    max_points INTEGER NOT NULL DEFAULT 100,
    due_date TIMESTAMP WITH TIME ZONE,
    allow_late_submission BOOLEAN DEFAULT false,
    late_penalty_percentage DECIMAL(5,2) DEFAULT 0.00,
    attachment_urls TEXT[],
    rubric JSONB,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create assignment submissions table
CREATE TABLE public.assignment_submissions_2025_11_15_16_09 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES public.assignments_2025_11_15_16_09(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.user_profiles_2025_11_15_16_09(user_id) ON DELETE CASCADE,
    submission_text TEXT,
    attachment_urls TEXT[],
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_late BOOLEAN DEFAULT false,
    grade DECIMAL(5,2),
    feedback TEXT,
    graded_at TIMESTAMP WITH TIME ZONE,
    graded_by UUID REFERENCES public.user_profiles_2025_11_15_16_09(user_id),
    status TEXT DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'graded', 'returned')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(assignment_id, student_id)
);

-- Create quizzes table
CREATE TABLE public.quizzes_2025_11_15_16_09 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses_2025_11_15_16_09(id) ON DELETE CASCADE,
    module_id UUID REFERENCES public.course_modules_2025_11_15_16_09(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    instructions TEXT,
    quiz_type TEXT DEFAULT 'practice' CHECK (quiz_type IN ('practice', 'graded', 'midterm', 'final')),
    max_points INTEGER NOT NULL DEFAULT 100,
    time_limit_minutes INTEGER,
    attempts_allowed INTEGER DEFAULT 1,
    show_correct_answers BOOLEAN DEFAULT true,
    randomize_questions BOOLEAN DEFAULT false,
    available_from TIMESTAMP WITH TIME ZONE,
    available_until TIMESTAMP WITH TIME ZONE,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quiz questions table
CREATE TABLE public.quiz_questions_2025_11_15_16_09 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID REFERENCES public.quizzes_2025_11_15_16_09(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer', 'essay', 'fill_blank')),
    options JSONB, -- For multiple choice questions
    correct_answer TEXT,
    points INTEGER NOT NULL DEFAULT 1,
    explanation TEXT,
    question_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quiz attempts table
CREATE TABLE public.quiz_attempts_2025_11_15_16_09 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID REFERENCES public.quizzes_2025_11_15_16_09(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.user_profiles_2025_11_15_16_09(user_id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    time_taken_minutes INTEGER,
    score DECIMAL(5,2),
    max_score INTEGER,
    percentage DECIMAL(5,2),
    answers JSONB, -- Store student answers
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create exams table (comprehensive assessments)
CREATE TABLE public.exams_2025_11_15_16_09 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses_2025_11_15_16_09(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    exam_type TEXT NOT NULL CHECK (exam_type IN ('midterm', 'final', 'comprehensive', 'oral')),
    max_points INTEGER NOT NULL DEFAULT 100,
    duration_minutes INTEGER NOT NULL,
    exam_date TIMESTAMP WITH TIME ZONE,
    location TEXT,
    instructions TEXT,
    materials_allowed TEXT[],
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create exam results table
CREATE TABLE public.exam_results_2025_11_15_16_09 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES public.exams_2025_11_15_16_09(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.user_profiles_2025_11_15_16_09(user_id) ON DELETE CASCADE,
    score DECIMAL(5,2) NOT NULL,
    max_score INTEGER NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    grade TEXT,
    feedback TEXT,
    exam_date TIMESTAMP WITH TIME ZONE,
    graded_by UUID REFERENCES public.user_profiles_2025_11_15_16_09(user_id),
    graded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(exam_id, student_id)
);

-- Enable RLS on all tables
ALTER TABLE public.assignments_2025_11_15_16_09 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions_2025_11_15_16_09 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes_2025_11_15_16_09 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions_2025_11_15_16_09 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts_2025_11_15_16_09 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams_2025_11_15_16_09 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results_2025_11_15_16_09 ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assignments
CREATE POLICY "Students can view published assignments for enrolled courses" ON public.assignments_2025_11_15_16_09
    FOR SELECT USING (
        is_published = true AND
        EXISTS (
            SELECT 1 FROM public.course_enrollments_2025_11_15_16_09 
            WHERE student_id = auth.uid() AND course_id = assignments_2025_11_15_16_09.course_id
        )
    );

CREATE POLICY "Instructors can manage assignments for their courses" ON public.assignments_2025_11_15_16_09
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.courses_2025_11_15_16_09 
            WHERE id = assignments_2025_11_15_16_09.course_id AND instructor_id = auth.uid()
        )
    );

-- RLS Policies for assignment submissions
CREATE POLICY "Students can manage their own submissions" ON public.assignment_submissions_2025_11_15_16_09
    FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Instructors can view and grade submissions for their courses" ON public.assignment_submissions_2025_11_15_16_09
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.assignments_2025_11_15_16_09 a
            JOIN public.courses_2025_11_15_16_09 c ON a.course_id = c.id
            WHERE a.id = assignment_submissions_2025_11_15_16_09.assignment_id AND c.instructor_id = auth.uid()
        )
    );

-- Similar policies for quizzes, quiz attempts, exams, and exam results
CREATE POLICY "Students can view published quizzes for enrolled courses" ON public.quizzes_2025_11_15_16_09
    FOR SELECT USING (
        is_published = true AND
        EXISTS (
            SELECT 1 FROM public.course_enrollments_2025_11_15_16_09 
            WHERE student_id = auth.uid() AND course_id = quizzes_2025_11_15_16_09.course_id
        )
    );

CREATE POLICY "Students can view their own quiz attempts" ON public.quiz_attempts_2025_11_15_16_09
    FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Students can view their own exam results" ON public.exam_results_2025_11_15_16_09
    FOR SELECT USING (student_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX idx_assignments_course_2025_11_15_16_09 ON public.assignments_2025_11_15_16_09(course_id);
CREATE INDEX idx_assignment_submissions_student_2025_11_15_16_09 ON public.assignment_submissions_2025_11_15_16_09(student_id);
CREATE INDEX idx_quizzes_course_2025_11_15_16_09 ON public.quizzes_2025_11_15_16_09(course_id);
CREATE INDEX idx_quiz_attempts_student_2025_11_15_16_09 ON public.quiz_attempts_2025_11_15_16_09(student_id);
CREATE INDEX idx_exam_results_student_2025_11_15_16_09 ON public.exam_results_2025_11_15_16_09(student_id);