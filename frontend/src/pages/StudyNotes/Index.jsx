import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Helmet } from 'react-helmet-async';
import {
  BookOpen, Search, Filter, ChevronRight, ChevronDown,
  GraduationCap, Library, Layers, FileText, Clock,
  Heart, Star, TrendingUp, Sparkles, ArrowRight,
  BookMarked, FolderOpen, Hash, X, SlidersHorizontal
} from 'lucide-react';

export default function StudyNotesIndex() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Data
  const [branches, setBranches] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [units, setUnits] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Recently viewed (from localStorage)
  const [recentlyViewed, setRecentlyViewed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('sn_recent') || '[]');
    } catch { return []; }
  });

  useEffect(() => {
    async function fetchAll() {
      try {
        const [bRes, sRes, subRes, uRes, cRes] = await Promise.all([
          supabase.from('branches').select('*').order('name'),
          supabase.from('semesters').select('*').order('number'),
          supabase.from('subjects').select('*').order('name'),
          supabase.from('units').select('*').order('number'),
          supabase.from('chapters').select('*').order('number'),
        ]);
        if (bRes.error) throw bRes.error;
        setBranches(bRes.data || []);
        setSemesters(sRes.data || []);
        setSubjects(subRes.data || []);
        setUnits(uRes.data || []);
        setChapters(cRes.data || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  // Computed filtered data
  const filteredSemesters = useMemo(() =>
    selectedBranch ? semesters.filter(s => s.branch_id === selectedBranch) : semesters,
    [semesters, selectedBranch]
  );

  const filteredSubjects = useMemo(() =>
    selectedSemester ? subjects.filter(s => s.semester_id === selectedSemester) : subjects,
    [subjects, selectedSemester]
  );

  const filteredUnits = useMemo(() =>
    selectedSubject ? units.filter(u => u.subject_id === selectedSubject) : [],
    [units, selectedSubject]
  );

  const filteredChapters = useMemo(() => {
    let chaps = chapters;
    if (selectedSubject) {
      const unitIds = new Set(filteredUnits.map(u => u.id));
      chaps = chaps.filter(c => unitIds.has(c.unit_id));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      chaps = chaps.filter(c => c.title?.toLowerCase().includes(q));
    }
    return chaps;
  }, [chapters, selectedSubject, filteredUnits, searchQuery]);

  // Search across all subjects
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    const matchedSubjects = subjects.filter(s => s.name?.toLowerCase().includes(q));
    const matchedChapters = chapters.filter(c => c.title?.toLowerCase().includes(q));
    const matchedUnits = units.filter(u => u.title?.toLowerCase().includes(q));
    return { subjects: matchedSubjects, chapters: matchedChapters, units: matchedUnits };
  }, [searchQuery, subjects, chapters, units]);

  const clearFilters = () => {
    setSelectedBranch('');
    setSelectedSemester('');
    setSelectedSubject('');
    setSearchQuery('');
  };

  const hasActiveFilters = selectedBranch || selectedSemester || selectedSubject || searchQuery;

  // Get name helpers
  const getBranchName = (id) => branches.find(b => b.id === id)?.name || '';
  const getSemesterNumber = (id) => semesters.find(s => s.id === id)?.number || '';
  const getSubjectName = (id) => subjects.find(s => s.id === id)?.name || '';
  const getUnitTitle = (id) => units.find(u => u.id === id)?.title || '';

  // Color schemes for subjects
  const subjectColors = [
    { bg: 'bg-violet-50', border: 'border-violet-100', text: 'text-violet-700', iconBg: 'bg-violet-100', badge: 'bg-violet-600' },
    { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-700', iconBg: 'bg-blue-100', badge: 'bg-blue-600' },
    { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700', iconBg: 'bg-emerald-100', badge: 'bg-emerald-600' },
    { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700', iconBg: 'bg-amber-100', badge: 'bg-amber-600' },
    { bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-700', iconBg: 'bg-rose-100', badge: 'bg-rose-600' },
    { bg: 'bg-cyan-50', border: 'border-cyan-100', text: 'text-cyan-700', iconBg: 'bg-cyan-100', badge: 'bg-cyan-600' },
    { bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-700', iconBg: 'bg-indigo-100', badge: 'bg-indigo-600' },
    { bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-700', iconBg: 'bg-orange-100', badge: 'bg-orange-600' },
  ];

  const getColor = (index) => subjectColors[index % subjectColors.length];

  // Difficulty badge
  const DifficultyBadge = ({ difficulty }) => {
    const colors = {
      Easy: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      Medium: 'bg-amber-100 text-amber-700 border-amber-200',
      Hard: 'bg-red-100 text-red-700 border-red-200',
    };
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colors[difficulty] || colors.Medium}`}>
        {difficulty || 'Medium'}
      </span>
    );
  };

  // =================== LOADING SKELETON ===================
  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: '#f8fafc' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {/* Header skeleton */}
          <div className="mb-8">
            <div className="h-10 w-64 bg-slate-200 rounded-xl shimmer mb-3" />
            <div className="h-5 w-96 bg-slate-100 rounded-lg shimmer" />
          </div>
          {/* Search skeleton */}
          <div className="h-14 w-full bg-white rounded-2xl border border-slate-100 shimmer mb-8" />
          {/* Cards skeleton */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="h-5 w-32 bg-slate-200 rounded-lg shimmer mb-3" />
                <div className="h-4 w-48 bg-slate-100 rounded shimmer mb-2" />
                <div className="h-4 w-40 bg-slate-100 rounded shimmer mb-4" />
                <div className="h-8 w-24 bg-slate-200 rounded-lg shimmer" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8fafc' }}>
        <div className="text-center">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Couldn't load Study Notes</h2>
          <p className="text-slate-500 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-500 transition-all">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // =================== MAIN RENDER ===================
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#f8fafc' }}>
      <Helmet>
        <title>Study Notes - NextraPath</title>
        <meta name="description" content="Access handwritten notes, revision materials, important questions, MCQs, and more for your B.Tech semester exams." />
      </Helmet>

      {/* Background decorators */}
      <div className="fixed top-0 right-[-10%] w-[50vw] h-[50vw] rounded-full bg-violet-100/20 blur-[120px] -z-10" />
      <div className="fixed bottom-[20%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-emerald-100/20 blur-[120px] -z-10" />

      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <Link to="/" className="text-xl sm:text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <img src="/logo.png" alt="NextraPath Logo" className="h-6 w-6 sm:h-8 sm:w-8 object-contain drop-shadow-sm" /> NextraPath
          </Link>
          <div className="hidden md:flex gap-6 text-sm font-medium text-slate-500 items-center">
            <Link to="/" className="hover:text-slate-800 transition-colors">Home</Link>
            <Link to="/explorer" className="hover:text-slate-800 transition-colors">Careers</Link>
            <Link to="/learn" className="hover:text-slate-800 transition-colors">Learn</Link>
            <Link to="/study-notes" className="text-violet-600 font-bold border-b-2 border-violet-600 pb-0.5">Study Notes</Link>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Link to="/dashboard" className="text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg transition-all shadow-md shadow-emerald-600/20">
                Dashboard
              </Link>
            ) : (
              <Link to="/login" className="text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg transition-all shadow-md shadow-emerald-600/20">
                Get Started
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* ======= HERO HEADER ======= */}
        <div className="mb-8 sm:mb-12 animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-violet-100 rounded-xl">
              <BookOpen className="h-6 w-6 text-violet-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight">
                Study Notes
              </h1>
              <p className="text-sm sm:text-base text-slate-500 mt-1">
                Your complete exam preparation hub — handwritten notes, revision, questions & more
              </p>
            </div>
          </div>
        </div>

        {/* ======= SEARCH BAR ======= */}
        <div className="relative mb-6 sm:mb-8 animate-fade-in">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search subjects, chapters, units..."
              className="w-full pl-12 pr-12 py-4 bg-white rounded-2xl border border-slate-200 text-sm sm:text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-300 shadow-sm transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-14 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full transition-colors">
                <X className="h-4 w-4 text-slate-400" />
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${showFilters ? 'bg-violet-100 text-violet-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              <SlidersHorizontal className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ======= FILTER PANEL ======= */}
        {showFilters && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 mb-6 sm:mb-8 shadow-sm animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Filter className="h-4 w-4" /> Filters
              </h3>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1">
                  <X className="h-3 w-3" /> Clear All
                </button>
              )}
            </div>
            <div className="grid sm:grid-cols-3 gap-3 sm:gap-4">
              {/* Branch */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Branch</label>
                <select
                  value={selectedBranch}
                  onChange={(e) => { setSelectedBranch(e.target.value); setSelectedSemester(''); setSelectedSubject(''); }}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-300"
                >
                  <option value="">All Branches</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              {/* Semester */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Semester</label>
                <select
                  value={selectedSemester}
                  onChange={(e) => { setSelectedSemester(e.target.value); setSelectedSubject(''); }}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-300"
                >
                  <option value="">All Semesters</option>
                  {filteredSemesters.map(s => <option key={s.id} value={s.id}>Semester {s.number}</option>)}
                </select>
              </div>
              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-300"
                >
                  <option value="">All Subjects</option>
                  {filteredSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ======= SEARCH RESULTS ======= */}
        {searchResults && searchQuery.trim() && (
          <div className="mb-8 animate-fade-in">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
              Search Results for "{searchQuery}"
            </h3>

            {/* Subject matches */}
            {searchResults.subjects.length > 0 && (
              <div className="mb-6">
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-1.5">
                  <BookMarked className="h-3.5 w-3.5" /> Subjects ({searchResults.subjects.length})
                </h4>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {searchResults.subjects.map((sub, i) => {
                    const color = getColor(i);
                    const sem = semesters.find(s => s.id === sub.semester_id);
                    const branch = sem ? branches.find(b => b.id === sem.branch_id) : null;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => { setSelectedSubject(sub.id); setSearchQuery(''); setShowFilters(false); }}
                        className={`${color.bg} border ${color.border} p-4 rounded-2xl text-left hover:shadow-md transition-all group`}
                      >
                        <div className={`text-base font-bold ${color.text} group-hover:scale-[1.01] transition-transform`}>{sub.name}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          {branch?.name} • Semester {sem?.number}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Chapter matches */}
            {searchResults.chapters.length > 0 && (
              <div className="mb-6">
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> Chapters ({searchResults.chapters.length})
                </h4>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {searchResults.chapters.map(ch => (
                    <Link
                      key={ch.id}
                      to={`/study-notes/chapter/${ch.id}`}
                      className="bg-white border border-slate-200 p-4 rounded-2xl hover:shadow-md hover:border-violet-200 transition-all group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                          Ch. {ch.number}
                        </span>
                        <DifficultyBadge difficulty={ch.difficulty} />
                      </div>
                      <div className="font-semibold text-slate-800 text-sm group-hover:text-violet-600 transition-colors">
                        {ch.title}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {getUnitTitle(ch.unit_id)}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {searchResults.subjects.length === 0 && searchResults.chapters.length === 0 && searchResults.units.length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-slate-500 font-medium">No results found for "{searchQuery}"</p>
                <p className="text-xs text-slate-400 mt-1">Try a different search term</p>
              </div>
            )}
          </div>
        )}

        {/* ======= RECENTLY VIEWED ======= */}
        {!searchQuery && recentlyViewed.length > 0 && (
          <div className="mb-8 sm:mb-10 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" /> Continue Reading
              </h3>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {recentlyViewed.slice(0, 5).map(item => (
                <Link
                  key={item.id}
                  to={`/study-notes/chapter/${item.id}`}
                  className="flex-shrink-0 w-48 bg-white border border-slate-200 p-4 rounded-2xl hover:shadow-md hover:border-violet-200 transition-all group"
                >
                  <div className="text-xs font-bold text-violet-600 mb-1">Ch. {item.number}</div>
                  <div className="text-sm font-semibold text-slate-800 group-hover:text-violet-600 transition-colors line-clamp-2">
                    {item.title}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {item.viewedAt ? new Date(item.viewedAt).toLocaleDateString() : 'Recently'}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ======= SUBJECT VIEW (when subject is selected) ======= */}
        {selectedSubject && !searchQuery && (
          <div className="animate-fade-in">
            {/* Breadcrumb */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-400 mb-6">
              <button onClick={clearFilters} className="hover:text-slate-600 transition-colors">Study Notes</button>
              {selectedBranch && (
                <><ChevronRight className="h-3 w-3" /><span className="text-slate-500">{getBranchName(selectedBranch)}</span></>
              )}
              {selectedSemester && (
                <><ChevronRight className="h-3 w-3" /><span className="text-slate-500">Semester {getSemesterNumber(selectedSemester)}</span></>
              )}
              <ChevronRight className="h-3 w-3" />
              <span className="text-violet-600 font-bold">{getSubjectName(selectedSubject)}</span>
            </div>

            {/* Units & Chapters */}
            {filteredUnits.length > 0 ? (
              <div className="space-y-6">
                {filteredUnits.map(unit => {
                  const unitChapters = chapters.filter(c => c.unit_id === unit.id);
                  return (
                    <div key={unit.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      {/* Unit header */}
                      <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-violet-50 to-indigo-50 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center text-violet-600 font-extrabold text-sm">
                            U{unit.number}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-800">{unit.title}</h3>
                            <p className="text-xs text-slate-500">{unitChapters.length} chapter{unitChapters.length !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                      </div>
                      {/* Chapters list */}
                      <div className="divide-y divide-slate-100">
                        {unitChapters.map(ch => (
                          <Link
                            key={ch.id}
                            to={`/study-notes/chapter/${ch.id}`}
                            onClick={() => {
                              const recent = [{ id: ch.id, title: ch.title, number: ch.number, viewedAt: new Date().toISOString() },
                                ...recentlyViewed.filter(r => r.id !== ch.id)].slice(0, 10);
                              setRecentlyViewed(recent);
                              localStorage.setItem('sn_recent', JSON.stringify(recent));
                            }}
                            className="flex items-center justify-between px-5 sm:px-6 py-4 hover:bg-violet-50/50 transition-all group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 font-bold text-xs shrink-0 group-hover:bg-violet-100 group-hover:text-violet-600 transition-colors">
                                {ch.number}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-sm text-slate-800 group-hover:text-violet-600 transition-colors truncate">
                                  {ch.title}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-3">
                              <DifficultyBadge difficulty={ch.difficulty} />
                              <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all" />
                            </div>
                          </Link>
                        ))}
                        {unitChapters.length === 0 && (
                          <div className="px-6 py-8 text-center text-slate-400 text-sm">
                            No chapters added yet
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">📖</div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">No units found</h3>
                <p className="text-slate-500 text-sm">No units have been added for this subject yet.</p>
              </div>
            )}
          </div>
        )}

        {/* ======= DEFAULT VIEW: SUBJECT GRID (no subject selected, no search) ======= */}
        {!selectedSubject && !searchQuery && (
          <div className="animate-fade-in">
            {/* Stats strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 sm:mb-10">
              {[
                { icon: <GraduationCap className="h-5 w-5" />, val: branches.length, label: 'Branches', color: 'text-violet-600 bg-violet-100' },
                { icon: <BookMarked className="h-5 w-5" />, val: subjects.length, label: 'Subjects', color: 'text-blue-600 bg-blue-100' },
                { icon: <Layers className="h-5 w-5" />, val: units.length, label: 'Units', color: 'text-emerald-600 bg-emerald-100' },
                { icon: <FileText className="h-5 w-5" />, val: chapters.length, label: 'Chapters', color: 'text-amber-600 bg-amber-100' },
              ].map(stat => (
                <div key={stat.label} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center mb-2.5`}>
                    {stat.icon}
                  </div>
                  <div className="text-2xl font-extrabold text-slate-800">{stat.val}</div>
                  <div className="text-xs font-medium text-slate-500">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Subject cards */}
            {filteredSubjects.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                    {selectedSemester ? `Semester ${getSemesterNumber(selectedSemester)} Subjects` : 'All Subjects'}
                  </h2>
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                    {filteredSubjects.length} subject{filteredSubjects.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSubjects.map((sub, i) => {
                    const color = getColor(i);
                    const sem = semesters.find(s => s.id === sub.semester_id);
                    const branch = sem ? branches.find(b => b.id === sem.branch_id) : null;
                    const subjectUnits = units.filter(u => u.subject_id === sub.id);
                    const subjectChapters = chapters.filter(c => subjectUnits.some(u => u.id === c.unit_id));

                    return (
                      <button
                        key={sub.id}
                        onClick={() => {
                          setSelectedSubject(sub.id);
                          if (sem) setSelectedSemester(sem.id);
                          if (branch) setSelectedBranch(branch.id);
                        }}
                        className={`${color.bg} border ${color.border} p-5 sm:p-6 rounded-2xl text-left hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group relative overflow-hidden`}
                      >
                        {/* Decorative gradient circle */}
                        <div className={`absolute -right-6 -top-6 w-24 h-24 ${color.iconBg} rounded-full opacity-40 group-hover:opacity-60 transition-opacity`} />

                        <div className="relative z-10">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-11 h-11 ${color.iconBg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                              <BookOpen className={`h-5 w-5 ${color.text}`} />
                            </div>
                            <div className={`text-[10px] font-bold uppercase tracking-wider ${color.text} ${color.iconBg} px-2 py-0.5 rounded-full`}>
                              Sem {sem?.number || '?'}
                            </div>
                          </div>
                          <h3 className={`text-base sm:text-lg font-bold text-slate-800 mb-1.5 group-hover:${color.text} transition-colors`}>
                            {sub.name}
                          </h3>
                          <p className="text-xs text-slate-500 mb-3">
                            {branch?.name || 'General'}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Layers className="h-3 w-3" /> {subjectUnits.length} units
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" /> {subjectChapters.length} chapters
                            </span>
                          </div>
                        </div>

                        <div className={`absolute right-4 bottom-4 ${color.text} opacity-0 group-hover:opacity-100 transition-opacity`}>
                          <ArrowRight className="h-5 w-5" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">No subjects available yet</h3>
                <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
                  Study notes are being prepared. Check back soon for handwritten notes, revision materials, and more!
                </p>
                <Link to="/" className="inline-flex items-center px-6 py-3 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-500 transition-all shadow-md shadow-violet-600/20">
                  Back to Home <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-xs text-slate-400">
          &copy; {new Date().getFullYear()} NextraPath. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
