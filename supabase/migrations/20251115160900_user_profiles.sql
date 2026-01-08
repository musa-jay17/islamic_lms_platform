-- Create user profiles table
CREATE TABLE public.user_profiles_2025_11_15_16_09 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female')),
    nationality TEXT,
    address TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'instructor', 'admin')),
    student_id TEXT UNIQUE,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'graduated')),
    profile_image_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create RLS policies
ALTER TABLE public.user_profiles_2025_11_15_16_09 ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles_2025_11_15_16_09
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.user_profiles_2025_11_15_16_09
    FOR UPDATE USING (auth.uid() = user_id);

-- Instructors and admins can view all profiles
CREATE POLICY "Instructors and admins can view all profiles" ON public.user_profiles_2025_11_15_16_09
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles_2025_11_15_16_09 
            WHERE user_id = auth.uid() AND role IN ('instructor', 'admin')
        )
    );

-- Only admins can insert new profiles
CREATE POLICY "Admins can insert profiles" ON public.user_profiles_2025_11_15_16_09
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles_2025_11_15_16_09 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Create function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_2025_11_15_16_09()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles_2025_11_15_16_09 (user_id, full_name, email, student_id)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
        NEW.email,
        'STU' || LPAD(EXTRACT(YEAR FROM NOW())::TEXT, 4, '0') || LPAD(EXTRACT(DOY FROM NOW())::TEXT, 3, '0') || LPAD((RANDOM() * 999)::INT::TEXT, 3, '0')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created_2025_11_15_16_09
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_2025_11_15_16_09();

-- Create index for better performance
CREATE INDEX idx_user_profiles_user_id_2025_11_15_16_09 ON public.user_profiles_2025_11_15_16_09(user_id);
CREATE INDEX idx_user_profiles_role_2025_11_15_16_09 ON public.user_profiles_2025_11_15_16_09(role);
CREATE INDEX idx_user_profiles_student_id_2025_11_15_16_09 ON public.user_profiles_2025_11_15_16_09(student_id);