-- Create detections table for VisionAI
CREATE TABLE IF NOT EXISTS detections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL, -- Path in Supabase Storage or 'webcam_capture'
    file_type TEXT NOT NULL, -- 'image' or 'video'
    objects_detected JSONB NOT NULL, -- Array of detected objects with confidence or AI explanation
    accuracy FLOAT NOT NULL,
    latency FLOAT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Set up Row Level Security (RLS)
ALTER TABLE detections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own detections" ON detections;
CREATE POLICY "Users can view their own detections"
    ON detections FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own detections" ON detections;
CREATE POLICY "Users can insert their own detections"
    ON detections FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create storage bucket for detection files
INSERT INTO storage.buckets (id, name, public)
VALUES ('detections', 'detections', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to read files
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'detections' );

-- Allow authenticated users to upload files
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'detections' AND (auth.role() = 'authenticated') );

-- Create profiles table for user data
DROP TABLE IF EXISTS public.profiles CASCADE;
CREATE TABLE public.profiles (
  userid UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY, -- Unique User ID
  email TEXT UNIQUE,
  password TEXT, -- Note: Supabase encrypts actual passwords in auth.users
  updated_at TIMESTAMP WITH TIME ZONE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  website TEXT,
  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- Set up Row Level Security (RLS) for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles FOR SELECT
  USING ( true );

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT
  WITH CHECK ( auth.uid() = userid );

DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile."
  ON public.profiles FOR UPDATE
  USING ( auth.uid() = userid );

-- Create a trigger function to automatically create a profile for every new signed-up user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (userid, email, password, full_name, username, avatar_url)
  VALUES (
    new.id, 
    new.email, 
    '*managed by supabase auth*', -- Supabase handles password securely in auth.users
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- SCHEDULED LOGIN SESSIONS (EVERY 6 DAYS)
-- ==========================================

-- 1. Enable pg_cron for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Create the table for logging scheduled sessions
CREATE TABLE IF NOT EXISTS public.scheduled_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    session_info TEXT DEFAULT 'Automated 6-day session record'
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.scheduled_sessions ENABLE ROW LEVEL SECURITY;

-- Allow only authenticated users to view these logs
DROP POLICY IF EXISTS "Allow authenticated reads on scheduled_sessions" ON public.scheduled_sessions;
CREATE POLICY "Allow authenticated reads on scheduled_sessions" 
    ON public.scheduled_sessions FOR SELECT 
    USING (auth.role() = 'authenticated');

-- 3. Create the cron job
-- This runs at 00:00 (midnight) every 6th day of the month
-- It inserts a new log entry into scheduled_sessions
SELECT cron.schedule(
  'log_session_every_6_days',
  '0 0 */6 * *', 
  $$
    INSERT INTO public.scheduled_sessions (created_at, session_info)
    VALUES (TIMEZONE('utc'::text, NOW()), 'Auto-generated session log every 6 days')
  $$
);

-- ==========================================
-- PRE-SIGNUP VERIFICATION TOKENS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.verification_tokens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  token text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);


-- ==========================================
-- v1.0 (Next.js 16 rebuild): cloud sync of on-device scans
-- The client upserts with the scan's own UUID and can delete its rows.
-- ==========================================
DROP POLICY IF EXISTS "Users can update their own detections" ON detections;
CREATE POLICY "Users can update their own detections"
    ON detections FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own detections" ON detections;
CREATE POLICY "Users can delete their own detections"
    ON detections FOR DELETE
    USING (auth.uid() = user_id);

-- Allow re-uploading (upsert) a scan image to the same path
DROP POLICY IF EXISTS "Authenticated users can update own uploads" ON storage.objects;
CREATE POLICY "Authenticated users can update own uploads"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'detections' AND auth.role() = 'authenticated' );
