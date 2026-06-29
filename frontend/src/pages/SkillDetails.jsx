import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Compass, Clock, BarChart, CheckCircle2, ChevronRight, ChevronDown, ChevronUp, Code2 } from 'lucide-react';

export default function SkillDetails() {
  const { name } = useParams();
  const { skillsList, loading } = useData();
  const [expandedPhase, setExpandedPhase] = useState(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse flex flex-col items-center">
          <Code2 className="h-12 w-12 text-emerald-500 mb-4" />
          <div className="text-lg font-bold text-slate-500">Loading Skill Roadmap...</div>
        </div>
      </div>
    );
  }

  // Find the skill, replacing url-encoded characters like %20 if necessary
  const decodedName = decodeURIComponent(name);
  const skill = skillsList.find(s => s.name.toLowerCase() === decodedName.toLowerCase());

  if (!skill) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Skill Roadmap Not Found</h2>
          <p className="text-slate-500 mb-6">We don't have a dedicated roadmap for "{decodedName}" yet.</p>
          <Link to="/skills" className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors">
            ← Back to Skills
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 animate-fade-in relative">
      <div className="fixed top-0 right-0 w-[40vw] h-[40vw] rounded-full bg-emerald-100/30 blur-[120px] -z-10" />
      <div className="fixed bottom-0 left-0 w-[30vw] h-[30vw] rounded-full bg-blue-100/30 blur-[120px] -z-10" />

      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-base sm:text-lg font-bold text-slate-800">
            <Compass className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-500" /> NaviCareer
          </Link>
          <Link to="/skills" className="text-xs sm:text-sm text-slate-500 hover:text-slate-800 transition-colors font-medium">← Back to Skills</Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-100 shadow-sm mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Code2 className="h-48 w-48 text-slate-400" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                <Code2 className="h-6 w-6" />
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-800 tracking-tight">{skill.name} Roadmap</h1>
            </div>
            
            <p className="text-base sm:text-lg text-slate-600 max-w-3xl leading-relaxed mb-8">{skill.description}</p>
            
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2.5 px-4 py-2.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-xl">
                <BarChart className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-blue-500/80 mb-0.5">Difficulty</div>
                  <div className="text-sm font-bold">{skill.difficulty}</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5 px-4 py-2.5 bg-orange-50 text-orange-700 border border-orange-100 rounded-xl">
                <Clock className="h-5 w-5 text-orange-500" />
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-orange-500/80 mb-0.5">Estimated Time</div>
                  <div className="text-sm font-bold">{skill.estimatedTime}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Roadmap Timeline */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Learning Path</h2>
            
            <div className="space-y-4">
              {skill.phases.map((phase, index) => {
                const isExpanded = expandedPhase === phase.phaseNumber;
                
                return (
                  <div key={phase.phaseNumber} className="relative">
                    {/* Connector line between phases */}
                    {index < skill.phases.length - 1 && (
                      <div className="absolute left-6 sm:left-8 top-16 w-0.5 h-[calc(100%-1rem)] bg-slate-200 z-0" />
                    )}

                    <div 
                      className={`relative z-10 rounded-2xl border transition-all cursor-pointer overflow-hidden ${
                        isExpanded ? 'bg-white border-emerald-300 shadow-md' : 'bg-slate-50 border-slate-200 hover:border-emerald-200 hover:bg-white hover:shadow-sm'
                      }`}
                      onClick={() => setExpandedPhase(isExpanded ? null : phase.phaseNumber)}
                    >
                      {/* Phase Header */}
                      <div className="flex items-center justify-between p-4 sm:p-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shrink-0 border-2 font-bold text-lg transition-colors ${
                            isExpanded ? 'bg-emerald-500 border-emerald-500 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500'
                          }`}>
                            {phase.phaseNumber}
                          </div>
                          <div>
                            <h3 className={`font-bold text-lg sm:text-xl transition-colors ${isExpanded ? 'text-emerald-700' : 'text-slate-800'}`}>
                              Phase {phase.phaseNumber} — {phase.phaseTitle}
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">{phase.topics.length} Topics</p>
                          </div>
                        </div>
                        <div className={`p-2 rounded-full transition-colors ${isExpanded ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </div>
                      </div>

                      {/* Phase Content (Topics) */}
                      {isExpanded && (
                        <div className="px-4 sm:px-6 pb-6 pt-2 border-t border-slate-100 bg-white" onClick={e => e.stopPropagation()}>
                          <div className="space-y-5 mt-4 ml-[3.25rem] sm:ml-[4.25rem]">
                            {phase.topics.map((topic, tIdx) => (
                              <div key={tIdx} className="relative">
                                {/* Topic dot */}
                                <div className="absolute -left-6 sm:-left-8 top-2 w-3 h-3 rounded-full bg-emerald-200 border-2 border-white ring-1 ring-slate-100" />
                                
                                <h4 className="font-bold text-slate-800 mb-2">{topic.title}</h4>
                                
                                {topic.description && topic.description.length > 0 && (
                                  <ul className="space-y-1.5">
                                    {topic.description.map((desc, dIdx) => (
                                      <li key={dIdx} className="flex items-start gap-2 text-sm text-slate-600">
                                        <ChevronRight className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                                        <span>{desc}</span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Skills You'll Gain */}
            {skill.skillsGained && skill.skillsGained.length > 0 && (
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3">Skills You'll Gain</h3>
                <ul className="space-y-3">
                  {skill.skillsGained.map((sg, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                      <span className="text-sm text-slate-700 font-medium">{sg}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Career Opportunities */}
            {skill.careerOpportunities && skill.careerOpportunities.length > 0 && (
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3">Career Opportunities</h3>
                <div className="flex flex-col gap-2.5">
                  {skill.careerOpportunities.map((careerName, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <div className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                      <span className="text-sm text-slate-700 font-semibold">{careerName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
          </div>

        </div>
      </div>
    </div>
  );
}
