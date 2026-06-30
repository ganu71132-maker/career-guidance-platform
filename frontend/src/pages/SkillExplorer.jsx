import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, Search, Code2, ChevronRight } from 'lucide-react';

export default function SkillExplorer() {
  const { careers, skillsList, loading } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // Create a combined list of skills from old careers extraction + new database skills
  const allSkills = useMemo(() => {
    if (!skillsList) return [];
    
    // Map database skills and sort alphabetically
    return [...skillsList]
      .map(s => ({
        name: s.name,
        fromDb: true,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [skillsList]);

  const filteredSkills = useMemo(() => {
    if (!searchQuery.trim()) return allSkills;
    const q = searchQuery.toLowerCase();
    return allSkills.filter(skill => 
      skill.name.toLowerCase().includes(q)
    );
  }, [allSkills, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Compass className="text-emerald-500 h-6 w-6" /> NextraPath
          </Link>
          <div className="flex gap-4">
            <Link to="/explorer" className="text-sm font-medium text-slate-500 hover:text-slate-800">Careers</Link>
            <Link to="/skills" className="text-sm font-bold text-emerald-600">Skills</Link>
            <Link to="/dashboard" className="text-sm font-medium text-slate-500 hover:text-slate-800">Dashboard</Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-800 mb-3 flex items-center gap-2">
            <Code2 className="h-8 w-8 text-indigo-500" /> Skill Library
          </h1>
          <p className="text-slate-500">Discover which careers match your skills and find resources to learn them.</p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-2xl mb-8">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search for a skill (e.g. Python, Communication, React)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-300 shadow-sm transition-all text-slate-700"
          />
        </div>

        {/* Skills Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSkills.map((skill, index) => (
            <div 
              key={index}
              onClick={() => navigate(`/skill/${encodeURIComponent(skill.name)}`)}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 cursor-pointer transition-all duration-300 group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors mb-1">{skill.name}</h3>
                </div>
                {skill.fromDb ? (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <Code2 className="h-4 w-4" />
                  </span>
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                    <ChevronRight className="h-4 w-4" />
                  </span>
                )}
              </div>
            </div>
          ))}
          {filteredSkills.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500">
              No skills found matching "{searchQuery}"
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
