import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, Medal, Crown, ArrowLeft, Star, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaders() {
      try {
        const { data, error } = await supabase
          .from('user_gamification')
          .select('user_id, total_xp, current_streak, users(full_name)')
          .order('total_xp', { ascending: false })
          .limit(50);
        
        if (data && !error) {
          setLeaders(data);
        }
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaders();
  }, []);

  const getRankIcon = (index) => {
    if (index === 0) return <Crown className="h-6 w-6 text-yellow-500 drop-shadow-sm" />;
    if (index === 1) return <Medal className="h-6 w-6 text-slate-400 drop-shadow-sm" />;
    if (index === 2) return <Medal className="h-6 w-6 text-amber-700 drop-shadow-sm" />;
    return <span className="font-bold text-slate-400 w-6 text-center">{index + 1}</span>;
  };

  const getRankStyle = (index) => {
    if (index === 0) return "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200 shadow-sm scale-[1.02] z-10 relative";
    if (index === 1) return "bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200";
    if (index === 2) return "bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200";
    return "bg-white border-slate-100 hover:bg-slate-50";
  };

  const getLevel = (xp) => {
    if (xp >= 800) return { name: 'Master', color: 'text-purple-600', bg: 'bg-purple-100' };
    if (xp >= 400) return { name: 'Professional', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (xp >= 150) return { name: 'Explorer', color: 'text-emerald-600', bg: 'bg-emerald-100' };
    return { name: 'Beginner', color: 'text-slate-600', bg: 'bg-slate-100' };
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <Link to="/" className="text-xl font-black text-blue-600 flex items-center gap-2">
          NextraPath <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full uppercase tracking-wider">Leaderboard</span>
        </Link>
        <Link to="/dashboard" className="text-sm font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto pt-10 pb-20 px-4">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-4 bg-yellow-100 rounded-full mb-4">
            <Trophy className="h-10 w-10 text-yellow-600" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 mb-3">Global Leaderboard</h1>
          <p className="text-slate-500 max-w-lg mx-auto">Complete roadmaps and daily challenges to earn XP, level up your profile, and climb the ranks.</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-20 bg-slate-200 animate-pulse rounded-2xl"></div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {leaders.map((leader, index) => {
              const level = getLevel(leader.total_xp || 0);
              return (
                <div 
                  key={leader.user_id}
                  className={`p-4 rounded-2xl border transition-all flex items-center gap-4 sm:gap-6 ${getRankStyle(index)}`}
                >
                  <div className="flex items-center justify-center w-10 shrink-0">
                    {getRankIcon(index)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 text-lg truncate">
                      {leader.users?.full_name || 'Anonymous Coder'}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${level.bg} ${level.color}`}>
                        {level.name}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 shrink-0">
                    <div className="hidden sm:flex flex-col items-center justify-center">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Streak</span>
                      <div className="flex items-center gap-1 font-bold text-orange-500">
                        <TrendingUp className="h-4 w-4" /> {leader.current_streak || 0}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total XP</span>
                      <div className="flex items-center gap-1 font-extrabold text-lg text-emerald-600">
                        <Star className="h-5 w-5 fill-emerald-500" /> {leader.total_xp || 0}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
