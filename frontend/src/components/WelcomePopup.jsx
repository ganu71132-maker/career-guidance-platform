import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Compass, CheckCircle2, Star, Sparkles, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function WelcomePopup() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const storageKey = `navicompany_welcome_shown_${user.id}`;
    const alreadyShown = localStorage.getItem(storageKey);
    if (!alreadyShown) {
      // Delay presentation slightly for optimal user experience
      const timer = setTimeout(() => setShow(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleClose = () => {
    if (user) {
      const storageKey = `navicompany_welcome_shown_${user.id}`;
      localStorage.setItem(storageKey, 'true');
      const sessionRedirectKey = `navicompany_welcome_redirected_${user.id}`;
      sessionStorage.setItem(sessionRedirectKey, 'true');
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full border border-slate-100 shadow-2xl p-6 sm:p-8 text-center space-y-6 animate-scale-up relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400" />
        <div className="absolute top-0 right-0 p-6 opacity-[0.03] select-none pointer-events-none">
          <Compass className="h-44 w-44 text-emerald-600" />
        </div>

        {/* Brand Icon */}
        <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
          <Compass className="h-9 w-9 animate-spin-slow" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center justify-center gap-1.5">
            🎉 Welcome to NextraPath <Sparkles className="h-5 w-5 text-amber-500 fill-amber-500" />
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm leading-relaxed px-2">
            Your personalized smart career guidance platform is ready. Explore advanced tools crafted for your growth.
          </p>
        </div>

        {/* Features Checklist */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left space-y-2.5">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Key Features Included</h4>
          
          <div className="flex items-center gap-2.5 text-xs text-slate-650 font-medium">
            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
            <span><strong>Career Explorer</strong> — Research details of major fields</span>
          </div>

          <div className="flex items-center gap-2.5 text-xs text-slate-650 font-medium">
            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
            <span><strong>Interactive Roadmaps</strong> — Guided learning step-by-step</span>
          </div>

          <div className="flex items-center gap-2.5 text-xs text-slate-650 font-medium">
            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
            <span><strong>ATS Resume Builder</strong> — Auto-import milestones instantly</span>
          </div>

          <div className="flex items-center gap-2.5 text-xs text-slate-650 font-medium">
            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
            <span><strong>Activity & Streak Tracker</strong> — Fuel consistency daily</span>
          </div>
        </div>

        {/* Button Actions */}
        <div className="flex flex-col gap-2 pt-2">
          <button 
            onClick={() => {
              handleClose();
              navigate('/explorer');
            }}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer text-sm"
          >
            Explore Platform
          </button>
          <button 
            onClick={handleClose}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 py-2.5 rounded-xl font-medium transition-all text-xs cursor-pointer"
          >
            Dismiss Welcome
          </button>
        </div>
      </div>
    </div>
  );
}
