import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Compass, Bookmark, CheckCircle, TrendingUp, LogOut, Map, BookOpen, User, ArrowRight, FileText, Megaphone, Code2, Clock } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import NotificationBell from '../components/NotificationBell';
import WelcomePopup from '../components/WelcomePopup';
import FeatureHighlightPopup from '../components/FeatureHighlightPopup';
import CodePracticeInterface from '../components/coding/CodePracticeInterface';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const VAPID_PUBLIC_KEY = 'BInACj48s2VLb4bczm5_4wvo2ujO1JR9cBJXPRDwH27Xs3pQHHGVJswQy-WjOm1MDB8XLSiklS0mH03n7U2RNEQ';

export default function Dashboard() {
  const { user, signOut, isAdmin } = useAuth();
  const { careers: careersData, loading, savedCareers, completedSteps, completionsList = [] } = useData();
  const navigate = useNavigate();
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [savedCodes, setSavedCodes] = useState([]);
  const [selectedSnippet, setSelectedSnippet] = useState(null);
  const [gamification, setGamification] = useState(null);

  useEffect(() => {
    if (!user) return;
    async function fetchRecent() {
      const nowISO = new Date().toISOString();
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        {recentAnnouncements.length > 0 && (
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-sm mb-8 sm:mb-10 relative overflow-hidden">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100/50">
              <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                <Megaphone className="text-emerald-500 h-5 w-5" /> Recent Updates
              </h2>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">What's New</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentAnnouncements.map((ann) => (
                <div key={ann.id} className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl flex flex-col justify-between hover:border-slate-200 transition-all">
                  <div className="space-y-1">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-bold text-slate-800 text-xs sm:text-sm line-clamp-1">{ann.title}</h3>
                      {ann.priority === 'high' && (
                        <span className="bg-red-50 text-red-650 text-[8px] font-extrabold uppercase px-1 py-0.2 rounded shrink-0">High</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-normal line-clamp-2">{ann.message}</p>
                  </div>
                  {ann.redirect_url && (
                    <Link 
                      to={ann.redirect_url}
                      onClick={async () => {
                        try {
                          await supabase.rpc('increment_announcement_clicks', { announcement_id: ann.id });
                        } catch (err) {
                          await supabase.from('announcements')
                            .update({ clicks_count: (ann.clicks_count || 0) + 1 })
                            .eq('id', ann.id);
                        }
                      }}
                      className="text-[10px] text-emerald-600 font-bold hover:text-emerald-700 mt-3 flex items-center gap-1 w-fit cursor-pointer"
                    >
                      {ann.button_text || 'Learn More'} <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Saved Code Snippets Widget */}
        {savedCodes.length > 0 && (
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-sm mb-8 sm:mb-10 relative overflow-hidden">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100/50">
              <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                <Code2 className="text-indigo-500 h-5 w-5" /> My Saved Code Snippets
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedCodes.map((codeItem) => (
                <div 
                  key={codeItem.id} 
                  onClick={() => setSelectedSnippet(codeItem)}
                  className="p-5 bg-slate-900 rounded-2xl flex flex-col justify-between border border-slate-800 shadow-xl shadow-slate-900/10 cursor-pointer hover:border-indigo-500/50 hover:bg-slate-800 transition-all group"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h3 className="font-bold text-slate-200 text-sm sm:text-base line-clamp-1 group-hover:text-indigo-400 transition-colors">{codeItem.title}</h3>
                      <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full shrink-0">
                        {codeItem.language}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      {new Date(codeItem.created_at).toLocaleDateString()}
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(codeItem.code);
                        alert('Code copied to clipboard!');
                      }}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold py-1.5 px-3 rounded-lg transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Saved/Recommended Careers */}
        <div className="mb-8 sm:mb-10">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">
              {savedCareersData.length > 0 ? 'My Saved Careers' : 'Recommended Careers'}
            </h2>
            <Link to="/explorer" className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-500 flex items-center gap-1 font-medium">View All <ArrowRight className="h-3.5 sm:h-4 w-3.5 sm:w-4" /></Link>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {savedCareersData.length > 0 
              ? savedCareersData.map((career) => (
                  <Link key={career.id} to={`/career/${career.id}`} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-300 flex flex-col group">
                    <h3 className="font-bold text-slate-800 mb-1.5 sm:mb-2 text-sm sm:text-base group-hover:text-indigo-600 transition-colors">{career.title}</h3>
                    <p className="text-[10px] sm:text-xs text-slate-500 mb-3 line-clamp-2">{career.description}</p>
                    
                    {/* Visual Progress Bar Widget */}
                    {(() => {
                      const steps = career.roadmap.map(s => s.id);
                      const done = completedSteps.filter(id => steps.includes(id)).length;
                      const pct = steps.length > 0 ? Math.round((done / steps.length) * 100) : 0;
                      return (
                        <div className="mt-auto pt-2 mb-3">
                          <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1 font-medium">
                            <span>Roadmap Progress</span>
                            <span className="font-bold text-slate-700">{pct}% ({done}/{steps.length})</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })()}
                    
                    <div className="flex items-center justify-between text-[10px] sm:text-xs pt-2 border-t border-slate-50">
                      <span className="text-emerald-600 font-semibold">{career.demandLevel}</span>
                      <span className="text-slate-400 font-medium group-hover:text-indigo-600 transition-colors">Continue Roadmap →</span>
                    </div>
                  </Link>
                ))
              : careersData.slice(0, 3).map((career) => (
                  <Link key={career.id} to={`/career/${career.id}`} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-300 group">
                    <h3 className="font-bold text-slate-800 mb-1.5 sm:mb-2 text-sm sm:text-base group-hover:text-indigo-600 transition-colors">{career.title}</h3>
                    <p className="text-[10px] sm:text-xs text-slate-500 mb-2.5 sm:mb-3 line-clamp-2">{career.description}</p>
                    <div className="flex items-center gap-3 text-[10px] sm:text-xs">
                      <span className="text-emerald-600 font-medium">{career.demandLevel}</span>
                      <span className="text-slate-400">{career.salary}</span>
                    </div>
                  </Link>
                ))
            }
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-4 sm:mb-6">Quick Actions</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Link to="/explorer" className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-blue-50 border border-blue-100 rounded-2xl hover:bg-blue-100/70 transition-colors">
              <Map className="h-7 sm:h-8 w-7 sm:w-8 text-blue-600" />
              <div>
                <h3 className="font-bold text-slate-800 text-sm sm:text-base">Browse Careers</h3>
                <p className="text-[10px] sm:text-xs text-slate-500">Explore all career paths</p>
              </div>
            </Link>
            <Link to="/skills" className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-indigo-50 border border-indigo-100 rounded-2xl hover:bg-indigo-100/70 transition-colors">
              <Code2 className="h-7 sm:h-8 w-7 sm:w-8 text-indigo-600" />
              <div>
                <h3 className="font-bold text-slate-800 text-sm sm:text-base">Skill Library</h3>
                <p className="text-[10px] sm:text-xs text-slate-500">Find careers by skill</p>
              </div>
            </Link>
            <Link to="/explorer" className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-purple-50 border border-purple-100 rounded-2xl hover:bg-purple-100/70 transition-colors">
              <BookOpen className="h-7 sm:h-8 w-7 sm:w-8 text-purple-600" />
              <div>
                <h3 className="font-bold text-slate-800 text-sm sm:text-base">Start a Roadmap</h3>
                <p className="text-[10px] sm:text-xs text-slate-500">Pick a career and begin</p>
              </div>
            </Link>
            <Link to="/resume" className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-orange-50 border border-orange-100 rounded-2xl hover:bg-orange-100/70 transition-colors">
              <FileText className="h-7 sm:h-8 w-7 sm:w-8 text-orange-600" />
              <div>
                <h3 className="font-bold text-slate-800 text-sm sm:text-base">Build Resume</h3>
                <p className="text-[10px] sm:text-xs text-slate-500">Create a job-ready CV</p>
              </div>
            </Link>
            <Link to="/profile" className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-emerald-50 border border-emerald-100 rounded-2xl hover:bg-emerald-100/70 transition-colors">
              <User className="h-7 sm:h-8 w-7 sm:w-8 text-emerald-600" />
              <div>
                <h3 className="font-bold text-slate-800 text-sm sm:text-base">Edit Profile</h3>
                <p className="text-[10px] sm:text-xs text-slate-500">Update your information</p>
              </div>
            </Link>
          </div>
        </div>
      </main>

      {/* Full Screen Modal for Selected Snippet */}
      {selectedSnippet && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-slate-900/80 backdrop-blur-sm p-4 sm:p-8 animate-in fade-in duration-200">
          <div className="w-full max-w-6xl mx-auto h-full flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <CodePracticeInterface 
              initialLanguage={selectedSnippet.language} 
              initialCode={selectedSnippet.code} 
              onClose={() => setSelectedSnippet(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
