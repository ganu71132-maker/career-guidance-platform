import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { BookOpen, CheckCircle, Circle, ArrowLeft, Clock, BarChart, Tag, PlayCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function LearnCourseOverview() {
  const { courseSlug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({});

  useEffect(() => {
    fetchCourseData();
  }, [courseSlug, user]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      // 1. Fetch Course
      const { data: courseData, error: courseErr } = await supabase
        .from('learning_courses')
        .select('*')
        .eq('slug', courseSlug)
        .single();
        
      if (courseErr) throw courseErr;
      setCourse(courseData);

      // 2. Fetch Chapters and Lessons
      const { data: chaptersData, error: chaptersErr } = await supabase
        .from('learning_chapters')
        .select(`
          *,
          learning_lessons (
            id, title, order_index, estimated_time, difficulty, tags
          )
        `)
        .eq('course_id', courseData.id)
        .order('order_index', { ascending: true });

      if (chaptersErr) throw chaptersErr;
      
      // Sort lessons within chapters
      chaptersData.forEach(ch => {
        if (ch.learning_lessons) {
          ch.learning_lessons.sort((a, b) => a.order_index - b.order_index);
        }
      });
      setChapters(chaptersData || []);

      // 3. Fetch User Progress if logged in
      if (user) {
        const lessonIds = chaptersData.flatMap(c => c.learning_lessons?.map(l => l.id) || []);
        if (lessonIds.length > 0) {
          const { data: progData, error: progErr } = await supabase
            .from('learning_progress')
            .select('entity_id')
            .eq('user_id', user.id)
            .eq('entity_type', 'lesson')
            .in('entity_id', lessonIds);

          if (!progErr && progData) {
            const progMap = {};
            progData.forEach(p => progMap[p.entity_id] = true);
            setProgress(progMap);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching course:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <Link to="/learn" className="text-xl font-black text-blue-600 flex items-center gap-2">
          NextraPath <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full uppercase tracking-wider">Learn</span>
        </Link>
        <Link to="/learn" className="text-sm font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Course Catalog
        </Link>
      </nav>
      <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-800 mb-4">Course Not Found</h1>
            <button onClick={() => navigate('/learn')} className="text-blue-600 font-semibold hover:underline flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Catalog
            </button>
          </div>
        </div>
    </div>
  );
  }

  // Calculate totals
  const totalLessons = chapters.reduce((sum, ch) => sum + (ch.learning_lessons?.length || 0), 0);
  const completedLessons = Object.keys(progress).length;
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  
  const totalTime = chapters.reduce((sum, ch) => {
    return sum + (ch.learning_lessons?.reduce((tsum, l) => tsum + (l.estimated_time || 0), 0) || 0);
  }, 0);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <Link to="/learn" className="text-xl font-black text-blue-600 flex items-center gap-2">
          NextraPath <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full uppercase tracking-wider">Learn</span>
        </Link>
        <Link to="/learn" className="text-sm font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Course Catalog
        </Link>
      </nav>
      
      {/* Hero Section */}
      <div className="bg-slate-900 text-white pt-28 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/learn" className="text-slate-400 hover:text-white flex items-center gap-2 mb-6 text-sm font-medium transition-colors w-max">
            <ArrowLeft className="w-4 h-4" /> Back to Catalog
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-blue-500/20">
              {course.language}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">{course.title}</h1>
          <p className="text-xl text-slate-300 max-w-2xl mb-8 leading-relaxed">
            {course.description}
          </p>

          <div className="flex flex-wrap items-center gap-6 text-slate-400 text-sm font-medium">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-slate-300" />
              <span>{totalLessons} Interactive Lessons</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-300" />
              <span>~{Math.round(totalTime / 60) > 0 ? `${Math.round(totalTime/60)} hrs` : `${totalTime} mins`}</span>
            </div>
          </div>
        </div>
      </div>
      
      <main className="flex-grow py-12 px-4 max-w-4xl mx-auto w-full">
        {/* Progress Bar (if logged in) */}
        {user && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-10">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-slate-800">Your Progress</h3>
              <span className="font-bold text-blue-600">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 mb-2 overflow-hidden">
              <div className="bg-blue-600 h-3 rounded-full transition-all duration-1000 ease-out" style={{ width: `${progressPercent}%` }}></div>
            </div>
            <p className="text-xs text-slate-500 font-medium">{completedLessons} of {totalLessons} lessons completed</p>
          </div>
        )}

        {!user && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-10 flex items-center justify-between flex-wrap gap-4">
            <div className="text-blue-900">
              <h3 className="font-bold">Sign in to save progress</h3>
              <p className="text-sm text-blue-800/80 mt-1">Track your completion, earn XP, and build your coding streak.</p>
            </div>
            <Link to="/login" state={{ from: `/learn/${courseSlug}` }} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold text-sm transition-colors">
              Sign In
            </Link>
          </div>
        )}

        {/* Syllabus / Chapters */}
        <div className="space-y-8">
          <h2 className="text-2xl font-extrabold text-slate-800 mb-6">Course Syllabus</h2>
          
          {chapters.map((chapter, index) => (
            <div key={chapter.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-slate-50 px-6 py-5 border-b border-slate-200">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-slate-400 font-bold font-mono">{(index + 1).toString().padStart(2, '0')}</span>
                  <h3 className="text-lg font-bold text-slate-800">{chapter.title}</h3>
                </div>
                <p className="text-slate-500 text-sm pl-9">{chapter.description}</p>
              </div>
              
              <div className="divide-y divide-slate-100">
                {chapter.learning_lessons?.map((lesson, lIndex) => {
                  const isCompleted = !!progress[lesson.id];
                  
                  return (
                    <Link 
                      key={lesson.id} 
                      to={`/learn/${course.slug}/${lesson.id}`}
                      className="group flex items-start sm:items-center justify-between p-4 sm:px-6 hover:bg-blue-50/50 transition-colors"
                    >
                      <div className="flex items-start sm:items-center gap-4">
                        <div className="mt-1 sm:mt-0 flex-shrink-0">
                          {isCompleted ? (
                            <CheckCircle className="w-6 h-6 text-emerald-500" />
                          ) : (
                            <Circle className="w-6 h-6 text-slate-300 group-hover:text-blue-400 transition-colors" />
                          )}
                        </div>
                        <div>
                          <h4 className={`font-semibold ${isCompleted ? 'text-slate-900' : 'text-slate-700 group-hover:text-blue-700'} transition-colors flex items-center gap-2`}>
                            {lIndex + 1}. {lesson.title}
                          </h4>
                          
                          <div className="flex flex-wrap items-center gap-3 mt-1.5">
                            <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
                              <Clock className="w-3 h-3" /> {lesson.estimated_time}m
                            </span>
                            
                            {lesson.difficulty && (
                              <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md ${
                                lesson.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                                lesson.difficulty === 'intermediate' ? 'bg-orange-100 text-orange-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                <BarChart className="w-3 h-3" /> {lesson.difficulty}
                              </span>
                            )}
                            
                            {lesson.tags?.slice(0, 2).map(tag => (
                              <span key={tag} className="flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                <Tag className="w-3 h-3" /> {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="hidden sm:flex flex-shrink-0 bg-white border border-slate-200 text-slate-600 rounded-full w-10 h-10 items-center justify-center group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all shadow-sm">
                        <PlayCircle className="w-5 h-5 ml-1" />
                      </div>
                    </Link>
                  );
                })}
                {(!chapter.learning_lessons || chapter.learning_lessons.length === 0) && (
                  <div className="p-6 text-center text-slate-500 text-sm italic">
                    Lessons are being written for this chapter. Check back soon!
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
