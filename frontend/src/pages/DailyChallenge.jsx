import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Play, CheckCircle, Trophy, Star } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import Confetti from 'react-confetti';

export default function DailyChallenge() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState('idle'); // idle, running, success, fail
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const pyodideRef = useRef(null);

  useEffect(() => {
    async function loadChallenge() {
      // Pick challenge based on day of month (1-30)
      const day = new Date().getDate();
      const dayNumber = day > 30 ? 30 : day;

      const { data: cData } = await supabase
        .from('daily_challenges')
        .select('*')
        .eq('day_number', dayNumber)
        .single();
      
      if (cData) {
        setChallenge(cData);
        setCode(cData.starter_code || '');
      }

      if (user) {
        const { data: uData } = await supabase
          .from('user_gamification')
          .select('last_daily_completed')
          .eq('user_id', user.id)
          .single();
        
        if (uData?.last_daily_completed) {
          const lastCompleted = new Date(uData.last_daily_completed).toLocaleDateString();
          const today = new Date().toLocaleDateString();
          if (lastCompleted === today) {
            setAlreadyCompleted(true);
          }
        }
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

    loadChallenge();
    initPyodide();
  }, [user]);

  const runCode = async () => {
    if (!pyodideRef.current) {
      setOutput('Python runtime is still loading. Please wait a moment...');
      return;
    }
    if (alreadyCompleted) return;

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
      const expected = challenge.expected_output.trim();
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
    setAlreadyCompleted(true);
    
    // Grant XP and mark daily complete
    try {
      await supabase.rpc('award_xp_and_update_streak', {
        p_user_id: user.id,
        p_xp_amount: 50,
        p_is_daily: true
      });
    } catch (err) {
      console.log("RPC failed, falling back to client update");
      // Fallback
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
            last_daily_completed: new Date().toISOString(),
            current_streak: (gamification.current_streak || 0) + 1
          })
          .eq('user_id', user.id);
      }
    }
    
    setTimeout(() => setShowConfetti(false), 5000);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">Loading...</div>;
  if (!challenge) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">No challenge found for today!</div>;

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-200">
      {showConfetti && <Confetti />}
      
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-bold text-lg text-white flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" /> Daily Challenge
            </h1>
            <p className="text-xs text-slate-400">Day {challenge.day_number}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded ${challenge.difficulty === 'easy' ? 'bg-emerald-900/50 text-emerald-400' : challenge.difficulty === 'medium' ? 'bg-yellow-900/50 text-yellow-400' : 'bg-red-900/50 text-red-400'}`}>
            {challenge.difficulty}
          </span>
          <div className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <span className="text-sm font-bold text-white">50 XP Reward</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Panel: Description */}
        <div className="w-full md:w-1/3 border-r border-slate-800 p-6 flex flex-col overflow-y-auto bg-slate-900/50">
          <h2 className="text-2xl font-bold text-white mb-2">{challenge.title}</h2>
          <div className="prose prose-invert max-w-none text-sm text-slate-300">
            <p className="whitespace-pre-wrap leading-relaxed">{challenge.statement}</p>
          </div>
          
          {alreadyCompleted && (
            <div className="mt-8 p-4 bg-emerald-900/30 border border-emerald-800/50 rounded-xl flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-emerald-400">Challenge Completed!</h3>
                <p className="text-sm text-emerald-500/80 mt-1">You earned 50 XP today. Come back tomorrow for a new challenge!</p>
                <Link to="/leaderboard" className="inline-block mt-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition-colors">
                  View Leaderboard
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Editor and Terminal */}
        <div className="flex-1 flex flex-col min-h-0 bg-[#1e1e1e]">
          <div className="flex-1 relative">
            <Editor
              height="100%"
              defaultLanguage={challenge.language === 'python' ? 'python' : 'javascript'}
              theme="vs-dark"
              value={code}
              onChange={setCode}
              options={{ minimap: { enabled: false }, fontSize: 14, readOnly: alreadyCompleted }}
            />
            {!alreadyCompleted && (
              <button
                onClick={runCode}
                disabled={status === 'running'}
                className="absolute bottom-4 right-4 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-900/50 flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                <Play className="h-4 w-4" fill="currentColor" /> Run Code
              </button>
            )}
          </div>
          
          {/* Output Terminal */}
          <div className="h-48 bg-[#111] border-t border-slate-800 p-4 font-mono text-sm overflow-y-auto">
            <div className="text-slate-500 mb-2 font-bold uppercase text-[10px] tracking-wider">Console Output</div>
            <pre className={`whitespace-pre-wrap ${status === 'fail' ? 'text-red-400' : status === 'success' ? 'text-emerald-400' : 'text-slate-300'}`}>
              {output || 'Click "Run Code" to see the output here.'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
