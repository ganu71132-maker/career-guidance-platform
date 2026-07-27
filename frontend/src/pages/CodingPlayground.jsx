import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Code, BookOpen, ArrowLeft } from 'lucide-react';
import CodePracticeInterface from '../components/coding/CodePracticeInterface';

export default function CodingPlayground() {
  const [triggerLearnDrawer, setTriggerLearnDrawer] = useState(0);

  return (
    <div className="min-h-screen relative pb-20 animate-fade-in bg-[#f8fafc]">
      <Helmet>
        <title>Code Sandbox | NextraPath</title>
        <meta name="description" content="Practice Python, JavaScript, HTML/CSS, and SQL directly in your browser with NextraPath's Code Sandbox." />
      </Helmet>
      
      <div className="fixed top-0 right-0 w-[40vw] h-[40vw] rounded-full bg-blue-100/30 blur-[120px] -z-10" />
      <div className="fixed bottom-0 left-0 w-[30vw] h-[30vw] rounded-full bg-purple-100/30 blur-[120px] -z-10" />

      {/* Top Bar */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-base sm:text-lg font-bold text-slate-800">
            <img src="/logo.png" alt="NextraPath Logo" className="h-5 w-5 sm:h-6 sm:w-6 object-contain drop-shadow-sm" /> NextraPath
          </Link>
          <Link to="/dashboard" className="text-xs sm:text-sm text-slate-500 hover:text-slate-800 transition-colors font-medium">← Back to Dashboard</Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Header Row: Title on Left, Learn to Code Button on Right */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <div className="h-10 sm:h-12 w-10 sm:w-12 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
              <Code className="h-5 sm:h-6 w-5 sm:w-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Code Sandbox</h1>
              <p className="text-slate-500 text-sm sm:text-base">Practice algorithms, scripts, and queries directly in your browser.</p>
            </div>
          </div>

          {/* Learn to Code Button on Right Side */}
          <button
            onClick={() => setTriggerLearnDrawer(prev => prev + 1)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-2.5 sm:py-3 rounded-2xl font-bold text-sm shadow-lg shadow-blue-600/20 hover:scale-105 transition-all cursor-pointer shrink-0"
          >
            <BookOpen className="w-4.5 h-4.5" /> Learn to Code
            <span className="bg-white/20 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full animate-pulse">New</span>
          </button>
        </div>
        
        <CodePracticeInterface externalLearnTrigger={triggerLearnDrawer} />
      </div>
    </div>
  );
}
