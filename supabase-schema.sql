-- ================================================================
-- SafeHer — Supabase Database Schema
-- Run this in your Supabase SQL Editor
-- ================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------
-- USERS TABLE
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  profile_image TEXT,
  emergency_pin TEXT NOT NULL DEFAULT '0000',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- ----------------------------------------------------------------
-- EMERGENCY CONTACTS TABLE
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  relationship TEXT DEFAULT '',
  priority INTEGER NOT NULL DEFAULT 1 CHECK (priority IN (1, 2, 3)),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own contacts"
  ON public.emergency_contacts FOR ALL USING (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- SOS ALERTS TABLE
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sos_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('manual', 'shake', 'ai_keyword', 'voice')),
  latitude DOUBLE PRECISION NOT NULL DEFAULT 0,
  longitude DOUBLE PRECISION NOT NULL DEFAULT 0,
  address TEXT,
  audio_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'cancelled')),
  duration_seconds INTEGER,
  ai_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE public.sos_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own SOS alerts"
  ON public.sos_alerts FOR ALL USING (auth.uid() = user_id);

-- Allow service role to insert (for API routes)
CREATE POLICY "Service role can insert SOS alerts"
  ON public.sos_alerts FOR INSERT WITH CHECK (true);

-- ----------------------------------------------------------------
-- LIVE TRACKING TABLE
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.live_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  speed DOUBLE PRECISION DEFAULT 0,
  battery_level INTEGER,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.live_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own location"
  ON public.live_tracking FOR ALL USING (auth.uid() = user_id);

-- Allow guardians to read location (implement with share tokens later)
CREATE POLICY "Service role can read tracking"
  ON public.live_tracking FOR SELECT USING (true);

-- ----------------------------------------------------------------
-- SAFE CHECK-INS TABLE
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.safe_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Home check-in',
  expected_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'missed', 'alerted')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.safe_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own check-ins"
  ON public.safe_checkins FOR ALL USING (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- SAFE ZONES TABLE (community contributed)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.safe_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('police', 'hospital', 'cafe', 'public', 'pharmacy')),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  contributed_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.safe_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read safe zones"
  ON public.safe_zones FOR SELECT USING (true);

CREATE POLICY "Authenticated users can contribute safe zones"
  ON public.safe_zones FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ----------------------------------------------------------------
-- SUPABASE STORAGE BUCKET
-- ----------------------------------------------------------------
-- Run this to create the audio evidence bucket:
INSERT INTO storage.buckets (id, name, public)
VALUES ('emergency-recordings', 'emergency-recordings', false)
ON CONFLICT DO NOTHING;

-- Storage policy: users can upload their own recordings
CREATE POLICY "Users can upload own recordings"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'emergency-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can read own recordings"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'emergency-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ----------------------------------------------------------------
-- INDEXES for performance
-- ----------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_sos_alerts_user_id ON public.sos_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_created_at ON public.sos_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_tracking_user_id ON public.live_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON public.emergency_contacts(user_id, priority);
CREATE INDEX IF NOT EXISTS idx_safe_checkins_user_status ON public.safe_checkins(user_id, status);

-- ----------------------------------------------------------------
-- REALTIME: Enable realtime for tracking and alerts
-- ----------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_tracking;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sos_alerts;

-- ----------------------------------------------------------------
-- TRIGGER: Auto-create user profile on signup
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email, phone, emergency_pin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'SafeHer User'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    '0000'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
