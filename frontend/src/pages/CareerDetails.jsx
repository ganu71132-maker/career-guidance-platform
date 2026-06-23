import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Target, Map, BookOpen, TrendingUp, IndianRupee, Briefcase, ExternalLink, CheckCircle, Circle, Compass, ChevronDown, ChevronUp, Video, BookText, FileText, Code, Lightbulb, Star, Play, Lock, Bookmark } from 'lucide-react';

const resourceIcons = {
  video: <Video className="h-4 w-4" />,
  course: <BookText className="h-4 w-4" />,
  documentation: <FileText className="h-4 w-4" />,
  practice: <Code className="h-4 w-4" />,
  project: <Lightbulb className="h-4 w-4" />,
};

const resourceColors = {
  video: 'text-red-400 bg-red-500/10',
  course: 'text-blue-400 bg-blue-500/10',
  documentation: 'text-yellow-400 bg-yellow-500/10',
  practice: 'text-green-400 bg-green-500/10',
  project: 'text-purple-400 bg-purple-500/10',
};

export default function CareerDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const { careers: careersData, loading, getCareerResources, savedCareers, completedSteps, toggleSaveCareer, toggleStepCompletion } = useData();
  const career = careersData.find(c => c.id === id);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedStep, setExpandedStep] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const isScrollingRef = React.useRef(false);

  React.useEffect(() => {
    const handleScroll = () => {
      if (isScrollingRef.current) return;
      
      const sections = isAuthenticated
        ? ['overview', 'skills', 'roadmap', 'resources']
        : ['overview'];
      const navbarHeight = 64;
      const tabsElement = document.getElementById('tabs-navigation');
      const tabsHeight = tabsElement ? tabsElement.offsetHeight : 90;
      const scrollPosition = window.scrollY + navbarHeight + tabsHeight + 100; // threshold

      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveTab(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isAuthenticated]);

  const handleTabClick = (tabId) => {
    if (!isAuthenticated && tabId !== 'overview') {
      setShowLoginModal(true);
      return;
    }
    setActiveTab(tabId);
    const element = document.getElementById(tabId);
    if (element) {
      isScrollingRef.current = true;
      const navbarHeight = 64;
      const tabsElement = document.getElementById('tabs-navigation');
      const tabsHeight = tabsElement ? tabsElement.offsetHeight : 90;
      
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - navbarHeight - tabsHeight - 8;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      setTimeout(() => {
        isScrollingRef.current = false;
      }, 800);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen relative pb-20" style={{ background: '#f8fafc' }}>
        <div className="fixed top-0 right-0 w-[40vw] h-[40vw] rounded-full bg-blue-100/30 blur-[120px] -z-10" />
        <div className="fixed bottom-0 left-0 w-[30vw] h-[30vw] rounded-full bg-purple-100/30 blur-[120px] -z-10" />

        {/* Top Bar */}
        <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 text-base sm:text-lg font-bold text-slate-800">
              <Compass className="h-5 w-5 text-emerald-500" /> NaviCareer
            </div>
            <div className="w-28 h-4 rounded shimmer" />
          </div>
        </nav>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">
          {/* Header Skeleton */}
          <div className="bg-white p-5 sm:p-8 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="w-16 h-5 rounded mb-4 shimmer" />
            <div className="w-2/3 h-10 rounded mb-4 shimmer" />
            <div className="w-full h-4 rounded mb-2 shimmer" />
            <div className="w-5/6 h-4 rounded mb-6 shimmer" />
            <div className="flex flex-wrap gap-3">
              <div className="w-28 h-8 rounded-xl shimmer" />
              <div className="w-28 h-8 rounded-xl shimmer" />
              <div className="w-28 h-8 rounded-xl shimmer" />
            </div>
          </div>

          {/* Tabs Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center">
                <div className="w-10 h-10 rounded-xl mb-2.5 shimmer" />
                <div className="w-16 h-3 rounded shimmer" />
              </div>
            ))}
          </div>

          {/* Main Sections Skeletons */}
          <div className="space-y-6 sm:space-y-8">
            {/* Overview / Qualifications Skeleton */}
            <div className="bg-white p-5 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              <div className="w-40 h-7 rounded border-b border-slate-100 pb-3 mb-4 shimmer" />
              <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="h-24 rounded-2xl shimmer" />
                <div className="h-24 rounded-2xl shimmer" />
              </div>
              <div className="space-y-2 pt-4">
                <div className="w-32 h-5 rounded shimmer" />
                <div className="w-full h-4 rounded shimmer" />
                <div className="w-5/6 h-4 rounded shimmer" />
              </div>
            </div>

            {/* Skills Skeleton */}
            <div className="bg-white p-5 sm:p-8 rounded-3xl border border-slate-100 shadow-sm">
              <div className="w-36 h-7 rounded border-b border-slate-100 pb-3 mb-6 shimmer" />
              <div className="grid sm:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 rounded-xl shimmer" />
                ))}
              </div>
            </div>

            {/* Roadmap Skeleton */}
            <div className="bg-white p-5 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              <div className="w-44 h-7 rounded border-b border-slate-100 pb-3 mb-4 shimmer" />
              <div className="space-y-6 relative">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-4 items-start relative">
                    <div className="w-12 h-12 rounded-xl shrink-0 shimmer" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="w-1/2 h-5 rounded shimmer" />
                      <div className="w-5/6 h-4 rounded shimmer" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!career) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8fafc' }}>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Career not found</h2>
          <Link to="/explorer" className="text-emerald-600 hover:underline font-semibold">← Back to Explorer</Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Briefcase className="h-4 w-4" /> },
    { id: 'skills', label: 'Required Skills', icon: <Target className="h-4 w-4" /> },
    { id: 'roadmap', label: 'Career Roadmap', icon: <Map className="h-4 w-4" /> },
    { id: 'resources', label: 'Resources', icon: <BookOpen className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen relative pb-20 animate-fade-in" style={{ background: '#f8fafc' }}>
      <div className="fixed top-0 right-0 w-[40vw] h-[40vw] rounded-full bg-blue-100/30 blur-[120px] -z-10" />
      <div className="fixed bottom-0 left-0 w-[30vw] h-[30vw] rounded-full bg-purple-100/30 blur-[120px] -z-10" />

      {/* Top Bar */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-base sm:text-lg font-bold text-slate-800">
            <Compass className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-500" /> NaviCareer
          </Link>
          <Link to="/explorer" className="text-xs sm:text-sm text-slate-500 hover:text-slate-800 transition-colors font-medium">← Back to Careers</Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* ====== CAREER HEADER ====== */}
        <div className="bg-white p-5 sm:p-8 rounded-3xl border border-slate-100 shadow-sm mb-6 sm:mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Target className="h-48 w-48 text-slate-400" />
          </div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-full">
                {career.category}
              </span>
              {isAuthenticated && (
                <button
                  onClick={() => toggleSaveCareer(career.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all duration-300 cursor-pointer ${
                    savedCareers.includes(career.id)
                      ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100/50 shadow-sm'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Bookmark className={`h-4 w-4 transition-all duration-300 ${savedCareers.includes(career.id) ? 'fill-purple-600 text-purple-600' : 'text-slate-400'}`} />
                  {savedCareers.includes(career.id) ? 'Saved' : 'Save Career'}
                </button>
              )}
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold mb-3 sm:mb-4 text-slate-800 tracking-tight">{career.title}</h1>
            <p className="text-sm sm:text-base text-slate-500 max-w-3xl leading-relaxed mb-5 sm:mb-6">{career.description}</p>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl">
                <TrendingUp className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-emerald-500" />
                <span className="text-xs sm:text-sm font-semibold">{career.demandLevel} Demand</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-50 text-blue-700 border border-blue-100 rounded-xl">
                <IndianRupee className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-blue-500" />
                <span className="text-xs sm:text-sm font-semibold">{career.salary}</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl">
                <Map className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-indigo-500" />
                <span className="text-xs sm:text-sm font-semibold">{career.roadmap.length} Steps</span>
              </div>
            </div>

            {/* Progress Tracking Informational Banner */}
            {isAuthenticated && (
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center">
                {!savedCareers.includes(career.id) ? (
                  <p className="text-xs text-purple-600 bg-purple-50 px-3 py-2 rounded-xl inline-flex items-center gap-1.5 border border-purple-100 font-medium">
                    <Bookmark className="h-3.5 w-3.5 fill-purple-600/20 text-purple-600" />
                    <span>Save this career path to add it to your Dashboard and track your steps progress.</span>
                  </p>
                ) : (
                  <p className="text-xs text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl inline-flex items-center gap-1.5 border border-emerald-100 font-medium">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-600 fill-emerald-600/20" />
                    <span>Saved to your Dashboard! You can track your steps and roadmap progress dynamically.</span>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ====== TAB NAVIGATION ====== */}
        <div id="tabs-navigation" className="sticky top-16 z-40 bg-[#f8fafc]/90 backdrop-blur-md py-3 mb-6 sm:mb-8 border-b border-slate-200/50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {tabs.map(tab => {
              const isSelected = activeTab === tab.id;
              const isLocked = !isAuthenticated && tab.id !== 'overview';
              
              let activeColorClass = 'bg-blue-600 border-blue-500 shadow-blue-600/25';
              let iconColorClass = 'text-blue-400';
              
              if (tab.id === 'overview') {
                activeColorClass = 'bg-[#0f766e] border-[#0d9488] shadow-teal-600/25';
                iconColorClass = isSelected ? 'text-white' : 'text-[#0d9488]';
              } else if (tab.id === 'skills') {
                activeColorClass = 'bg-[#4338ca] border-[#4f46e5] shadow-indigo-600/25';
                iconColorClass = isSelected ? 'text-white' : 'text-[#4f46e5]';
              } else if (tab.id === 'roadmap') {
                activeColorClass = 'bg-[#047857] border-[#059669] shadow-emerald-600/25';
                iconColorClass = isSelected ? 'text-white' : 'text-[#059669]';
              } else if (tab.id === 'resources') {
                activeColorClass = 'bg-[#b45309] border-[#d97706] shadow-amber-600/25';
                iconColorClass = isSelected ? 'text-white' : 'text-[#d97706]';
              }

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl border transition-all duration-300 text-center select-none cursor-pointer group ${
                    isSelected
                      ? `${activeColorClass} text-white shadow-md scale-102`
                      : 'bg-white border-slate-200 text-slate-400 hover:text-slate-800 hover:border-slate-300 hover:bg-slate-50 shadow-sm'
                  }`}
                >
                  {isLocked && (
                    <span className="absolute top-2 right-2 p-1 bg-slate-100 text-slate-400 rounded-full">
                      <Lock className="h-3 w-3" />
                    </span>
                  )}
                  {tab.id === 'roadmap' && !isLocked && (
                    <span className="absolute -top-1.5 right-1.5 px-1.5 py-0.5 text-[8px] font-extrabold uppercase bg-red-500 text-white rounded-full tracking-wider animate-pulse">
                      Path
                    </span>
                  )}
                  
                  <div className={`p-2 rounded-xl mb-1 sm:mb-2 transition-colors ${
                    isSelected ? 'bg-white/10' : 'bg-slate-100 group-hover:bg-slate-200'
                  }`}>
                    {React.cloneElement(tab.icon, { className: `h-4 w-4 sm:h-5 sm:w-5 ${iconColorClass}` })}
                  </div>
                  <span className="font-bold text-[10px] sm:text-xs tracking-wide">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ====== SECTIONS CONTENT ====== */}
        <div className="space-y-8">

          {/* OVERVIEW SECTION */}
          <div id="overview" className="bg-white p-5 sm:p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-slate-800 border-b border-slate-100 pb-3">Career Overview</h2>

            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div className="p-5 sm:p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                <div className="flex items-center gap-2.5 sm:gap-3 mb-2.5 sm:mb-3">
                  <IndianRupee className="h-5 sm:h-6 w-5 sm:w-6 text-emerald-600" />
                  <h3 className="font-bold text-base sm:text-lg text-emerald-800">Salary Range</h3>
                </div>
                <p className="text-xl sm:text-2xl font-extrabold text-slate-800 mb-1">{career.salary}</p>
                <p className="text-xs sm:text-sm text-emerald-600/70">Average annual compensation</p>
              </div>
              <div className="p-5 sm:p-6 bg-orange-50/50 rounded-2xl border border-orange-100">
                <div className="flex items-center gap-2.5 sm:gap-3 mb-2.5 sm:mb-3">
                  <TrendingUp className="h-5 sm:h-6 w-5 sm:w-6 text-orange-600" />
                  <h3 className="font-bold text-base sm:text-lg text-orange-800">Growth Potential</h3>
                </div>
                <p className="text-xl sm:text-2xl font-extrabold text-slate-800 mb-1">{career.growthPotential}</p>
                <p className="text-xs sm:text-sm text-orange-600/70">Projected industry growth</p>
              </div>
            </div>

            <div className="mb-6 sm:mb-8">
              <h3 className="font-bold text-base sm:text-lg text-slate-800 mb-2.5 sm:mb-3">Industry Demand</h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">{career.industryDemand}</p>
            </div>

            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-800 mb-2.5 sm:mb-3">Related Roles & Career Paths</h3>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {career.jobOpportunities.map((job, i) => (
                  <span key={i} className="px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-600 font-medium">
                    {job}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* REQUIRED SKILLS SECTION */}
          {isAuthenticated && (
            <div id="skills" className="bg-white p-5 sm:p-8 rounded-3xl border border-slate-100 shadow-sm">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-slate-800 border-b border-slate-100 pb-3">Required Skills</h2>
              <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                {career.requiredSkills.map((skill, index) => (
                  <div key={index} className="flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-300 hover:bg-white hover:shadow-sm transition-all duration-300">
                    <div className="w-8 sm:w-10 h-8 sm:h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-xs sm:text-sm shrink-0">
                      {index + 1}
                    </div>
                    <span className="font-medium text-xs sm:text-sm text-slate-700">{skill}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CAREER ROADMAP SECTION */}
          {isAuthenticated && (
            <div id="roadmap" className="bg-white p-5 sm:p-8 rounded-3xl border border-slate-100 shadow-sm">
              <h2 className="text-xl sm:text-2xl font-bold mb-1.5 sm:mb-2 text-slate-800">Career Roadmap</h2>
              <p className="text-xs sm:text-sm text-slate-500 mb-6 sm:mb-8 pb-3 border-b border-slate-100">
                Follow this step-by-step path from beginner to {career.title}. <span className="text-emerald-600 font-bold block sm:inline mt-1 sm:mt-0">💡 Click the step numbers to check them off and track progress!</span>
              </p>

              <div className="space-y-4">
                {career.roadmap.map((step, index) => {
                  const isLast = index === career.roadmap.length - 1;
                  const isExpanded = expandedStep === step.id;

                  return (
                    <div key={step.id} className="relative">
                      {/* Connector line */}
                      {!isLast && (
                        <div className="absolute left-10 sm:left-11 top-16 w-0.5 h-[calc(100%-2rem)] bg-slate-200 z-0" />
                      )}

                      <div
                        className={`relative z-10 rounded-2xl border transition-all cursor-pointer ${
                          isExpanded ? 'bg-white border-emerald-200 shadow-md shadow-emerald-500/5' : 'bg-slate-50 border-slate-100 hover:border-slate-200 hover:bg-white hover:shadow-sm'
                        }`}
                        onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5">
                          <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border transition-colors ${
                              completedSteps.includes(step.id)
                                ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                                : isLast 
                                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                  : 'bg-blue-50 text-blue-600 border-blue-100'
                            }`}>
                              {completedSteps.includes(step.id) ? <CheckCircle className="h-6 w-6" /> : step.step}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-slate-800 text-base sm:text-lg group-hover:text-emerald-600 transition-colors">{step.title}</h3>
                              <p className="text-xs sm:text-sm text-slate-500 line-clamp-2 sm:line-clamp-none">{step.description}</p>
                            </div>
                          </div>
                          
                          {/* Right Side Actions: Completion button and resources count */}
                          <div className="flex items-center gap-3.5 self-stretch sm:self-auto justify-between sm:justify-end border-t border-slate-100 sm:border-t-0 pt-3 sm:pt-0 mt-2 sm:mt-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const isChecking = !completedSteps.includes(step.id);
                                toggleStepCompletion(step.id);
                                
                                // Auto-save the career if user marks a step completed and career isn't saved yet
                                if (isChecking && !savedCareers.includes(career.id)) {
                                  toggleSaveCareer(career.id);
                                }
                              }}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all duration-300 cursor-pointer ${
                                completedSteps.includes(step.id)
                                  ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-600/10'
                                  : 'bg-emerald-50/40 text-emerald-600 border-emerald-200 hover:bg-emerald-600 hover:text-white hover:border-emerald-600'
                              }`}
                            >
                              {completedSteps.includes(step.id) ? (
                                <>
                                  <CheckCircle className="h-4 w-4 text-white fill-emerald-600/20" />
                                  <span>Completed</span>
                                </>
                              ) : (
                                <>
                                  <Circle className="h-4 w-4 text-emerald-500" />
                                  <span>Mark Complete</span>
                                </>
                              )}
                            </button>

                            {step.resources.length > 0 && (
                              <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
                                <span className="text-xs bg-slate-100 px-2 py-1 rounded font-medium">{step.resources.length} resources</span>
                                {isExpanded ? <ChevronUp className="h-4 sm:h-5 w-4 sm:w-5" /> : <ChevronDown className="h-4 sm:h-5 w-4 sm:w-5" />}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Expanded Resources */}
                        {isExpanded && step.resources.length > 0 && (
                          <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0" onClick={e => e.stopPropagation()}>
                            <div className="border-t border-slate-100 pt-4">
                              <h4 className="text-xs sm:text-sm font-semibold text-slate-600 mb-3">📚 Learning Resources for this step:</h4>
                              <div className="space-y-2">
                                {[...step.resources].sort((a, b) => (b.recommended ? 1 : 0) - (a.recommended ? 1 : 0)).map((res, ri) => (
                                  <a
                                    key={ri}
                                    href={res.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center justify-between p-3 sm:p-4 rounded-2xl transition-all duration-300 group ${
                                      res.recommended
                                        ? 'bg-amber-50/50 border border-amber-200 hover:border-amber-300'
                                        : 'bg-slate-50 border border-slate-100 hover:border-slate-200 hover:bg-white hover:shadow-sm'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 bg-slate-100 border border-slate-200 group-hover:scale-105 transition-transform duration-300`}>
                                        {React.cloneElement(resourceIcons[res.type] || <BookOpen />, { className: `h-4 w-4 sm:h-5 sm:w-5 ${resourceColors[res.type]}` })}
                                      </div>
                                      
                                      <div className="min-w-0">
                                        <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 mb-1 sm:mb-1.5">
                                          <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">{res.title}</span>
                                          {res.recommended && (
                                            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-500/20 text-yellow-500 rounded-full text-[8px] font-extrabold tracking-wider uppercase shrink-0">
                                              <Star className="h-2 w-2 fill-current" /> Recommended
                                            </span>
                                          )}
                                        </div>
                                        
                                        <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                                          <span className="px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/10 capitalize font-medium">{res.type}</span>
                                          <span className="text-slate-500 font-medium">{res.platform}</span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 shadow-md transition-all duration-300 shrink-0 ml-3 sm:ml-4">
                                      <Play className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 fill-current ml-0.5 transition-transform group-hover:scale-110" />
                                    </div>
                                  </a>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* RESOURCES SECTION */}
          {isAuthenticated && (
            <div id="resources" className="bg-white p-5 sm:p-8 rounded-3xl border border-slate-100 shadow-sm">
              {(() => {
                const cResources = getCareerResources(career.id);
                const types = ['video', 'course', 'book', 'documentation', 'tool', 'practice', 'project', 'other'];
                const typeLabel = {
                  video: '🎥 Videos', course: '📖 Courses', book: '📚 Books',
                  documentation: '📄 Documentation', tool: '🛠️ Tools',
                  practice: '💻 Practice', project: '💡 Projects', other: '📌 Other'
                };

                if (cResources.length === 0) {
                  return (
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold mb-1.5 sm:mb-2 text-slate-800">Learning Resources</h2>
                      <p className="text-xs sm:text-sm text-slate-500 mb-6 sm:mb-8">Resources for this career will be added soon. Check back later!</p>
                      <div className="bg-slate-50 p-8 sm:p-12 rounded-2xl border border-slate-100 text-center">
                        <BookOpen className="h-10 sm:h-12 w-10 sm:w-12 text-slate-400 mx-auto mb-3 sm:mb-4" />
                        <p className="text-xs sm:text-sm text-slate-500">No resources available yet.</p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold mb-1.5 sm:mb-2 text-slate-800 border-b border-slate-100 pb-3">Learning Resources</h2>
                    <p className="text-xs sm:text-sm text-slate-500 mb-6 sm:mb-8">Handpicked resources to help you become a {career.title}.</p>

                    {types.map(type => {
                      const typeRes = cResources.filter(r => r.type === type);
                      if (typeRes.length === 0) return null;

                      return (
                        <div key={type} className="mb-6 sm:mb-8">
                          <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-3 sm:mb-4">{typeLabel[type] || type}</h3>
                          <div className="grid sm:grid-cols-2 gap-3">
                            {[...typeRes].sort((a, b) => (b.recommended ? 1 : 0) - (a.recommended ? 1 : 0)).map((res, ri) => (
                              <a key={ri} href={res.url} target="_blank" rel="noopener noreferrer"
                                className={`flex items-center justify-between p-3 sm:p-4 rounded-2xl transition-all duration-300 group ${
                                  res.recommended
                                    ? 'bg-amber-50/50 border border-amber-200 hover:border-amber-300'
                                    : 'bg-slate-50 border border-slate-100 hover:border-slate-200 hover:bg-white hover:shadow-sm'
                                }`}>
                                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 bg-slate-100 border border-slate-200 group-hover:scale-105 transition-transform duration-300`}>
                                    {React.cloneElement(resourceIcons[res.type] || <BookOpen />, { className: `h-4 w-4 sm:h-5 sm:w-5 ${resourceColors[res.type]}` })}
                                  </div>
                                  
                                  <div className="min-w-0">
                                    <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 mb-1 sm:mb-1.5">
                                      <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">{res.title}</span>
                                      {res.recommended && (
                                        <span className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-500/20 text-yellow-500 rounded-full text-[8px] font-extrabold tracking-wider uppercase shrink-0">
                                          <Star className="h-2 w-2 fill-current" /> Recommended
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] sm:text-xs text-slate-500 flex items-center flex-wrap gap-1.5 sm:gap-2">
                                      <span className="px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/10 capitalize font-medium">{res.type}</span>
                                      <span className="font-medium text-slate-400">{res.platform}</span>
                                      {res.description && <span className="text-slate-500"> · {res.description}</span>}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 shadow-md transition-all duration-300 shrink-0 ml-3 sm:ml-4">
                                  <Play className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 fill-current ml-0.5 transition-transform group-hover:scale-110" />
                                </div>
                              </a>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

        </div>
      </div>

      {/* Login Required Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-100 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="absolute top-0 right-0 p-6 opacity-5">
              <Compass className="h-32 w-32 text-slate-400" />
            </div>
            
            <div className="relative z-10 text-center">
              <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-5 border border-emerald-100">
                <Lock className="h-8 w-8" />
              </div>
              
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-800 mb-3">Login Required</h3>
              <p className="text-sm sm:text-base text-slate-500 mb-6 leading-relaxed">
                Please login or create an account to access Required Skills, Career Roadmap, and Resources.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/login"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-4 rounded-xl text-center shadow-md shadow-emerald-600/20 transition-all text-sm sm:text-base"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-xl text-center border border-slate-200 transition-all text-sm sm:text-base"
                >
                  Sign Up
                </Link>
              </div>
              
              <button 
                onClick={() => setShowLoginModal(false)}
                className="mt-4 text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
