import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Compass, Code2, ChevronRight } from 'lucide-react';

export default function SkillDetails() {
  const { name } = useParams();
  const { skillsList, loading } = useData();
  const [activePhase, setActivePhase] = useState(null);

  const decodedName = decodeURIComponent(name);
  const skill = skillsList.find(s => s.name.toLowerCase() === decodedName.toLowerCase());

  // Set the first phase as active by default when skill loads
  useEffect(() => {
    if (skill && skill.phases && skill.phases.length > 0 && !activePhase) {
      setActivePhase(skill.phases[0].phaseNumber);
    }
  }, [skill, activePhase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse flex flex-col items-center">
          <Code2 className="h-12 w-12 text-emerald-500 mb-4" />
          <div className="text-lg font-bold text-slate-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (!skill) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Roadmap Not Found</h2>
          <Link to="/skills" className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors">
            ← Back to Skills
          </Link>
        </div>
      </div>
    );
  }

  const activePhaseData = skill.phases.find(p => p.phaseNumber === activePhase);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold text-slate-800">
            <Compass className="h-6 w-6 text-emerald-500" /> NaviCareer
          </Link>
          <Link to="/skills" className="text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors">
            ← Back to Skills
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Simple Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-slate-800 mb-2">{skill.name} Roadmap</h1>
          <p className="text-slate-500 text-lg">{skill.description}</p>
        </div>

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-12 gap-8 items-start">
          
          {/* Left Sidebar - Steps */}
          <div className="md:col-span-4 lg:col-span-3 flex flex-col gap-2">
            {skill.phases.map((phase) => {
              const isActive = activePhase === phase.phaseNumber;
              return (
                <button
                  key={phase.phaseNumber}
                  onClick={() => setActivePhase(phase.phaseNumber)}
                  className={`w-full flex items-center justify-between px-5 py-4 rounded-xl font-bold text-left transition-all ${
                    isActive 
                      ? 'bg-emerald-50 text-emerald-700 border-2 border-emerald-500 shadow-sm' 
                      : 'bg-white text-slate-600 border-2 border-slate-100 hover:border-emerald-200 hover:bg-slate-50'
                  }`}
                >
                  <span>Step {phase.phaseNumber}: {phase.phaseTitle}</span>
                  {isActive && <ChevronRight className="h-5 w-5 text-emerald-500" />}
                </button>
              );
            })}
          </div>

          {/* Right Content - Topics */}
          <div className="md:col-span-8 lg:col-span-9 bg-slate-50 rounded-2xl p-8 sm:p-12 border border-slate-100 min-h-[400px]">
            {activePhaseData ? (
              <div className="animate-fade-in">
                <h2 className="text-3xl font-extrabold text-slate-800 mb-8 pb-4 border-b border-slate-200">
                  {activePhaseData.phaseTitle}
                </h2>
                
                <ul className="space-y-6">
                  {activePhaseData.topics.map((topic, index) => (
                    <li key={index} className="flex flex-col">
                      <div className="flex items-center gap-4 text-xl font-medium text-slate-800">
                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
                        {topic.title}
                      </div>
                      
                      {/* If the topic has detailed bullet points, show them cleanly beneath */}
                      {topic.description && topic.description.length > 0 && (
                        <ul className="ml-6 mt-3 space-y-2 text-slate-600 text-base list-none">
                          {topic.description.map((desc, dIdx) => (
                            <li key={dIdx} className="flex items-start gap-2">
                              <span className="text-slate-300 mt-1">•</span>
                              {desc}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 font-medium">
                Select a step from the left to view topics
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
