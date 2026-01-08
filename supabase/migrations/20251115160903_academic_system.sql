-- Create academic records table
CREATE TABLE IF NOT EXISTS public.academic_records_2025_11_15_16_09 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.user_profiles_2025_11_15_16_09(user_id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses_2025_11_15_16_09(id) ON DELETE CASCADE,
    semester TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    final_grade TEXT NOT NULL,
    grade_points DECIMAL(3,2) NOT NULL,
    credits_earned INTEGER NOT NULL,
    attendance_percentage DECIMAL(5,2),
    instructor_comments TEXT,
    completion_status TEXT DEFAULT 'completed' CHECK (completion_status IN ('completed', 'incomplete', 'withdrawn', 'failed')),
    completion_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, course_id, semester, academic_year)
);

-- Create transcripts table
CREATE TABLE public.transcripts_2025_11_15_16_09 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.user_profiles_2025_11_15_16_09(user_id) ON DELETE CASCADE,
    transcript_type TEXT DEFAULT 'official' CHECK (transcript_type IN ('official', 'unofficial', 'partial')),
    total_credits_attempted INTEGER DEFAULT 0,
    total_credits_earned INTEGER DEFAULT 0,
    cumulative_gpa DECIMAL(3,2) DEFAULT 0.00,
    academic_standing TEXT DEFAULT 'good' CHECK (academic_standing IN ('excellent', 'good', 'probation', 'suspended')),
    graduation_date DATE,
    degree_awarded TEXT,
    honors TEXT,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    generated_by UUID REFERENCES public.user_profiles_2025_11_15_16_09(user_id),
    is_official BOOLEAN DEFAULT false,
    verification_code TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create certificates table
CREATE TABLE public.certificates_2025_11_15_16_09 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.user_profiles_2025_11_15_16_09(user_id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses_2025_11_15_16_09(id) ON DELETE CASCADE,
    certificate_type TEXT NOT NULL CHECK (certificate_type IN ('completion', 'achievement', 'participation', 'excellence')),
    title TEXT NOT NULL,
    description TEXT,
    issued_date DATE DEFAULT CURRENT_DATE,
    issued_by UUID REFERENCES public.user_profiles_2025_11_15_16_09(user_id),
    certificate_url TEXT,
    verification_code TEXT UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create announcements table
CREATE TABLE public.announcements_2025_11_15_16_09 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    announcement_type TEXT DEFAULT 'general' CHECK (announcement_type IN ('general', 'academic', 'event', 'urgent', 'course')),
    target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'students', 'instructors', 'admins')),
    course_id UUID REFERENCES public.courses_2025_11_15_16_09(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.user_profiles_2025_11_15_16_09(user_id) ON DELETE CASCADE,
    is_published BOOLEAN DEFAULT false,
    is_pinned BOOLEAN DEFAULT false,
    publish_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expire_date TIMESTAMP WITH TIME ZONE,
    attachment_urls TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table for internal communication
CREATE TABLE public.messages_2025_11_15_16_09 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES public.user_profiles_2025_11_15_16_09(user_id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES public.user_profiles_2025_11_15_16_09(user_id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'personal' CHECK (message_type IN ('personal', 'academic', 'administrative')),
    is_read BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    parent_message_id UUID REFERENCES public.messages_2025_11_15_16_09(id),
    attachment_urls TEXT[],
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance table
CREATE TABLE public.attendance_2025_11_15_16_09 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.user_profiles_2025_11_15_16_09(user_id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses_2025_11_15_16_09(id) ON DELETE CASCADE,
    class_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    notes TEXT,
    marked_by UUID REFERENCES public.user_profiles_2025_11_15_16_09(user_id),
    marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, course_id, class_date)
);

-- Enable RLS on all tables
ALTER TABLE public.academic_records_2025_11_15_16_09 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcripts_2025_11_15_16_09 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates_2025_11_15_16_09 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements_2025_11_15_16_09 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages_2025_11_15_16_09 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_2025_11_15_16_09 ENABLE ROW LEVEL SECURITY;

-- RLS Policies for academic records
CREATE POLICY "Students can view their own academic records" ON public.academic_records_2025_11_15_16_09
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Instructors can view records for their courses" ON public.academic_records_2025_11_15_16_09
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.courses_2025_11_15_16_09 
            WHERE id = academic_records_2025_11_15_16_09.course_id AND instructor_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all academic records" ON public.academic_records_2025_11_15_16_09
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles_2025_11_15_16_09 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for transcripts
CREATE POLICY "Students can view their own transcripts" ON public.transcripts_2025_11_15_16_09
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Admins can manage all transcripts" ON public.transcripts_2025_11_15_16_09
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles_2025_11_15_16_09 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for certificates
CREATE POLICY "Students can view their own certificates" ON public.certificates_2025_11_15_16_09
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Instructors can issue certificates for their courses" ON public.certificates_2025_11_15_16_09
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.courses_2025_11_15_16_09 
            WHERE id = certificates_2025_11_15_16_09.course_id AND instructor_id = auth.uid()
        )
    );

