import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Play, CheckCircle, Trophy, Star, Lock, ChevronRight, Menu, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import Confetti from 'react-confetti';

export default function DailyChallenge() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState([]);
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [completions, setCompletions] = useState([]); // array of challenge_ids
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState('idle'); // idle, running, success, fail
  const [showConfetti, setShowConfetti] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pyodideRef = useRef(null);

  useEffect(() => {
    async function loadData() {
      // 1. Fetch all challenges sorted by day_number
      const { data: cData } = await supabase
        .from('daily_challenges')
        .select('*')
        .order('day_number', { ascending: true });
      
      if (cData) {
        setChallenges(cData);
      }

      // 2. Fetch completions for current user
      let completedIds = [];
      if (user) {
        const { data: compData } = await supabase
          .from('user_challenge_completions')
          .select('challenge_id')
          .eq('user_id', user.id);
        
        if (compData) {
          completedIds = compData.map(c => c.challenge_id);
          setCompletions(completedIds);
        }
      }

      // 3. Set the active challenge: find the first uncompleted challenge, or default to challenge 1
      if (cData && cData.length > 0) {
        const firstUncompleted = cData.find(c => !completedIds.includes(c.id));
        const initial = firstUncompleted || cData[cData.length - 1]; // if all completed, open the last one
        setActiveChallenge(initial);
        
        // Load draft code from localStorage or fallback to starter code
        const savedDraft = localStorage.getItem(`challenge_draft_${initial.id}`);
        setCode(savedDraft || initial.starter_code || '');
      }

      setLoading(false);
    }

    async function initPyodide() {
      if (!window.loadPyodide) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js';
        script.onload = async () => {
          pyodideRef.current = await window.loadPyodide();
        };
        document.body.appendChild(script);
      } else if (!pyodideRef.current) {
        pyodideRef.current = await window.loadPyodide();
      }
    }

    loadData();
    initPyodide();
  }, [user]);

  // Save draft code to localStorage on edit
  useEffect(() => {
    if (activeChallenge) {
      localStorage.setItem(`challenge_draft_${activeChallenge.id}`, code);
    }
  }, [code, activeChallenge]);

  const selectChallenge = (chall) => {
    // Check if locked: must have completed all previous challenges
    const index = challenges.findIndex(c => c.id === chall.id);
    const isLocked = index > 0 && !completions.includes(challenges[index - 1].id);
    
    if (isLocked) {
      alert("This challenge is locked! Please solve the previous challenges to unlock it.");
      return;
    }

    setActiveChallenge(chall);
    setStatus('idle');
    setOutput('');
    const savedDraft = localStorage.getItem(`challenge_draft_${chall.id}`);
    setCode(savedDraft || chall.starter_code || '');
  };

  const runCode = async () => {
    if (!pyodideRef.current) {
      setOutput('Python runtime is still loading. Please wait a moment...');
      return;
    }
    const isAlreadyCompleted = completions.includes(activeChallenge.id);
    if (isAlreadyCompleted) {
      alert("You have already completed this challenge!");
      return;
    }

    setStatus('running');
    setOutput('Running code...');

    try {
      pyodideRef.current.runPython(`
import sys
import io
sys.stdout = io.StringIO()
      `);

      pyodideRef.current.runPython(code);
      const stdout = pyodideRef.current.runPython('sys.stdout.getvalue()');
      setOutput(stdout || 'Code executed successfully with no output.');

      // Check if output matches expected
      const expected = activeChallenge.expected_output.trim();
      const actual = stdout.trim();

      if (actual === expected || (expected.includes(actual) && actual.length > 0)) {
        setStatus('success');
        handleSuccess();
      } else {
        setStatus('fail');
        setOutput(`Output:\n${actual}\n\nExpected:\n${expected}`);
      }
    } catch (err) {
      setStatus('fail');
      setOutput(err.message || String(err));
    }
  };

  const handleSuccess = async () => {
    setShowConfetti(true);
    
    // Add completion to DB
    const { error: compError } = await supabase
      .from('user_challenge_completions')
      .insert({ user_id: user.id, challenge_id: activeChallenge.id });

    if (!compError) {
      // Update local completions array
      setCompletions(prev => [...prev, activeChallenge.id]);

      // Award +50 XP
      try {
        const { data: gamification } = await supabase
          .from('user_gamification')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (gamification) {
          await supabase
            .from('user_gamification')
            .update({
              total_xp: (gamification.total_xp || 0) + 50,
              last_active_date: new Date().toISOString().split('T')[0]
            })
            .eq('user_id', user.id);
        }
      } catch (err) {
        console.error("Error updating XP:", err);
      }
    }
    
    setTimeout(() => setShowConfetti(false), 5000);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">Loading challenges...</div>;

  return (
    <div className="h-screen flex flex-col bg-slate-900 text-slate-200 font-sans">
      {showConfetti && <Confetti recycle={false} numberOfPieces={200} />}
      
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-slate-950 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="Toggle challenges sidebar"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div>
            <h1 className="font-extrabold text-lg text-white flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" /> Coding Challenge Track
            </h1>
          </div>
        </div>
        
        {activeChallenge && (
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${activeChallenge.difficulty === 'easy' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/50' : activeChallenge.difficulty === 'medium' ? 'bg-yellow-950 text-yellow-400 border border-yellow-900/50' : 'bg-red-950 text-red-400 border border-red-900/50'}`}>
              {activeChallenge.difficulty}
            </span>
            <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-inner">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-bold text-white">+50 XP</span>
            </div>
          </div>
        )}
      </header>

      {/* Workspace */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Sidebar: List of 30 Challenges */}
        <aside className={`bg-slate-950 border-r border-slate-800 flex flex-col transition-all duration-300 ${sidebarOpen ? 'w-80' : 'w-0 overflow-hidden'}`}>
          <div className="p-4 border-b border-slate-800/80 bg-slate-950/50 shrink-0">
            <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider">Progression Map</h3>
            <p className="text-xs text-slate-500 mt-1">Unlock all 30 coding challenges in order.</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {challenges.map((chall, idx) => {
              const isCompleted = completions.includes(chall.id);
              const isActive = activeChallenge?.id === chall.id;
              // Locked if it's not the first challenge, and the previous challenge is not completed
              const isLocked = idx > 0 && !completions.includes(challenges[idx - 1].id);

              return (
                <button
                  key={chall.id}
                  disabled={isLocked}
                  onClick={() => selectChallenge(chall)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left group ${
                    isActive 
                      ? 'bg-blue-600/10 border-blue-500 text-white shadow-sm shadow-blue-900/10 font-bold' 
                      : isCompleted 
                        ? 'bg-emerald-950/5 border-emerald-900/30 text-slate-300 hover:bg-slate-900' 
                        : isLocked 
                          ? 'opacity-40 bg-transparent border-transparent text-slate-500 cursor-not-allowed' 
                          : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-850">
                      Day {chall.day_number}
                    </span>
                    <span className="truncate text-sm">{chall.title}</span>
                  </div>
                  
                  <div className="shrink-0">
                    {isCompleted ? (
                      <CheckCircle className="h-4.5 w-4.5 text-emerald-500" />
                    ) : isLocked ? (
                      <Lock className="h-4 w-4 text-slate-650" />
                    ) : (
                      <ChevronRight className="h-4.5 w-4.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Content area: Statement & Editor */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          {/* Left panel: Statement */}
          {activeChallenge && (
            <div className="w-full md:w-5/12 border-r border-slate-800 p-6 flex flex-col overflow-y-auto bg-slate-900/40">
              <h2 className="text-2xl font-black text-white mb-2">{activeChallenge.title}</h2>
              <div className="prose prose-invert max-w-none text-slate-350 leading-relaxed text-sm">
                <p className="whitespace-pre-wrap">{activeChallenge.statement}</p>
              </div>
              
              {completions.includes(activeChallenge.id) && (
                <div className="mt-8 p-5 bg-emerald-950/15 border border-emerald-900/40 rounded-2xl flex items-start gap-3 shadow-inner">
                  <CheckCircle className="h-6 w-6 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-extrabold text-emerald-400">Challenge Completed!</h3>
                    <p className="text-xs text-slate-400 mt-1">Excellent job! You successfully completed this challenge. Select the next day in the sidebar map to continue climbing the ranks!</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Right panel: Monaco Editor */}
          {activeChallenge && (
            <div className="flex-1 flex flex-col min-h-0 bg-[#1e1e1e]">
              <div className="flex-1 relative min-h-0">
                <Editor
                  height="100%"
                  defaultLanguage={activeChallenge.language === 'python' ? 'python' : 'javascript'}
                  theme="vs-dark"
                  value={code}
                  onChange={setCode}
                  options={{ minimap: { enabled: false }, fontSize: 14, readOnly: completions.includes(activeChallenge.id) }}
                />
                {!completions.includes(activeChallenge.id) && (
                  <button
                    onClick={runCode}
                    disabled={status === 'running'}
                    className="absolute bottom-6 right-6 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-950/60 flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
                  >
                    <Play className="h-4 w-4 text-white fill-white" /> Run & Submit
                  </button>
                )}
              </div>
              
              {/* Output console */}
              <div className="h-56 bg-slate-950 border-t border-slate-800/80 p-5 font-mono text-sm overflow-y-auto shrink-0 flex flex-col">
                <div className="text-slate-500 mb-2 font-bold uppercase text-[10px] tracking-wider shrink-0">Console Output</div>
                <pre className={`flex-1 whitespace-pre-wrap overflow-y-auto ${status === 'fail' ? 'text-red-400' : status === 'success' ? 'text-emerald-400' : 'text-slate-350'}`}>
                  {output || 'Click "Run & Submit" to verify your solution.'}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
