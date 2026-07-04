import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// Setup ES Module paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read env variables from frontend/.env.local manually since we don't have dotenv
const envPath = path.resolve(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value) envVars[key.trim()] = value.join('=').trim();
});

const SUPABASE_URL = envVars.VITE_SUPABASE_URL;
// MUST use Service Role Key for inserting content (bypasses RLS)
const SUPABASE_SERVICE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY in frontend/.env.local");
  console.error("Please add SUPABASE_SERVICE_ROLE_KEY=your_key_here to the file.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function seed() {
  console.log("🌱 Starting content ingestion using Service Role...");
  
  const contentDir = path.resolve(__dirname, '../content');
  const languages = fs.readdirSync(contentDir);

  for (const lang of languages) {
    const langDir = path.join(contentDir, lang);
    if (!fs.statSync(langDir).isDirectory()) continue;

    const files = fs.readdirSync(langDir).filter(f => f.endsWith('.json'));
    
    for (const file of files) {
      console.log(`\nProcessing ${lang}/${file}...`);
      const filePath = path.join(langDir, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      // 1. UPSERT COURSE
      let { data: course, error: courseErr } = await supabase
        .from('learning_courses')
        .select('id')
        .eq('slug', data.course.slug)
        .single();
      
      if (!course) {
        const res = await supabase.from('learning_courses').insert({
          title: data.course.title,
          slug: data.course.slug,
          language: data.course.language,
          description: data.course.description
        }).select('id').single();
        if (res.error) throw new Error(`Course Error: ${res.error.message}`);
        course = res.data;
      }

      // 2. UPSERT CHAPTER
      let { data: chapter, error: chapterErr } = await supabase
        .from('learning_chapters')
        .select('id')
        .eq('course_id', course.id)
        .eq('title', data.chapter.title)
        .single();
      
      if (!chapter) {
        const res = await supabase.from('learning_chapters').insert({
          course_id: course.id,
          title: data.chapter.title,
          description: data.chapter.description,
          order_index: data.chapter.order_index
        }).select('id').single();
        if (res.error) throw new Error(`Chapter Error: ${res.error.message}`);
        chapter = res.data;
      }

      // 3. UPSERT LESSONS
      for (const lessonData of data.lessons) {
        let { data: lesson, error: lessonErr } = await supabase
          .from('learning_lessons')
          .select('id')
          .eq('chapter_id', chapter.id)
          .eq('title', lessonData.title)
          .single();

        const lessonPayload = {
          chapter_id: chapter.id,
          title: lessonData.title,
          objectives: lessonData.objectives || [],
          explanation: lessonData.explanation || '',
          analogy: lessonData.analogy || '',
          syntax: lessonData.syntax || '',
          common_mistakes: lessonData.common_mistakes || [],
          best_practices: lessonData.best_practices || [],
          summary: lessonData.summary || '',
          order_index: lessonData.order_index || 1,
          estimated_time: lessonData.estimated_time || 10,
          difficulty: lessonData.difficulty || 'beginner',
          tags: lessonData.tags || [],
          updated_at: new Date().toISOString()
        };

        if (lesson) {
          const res = await supabase.from('learning_lessons').update(lessonPayload).eq('id', lesson.id).select('id').single();
          if (res.error) throw new Error(`Lesson Update Error: ${res.error.message}`);
        } else {
          const res = await supabase.from('learning_lessons').insert(lessonPayload).select('id').single();
          if (res.error) throw new Error(`Lesson Insert Error: ${res.error.message}`);
          lesson = res.data;
        }

        console.log(`  ✓ Lesson: ${lessonData.title}`);

        // A. CAREER MAPPING
        if (lessonData.careers && lessonData.careers.length > 0) {
          // Fetch existing careers
          const { data: careersInDb } = await supabase.from('careers').select('id, title');
          for (const careerTitle of lessonData.careers) {
            const foundCareer = (careersInDb || []).find(c => c.title.toLowerCase().includes(careerTitle.toLowerCase()));
            if (foundCareer) {
              await supabase.from('learning_lesson_careers').upsert({
                lesson_id: lesson.id,
                career_id: foundCareer.id
              }, { onConflict: 'lesson_id,career_id' });
            } else {
              console.warn(`    ⚠️ Career not found in DB: ${careerTitle}`);
            }
          }
        }

        // B. EXAMPLES
        if (lessonData.examples) {
          // Clean old examples first to avoid duplicates (naive upsert)
          await supabase.from('learning_examples').delete().eq('lesson_id', lesson.id);
          for (const ex of lessonData.examples) {
            await supabase.from('learning_examples').insert({
              lesson_id: lesson.id,
              title: ex.title,
              code: ex.code,
              explanation: ex.explanation
            });
          }
        }

        // C. EXERCISES
        if (lessonData.exercises) {
          await supabase.from('learning_exercises').delete().eq('lesson_id', lesson.id);
          for (const ex of lessonData.exercises) {
            const exRes = await supabase.from('learning_exercises').insert({
              lesson_id: lesson.id,
              statement: ex.statement,
              difficulty: ex.difficulty || 'beginner',
              starter_code: ex.starter_code || '',
              expected_output: ex.expected_output,
              hint: ex.hint || '',
              solution: ex.solution || ''
            });
            if (exRes.error) console.error(`Failed to insert exercise for ${lessonData.title}:`, exRes.error);
          }
        }

        // D. RESOURCES
        if (lessonData.resources) {
          await supabase.from('learning_resources').delete().eq('lesson_id', lesson.id);
          for (const res of lessonData.resources) {
            await supabase.from('learning_resources').insert({
              lesson_id: lesson.id,
              title: res.title,
              url: res.url,
              type: res.type || 'documentation',
              platform: res.platform || '',
              rating: res.rating || 5
            });
          }
        }
      }
    }
  }
  
  console.log("✅ Seeding complete!");
}

seed().catch(err => console.error("Fatal Error:", err));
