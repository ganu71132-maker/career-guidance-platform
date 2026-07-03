import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Compass, Bookmark, CheckCircle, TrendingUp, LogOut, Map, BookOpen, User, ArrowRight, FileText, Megaphone, Code2, Clock } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import NotificationBell from '../components/NotificationBell';
import WelcomePopup from '../components/WelcomePopup';
import FeatureHighlightPopup from '../components/FeatureHighlightPopup';
import CodePracticeInterface from '../components/coding/CodePracticeInterface';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const VAPID_PUBLIC_KEY = 'BInACj48s2VLb4bczm5_4wvo2ujO1JR9cBJXPRDwH27Xs3pQHHGVJswQy-WjOm1MDB8XLSiklS0mH03n7U2RNEQ';

export default function Dashboard() {
  const { user, signOut, isAdmin } = useAuth();
  const { careers: careersData, loading, savedCareers, completedSteps, completionsList = [] } = useData();
  const navigate = useNavigate();
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [savedCodes, setSavedCodes] = useState([]);
  const [selectedSnippet, setSelectedSnippet] = useState(null);

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

    async function fetchSavedCodes() {
      try {
        const { data, error } = await supabase
          .from('saved_code')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (!error && data) setSavedCodes(data);
      } catch (err) {
        console.error('Error fetching saved codes:', err);
      }
    }

    fetchRecent();
    fetchSavedCodes();
  }, [user]);

  // Redirect old users to /explorer on initial login/dashboard mount
  useEffect(() => {
    if (!user) return;
    const storageKey = `navicompany_welcome_shown_${user.id}`;
    const alreadyShown = localStorage.getItem(storageKey);
    const sessionRedirectKey = `navicompany_welcome_redirected_${user.id}`;
    const alreadyRedirected = sessionStorage.getItem(sessionRedirectKey);

    if (alreadyShown === 'true' && !alreadyRedirected) {
      sessionStorage.setItem(sessionRedirectKey, 'true');
      navigate('/explorer', { replace: true });
    }
  }, [user, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const [showPushBanner, setShowPushBanner] = useState(false);
  const [pushStatus, setPushStatus] = useState('');
  const [pushError, setPushError] = useState('');

  useEffect(() => {
    if (!user) return;
    const supportsPush = 'serviceWorker' in navigator && 'PushManager' in window;
    if (!supportsPush) return;

    if (Notification.permission === 'granted') {
      // Auto-sync/register subscription in the database if permission is already granted
      const syncSubscription = async () => {
        try {
          const registration = await navigator.serviceWorker.ready;
          let sub = await registration.pushManager.getSubscription();
          if (!sub) {
            sub = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });
          }
          await supabase
            .from('user_push_subscriptions')
            .upsert({ user_id: user.id, subscription: sub }, { onConflict: 'user_id' });
        } catch (e) {
          console.error('Failed to auto-sync push subscription:', e);
        }
      };
      syncSubscription();
    } else {
      const dismissed = sessionStorage.getItem(`pwa-push-banner-dismissed-${user.id}`);
      if (!dismissed) {
        setShowPushBanner(true);
      }
    }
  }, [user]);

  const handleSubscribePush = async () => {
    try {
      setPushStatus('loading');
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      // Save subscription details directly to Supabase table
      const { error: dbError } = await supabase
        .from('user_push_subscriptions')
        .upsert({ user_id: user.id, subscription: sub }, { onConflict: 'user_id' });

      if (dbError) {
        console.error('Error saving subscription to Supabase DB:', dbError);
      }

      setPushStatus('success');
      setTimeout(() => setShowPushBanner(false), 8000);
    } catch (err) {
      console.error('Push subscription failed:', err);
      setPushError(err.message || String(err));
      setPushStatus('error');
    }
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

  if (loading) {
    return (
      <div className="min-h-screen flex animate-fade-in" style={{ background: '#f8fafc' }}>
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-100 hidden md:flex flex-col shrink-0 shadow-sm animate-fade-in">
          <div className="h-20 flex items-center px-6 border-b border-slate-100">
            <div className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <img src="/logo.png" alt="NextraPath Logo" className="h-6 w-6 object-contain drop-shadow-sm" /> NextraPath
            </div>
          </div>
          <div className="flex-1 py-6 px-4 space-y-1">
            <div className="px-4 py-3 bg-emerald-50 text-emerald-700 rounded-xl font-medium text-sm border border-emerald-100">Dashboard</div>
            <div className="block px-4 py-3 text-slate-400 rounded-xl text-sm font-medium">Explore Careers</div>
            <div className="block px-4 py-3 text-slate-400 rounded-xl text-sm font-medium">Resume Builder</div>
            <div className="block px-4 py-3 text-slate-400 rounded-xl text-sm font-medium">Profile</div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 p-4 sm:p-6 md:p-10 overflow-y-auto relative animate-fade-in">
          <div className="fixed top-0 right-0 w-[40vw] h-[40vw] rounded-full bg-emerald-100/20 blur-[100px] -z-10" />

          {/* Mobile header */}
          <div className="md:hidden flex flex-col gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="text-base font-bold text-slate-800 flex items-center gap-1.5 shrink-0">
                <img src="/logo.png" alt="NextraPath Logo" className="h-5 w-5 object-contain drop-shadow-sm" /> NextraPath
              </div>
            </div>
            <div className="flex items-center justify-between bg-slate-100/80 p-1 rounded-xl border border-slate-200/20">
              <div className="flex-1 text-center bg-white text-emerald-600 text-[11px] font-bold py-1.5 rounded-lg shadow-sm border border-slate-200/40">Dashboard</div>
              <div className="flex-1 text-center text-slate-400 text-[11px] py-1.5">Explore</div>
              <div className="flex-1 text-center text-slate-400 text-[11px] py-1.5">Resume</div>
              <div className="flex-1 text-center text-slate-400 text-[11px] py-1.5">Profile</div>
            </div>
          </div>

          <header className="mb-8 sm:mb-10">
            <div className="h-8 w-64 bg-slate-200 rounded-xl shimmer mb-2" />
            <div className="h-4 w-48 bg-slate-200 rounded-lg shimmer" />
          </header>

          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
                <div className="w-10 h-10 bg-slate-100 rounded-lg shimmer mb-3" />
                <div className="h-6 w-12 bg-slate-200 rounded-lg shimmer mb-1.5" />
                <div className="h-3.5 w-24 bg-slate-100 rounded shimmer" />
              </div>
            ))}
          </div>

          {/* Streak Skeleton */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-sm mb-8 sm:mb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="h-6 w-36 bg-slate-200 rounded-lg shimmer" />
                <div className="h-4 w-64 bg-slate-100 rounded shimmer" />
                <div className="h-10 w-24 bg-slate-200 rounded-xl shimmer mt-2" />
              </div>
              <div className="flex-1 max-w-md w-full">
                <div className="h-4 w-28 bg-slate-150 rounded shimmer mb-3.5" />
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className="h-3 w-4 bg-slate-100 rounded shimmer mb-2" />
                      <div className="w-9 h-9 sm:w-10 sm:h-10 bg-slate-100 rounded-xl border border-slate-100/50 shimmer" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Careers Section Skeleton */}
          <div className="mb-8 sm:mb-10">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="h-6 w-48 bg-slate-200 rounded-xl shimmer" />
              <div className="h-4 w-16 bg-slate-200 rounded shimmer" />
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3">
                  <div className="h-5 w-3/4 bg-slate-200 rounded-lg shimmer" />
                  <div className="space-y-1.5">
                    <div className="h-3 w-full bg-slate-100 rounded shimmer" />
                    <div className="h-3 w-5/6 bg-slate-100 rounded shimmer" />
                  </div>
                  <div className="mt-auto space-y-2 pt-2">
                    <div className="flex justify-between">
                      <div className="h-3 w-20 bg-slate-100 rounded shimmer" />
                      <div className="h-3 w-8 bg-slate-150 rounded shimmer" />
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full w-1/3 bg-slate-200 shimmer" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#f8fafc' }}>
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-100 hidden md:flex flex-col shrink-0 shadow-sm">
        <div className="h-20 flex items-center px-6 border-b border-slate-100">
          <Link to="/" className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <img src="/logo.png" alt="NextraPath Logo" className="h-6 w-6 object-contain drop-shadow-sm" /> NextraPath
          </Link>
        </div>
        <div className="flex-1 py-6 px-4 space-y-1">
          <div className="px-4 py-3 bg-emerald-50 text-emerald-700 rounded-xl font-medium text-sm border border-emerald-100">Dashboard</div>
          <Link to="/explorer" className="block px-4 py-3 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl text-sm transition-all font-medium">Explore Careers</Link>
          <Link to="/skills" className="block px-4 py-3 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl text-sm transition-all font-medium">Skill Library</Link>
          <Link to="/sandbox" className="flex items-center justify-between px-4 py-3 text-indigo-600 font-bold hover:bg-indigo-50 rounded-xl text-sm transition-all border border-indigo-100 bg-indigo-50/50">
            Code Sandbox
            <span className="bg-indigo-600 text-white text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full animate-pulse">New</span>
          </Link>
          <Link to="/resume" className="block px-4 py-3 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl text-sm transition-all font-medium">Resume Builder</Link>
          <Link to="/profile" className="block px-4 py-3 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl text-sm transition-all font-medium">Profile</Link>
          {isAdmin && (
            <Link to="/admin" className="block px-4 py-3 text-emerald-600 font-bold hover:bg-emerald-50 rounded-xl text-sm transition-all mt-4 border border-emerald-100 bg-emerald-50/50">
              ⚙️ Admin Panel
            </Link>
          )}
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
              <img src="/logo.png" alt="NextraPath Logo" className="h-5 w-5 object-contain drop-shadow-sm" /> NextraPath
            </Link>
            <NotificationBell />
          </div>

          <div className="flex items-center justify-between bg-slate-100/80 p-1 rounded-xl border border-slate-200/20 overflow-x-auto hide-scrollbar">
            <Link to="/dashboard" className="flex-1 min-w-[70px] text-center bg-white text-emerald-600 text-[10px] font-bold py-1.5 rounded-lg shadow-sm border border-slate-200/40 transition-all">
              Dashboard
            </Link>
            <Link to="/explorer" className="flex-1 min-w-[60px] text-center text-slate-500 hover:text-slate-800 text-[10px] font-semibold py-1.5 transition-colors">
              Explore
            </Link>
            <Link to="/skills" className="flex-1 min-w-[50px] text-center text-slate-500 hover:text-slate-800 text-[10px] font-semibold py-1.5 transition-colors">
              Skills
            </Link>
            <Link to="/sandbox" className="flex-1 min-w-[70px] text-center text-indigo-600 hover:text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100 rounded-lg text-[10px] font-bold py-1.5 transition-colors border border-indigo-100 relative">
              Sandbox
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
            </Link>
            <Link to="/resume" className="flex-1 min-w-[70px] text-center text-slate-500 hover:text-slate-800 text-[10px] font-semibold py-1.5 transition-colors flex items-center justify-center gap-0.5">
              Resume <span className="text-[8px]">✨</span>
            </Link>
            <Link to="/profile" className="flex-1 min-w-[55px] text-center text-slate-500 hover:text-slate-800 text-[10px] font-semibold py-1.5 transition-colors">
              Profile
            </Link>
            {isAdmin && (
              <Link to="/admin" className="flex-1 min-w-[55px] text-center text-emerald-600 font-bold text-[10px] py-1.5 transition-colors bg-emerald-50 rounded-lg ml-1 border border-emerald-100">
                Admin
              </Link>
            )}
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

        {/* PWA Notification Subscription Alert Banner */}
        {showPushBanner && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-blue-500/5 to-emerald-500/10 border border-emerald-500/20 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100/50 shrink-0">
                <Megaphone className="h-5 w-5 text-emerald-600 animate-bounce" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm sm:text-base">🔔 Get Daily Learning Reminders!</h3>
                <p className="text-xs text-slate-500 font-medium">Never break your streak. Install roadmap notifications on this device.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <button
                onClick={() => {
                  sessionStorage.setItem(`pwa-push-banner-dismissed-${user.id}`, 'true');
                  setShowPushBanner(false);
                }}
                className="text-xs font-semibold text-slate-400 hover:text-slate-700 px-3 py-2 rounded-xl transition-all cursor-pointer"
              >
                Later
              </button>
              <button
                onClick={handleSubscribePush}
                disabled={pushStatus === 'loading'}
                className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 rounded-xl shadow-md shadow-emerald-600/15 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                {pushStatus === 'loading' ? 'Enabling...' : pushStatus === 'success' ? 'Enabled! 🎉' : pushStatus === 'error' ? `Failed: ${pushError}` : 'Enable Notifications'}
              </button>
            </div>
          </div>
        )}


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

        {/* Saved Code Snippets Widget */}
        {savedCodes.length > 0 && (
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-sm mb-8 sm:mb-10 relative overflow-hidden">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100/50">
              <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                <Code2 className="text-indigo-500 h-5 w-5" /> My Saved Code Snippets
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedCodes.map((codeItem) => (
                <div 
                  key={codeItem.id} 
                  onClick={() => setSelectedSnippet(codeItem)}
                  className="p-5 bg-slate-900 rounded-2xl flex flex-col justify-between border border-slate-800 shadow-xl shadow-slate-900/10 cursor-pointer hover:border-indigo-500/50 hover:bg-slate-800 transition-all group"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h3 className="font-bold text-slate-200 text-sm sm:text-base line-clamp-1 group-hover:text-indigo-400 transition-colors">{codeItem.title}</h3>
                      <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full shrink-0">
                        {codeItem.language}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      {new Date(codeItem.created_at).toLocaleDateString()}
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(codeItem.code);
                        alert('Code copied to clipboard!');
                      }}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold py-1.5 px-3 rounded-lg transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                    >
                      Copy
                    </button>
                  </div>
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
            <Link to="/explorer" className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-500 flex items-center gap-1 font-medium">View All <ArrowRight className="h-3.5 sm:h-4 w-3.5 sm:w-4" /></Link>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {savedCareersData.length > 0 
              ? savedCareersData.map((career) => (
                  <Link key={career.id} to={`/career/${career.id}`} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-300 flex flex-col group">
                    <h3 className="font-bold text-slate-800 mb-1.5 sm:mb-2 text-sm sm:text-base group-hover:text-indigo-600 transition-colors">{career.title}</h3>
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
                      <span className="text-slate-400 font-medium group-hover:text-indigo-600 transition-colors">Continue Roadmap →</span>
                    </div>
                  </Link>
                ))
              : careersData.slice(0, 3).map((career) => (
                  <Link key={career.id} to={`/career/${career.id}`} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-300 group">
                    <h3 className="font-bold text-slate-800 mb-1.5 sm:mb-2 text-sm sm:text-base group-hover:text-indigo-600 transition-colors">{career.title}</h3>
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
            <Link to="/skills" className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-indigo-50 border border-indigo-100 rounded-2xl hover:bg-indigo-100/70 transition-colors">
              <Code2 className="h-7 sm:h-8 w-7 sm:w-8 text-indigo-600" />
              <div>
                <h3 className="font-bold text-slate-800 text-sm sm:text-base">Skill Library</h3>
                <p className="text-[10px] sm:text-xs text-slate-500">Find careers by skill</p>
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

      {/* Full Screen Modal for Selected Snippet */}
      {selectedSnippet && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-slate-900/80 backdrop-blur-sm p-4 sm:p-8 animate-in fade-in duration-200">
          <div className="w-full max-w-6xl mx-auto h-full flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <CodePracticeInterface 
              initialLanguage={selectedSnippet.language} 
              initialCode={selectedSnippet.code} 
              onClose={() => setSelectedSnippet(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
