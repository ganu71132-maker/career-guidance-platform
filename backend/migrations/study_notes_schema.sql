-- Migration script for Study Notes feature
-- Run this script in Supabase SQL editor or via CLI

-- 1. Branches
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Semesters (linked to branch)
CREATE TABLE IF NOT EXISTS semesters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  number INT NOT NULL CHECK (number BETWEEN 1 AND 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Subjects (belong to semester)
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  semester_id UUID REFERENCES semesters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Units
CREATE TABLE IF NOT EXISTS units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  number INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Chapters
CREATE TABLE IF NOT EXISTS chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  number INT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('Easy','Medium','Hard')) DEFAULT 'Medium',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Resource Types (flexible)
CREATE TABLE IF NOT EXISTS resource_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Seed default resource types
INSERT INTO resource_types (name, icon) VALUES
  ('handwritten', 'pen'),
  ('quick_revision', 'book'),
  ('important_questions', 'question'),
  ('mcq', 'list'),
  ('previous_year', 'archive'),
  ('program', 'code'),
  ('video', 'video'),
  ('additional', 'plus')
ON CONFLICT (name) DO NOTHING;

-- 7. Chapter Resources (generic container)
CREATE TABLE IF NOT EXISTS chapter_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  type_id UUID REFERENCES resource_types(id) ON DELETE RESTRICT,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT,
  downloads BIGINT DEFAULT 0,
  views BIGINT DEFAULT 0,
  likes BIGINT DEFAULT 0,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8. Student interaction tables
CREATE TABLE IF NOT EXISTS student_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES chapter_resources(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS student_recent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  last_viewed TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chapter_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  progress_percent INT CHECK (progress_percent BETWEEN 0 AND 100) DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 9. Quiz system
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_option TEXT NOT NULL,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  score INT NOT NULL,
  total INT NOT NULL,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 10. Gamification
CREATE TABLE IF NOT EXISTS user_xp (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  xp BIGINT DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 11. Analytics view
CREATE MATERIALIZED VIEW IF NOT EXISTS admin_stats AS
SELECT
  (SELECT COUNT(*) FROM branches) AS branch_cnt,
  (SELECT COUNT(*) FROM subjects) AS subject_cnt,
  (SELECT COUNT(*) FROM units) AS unit_cnt,
  (SELECT COUNT(*) FROM chapters) AS chapter_cnt,
  (SELECT COUNT(*) FROM chapter_resources) AS resource_cnt,
  (SELECT COALESCE(SUM(downloads),0) FROM chapter_resources) AS total_downloads,
  (SELECT COALESCE(SUM(views),0) FROM chapter_resources) AS total_views,
  (SELECT COUNT(DISTINCT user_id) FROM chapter_resources) AS unique_viewers;

-- Ensure materialized view refresh schedule (Supabase cron) optional.

-- End of migration.
