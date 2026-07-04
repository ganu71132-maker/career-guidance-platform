-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS TABLE (Extends Supabase Auth)
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CAREERS TABLE
CREATE TABLE careers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  salary TEXT NOT NULL,
  demand_level TEXT NOT NULL,
  growth_potential TEXT NOT NULL,
  required_skills TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROADMAPS TABLE
CREATE TABLE roadmaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  career_id UUID REFERENCES careers(id) ON DELETE CASCADE,
  step_title TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RESOURCES TABLE
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  career_id UUID REFERENCES careers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('course', 'video', 'documentation', 'practice', 'project')),
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SAVED CAREERS TABLE
CREATE TABLE saved_careers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  career_id UUID REFERENCES careers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, career_id)
);

-- USER PROGRESS TABLE
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  roadmap_step_id UUID REFERENCES roadmaps(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, roadmap_step_id)
);

-- RLS (Row Level Security) Policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE careers ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_careers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Policies for Users
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Policies for Careers (Public read, Admin write)
CREATE POLICY "Anyone can view careers" ON careers FOR SELECT USING (true);
CREATE POLICY "Admins can manage careers" ON careers USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Policies for Roadmaps
CREATE POLICY "Anyone can view roadmaps" ON roadmaps FOR SELECT USING (true);
CREATE POLICY "Admins can manage roadmaps" ON roadmaps USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Policies for Resources
CREATE POLICY "Anyone can view resources" ON resources FOR SELECT USING (true);
CREATE POLICY "Admins can manage resources" ON resources USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Policies for Saved Careers
CREATE POLICY "Users can manage their saved careers" ON saved_careers 
  FOR ALL USING (auth.uid() = user_id);

-- Policies for User Progress
CREATE POLICY "Users can manage their progress" ON user_progress 
  FOR ALL USING (auth.uid() = user_id);

-- Trigger to automatically create a user record when a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email, 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ANNOUNCEMENTS TABLE
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  button_text TEXT,
  redirect_url TEXT,
  priority TEXT DEFAULT 'medium',
  is_active BOOLEAN DEFAULT true,
  is_feature_highlight BOOLEAN DEFAULT false,
  target_audience TEXT DEFAULT 'all',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  views_count INTEGER DEFAULT 0,
  clicks_count INTEGER DEFAULT 0
);

-- USER ANNOUNCEMENTS TABLE (For tracking reads)
CREATE TABLE user_announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT true,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, announcement_id)
);

-- Enable RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_announcements ENABLE ROW LEVEL SECURITY;

-- Policies for Announcements
CREATE POLICY "Anyone can view announcements" ON announcements FOR SELECT USING (true);
CREATE POLICY "Admins can manage announcements" ON announcements 
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Policies for User Announcements
CREATE POLICY "Users can manage their own announcement reads" ON user_announcements 
  FOR ALL USING (auth.uid() = user_id);

-- ==========================================
-- INTERACTIVE LEARNING PLATFORM SCHEMA
-- ==========================================

-- 1. Courses
CREATE TABLE learning_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  language TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Chapters
CREATE TABLE learning_chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES learning_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Lessons
CREATE TABLE learning_lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID REFERENCES learning_chapters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  objectives TEXT[],
  explanation TEXT,
  analogy TEXT,
  syntax TEXT,
  common_mistakes TEXT[],
  best_practices TEXT[],
  summary TEXT,
  order_index INTEGER DEFAULT 0,
  version TEXT DEFAULT '1.0',
  tags TEXT[] DEFAULT '{}',
  estimated_time INTEGER DEFAULT 10,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Lesson to Career Mapping
CREATE TABLE learning_lesson_careers (
  lesson_id UUID REFERENCES learning_lessons(id) ON DELETE CASCADE,
  career_id UUID REFERENCES careers(id) ON DELETE CASCADE,
  PRIMARY KEY (lesson_id, career_id)
);

-- 5. Lesson Prerequisites
CREATE TABLE learning_lesson_prerequisites (
  lesson_id UUID REFERENCES learning_lessons(id) ON DELETE CASCADE,
  required_lesson_id UUID REFERENCES learning_lessons(id) ON DELETE CASCADE,
  PRIMARY KEY (lesson_id, required_lesson_id)
);

