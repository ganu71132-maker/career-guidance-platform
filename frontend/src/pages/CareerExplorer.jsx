import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Search, Briefcase, TrendingUp, IndianRupee, Compass, ArrowLeft, Map, GraduationCap, ChevronDown, MessageSquare, LayoutGrid } from 'lucide-react';
import NotificationBell from '../components/NotificationBell';
import CommentSection from '../components/CommentSection';

export default function CareerExplorer() {
  const { careers: careersData, loading } = useData();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedField, setSelectedField] = useState('All');
  const [isFieldDropdownOpen, setIsFieldDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('careers');

  const fields = ['All', ...new Set(careersData.flatMap(c => (c.field || []).map(f => f.trim().toUpperCase())))].filter(Boolean);

  const filtered = careersData.filter(career => {
    const matchesSearch = career.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          career.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesField = selectedField === 'All' ||
      (career.field || []).some(f => f.trim().toUpperCase() === selectedField.trim().toUpperCase());
    return matchesSearch && matchesField;
  });

  const displayedCareers = user ? filtered : filtered.slice(0, 6);

  const fieldFullNames = {
    'CSE': 'Computer Science (CSE)',
    'IT': 'Information Technology (IT)',
    'ECE': 'Electronics & Communication (ECE)',
    'EEE': 'Electrical Engineering (EEE)',
    'ME': 'Mechanical Engineering (ME)',
    'CE': 'Civil Engineering (CE)',
    'BIOTECH': 'Biotechnology (BioTech)',
    'MATHEMATICS': 'Mathematics',
    'DESIGN': 'Design',
    'COMMERCE': 'Commerce',
    'SCIENCE': 'General Science',
    'BBA': 'Business Administration (BBA)',
    'MBA': 'Business Administration (MBA)',
    'BCA': 'Computer Applications (BCA)',
    'MCA': 'Computer Applications (MCA)',
  };

  return (
    <div className="min-h-screen relative" style={{ background: '#f8fafc' }}>
      <div className="fixed top-0 right-0 w-[40vw] h-[40vw] rounded-full bg-blue-100/30 blur-[120px] -z-10" />
      <div className="fixed bottom-0 left-0 w-[30vw] h-[30vw] rounded-full bg-purple-100/30 blur-[120px] -z-10" />

      {/* Top Bar */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 shadow-sm">
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 h-16 items-center justify-between ${user ? 'hidden md:flex' : 'flex'}`}>
          <Link to="/" className="flex items-center gap-2 text-base sm:text-lg font-bold text-slate-800">
            <img src="/logo.png" alt="NextraPath Logo" className="h-5 w-5 sm:h-6 sm:w-6 object-contain drop-shadow-sm" /> NextraPath
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

        {user && (
          <div className="md:hidden flex flex-col gap-3 px-4 py-3">
            <div className="flex items-center justify-between">
              <Link to="/" className="text-base font-bold text-slate-800 flex items-center gap-1.5 shrink-0">
                <img src="/logo.png" alt="NextraPath Logo" className="h-5 w-5 object-contain drop-shadow-sm" /> NextraPath
              </Link>
              <NotificationBell />
            </div>
            <div className="flex items-center justify-between bg-slate-100/80 p-1 rounded-xl border border-slate-200/20">
              <Link to="/dashboard" className="flex-1 text-center text-slate-500 hover:text-slate-800 text-[11px] font-semibold py-1.5 transition-colors">Dashboard</Link>
              <Link to="/explorer" className="flex-1 text-center bg-white text-emerald-600 text-[11px] font-bold py-1.5 rounded-lg shadow-sm border border-slate-200/40 transition-all">Explore</Link>
              <Link to="/resume" className="flex-1 text-center text-slate-500 hover:text-slate-800 text-[11px] font-semibold py-1.5 transition-colors flex items-center justify-center gap-0.5">
                Resume <span className="text-[9px]">✨</span>
              </Link>
              <Link to="/profile" className="flex-1 text-center text-slate-500 hover:text-slate-800 text-[11px] font-semibold py-1.5 transition-colors">Profile</Link>
            </div>
          </div>
        )}
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <Link to="/" className="inline-flex items-center text-slate-400 hover:text-emerald-600 transition-colors mb-3 sm:mb-4 text-xs sm:text-sm font-medium">
            <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" /> Back to Home
          </Link>
          <h1 className="text-2xl sm:text-4xl font-extrabold mb-2 sm:mb-3 text-slate-800 tracking-tight">Explore Careers</h1>
          <p className="text-slate-500 text-sm sm:text-lg">Browse careers, view roadmaps, and start learning.</p>
        </div>

        {/* ── TABS ── */}
        <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60 mb-8 w-fit">
          <button
            onClick={() => setActiveTab('careers')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'careers'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            Careers
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeTab === 'careers' ? 'bg-indigo-50 text-indigo-500' : 'bg-slate-200 text-slate-400'}`}>
              {careersData.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('discussion')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'discussion'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            Discussion
          </button>
        </div>

        {/* ── CAREERS TAB ── */}
        {activeTab === 'careers' && (
          <>
            {/* Search & Filters */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm mb-8 sm:mb-10">
              <div className="flex flex-col gap-3 sm:gap-4">
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

                {fields.length > 1 && (
                  <div className="relative">
                    <div className="flex items-center gap-1.5 mb-2">
                      <GraduationCap className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Your Branch / Field</span>
                    </div>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsFieldDropdownOpen(!isFieldDropdownOpen)}
                        className="w-full sm:w-72 bg-slate-50 border border-slate-200 hover:bg-slate-100/50 rounded-xl py-2.5 px-4 flex items-center justify-between text-slate-700 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <span>🎓</span>
                          <span>{selectedField === 'All' ? 'All Fields / Branches' : (fieldFullNames[selectedField] || selectedField)}</span>
                        </span>
                        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isFieldDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isFieldDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setIsFieldDropdownOpen(false)} />
                          <div className="absolute left-0 mt-2 w-full sm:w-80 bg-white border border-slate-150 rounded-2xl shadow-xl z-20 py-2 max-h-72 overflow-y-auto animate-fade-in no-scrollbar">
                            {fields.map(field => {
                              const isSelected = selectedField === field;
                              return (
                                <button
                                  key={field}
                                  type="button"
                                  onClick={() => { setSelectedField(field); setIsFieldDropdownOpen(false); }}
                                  className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm font-medium transition-colors flex items-center justify-between cursor-pointer ${
                                    isSelected ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600 hover:bg-slate-50'
                                  }`}
                                >
                                  <span>{field === 'All' ? '🎯 All Fields' : fieldFullNames[field] || field}</span>
                                  {isSelected && <span className="text-blue-600 font-bold">✓</span>}
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Careers Grid */}
            {loading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-[300px]">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-xl shimmer" />
                      <div className="w-20 h-5 rounded-full shimmer" />
                    </div>
                    <div className="w-3/4 h-6 rounded mb-3.5 shimmer" />
                    <div className="w-full h-4 rounded mb-2 shimmer" />
                    <div className="w-5/6 h-4 rounded mb-5 shimmer" />
                    <div className="flex gap-4 mb-4">
                      <div className="w-24 h-4 rounded shimmer" />
                      <div className="w-20 h-4 rounded shimmer" />
                    </div>
                    <div className="w-full h-11 rounded-xl mt-auto shimmer" />
                  </div>
                ))}
              </div>
            ) : displayedCareers.length > 0 ? (
              <div className="flex flex-col gap-6">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 animate-fade-in">
                  {displayedCareers.map((career) => (
                  <div key={career.id} className="bg-white p-5 sm:p-6 rounded-2xl border border-indigo-200 shadow-sm hover:shadow-md hover:border-indigo-300 hover:-translate-y-1 transition-all duration-300 group">
                    <div className="flex justify-between items-start mb-3 sm:mb-4">
                      <div className="p-2.5 sm:p-3 bg-indigo-50 rounded-xl group-hover:bg-indigo-100 transition-colors">
                        <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
                      </div>
                      <span className="text-[10px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1 bg-slate-100 rounded-full text-slate-500">
                        {career.category}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-xl font-bold mb-1.5 sm:mb-2 text-slate-800 group-hover:text-indigo-600 transition-colors">{career.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-500 mb-4 sm:mb-5 line-clamp-2">{career.description}</p>

                    <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4 text-xs sm:text-sm">
                      <span className="flex items-center gap-1 text-emerald-600 font-medium"><TrendingUp className="h-3 sm:h-3.5 w-3 sm:w-3.5" /> {career.demandLevel}</span>
                      <span className="flex items-center gap-1 text-slate-500"><IndianRupee className="h-3 sm:h-3.5 w-3 sm:w-3.5" /> {career.salary}</span>
                    </div>

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
                      className="block text-center w-full py-2.5 sm:py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-md hover:shadow-lg shadow-indigo-600/20 text-xs sm:text-sm"
                    >
                      View Career Details →
                    </Link>
                  </div>
                ))}
                </div>
                {!user && filtered.length > 6 && (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 sm:p-8 text-center mt-4">
                    <h3 className="text-xl sm:text-2xl font-bold text-indigo-900 mb-3">Discover {filtered.length - 6} more careers!</h3>
                    <p className="text-sm sm:text-base text-indigo-700 mb-6 max-w-2xl mx-auto">Create a free account or log in to unlock our full catalog of career roadmaps, structured learning paths, and personalized guidance.</p>
                    <div className="flex items-center justify-center gap-4">
                      <Link to="/register" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md shadow-indigo-600/20">Create Free Account</Link>
                      <Link to="/login" className="bg-white hover:bg-indigo-50 text-indigo-600 border border-indigo-200 px-6 py-2.5 rounded-xl font-bold text-sm transition-all">Log In</Link>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16 sm:py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <Search className="h-10 sm:h-12 w-10 sm:w-12 text-slate-300 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-lg sm:text-xl font-bold mb-2 text-slate-800">No careers found</h3>
                <p className="text-xs sm:text-sm text-slate-500">Try adjusting your search or filters.</p>
              </div>
            )}
          </>
        )}

        {/* ── DISCUSSION TAB ── */}
        {activeTab === 'discussion' && (
          <CommentSection pageType="explorer" pageId="00000000-0000-0000-0000-000000000001" />
        )}
      </div>
    </div>
  );
}
