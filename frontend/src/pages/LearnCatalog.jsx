import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { BookOpen, Terminal, Shield, Cpu, Code2, Zap, Flame, Trophy, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function LearnCatalog() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ xp: 0, streak: 0 });

  useEffect(() => {
    fetchCourses();
    if (user) {
      fetchUserStats();
    }
  }, [user]);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('learning_courses')
        .select('*')
        .order('order_index', { ascending: true });
      if (error) throw error;
      setCourses(data || []);
    } catch (err) {
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const { data, error } = await supabase
        .from('user_gamification')
        .select('total_xp, current_streak')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setStats({ xp: data.total_xp || 0, streak: data.current_streak || 0 });
      }
    } catch (err) {
      console.error('Error fetching gamification stats:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <Link to="/" className="text-xl font-black text-blue-600 flex items-center gap-2">
          NextraPath <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full uppercase tracking-wider">Learn</span>
        </Link>
        <Link to="/" className="text-sm font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </nav>
      
      <main className="flex-grow pt-10 pb-16 px-4 max-w-7xl mx-auto w-full">
        {/* Gamification Header for Logged-in Users */}
        {user && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-wrap gap-6 items-center justify-between mb-10">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Welcome back, {user.user_metadata?.full_name?.split(' ')[0] || 'Learner'}! 👋</h1>
              <p className="text-slate-500 text-sm mt-1">Ready to continue your coding journey?</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center justify-center p-3 bg-orange-50 text-orange-600 rounded-xl min-w-[100px]">
                <div className="flex items-center gap-1 font-bold text-xl"><Flame className="h-5 w-5 fill-orange-500" /> {stats.streak}</div>
                <span className="text-xs uppercase tracking-wider font-semibold">Day Streak</span>
              </div>
              <div className="flex flex-col items-center justify-center p-3 bg-emerald-50 text-emerald-600 rounded-xl min-w-[100px]">
                <div className="flex items-center gap-1 font-bold text-xl"><Trophy className="h-5 w-5" /> {stats.xp}</div>
                <span className="text-xs uppercase tracking-wider font-semibold">Total XP</span>
              </div>
            </div>
          </div>
        )}

        {!user && (
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
              Master the skills that drive the future.
            </h1>
            <p className="text-lg text-slate-600 mb-8">
              Interactive, hands-on coding courses designed to take you from beginner to professional developer.
            </p>
          </div>
        )}

        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="text-blue-600 h-6 w-6" /> Available Courses
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl h-64 border border-slate-100 animate-pulse shadow-sm"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(course => (
              <Link 
                to={`/learn/${course.slug}`} 
                key={course.id}
                className="group bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 relative overflow-hidden flex flex-col"
              >
                <div className="absolute -right-10 -top-10 bg-slate-50 w-32 h-32 rounded-full group-hover:bg-blue-50 transition-colors"></div>
                
                <div className="mb-6 relative z-10 flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 group-hover:scale-110 transition-transform">
                  {course.language === 'python' ? <Code2 className="h-7 w-7" /> : <Terminal className="h-7 w-7" />}
                </div>

                <h3 className="text-xl font-bold text-slate-800 mb-2 relative z-10">{course.title}</h3>
                <p className="text-slate-600 text-sm mb-6 flex-grow relative z-10 line-clamp-3">
                  {course.description}
                </p>

                <div className="mt-auto relative z-10 flex items-center justify-between text-sm">
                  <span className="font-semibold text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    View Course <span aria-hidden="true">&rarr;</span>
                  </span>
                  <span className="bg-slate-100 text-slate-500 py-1 px-3 rounded-full text-xs font-medium uppercase tracking-wider">
                    {course.language}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