-- RLS Policies for announcements
CREATE POLICY "Everyone can view published announcements" ON public.announcements_2025_11_15_16_09
    FOR SELECT USING (is_published = true);

CREATE POLICY "Instructors and admins can create announcements" ON public.announcements_2025_11_15_16_09
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles_2025_11_15_16_09 
            WHERE user_id = auth.uid() AND role IN ('instructor', 'admin')
        )
    );

-- RLS Policies for messages
CREATE POLICY "Users can view messages sent to them or by them" ON public.messages_2025_11_15_16_09
    FOR SELECT USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can send messages" ON public.messages_2025_11_15_16_09
    FOR INSERT WITH CHECK (sender_id = auth.uid());

-- RLS Policies for attendance
CREATE POLICY "Students can view their own attendance" ON public.attendance_2025_11_15_16_09
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Instructors can manage attendance for their courses" ON public.attendance_2025_11_15_16_09
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.courses_2025_11_15_16_09 
            WHERE id = attendance_2025_11_15_16_09.course_id AND instructor_id = auth.uid()
        )
    );

-- Create indexes for better performance
CREATE INDEX idx_academic_records_student_2025_11_15_16_09 ON public.academic_records_2025_11_15_16_09(student_id);
CREATE INDEX idx_transcripts_student_2025_11_15_16_09 ON public.transcripts_2025_11_15_16_09(student_id);
CREATE INDEX idx_certificates_student_2025_11_15_16_09 ON public.certificates_2025_11_15_16_09(student_id);
CREATE INDEX idx_announcements_published_2025_11_15_16_09 ON public.announcements_2025_11_15_16_09(is_published, publish_date);
CREATE INDEX idx_messages_recipient_2025_11_15_16_09 ON public.messages_2025_11_15_16_09(recipient_id);
CREATE INDEX idx_attendance_student_course_2025_11_15_16_09 ON public.attendance_2025_11_15_16_09(student_id, course_id);

-- Create function to calculate GPA
CREATE OR REPLACE FUNCTION public.calculate_gpa_2025_11_15_16_09(student_uuid UUID)
RETURNS DECIMAL(3,2) AS $$
DECLARE
    total_grade_points DECIMAL(10,2) := 0;
    total_credits INTEGER := 0;
    gpa DECIMAL(3,2) := 0.00;
BEGIN
    SELECT 
        COALESCE(SUM(grade_points * credits_earned), 0),
        COALESCE(SUM(credits_earned), 0)
    INTO total_grade_points, total_credits
    FROM public.academic_records_2025_11_15_16_09
    WHERE student_id = student_uuid AND completion_status = 'completed';
    
    IF total_credits > 0 THEN
        gpa := total_grade_points / total_credits;
    END IF;
    
    RETURN ROUND(gpa, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;