-- 6. Interactive Content: Examples
CREATE TABLE learning_examples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID REFERENCES learning_lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  code TEXT NOT NULL,
  explanation TEXT
);

-- 7. Interactive Content: Exercises
CREATE TABLE learning_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID REFERENCES learning_lessons(id) ON DELETE CASCADE,
  statement TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  starter_code TEXT,
  expected_output TEXT NOT NULL,
  hint TEXT,
  solution TEXT NOT NULL
);

-- 8. Quizzes
CREATE TABLE learning_quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID REFERENCES learning_chapters(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options_json JSONB NOT NULL,
  correct_index INTEGER NOT NULL,
  explanation TEXT,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced'))
);

-- 9. Projects
CREATE TABLE learning_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID REFERENCES learning_chapters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  starter_code TEXT,
  solution TEXT,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced'))
);

-- 10. Resources
CREATE TABLE learning_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID REFERENCES learning_lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT,
  platform TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5)
);

-- 11. User Progress
CREATE TABLE learning_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL,
  entity_type TEXT CHECK (entity_type IN ('lesson', 'quiz', 'project')),
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  xp_earned INTEGER DEFAULT 0,
  UNIQUE(user_id, entity_id, entity_type)
);

-- 12. Editor State (Auto-save)
CREATE TABLE learning_editor_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES learning_lessons(id) ON DELETE CASCADE,
  current_code TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- 13. Bookmarks
CREATE TABLE learning_bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES learning_lessons(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- 14. Notes
CREATE TABLE learning_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES learning_lessons(id) ON DELETE CASCADE,
  note_content TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- 15. Gamification (XP & Streaks)
CREATE TABLE user_gamification (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
  total_xp INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_active_date DATE
);

-- 16. AI Future-Proofing Tables
CREATE TABLE learning_ai_explanations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES learning_lessons(id) ON DELETE CASCADE,
  code_snippet TEXT NOT NULL,
  explanation_provided TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE learning_ai_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  context JSONB,
  started_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE learning_hint_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES learning_exercises(id) ON DELETE CASCADE,
  hint_requested_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- ENABLE RLS FOR ALL LEARNING TABLES
-- ==========================================
ALTER TABLE learning_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_lesson_careers ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_lesson_prerequisites ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_editor_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_ai_explanations ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_ai_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_hint_history ENABLE ROW LEVEL SECURITY;

-- Base Policies (Public Read)
CREATE POLICY "Public read access" ON learning_courses FOR SELECT USING (true);
CREATE POLICY "Public read access" ON learning_chapters FOR SELECT USING (true);
CREATE POLICY "Public read access" ON learning_lessons FOR SELECT USING (true);
CREATE POLICY "Public read access" ON learning_lesson_careers FOR SELECT USING (true);
CREATE POLICY "Public read access" ON learning_lesson_prerequisites FOR SELECT USING (true);
CREATE POLICY "Public read access" ON learning_examples FOR SELECT USING (true);
CREATE POLICY "Public read access" ON learning_exercises FOR SELECT USING (true);
CREATE POLICY "Public read access" ON learning_quizzes FOR SELECT USING (true);
CREATE POLICY "Public read access" ON learning_projects FOR SELECT USING (true);
CREATE POLICY "Public read access" ON learning_resources FOR SELECT USING (true);

-- User-specific Policies (Users can only manage their own data)
CREATE POLICY "Users can manage their progress" ON learning_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their editor state" ON learning_editor_state FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their bookmarks" ON learning_bookmarks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their notes" ON learning_notes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view their gamification" ON user_gamification FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can manage user gamification" ON user_gamification FOR ALL USING (true); -- Requires secure RPCs in production

-- Admin Policies for Content Management
-- Assuming role IN ('admin', 'super admin', 'superadmin')
-- Note: A secure production system would duplicate these for every content table, 
-- but since this is seed-driven initially, we keep it simple.
