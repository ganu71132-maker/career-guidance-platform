import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { Link } from 'react-router-dom';
import { Compass, Search, Code2, PlayCircle, GraduationCap, X, ChevronRight, Briefcase } from 'lucide-react';

export default function SkillExplorer() {
  const { careers } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkill, setSelectedSkill] = useState(null);

  // Extract unique skills and map them to careers
  const skillsMap = useMemo(() => {
    const map = {};
    careers.forEach(career => {
      if (career.requiredSkills && Array.isArray(career.requiredSkills)) {
        career.requiredSkills.forEach(skill => {
          if (!map[skill]) {
            map[skill] = { name: skill, careers: [] };
          }
          map[skill].careers.push(career);
        });
      }
    });
    // Convert to array and sort alphabetically
    return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
  }, [careers]);

  // Filter skills based on search term
  const filteredSkills = useMemo(() => {
    if (!searchTerm) return skillsMap;
    return skillsMap.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [skillsMap, searchTerm]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Compass className="text-emerald-500 h-6 w-6" /> NaviCareer
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-300 shadow-sm transition-all text-slate-700"
          />
        </div>

        {/* Skills Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredSkills.map(skill => (
            <div 
              key={skill.name}
              onClick={() => setSelectedSkill(skill)}
              className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 cursor-pointer transition-all group"
            >
              <h3 className="font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">{skill.name}</h3>
              <p className="text-xs text-slate-500 font-medium">
                Required in <span className="text-emerald-600 font-bold">{skill.careers.length}</span> career{skill.careers.length > 1 ? 's' : ''}
              </p>
            </div>
          ))}
          {filteredSkills.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500">
              No skills found matching "{searchTerm}"
            </div>
          )}
        </div>
      </main>

      {/* Skill Details Modal */}
      {selectedSkill && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Code2 className="text-indigo-500 h-5 w-5" /> {selectedSkill.name}
              </h2>
              <button onClick={() => setSelectedSkill(null)} className="p-1 hover:bg-slate-200 rounded-lg transition-colors">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">Careers Requiring This Skill</h3>
              <div className="grid sm:grid-cols-2 gap-3 mb-8">
                {selectedSkill.careers.map(career => (
                  <Link 
                    key={career.id} 
                    to={`/career/${career.id}`}
                    className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-indigo-50 hover:border-indigo-100 transition-colors group"
                  >
                    <span className="text-sm font-semibold text-slate-700 group-hover:text-indigo-700">{career.title}</span>
                    <Briefcase className="h-4 w-4 text-slate-400 group-hover:text-indigo-500" />
                  </Link>
                ))}
              </div>

              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">Learn This Skill</h3>
              <div className="flex flex-col gap-3">
                <a 
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(selectedSkill.name + " full course beginner")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-colors group"
                >
                  <PlayCircle className="h-6 w-6 text-red-600 shrink-0" />
                  <div>
                    <h4 className="font-bold text-slate-800 group-hover:text-red-700 text-sm">Search YouTube Tutorials</h4>
                    <p className="text-xs text-slate-500">Find free video courses and crash courses.</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400 ml-auto" />
                </a>

                <a 
                  href={`https://www.coursera.org/search?query=${encodeURIComponent(selectedSkill.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-colors group"
                >
                  <GraduationCap className="h-6 w-6 text-blue-600 shrink-0" />
                  <div>
                    <h4 className="font-bold text-slate-800 group-hover:text-blue-700 text-sm">Search Coursera Courses</h4>
                    <p className="text-xs text-slate-500">Find professional certifications and specializations.</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400 ml-auto" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
