import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Compass, Bookmark, CheckCircle, TrendingUp, LogOut, Map, BookOpen, User, ArrowRight, FileText, Megaphone } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import NotificationBell from '../components/NotificationBell';
import WelcomePopup from '../components/WelcomePopup';
import FeatureHighlightPopup from '../components/FeatureHighlightPopup';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { careers: careersData, savedCareers, completedSteps, completionsList = [] } = useData();
  const navigate = useNavigate();
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);

  useEffect(() => {
    if (!user) return;
    async function fetchRecent() {
      const nowISO = new Date().toISOString();
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .or(`expires_at.is.null,expires_at.gt.${nowISO}`)
        .order('created_at', { ascending: false })
        .limit(3);
      if (data) setRecentAnnouncements(data);
    }
    fetchRecent();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const savedCareersData = careersData.filter(c => savedCareers.includes(c.id));
  const totalStepsInSaved = savedCareersData.reduce((sum, c) => sum + c.roadmap.length, 0);
  const savedStepsIds = new Set(savedCareersData.flatMap(c => c.roadmap.map(step => step.id)));
  const completedSavedStepsCount = completedSteps.filter(id => savedStepsIds.has(id)).length;

  const progressVal = totalStepsInSaved > 0 
    ? `${Math.round((completedSavedStepsCount / totalStepsInSaved) * 100)}%`
    : '0%';

  // Streak & Activity Calendar calculations
  const activeDates = new Set();
  completionsList.forEach(item => {
    if (item.completedAt) {
      const dateStr = new Date(item.completedAt).toLocaleDateString('en-CA');
      activeDates.add(dateStr);
    }
  });

  let streak = 0;
  let checkDate = new Date();
  const toLocalISO = (d) => d.toLocaleDateString('en-CA');

  const hasActivityToday = activeDates.has(toLocalISO(checkDate));
  let yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const hasActivityYesterday = activeDates.has(toLocalISO(yesterday));

  if (hasActivityToday || hasActivityYesterday) {
    if (hasActivityToday) {
      streak = 1;
      checkDate.setDate(checkDate.getDate() - 1);
    }
    while (true) {
      if (activeDates.has(toLocalISO(checkDate))) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = toLocalISO(d);
    const isCompleted = activeDates.has(dateStr);
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = d.getDate();
    last7Days.push({
      dateStr,
      isCompleted,
      dayLabel,
      dayNum,
      isToday: i === 0
    });
  }

  const todayStr = toLocalISO(new Date());
  const activeTodayCareers = savedCareersData.filter(career => {
    const careerStepIds = career.roadmap.map(s => s.id);
    return completionsList.some(comp => 
      careerStepIds.includes(comp.stepId) && 
      toLocalISO(new Date(comp.completedAt)) === todayStr
    );
  });

  return (
    <div className="min-h-screen flex" style={{ background: '#f8fafc' }}>
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-100 hidden md:flex flex-col shrink-0 shadow-sm">
        <div className="h-20 flex items-center px-6 border-b border-slate-100">
          <Link to="/" className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Compass className="text-emerald-500 h-6 w-6" /> NaviCareer
          </Link>
        </div>
        <div className="flex-1 py-6 px-4 space-y-1">
          <div className="px-4 py-3 bg-emerald-50 text-emerald-700 rounded-xl font-medium text-sm border border-emerald-100">Dashboard</div>
          <Link to="/explorer" className="block px-4 py-3 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl text-sm transition-all font-medium">Explore Careers</Link>
          <Link to="/resume" className="block px-4 py-3 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl text-sm transition-all font-medium">Resume Builder</Link>
          <Link to="/profile" className="block px-4 py-3 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl text-sm transition-all font-medium">Profile</Link>
        </div>
        <div className="p-4 border-t border-slate-100">
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all text-sm font-medium">
            <LogOut className="h-5 w-5" /> Log Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-4 sm:p-6 md:p-10 overflow-y-auto relative">
        <div className="fixed top-0 right-0 w-[40vw] h-[40vw] rounded-full bg-emerald-100/20 blur-[100px] -z-10" />

        {/* Welcome & Highlight Overlay Modals */}
        <WelcomePopup />
        <FeatureHighlightPopup />

        {/* Mobile header */}
        <div className="md:hidden flex flex-col gap-3 mb-6 pb-4 border-b border-slate-100">
          {/* Row 1: Brand Logo & Notification Bell */}
          <div className="flex items-center justify-between">
            <Link to="/" className="text-base font-bold text-slate-800 flex items-center gap-1.5 shrink-0">
              <Compass className="text-emerald-500 h-5 w-5" /> NaviCareer
            </Link>
            <NotificationBell />
          </div>

          {/* Row 2: Segmented Navigation Tabs */}
          <div className="flex items-center justify-between bg-slate-100/80 p-1 rounded-xl border border-slate-200/20">
            <Link to="/dashboard" className="flex-1 text-center bg-white text-emerald-600 text-[11px] font-bold py-1.5 rounded-lg shadow-sm border border-slate-200/40 transition-all">
              Dashboard
            </Link>
            <Link to="/explorer" className="flex-1 text-center text-slate-500 hover:text-slate-800 text-[11px] font-semibold py-1.5 transition-colors">
              Explore
            </Link>
            <Link to="/resume" className="flex-1 text-center text-slate-500 hover:text-slate-800 text-[11px] font-semibold py-1.5 transition-colors flex items-center justify-center gap-0.5">
              Resume <span className="text-[9px]">✨</span>
            </Link>
            <Link to="/profile" className="flex-1 text-center text-slate-500 hover:text-slate-800 text-[11px] font-semibold py-1.5 transition-colors">
              Profile
            </Link>
          </div>
        </div>

        <header className="mb-8 sm:mb-10 flex justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-slate-800">Welcome back, {user?.user_metadata?.full_name || 'User'}! 👋</h1>
            <p className="text-slate-500 text-sm sm:text-base">Here's your career exploration overview.</p>
          </div>
          <div className="hidden md:block">
            <NotificationBell />
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-blue-100 shadow-sm">
            <div className="flex items-center gap-2.5 sm:gap-3 mb-2.5 sm:mb-3">
              <div className="p-2 sm:p-2.5 bg-blue-50 rounded-lg"><Compass className="h-5 sm:h-6 w-5 sm:w-6 text-blue-600" /></div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-800 mb-1">{careersData.length}</div>
            <div className="text-[10px] sm:text-xs text-slate-500 font-medium">Careers Available</div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-purple-100 shadow-sm">
            <div className="flex items-center gap-2.5 sm:gap-3 mb-2.5 sm:mb-3">
              <div className="p-2 sm:p-2.5 bg-purple-50 rounded-lg"><Bookmark className="h-5 sm:h-6 w-5 sm:w-6 text-purple-600" /></div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-800 mb-1">{savedCareers.length}</div>
            <div className="text-[10px] sm:text-xs text-slate-500 font-medium">Saved Careers</div>
          </div>

          {/* Steps Completed Stat Card with hover breakdown */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-100 shadow-sm relative group cursor-help">
            <div className="flex items-center justify-between mb-2.5 sm:mb-3">
              <div className="p-2 sm:p-2.5 bg-emerald-50 rounded-lg"><CheckCircle className="h-5 sm:h-6 w-5 sm:w-6 text-emerald-600" /></div>
              {savedCareersData.length > 0 && (
                <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-semibold">Hover for details</span>
              )}
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-800 mb-1">{completedSavedStepsCount}</div>
            <div className="text-[10px] sm:text-xs text-slate-500 font-medium">Steps Completed</div>

            {/* Hover Breakdown Popover */}
            {savedCareersData.length > 0 && (
              <div className="absolute left-0 right-0 top-[105%] mt-1 bg-white border border-slate-100 shadow-xl rounded-2xl p-4 hidden group-hover:block z-30 transition-all duration-200">
                <h4 className="font-bold text-xs text-slate-700 mb-2 border-b border-slate-50 pb-1.5 flex items-center justify-between">
                  <span>Steps Breakdown</span>
                  <span className="text-[10px] text-slate-400 font-normal">Completed / Total</span>
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {savedCareersData.map((career) => {
                    const steps = career.roadmap.map(s => s.id);
                    const done = completedSteps.filter(id => steps.includes(id)).length;
                    return (
                      <div key={career.id} className="flex justify-between items-center gap-4 text-[11px]">
                        <span className="text-slate-600 font-medium truncate max-w-[120px]">{career.title}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="font-semibold text-slate-800">{done}/{steps.length}</span>
                          <span className="text-slate-400">({steps.length > 0 ? Math.round((done / steps.length) * 100) : 0}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-orange-100 shadow-sm">
            <div className="flex items-center gap-2.5 sm:gap-3 mb-2.5 sm:mb-3">
              <div className="p-2 sm:p-2.5 bg-orange-50 rounded-lg"><TrendingUp className="h-5 sm:h-6 w-5 sm:w-6 text-orange-600" /></div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-800 mb-1">{progressVal}</div>
            <div className="text-[10px] sm:text-xs text-slate-500 font-medium">Overall Progress</div>
          </div>
        </div>

        {/* Learning Streak & Activity Tracker */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-sm mb-8 sm:mb-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] select-none pointer-events-none">
            <TrendingUp className="h-40 w-40 text-emerald-600" />
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl">🔥</span>
                <h2 className="text-base sm:text-lg font-bold text-slate-800">Learning Streak</h2>
              </div>
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                Complete at least one step in <strong>any of your saved careers</strong> every day to keep your learning streak active!
              </p>
              <div className="pt-2 flex flex-col gap-1.5">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">{streak}</span>
                  <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Days Streak</span>
                </div>
                {activeTodayCareers.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500 font-semibold mt-1">
                    <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                      ⚡ Active Today:
                    </span>
                    {activeTodayCareers.map(c => (
                      <span key={c.id} className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                        {c.title}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Visual calendar - last 7 days */}
            <div className="flex-1 max-w-md w-full">
              <h4 className="font-bold text-[10px] sm:text-xs text-slate-400 mb-3.5 uppercase tracking-wider">Weekly Activity</h4>
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {last7Days.map((day) => (
                  <div key={day.dateStr} className="flex flex-col items-center">
                    <span className="text-[10px] text-slate-400 font-bold mb-1.5">{day.dayLabel[0]}</span>
                    <div 
                      title={day.isCompleted ? `Activity on ${day.dateStr}` : `No activity on ${day.dateStr}`}
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex flex-col items-center justify-center border transition-all duration-300 ${
                        day.isCompleted
                          ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                          : day.isToday
                            ? 'bg-white text-emerald-600 border-emerald-400 border-2 font-bold ring-4 ring-emerald-50'
                            : 'bg-slate-50 text-slate-400 border-slate-100'
                      }`}
                    >
                      <span className="text-xs font-bold">{day.dayNum}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Updates Widget */}
        {recentAnnouncements.length > 0 && (
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-sm mb-8 sm:mb-10 relative overflow-hidden">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100/50">
              <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                <Megaphone className="text-emerald-500 h-5 w-5" /> Recent Updates
              </h2>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">What's New</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentAnnouncements.map((ann) => (
                <div key={ann.id} className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl flex flex-col justify-between hover:border-slate-200 transition-all">
                  <div className="space-y-1">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-bold text-slate-800 text-xs sm:text-sm line-clamp-1">{ann.title}</h3>
                      {ann.priority === 'high' && (
                        <span className="bg-red-50 text-red-650 text-[8px] font-extrabold uppercase px-1 py-0.2 rounded shrink-0">High</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-normal line-clamp-2">{ann.message}</p>
                  </div>
                  {ann.redirect_url && (
                    <Link 
                      to={ann.redirect_url}
                      onClick={async () => {
                        try {
                          await supabase.rpc('increment_announcement_clicks', { announcement_id: ann.id });
                        } catch (err) {
                          await supabase.from('announcements')
                            .update({ clicks_count: (ann.clicks_count || 0) + 1 })
                            .eq('id', ann.id);
                        }
                      }}
                      className="text-[10px] text-emerald-600 font-bold hover:text-emerald-700 mt-3 flex items-center gap-1 w-fit cursor-pointer"
                    >
                      {ann.button_text || 'Learn More'} <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Saved/Recommended Careers */}
        <div className="mb-8 sm:mb-10">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">
              {savedCareersData.length > 0 ? 'My Saved Careers' : 'Recommended Careers'}
            </h2>
            <Link to="/explorer" className="text-xs sm:text-sm text-emerald-600 hover:text-emerald-500 flex items-center gap-1 font-medium">View All <ArrowRight className="h-3.5 sm:h-4 w-3.5 sm:w-4" /></Link>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {savedCareersData.length > 0 
              ? savedCareersData.map((career) => (
                  <Link key={career.id} to={`/career/${career.id}`} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300 flex flex-col group">
                    <h3 className="font-bold text-slate-800 mb-1.5 sm:mb-2 text-sm sm:text-base group-hover:text-emerald-600 transition-colors">{career.title}</h3>
                    <p className="text-[10px] sm:text-xs text-slate-500 mb-3 line-clamp-2">{career.description}</p>
                    
                    {/* Visual Progress Bar Widget */}
                    {(() => {
                      const steps = career.roadmap.map(s => s.id);
                      const done = completedSteps.filter(id => steps.includes(id)).length;
                      const pct = steps.length > 0 ? Math.round((done / steps.length) * 100) : 0;
                      return (
                        <div className="mt-auto pt-2 mb-3">
                          <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1 font-medium">
                            <span>Roadmap Progress</span>
                            <span className="font-bold text-slate-700">{pct}% ({done}/{steps.length})</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })()}
                    
                    <div className="flex items-center justify-between text-[10px] sm:text-xs pt-2 border-t border-slate-50">
                      <span className="text-emerald-600 font-semibold">{career.demandLevel}</span>
                      <span className="text-slate-400 font-medium group-hover:text-emerald-600 transition-colors">Continue Roadmap →</span>
                    </div>
                  </Link>
                ))
              : careersData.slice(0, 3).map((career) => (
                  <Link key={career.id} to={`/career/${career.id}`} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300 group">
                    <h3 className="font-bold text-slate-800 mb-1.5 sm:mb-2 text-sm sm:text-base group-hover:text-emerald-600 transition-colors">{career.title}</h3>
                    <p className="text-[10px] sm:text-xs text-slate-500 mb-2.5 sm:mb-3 line-clamp-2">{career.description}</p>
                    <div className="flex items-center gap-3 text-[10px] sm:text-xs">
                      <span className="text-emerald-600 font-medium">{career.demandLevel}</span>
                      <span className="text-slate-400">{career.salary}</span>
                    </div>
                  </Link>
                ))
            }
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-4 sm:mb-6">Quick Actions</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Link to="/explorer" className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-blue-50 border border-blue-100 rounded-2xl hover:bg-blue-100/70 transition-colors">
              <Map className="h-7 sm:h-8 w-7 sm:w-8 text-blue-600" />
              <div>
                <h3 className="font-bold text-slate-800 text-sm sm:text-base">Browse Careers</h3>
                <p className="text-[10px] sm:text-xs text-slate-500">Explore all career paths</p>
              </div>
            </Link>
            <Link to="/explorer" className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-purple-50 border border-purple-100 rounded-2xl hover:bg-purple-100/70 transition-colors">
              <BookOpen className="h-7 sm:h-8 w-7 sm:w-8 text-purple-600" />
              <div>
                <h3 className="font-bold text-slate-800 text-sm sm:text-base">Start a Roadmap</h3>
                <p className="text-[10px] sm:text-xs text-slate-500">Pick a career and begin</p>
              </div>
            </Link>
            <Link to="/resume" className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-orange-50 border border-orange-100 rounded-2xl hover:bg-orange-100/70 transition-colors">
              <FileText className="h-7 sm:h-8 w-7 sm:w-8 text-orange-600" />
              <div>
                <h3 className="font-bold text-slate-800 text-sm sm:text-base">Build Resume</h3>
                <p className="text-[10px] sm:text-xs text-slate-500">Create a job-ready CV</p>
              </div>
            </Link>
            <Link to="/profile" className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-emerald-50 border border-emerald-100 rounded-2xl hover:bg-emerald-100/70 transition-colors">
              <User className="h-7 sm:h-8 w-7 sm:w-8 text-emerald-600" />
              <div>
                <h3 className="font-bold text-slate-800 text-sm sm:text-base">Edit Profile</h3>
                <p className="text-[10px] sm:text-xs text-slate-500">Update your information</p>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
