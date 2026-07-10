import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useChat } from '../contexts/ChatContext';
import { ArrowLeft, ArrowRight, Play, Check, X, RefreshCcw, Sparkles, BookOpen, ChevronRight, Bookmark } from 'lucide-react';
import CodeEditor from '../components/coding/CodeEditor';
import { PythonRunner } from '../components/coding/runners/PythonRunner';
import { JavaScriptRunner } from '../components/coding/runners/JavaScriptRunner';
import { SqlRunner } from '../components/coding/runners/SqlRunner';
import { useAuth } from '../contexts/AuthContext';

export default function InteractiveWorkspace() {
  const { courseSlug, lessonId } = useParams();
  const { user } = useAuth();
  const { openChatWithContext } = useChat();
  const navigate = useNavigate();
  
  const [lesson, setLesson] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
  
  const [code, setCode] = useState('');
  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [passed, setPassed] = useState(false);
  
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  const [nextLessonId, setNextLessonId] = useState(null);
  const [activeTab, setActiveTab] = useState('lesson');

  useEffect(() => {
    fetchLesson();
  }, [lessonId]);

  const fetchLesson = async () => {
    try {
      setLoading(true);
      // Fetch Lesson details
      const { data: lessonData, error: lErr } = await supabase
        .from('learning_lessons')
        .select(`
          *,
          learning_chapters!inner(
            learning_courses!inner(slug, language)
          ),
          learning_lesson_careers(
            careers(title)
          )
        `)
        .eq('id', lessonId)
        .single();
      
      if (lErr) throw lErr;
      setLesson(lessonData);

      // Fetch Exercises
      const { data: exData, error: eErr } = await supabase
        .from('learning_exercises')
        .select('*')
        .eq('lesson_id', lessonId);
      
      if (eErr) throw eErr;
      setExercises(exData || []);

      // Set starter code
      if (exData && exData.length > 0) {
        setCode(exData[0].starter_code || '# Write your code here\n');
      }

      // Fetch Editor State if user logged in
      if (user) {
        const { data: stateData } = await supabase
          .from('learning_editor_state')
          .select('current_code')
          .eq('user_id', user.id)
          .eq('lesson_id', lessonId)
          .single();
        
        if (stateData && stateData.current_code) {
          setCode(stateData.current_code);
        }
      }
      if (lessonData.learning_chapters?.course_id) {
        // Also fetch the next lesson in the course
        const { data: allLessons } = await supabase
          .from('learning_lessons')
          .select('id, order_index, chapter_id, learning_chapters!inner(course_id, order_index)')
          .eq('learning_chapters.course_id', lessonData.learning_chapters.course_id)
          .order('order_index', { referencedTable: 'learning_chapters', ascending: true })
          .order('order_index', { ascending: true });
        
        if (allLessons && allLessons.length > 0) {
          const currentIndex = allLessons.findIndex(l => l.id === lessonData.id);
          if (currentIndex !== -1 && currentIndex < allLessons.length - 1) {
            setNextLessonId(allLessons[currentIndex + 1].id);
          } else {
            setNextLessonId(null);
          }
        }
      }

    } catch (err) {
      console.error('Error fetching lesson data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput(null);
    setPassed(false);
    
    try {
      const language = lesson?.learning_chapters?.learning_courses?.language || 'python';
      let res;
      
      if (language === 'html' || language === 'css') {
        // HTML/CSS doesn't run through a typical runner, we just set the output type to html
        res = code;
        setOutput({ type: 'html', content: res });
      } else {
        if (language === 'javascript' || language === 'js') {
          res = await JavaScriptRunner.run(code);
        } else if (language === 'sql') {
          res = await SqlRunner.run(code);
        } else {
          res = await PythonRunner.run(code);
        }
        
        if (typeof res === 'object' && res !== null && res.type) {
          setOutput(res);
        } else {
          setOutput({ type: 'text', content: res });
        }
      }

      // Verify if there is an active exercise
      const currentExercise = exercises[currentExerciseIdx];
      if (currentExercise && currentExercise.expected_output) {
        const expected = currentExercise.expected_output.trim();
        
        if (language === 'html' || language === 'css') {
           // For HTML, a simple includes check on the code itself (since execution output is visual)
           if (code.toLowerCase().includes(expected.toLowerCase())) {
             setPassed(true);
             handleMarkComplete();
           }
        } else {
           const actualText = typeof res === 'object' && res !== null && res.content ? JSON.stringify(res.content) : String(res);
           const actual = actualText.trim();
           if (actual === expected || actual.includes(expected)) {
             setPassed(true);
             handleMarkComplete();
           }
        }
      }
    } catch (err) {
      setOutput({ type: 'error', content: err.message });
    } finally {
      setIsRunning(false);
    }
    
    // Auto-save state
    if (user) {
      await supabase.from('learning_editor_state').upsert({
        user_id: user.id,
        lesson_id: lessonId,
        current_code: code,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,lesson_id' });
    }
  };

  const handleMarkComplete = async () => {
    if (!user) return;
    try {
      // 1. Mark lesson as complete
      await supabase.from('learning_progress').upsert({
        user_id: user.id,
        entity_id: lessonId,
        entity_type: 'lesson',
        xp_earned: 20
      }, { onConflict: 'user_id,entity_id,entity_type' });

      // 2. Add Gamification XP
      const { data: currentStats } = await supabase
        .from('user_gamification')
        .select('total_xp')
        .eq('user_id', user.id)
        .single();
        
      await supabase.from('user_gamification').upsert({
        user_id: user.id,
        total_xp: (currentStats?.total_xp || 0) + 20,
        last_active_date: new Date().toISOString().split('T')[0]
      });

    } catch (err) {
      console.error('Gamification Error:', err);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>;
  if (!lesson) {
    return <div className="flex h-screen items-center justify-center bg-slate-900 text-slate-400">Loading lesson workspace...</div>;
  }

  const currentExercise = exercises[currentExerciseIdx];
  const language = lesson?.learning_chapters?.learning_courses?.language || 'python';

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-200 font-sans">
      {/* Header */}
      <header className="h-14 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <Link to={`/learn/${courseSlug}`} className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="text-slate-500">{lesson.learning_chapters?.learning_courses?.language || 'Python'}</span>
            <ChevronRight className="w-4 h-4 text-slate-600" />
            <span className="text-white">{lesson.title}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors">
            <Bookmark className="w-3.5 h-3.5" /> Bookmark
          </button>
          <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors">
            <Sparkles className="w-3.5 h-3.5" /> AI Explain Code
          </button>
        </div>

      {/* Mobile Tab Switcher */}
      <div className="md:hidden flex border-b border-slate-800 bg-slate-950 shrink-0">
        <button
          onClick={() => setActiveTab('lesson')}
          className={`flex-1 py-3 text-center text-xs font-bold border-b-2 transition-all ${activeTab === 'lesson' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-400'}`}
        >
          📄 Lesson Content
        </button>
        <button
          onClick={() => setActiveTab('editor')}
          className={`flex-1 py-3 text-center text-xs font-bold border-b-2 transition-all ${activeTab === 'editor' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-400'}`}
        >
          💻 Code Editor & Console
        </button>
      </div>

      {/* Main Workspace */}
      <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Pane: Content */}
        <div className={`w-full md:w-1/3 md:min-w-[350px] bg-slate-900 border-r border-slate-800 overflow-y-auto custom-scrollbar p-6 sm:p-8 ${activeTab === 'lesson' ? 'block' : 'hidden md:block'}`}>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-6">{lesson.title}</h1>
          
          <div className="prose prose-invert prose-blue max-w-none">
            <p className="text-slate-300 leading-relaxed whitespace-pre-line">{lesson.explanation}</p>
            
            {lesson.analogy && (
              <div className="my-6 p-4 rounded-xl bg-blue-900/20 border border-blue-800/30">
                <h4 className="flex items-center gap-2 text-blue-400 font-bold text-sm uppercase tracking-wider mb-2">
                  <BookOpen className="w-4 h-4" /> Concept Analogy
                </h4>
                <p className="text-blue-100/80 m-0 leading-relaxed">{lesson.analogy}</p>
              </div>
            )}

            {lesson.syntax && (
              <div className="my-6">
                <h4 className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-2">Syntax</h4>
                <div className="bg-slate-950 p-4 rounded-xl font-mono text-sm border border-slate-800">
                  {lesson.syntax}
                </div>
              </div>
            )}

            {lesson.learning_lesson_careers?.length > 0 && (
              <div className="my-8 pt-6 border-t border-slate-800">
                <h4 className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-3">Where is this used?</h4>
                <div className="flex flex-wrap gap-2">
                  {lesson.learning_lesson_careers.map((c, i) => (
                    <span key={i} className="px-3 py-1 bg-emerald-900/20 text-emerald-400 border border-emerald-800/30 rounded-full text-xs font-medium">
                      {c.careers?.title}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Editor & Console */}
        <div className={`w-full md:w-2/3 flex flex-col bg-[#1e1e1e] ${activeTab === 'editor' ? 'flex' : 'hidden md:flex'}`}>
          
          {/* Instructions Bar */}
          <div className="h-auto min-h-[60px] max-h-[40vh] overflow-y-auto custom-scrollbar bg-slate-950 border-b border-slate-800 p-4 shrink-0 flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
            {currentExercise ? (
              <div className="flex-grow">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1 block">Exercise</span>
                <p className="text-sm text-slate-300 m-0 mb-2">{currentExercise.statement}</p>
                <div className="flex flex-wrap gap-2">
                  {currentExercise.hint && (
                    <button 
                      onClick={() => setShowHint(!showHint)}
                      className="text-[11px] font-bold px-2.5 py-1 rounded-md border border-amber-500/30 text-amber-500 hover:bg-amber-500/10 transition-colors"
                    >
                      {showHint ? 'Hide Hint' : 'Show Hint'}
                    </button>
                  )}
                  {currentExercise.solution && (
                    <button 
                      onClick={() => setShowSolution(!showSolution)}
                      className="text-[11px] font-bold px-2.5 py-1 rounded-md border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                    >
                      {showSolution ? 'Hide Solution' : 'Show Solution'}
                    </button>
                  )}
                </div>
                {showHint && currentExercise.hint && (
                  <div className="mt-3 p-3 bg-amber-900/10 border border-amber-900/30 rounded-lg text-amber-200 text-sm">
                    <span className="font-bold uppercase tracking-wider text-[10px] block mb-1">Hint</span>
                    {currentExercise.hint}
                  </div>
                )}
                {showSolution && currentExercise.solution && (
                  <div className="mt-3 p-3 bg-emerald-900/10 border border-emerald-900/30 rounded-lg text-emerald-200 text-sm font-mono whitespace-pre-wrap">
                    <span className="font-bold uppercase tracking-wider text-[10px] block mb-1 font-sans">Solution</span>
                    {currentExercise.solution}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-slate-400 italic">Sandbox mode: Write and run any Python code.</div>
            )}
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => openChatWithContext({ type: 'code', data: { code, output: typeof output?.content === 'object' ? JSON.stringify(output.content) : output?.content, challengeTitle: lesson?.title } })}
                className="flex shrink-0 items-center gap-2 bg-indigo-600/90 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-lg shadow-indigo-900/20"
              >
                <Sparkles className="w-4 h-4" /> Ask AI
              </button>
              <button 
                onClick={handleRunCode}
                disabled={isRunning}
                className="flex shrink-0 items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg font-bold text-sm transition-all shadow-lg shadow-blue-900/20"
              >
                {isRunning ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                {isRunning ? 'Running...' : `Run ${language === 'sql' ? 'Query' : 'Code'}`}
              </button>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="flex-grow relative min-h-0">
            <CodeEditor 
              language={lesson.learning_chapters?.learning_courses?.language || 'python'} 
              value={code} 
              onChange={setCode} 
            />
          </div>

          {/* Console Output */}
          <div className="h-1/3 min-h-[200px] bg-slate-950 border-t border-slate-800 flex flex-col shrink-0">
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/50">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Console</span>
              {passed && (
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-900/20 px-3 py-1 rounded-full animate-pulse">
                    <Check className="w-3.5 h-3.5" /> Passed! +20 XP
                  </span>
                  {nextLessonId ? (
                    <button 
                      onClick={() => navigate(`/learn/${lesson?.learning_chapters?.learning_courses?.slug}/${nextLessonId}`)}
                      className="flex items-center gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg transition-colors shadow-lg shadow-emerald-900/20"
                    >
                      Next Lesson <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button 
                      onClick={() => navigate(`/learn/${lesson?.learning_chapters?.learning_courses?.slug}`)}
                      className="flex items-center gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-colors shadow-lg shadow-blue-900/20"
                    >
                      Back to Syllabus <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="flex-grow p-4 overflow-y-auto font-mono text-sm custom-scrollbar relative">
              {!output && <span className="text-slate-600 italic">Output will appear here...</span>}
              {output && output.type === 'error' && <span className="text-red-400 whitespace-pre-wrap">{output.content}</span>}
              {output && output.type === 'text' && (
                <span className={`whitespace-pre-wrap ${output.content.includes('Error') ? 'text-red-400' : 'text-slate-300'}`}>
                  {output.content}
                </span>
              )}
              {output && output.type === 'html' && (
                <iframe 
                  title="HTML Preview"
                  sandbox="allow-scripts"
                  srcDoc={output.content}
                  className="w-full h-full bg-white border-0 rounded-md"
                />
              )}
              {output && output.type === 'table' && (
                <div className="overflow-x-auto w-full">
                  {output.content.map((table, i) => (
                    <table key={i} className="min-w-full text-left border-collapse border border-slate-700 mb-4">
                      <thead>
                        <tr>
                          {table.columns.map((col, j) => (
                            <th key={j} className="border border-slate-700 px-4 py-2 bg-slate-800 text-slate-200">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {table.values.map((row, j) => (
                          <tr key={j} className="hover:bg-slate-800/50">
                            {row.map((val, k) => (
                              <td key={k} className="border border-slate-700 px-4 py-2 text-slate-400">{val}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
