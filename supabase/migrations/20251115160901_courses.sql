-- Create courses table
CREATE TABLE IF NOT EXISTS  public.courses_2025_11_15_16_09 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    course_code TEXT UNIQUE NOT NULL,
    instructor_id UUID REFERENCES public.user_profiles_2025_11_15_16_09(user_id),
    category TEXT NOT NULL CHECK (category IN ('quran', 'arabic', 'fiqh', 'hadith', 'history', 'aqeedah', 'other')),
    level TEXT NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    duration_weeks INTEGER NOT NULL DEFAULT 12,
    credits INTEGER NOT NULL DEFAULT 3,
    max_students INTEGER DEFAULT 30,
    prerequisites TEXT[],
    learning_objectives TEXT[],
    course_image_url TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    start_date DATE,
    end_date DATE,
    schedule_days TEXT[], -- ['monday', 'wednesday', 'friday']
    schedule_time TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create course modules table
CREATE TABLE public.course_modules_2025_11_15_16_09 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses_2025_11_15_16_09(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    module_order INTEGER NOT NULL,
    content TEXT,
    video_url TEXT,
    resources JSONB DEFAULT '[]'::jsonb,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create course enrollments table
CREATE TABLE public.course_enrollments_2025_11_15_16_09 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.user_profiles_2025_11_15_16_09(user_id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses_2025_11_15_16_09(id) ON DELETE CASCADE,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'completed', 'dropped', 'failed')),
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    final_grade TEXT,
    completion_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, course_id)
);

-- Enable RLS
ALTER TABLE public.courses_2025_11_15_16_09 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules_2025_11_15_16_09 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments_2025_11_15_16_09 ENABLE ROW LEVEL SECURITY;

-- RLS Policies for courses
CREATE POLICY "Anyone can view active courses" ON public.courses_2025_11_15_16_09
    FOR SELECT USING (status = 'active');

CREATE POLICY "Instructors can manage their courses" ON public.courses_2025_11_15_16_09
    FOR ALL USING (instructor_id = auth.uid());

CREATE POLICY "Admins can manage all courses" ON public.courses_2025_11_15_16_09
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles_2025_11_15_16_09 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for course modules
CREATE POLICY "Students can view published modules of enrolled courses" ON public.course_modules_2025_11_15_16_09
    FOR SELECT USING (
        is_published = true AND
        EXISTS (
            SELECT 1 FROM public.course_enrollments_2025_11_15_16_09 
            WHERE student_id = auth.uid() AND course_id = course_modules_2025_11_15_16_09.course_id
        )
    );

CREATE POLICY "Instructors can manage modules of their courses" ON public.course_modules_2025_11_15_16_09
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.courses_2025_11_15_16_09 
            WHERE id = course_modules_2025_11_15_16_09.course_id AND instructor_id = auth.uid()
        )
    );

-- RLS Policies for enrollments
CREATE POLICY "Students can view their own enrollments" ON public.course_enrollments_2025_11_15_16_09
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students can enroll themselves" ON public.course_enrollments_2025_11_15_16_09
    FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Instructors can view enrollments for their courses" ON public.course_enrollments_2025_11_15_16_09
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.courses_2025_11_15_16_09 
            WHERE id = course_enrollments_2025_11_15_16_09.course_id AND instructor_id = auth.uid()
        )
    );

-- Create indexes
CREATE INDEX idx_courses_instructor_2025_11_15_16_09 ON public.courses_2025_11_15_16_09(instructor_id);
CREATE INDEX idx_courses_category_2025_11_15_16_09 ON public.courses_2025_11_15_16_09(category);
CREATE INDEX idx_course_modules_course_2025_11_15_16_09 ON public.course_modules_2025_11_15_16_09(course_id);
CREATE INDEX idx_enrollments_student_2025_11_15_16_09 ON public.course_enrollments_2025_11_15_16_09(student_id);
CREATE INDEX idx_enrollments_course_2025_11_15_16_09 ON public.course_enrollments_2025_11_15_16_09(course_id);