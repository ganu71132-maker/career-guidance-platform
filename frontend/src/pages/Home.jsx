import React from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { ArrowRight, Compass, Map, BookOpen, Target, Briefcase, TrendingUp, IndianRupee, Star } from 'lucide-react';

export default function Home() {
  const { careers: careersData } = useData();
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: '#f8fafc' }}>
      {/* Background Decorators */}
      <div className="fixed top-0 right-[-10%] w-[50vw] h-[50vw] rounded-full bg-emerald-100/30 blur-[120px] -z-10" />
      <div className="fixed bottom-[20%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-blue-100/30 blur-[120px] -z-10" />

      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <Link to="/" className="text-xl sm:text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <Compass className="text-emerald-500 h-6 w-6 sm:h-8 sm:w-8" />
            NaviCareer
          </Link>
          <div className="hidden md:flex gap-8 text-sm font-medium text-slate-500">
            <a href="#how-it-works" className="hover:text-slate-800 transition-colors">How It Works</a>
            <a href="#careers" className="hover:text-slate-800 transition-colors">Careers</a>
            <a href="#stats" className="hover:text-slate-800 transition-colors">Impact</a>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link to="/login" className="text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">Log in</Link>
            <Link to="/register" className="text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg transition-all shadow-md shadow-emerald-600/20">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        {/* ====== HERO SECTION ====== */}
        <section className="relative pt-16 sm:pt-28 pb-12 sm:pb-20 px-4 sm:px-6 max-w-7xl mx-auto text-center">
          <div className="inline-block mb-4 sm:mb-6 px-4 py-1.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs sm:text-sm font-medium">
            🚀 Your Career Journey Starts Here
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-5 sm:mb-8 leading-tight text-slate-800">
            Discover Your Dream Career <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">& Learn How To Get There</span>
          </h1>
          <p className="text-base sm:text-xl text-slate-500 max-w-2xl mx-auto mb-8 sm:mb-12 leading-relaxed">
            Find the perfect career path, follow a step-by-step roadmap from beginner to professional, and access curated learning resources at every stage.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <Link to="/explorer" className="flex items-center justify-center px-6 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-lg shadow-emerald-600/20 hover:scale-105 hover:shadow-xl">
              Explore Careers <ArrowRight className="ml-2 h-4 sm:h-5 w-4 sm:w-5" />
            </Link>
            <Link to="/register" className="flex items-center justify-center px-6 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-xl transition-all border border-slate-200 shadow-sm">
              Get Started Free
            </Link>
          </div>
        </section>

        {/* ====== HOW IT WORKS ====== */}
        <section id="how-it-works" className="py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-slate-800">How It Works</h2>
            <p className="text-slate-500 max-w-xl mx-auto text-sm sm:text-base">Three simple steps to go from confused student to career-ready professional.</p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8">
            {/* Step Cards */}
            {[{ num: '01', icon: <Target className="h-6 sm:h-7 w-6 sm:w-7 text-blue-600" />, bg: 'bg-blue-50', border: 'border-blue-100', title: 'Explore Careers', desc: 'Browse curated tech careers. See descriptions, required skills, salary info, and industry demand at a glance.' },
              { num: '02', icon: <Map className="h-6 sm:h-7 w-6 sm:w-7 text-purple-650" />, bg: 'bg-purple-50', border: 'border-purple-100', title: 'Follow the Roadmap', desc: 'Each career has a step-by-step learning path — from absolute beginner to job-ready professional.' },
              { num: '03', icon: <BookOpen className="h-6 sm:h-7 w-6 sm:w-7 text-emerald-600" />, bg: 'bg-emerald-50', border: 'border-emerald-100', title: 'Access Resources', desc: 'Every roadmap step comes with curated YouTube videos, courses, documentation, and project ideas.' },
            ].map((item) => (
              <Link key={item.num} to="/explorer" className={`bg-white p-6 sm:p-8 rounded-2xl border ${item.border} shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300 group block`}>
                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className={`w-12 sm:w-14 h-12 sm:h-14 ${item.bg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    {item.icon}
                  </div>
                  <span className="text-3xl sm:text-4xl font-extrabold text-slate-100">{item.num}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-slate-800">{item.title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm sm:text-base">{item.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* ====== FEATURED CAREERS ====== */}
        <section id="careers" className="py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-slate-800">Featured Careers</h2>
            <p className="text-slate-500 max-w-xl mx-auto text-sm sm:text-base">Explore top tech careers with detailed roadmaps and resources.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {careersData.map((career) => (
              <div key={career.id} className="bg-white p-5 sm:p-6 rounded-2xl border border-emerald-200 shadow-sm hover:shadow-md hover:border-emerald-300 hover:-translate-y-1 transition-all duration-300 group">
                <div className="flex justify-between items-start mb-3 sm:mb-4">
                  <div className="p-2.5 sm:p-3 bg-emerald-50 rounded-xl group-hover:bg-emerald-100 transition-colors">
                    <Briefcase className="h-5 sm:h-6 w-5 sm:w-6 text-emerald-600" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1 bg-slate-100 rounded-full text-slate-500">
                    {career.category}
                  </span>
                </div>
                <h3 className="text-base sm:text-xl font-bold mb-1.5 sm:mb-2 text-slate-800 group-hover:text-emerald-600 transition-colors">{career.title}</h3>
                <p className="text-xs sm:text-sm text-slate-500 mb-4 sm:mb-5 line-clamp-2">{career.description}</p>
                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-5 text-xs sm:text-sm">
                  <span className="flex items-center gap-1 text-emerald-600 font-medium"><TrendingUp className="h-3 sm:h-3.5 w-3 sm:w-3.5" /> {career.demandLevel}</span>
                  <span className="flex items-center gap-1 text-slate-500"><IndianRupee className="h-3 sm:h-3.5 w-3 sm:w-3.5" /> {career.salary}</span>
                </div>
                <Link to={`/career/${career.id}`} className="block text-center w-full py-2.5 sm:py-3 bg-emerald-50/40 hover:bg-emerald-600 text-emerald-700 hover:text-white font-semibold rounded-xl transition-all duration-300 border border-emerald-300/80 hover:border-emerald-600 text-xs sm:text-sm shadow-sm">
                  Explore Career →
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* ====== STATS ====== */}
        <section id="stats" className="py-14 sm:py-20 relative">
          <div className="absolute inset-0 bg-emerald-50/50 border-y border-emerald-100/50"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
            {[
              { val: '50+', label: 'Careers Mapped' },
              { val: '500+', label: 'Learning Resources' },
              { val: '10k+', label: 'Students Guided' },
              { val: '95%', label: 'Satisfaction Rate' },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-3xl sm:text-4xl font-extrabold text-slate-800 mb-1 sm:mb-2">{s.val}</div>
                <div className="text-slate-500 font-medium text-xs sm:text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ====== CTA ====== */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-slate-800">Ready to Start Your Career Journey?</h2>
          <p className="text-base sm:text-xl text-slate-500 mb-8 sm:mb-10">Join thousands of students who discovered their career path and started learning with structured roadmaps.</p>
          <Link to="/register" className="inline-flex items-center px-8 sm:px-10 py-3.5 sm:py-4 text-base sm:text-lg font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-lg shadow-emerald-600/20 hover:scale-105 hover:shadow-xl">
            Create Free Account <ArrowRight className="ml-2 h-4 sm:h-5 w-4 sm:w-5" />
          </Link>
        </section>
      </main>

      {/* ====== FOOTER ====== */}
      <footer className="border-t border-slate-200 bg-white pt-12 sm:pt-16 pb-6 sm:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8 sm:mb-12">
          <div className="sm:col-span-2">
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2 mb-3 sm:mb-4">
              <Compass className="text-emerald-500 h-5 w-5 sm:h-6 sm:w-6" />
              NaviCareer
            </div>
            <p className="text-slate-500 max-w-sm text-sm sm:text-base">
              Empowering students with clear career paths, structured roadmaps, and curated learning resources.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-3 sm:mb-4 text-slate-800 text-sm sm:text-base">Platform</h4>
            <ul className="space-y-2 text-slate-500 text-xs sm:text-sm">
              <li><Link to="/explorer" className="hover:text-emerald-600 transition-colors">Explore Careers</Link></li>
              <li><Link to="/register" className="hover:text-emerald-600 transition-colors">Get Started</Link></li>
              <li><Link to="/login" className="hover:text-emerald-600 transition-colors">Login</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-3 sm:mb-4 text-slate-800 text-sm sm:text-base">Company</h4>
            <ul className="space-y-2 text-slate-500 text-xs sm:text-sm">
              <li><a href="#" className="hover:text-emerald-600 transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-emerald-600 transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-emerald-600 transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-xs sm:text-sm text-slate-400 pt-6 sm:pt-8 border-t border-slate-100">
          &copy; {new Date().getFullYear()} NaviCareer. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
