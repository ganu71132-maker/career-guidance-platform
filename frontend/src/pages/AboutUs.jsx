import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Compass, BookOpen, Target, Users, Map } from 'lucide-react';

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <Helmet>
        <title>About Us | NextraPath - Career Guidance & Roadmaps</title>
        <meta name="description" content="Learn about NextraPath, the premier career guidance and interactive roadmap platform for students and professionals." />
      </Helmet>

      {/* Navbar */}
      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <Link to="/" className="text-xl sm:text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <img src="/logo.png" alt="NextraPath Logo" className="h-6 w-6 sm:h-8 sm:w-8 object-contain drop-shadow-sm" /> NextraPath
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link to="/explorer" className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-emerald-600 transition-colors">Explore</Link>
            <Link to="/login" className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-emerald-600 transition-colors">Log in</Link>
            <Link to="/register" className="text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition-all shadow-md shadow-emerald-600/20">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative py-16 sm:py-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-[40vw] h-[40vw] rounded-full bg-emerald-200/20 dark:bg-emerald-900/20 blur-[100px] -z-10" />
        <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] rounded-full bg-blue-200/20 dark:bg-blue-900/20 blur-[100px] -z-10" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight">
            Charting the Course for Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">Future Career</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl mx-auto">
            NextraPath is an interactive career guidance platform designed to help students, recent graduates, and career transitioners navigate the complex tech industry with clear, step-by-step learning roadmaps.
          </p>
        </div>
      </div>

      {/* Mission & Vision (SEO Content) */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 sm:p-12 shadow-sm border border-slate-200 dark:border-slate-700 mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-3">
            <Target className="h-8 w-8 text-emerald-500" /> Our Mission
          </h2>
          <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 text-base sm:text-lg space-y-6">
            <p>
              Finding the right career path in today's fast-paced digital world can be overwhelming. We built <strong>NextraPath</strong> to solve this exact problem. Unlike platforms that charge for 1-on-1 mentorship calls or expensive bootcamps, NextraPath focuses on empowering individuals through self-paced, interactive, and completely transparent learning roadmaps.
            </p>
            <p>
              Our goal is to provide the ultimate <strong>career guidance</strong> experience. Whether you want to become a Software Engineer, a Data Scientist, or an AI Specialist, NextraPath provides curated study resources, practical skills mapping, and community-driven insights to help you land your dream job.
            </p>
          </div>
        </div>

        {/* Features / Why Us */}
        <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
          <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-transform hover:-translate-y-1">
            <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mb-6">
              <Map className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">Interactive Roadmaps</h3>
            <p className="text-slate-600 dark:text-slate-400">
              Stop guessing what to learn next. Our step-by-step roadmaps take you from absolute beginner to industry professional, tracking your progress along the way.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-transform hover:-translate-y-1">
            <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-6">
              <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">Curated Resources</h3>
            <p className="text-slate-600 dark:text-slate-400">
              We hand-pick the best free and premium study materials, courses, and tutorials on the internet, so you spend less time searching and more time learning.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-transform hover:-translate-y-1">
            <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-6">
              <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">Community Driven</h3>
            <p className="text-slate-600 dark:text-slate-400">
              Learning is better together. Engage in community discussions, share resources, and get advice from peers who are on the exact same career path.
            </p>
          </div>
        </div>
      </div>
      
      {/* Footer CTA */}
      <div className="bg-emerald-600 text-white py-16 text-center">
        <h2 className="text-3xl font-bold mb-6">Start Your Journey Today</h2>
        <Link to="/register" className="inline-block bg-white text-emerald-600 font-bold px-8 py-3 rounded-xl hover:bg-slate-50 transition-colors shadow-lg">
          Create a Free Account
        </Link>
      </div>
    </div>
  );
}
