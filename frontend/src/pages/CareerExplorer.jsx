import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Search, Briefcase, TrendingUp, IndianRupee, Compass, ArrowLeft, Map, GraduationCap } from 'lucide-react';
import NotificationBell from '../components/NotificationBell';

export default function CareerExplorer() {
  const { careers: careersData } = useData();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedField, setSelectedField] = useState('All');

  const categories = ['All', ...new Set(careersData.map(c => c.category))];
  
  // Extract all unique fields from all careers, normalized to UPPERCASE and trimmed
  const fields = ['All', ...new Set(careersData.flatMap(c => (c.field || []).map(f => f.trim().toUpperCase())))].filter(Boolean);

  const filtered = careersData.filter(career => {
    const matchesSearch = career.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          career.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'All' || career.category === selectedCategory;
    const matchesField = selectedField === 'All' || 
      (career.field || []).some(f => f.trim().toUpperCase() === selectedField.trim().toUpperCase());
    return matchesSearch && matchesCat && matchesField;
  });

  // Full names for field badges (UPPERCASE keys)
  const fieldFullNames = {
    'CSE': 'Computer Science',
    'IT': 'Information Technology',
    'ECE': 'Electronics & Communication',
    'EEE': 'Electrical Engineering',
    'ME': 'Mechanical Engineering',
    'CE': 'Civil Engineering',
    'BIOTECH': 'Biotechnology',
    'MATHEMATICS': 'Mathematics',
    'DESIGN': 'Design',
    'COMMERCE': 'Commerce',
    'SCIENCE': 'General Science',
  };

  return (
    <div className="min-h-screen relative" style={{ background: '#f8fafc' }}>
      {/* Subtle background blobs */}
      <div className="fixed top-0 right-0 w-[40vw] h-[40vw] rounded-full bg-blue-100/30 blur-[120px] -z-10" />
      <div className="fixed bottom-0 left-0 w-[30vw] h-[30vw] rounded-full bg-purple-100/30 blur-[120px] -z-10" />

      {/* Top Bar */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 shadow-sm">
        {/* Desktop Header & Logged Out Mobile Header */}
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 h-16 items-center justify-between ${user ? 'hidden md:flex' : 'flex'}`}>
          <Link to="/" className="flex items-center gap-2 text-base sm:text-lg font-bold text-slate-800">
            <Compass className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-500" /> NaviCareer
          </Link>
          <div className="flex gap-3 sm:gap-4 text-sm items-center">
            {user ? (
              <>
                <Link to="/dashboard" className="text-slate-600 hover:text-slate-800 transition-colors font-semibold text-xs sm:text-sm">Dashboard</Link>
                <Link to="/profile" className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 sm:px-4 py-2 rounded-lg transition-all font-semibold text-xs sm:text-sm border border-slate-200 shadow-sm">Profile</Link>
              </>
            ) : (
              <>
                <Link to="/login" className="text-slate-500 hover:text-slate-800 transition-colors font-medium text-xs sm:text-sm">Login</Link>
                <Link to="/register" className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 sm:px-4 py-2 rounded-lg transition-all font-medium text-xs sm:text-sm shadow-sm">Get Started</Link>
              </>
            )}
          </div>
        </div>

        {/* Logged In Mobile Header */}
        {user && (
          <div className="md:hidden flex flex-col gap-3 px-4 py-3">
            {/* Row 1: Brand Logo & Notification Bell */}
            <div className="flex items-center justify-between">
              <Link to="/" className="text-base font-bold text-slate-800 flex items-center gap-1.5 shrink-0">
                <Compass className="text-emerald-500 h-5 w-5" /> NaviCareer
              </Link>
              <NotificationBell />
            </div>

            {/* Row 2: Segmented Navigation Tabs */}
            <div className="flex items-center justify-between bg-slate-100/80 p-1 rounded-xl border border-slate-200/20">
              <Link to="/dashboard" className="flex-1 text-center text-slate-500 hover:text-slate-800 text-[11px] font-semibold py-1.5 transition-colors">
                Dashboard
              </Link>
              <Link to="/explorer" className="flex-1 text-center bg-white text-emerald-600 text-[11px] font-bold py-1.5 rounded-lg shadow-sm border border-slate-200/40 transition-all">
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
        )}
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8 sm:mb-10">
          <Link to="/" className="inline-flex items-center text-slate-400 hover:text-emerald-600 transition-colors mb-3 sm:mb-4 text-xs sm:text-sm font-medium">
            <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" /> Back to Home
          </Link>
          <h1 className="text-2xl sm:text-4xl font-extrabold mb-2 sm:mb-3 text-slate-800 tracking-tight">Explore Careers</h1>
          <p className="text-slate-500 text-sm sm:text-lg">Browse careers, view roadmaps, and start learning.</p>
        </div>

        {/* Search & Filters */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm mb-8 sm:mb-10">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 sm:left-4 top-3 sm:top-3.5 h-4 sm:h-5 w-4 sm:w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search careers... (e.g. AI Engineer, Cybersecurity)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 sm:py-3 pl-10 sm:pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-300 text-slate-800 placeholder-slate-400 text-sm sm:text-base transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Field Filter (Branch) */}
            {fields.length > 1 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <GraduationCap className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Your Branch / Field</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {fields.map(field => (
                    <button
                      key={field}
                      onClick={() => setSelectedField(field)}
                      className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                        selectedField === field
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100'
                      }`}
                      title={fieldFullNames[field] || field}
                    >
                      {field === 'All' ? '🎯 All Fields' : field}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Category Filter */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Briefcase className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                      selectedCategory === cat
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>


        {/* Careers Grid */}
        {filtered.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filtered.map((career) => (
              <div key={career.id} className="bg-white p-5 sm:p-6 rounded-2xl border border-emerald-200 shadow-sm hover:shadow-md hover:border-emerald-300 hover:-translate-y-1 transition-all duration-300 group">
                <div className="flex justify-between items-start mb-3 sm:mb-4">
                  <div className="p-2.5 sm:p-3 bg-emerald-50 rounded-xl group-hover:bg-emerald-100 transition-colors">
                    <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1 bg-slate-100 rounded-full text-slate-500">
                    {career.category}
                  </span>
                </div>
                <h3 className="text-base sm:text-xl font-bold mb-1.5 sm:mb-2 text-slate-800 group-hover:text-emerald-600 transition-colors">{career.title}</h3>
                <p className="text-xs sm:text-sm text-slate-500 mb-4 sm:mb-5 line-clamp-2">{career.description}</p>

                <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4 text-xs sm:text-sm">
                  <span className="flex items-center gap-1 text-emerald-600 font-medium"><TrendingUp className="h-3 sm:h-3.5 w-3 sm:w-3.5" /> {career.demandLevel}</span>
                  <span className="flex items-center gap-1 text-slate-500"><IndianRupee className="h-3 sm:h-3.5 w-3 sm:w-3.5" /> {career.salary}</span>
                </div>

                {/* Field / Branch Badges */}
                {career.field && career.field.length > 0 && (
                  <div className="flex items-center gap-1.5 mb-3 sm:mb-4 flex-wrap">
                    <GraduationCap className="h-3 w-3 text-blue-400" />
                    {career.field.map(f => (
                      <span key={f} className="text-[10px] sm:text-xs font-medium px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md border border-blue-100">
                        {f.trim().toUpperCase()}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 mb-4 sm:mb-5 text-[10px] sm:text-xs text-slate-400">
                  <span className="bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg font-medium flex items-center gap-1"><Map className="h-3 w-3" />{career.roadmap.length} Steps</span>
                  <span className="bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg font-medium">{career.roadmap.reduce((sum, s) => sum + s.resources.length, 0)} Resources</span>
                </div>

                <Link
                  to={`/career/${career.id}`}
                  className="block text-center w-full py-2.5 sm:py-3 bg-emerald-50/40 hover:bg-emerald-600 text-emerald-700 hover:text-white font-semibold rounded-xl transition-all duration-300 border border-emerald-300/80 hover:border-emerald-600 text-xs sm:text-sm shadow-sm"
                >
                  View Career Details →
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 sm:py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <Search className="h-10 sm:h-12 w-10 sm:w-12 text-slate-300 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-bold mb-2 text-slate-800">No careers found</h3>
            <p className="text-xs sm:text-sm text-slate-500">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
