import React, { useState, useEffect } from 'react';
import CodeEditor from './CodeEditor';
import { PythonRunner } from './runners/PythonRunner';
import { JavaScriptRunner } from './runners/JavaScriptRunner';
import { SqlRunner } from './runners/SqlRunner';
import WebPreview from './runners/WebPreview';
import { 
  Play, RotateCcw, Trash2, Copy, Download, Save, Code, Sparkles, Clock, 
  BookOpen, X, ChevronRight, CheckCircle2, Lightbulb, Key, Search, Flame, Trophy
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { supabase } from '../../lib/supabase';

const STARTER_CODE = {
  python: 'print("Hello, NextraPath!")',
  javascript: 'console.log("Hello, NextraPath!");',
  'html/css': '<h1 style="color: #10b981; text-align: center; font-family: sans-serif;">Hello, NextraPath!</h1>\n<p style="text-align: center; color: #64748b;">Start building your UI here.</p>',
  sql: '-- Create a table\nCREATE TABLE users (id INT, name TEXT);\n\n-- Insert data\nINSERT INTO users VALUES (1, "Alice"), (2, "Bob");\n\n-- Select data\nSELECT * FROM users;'
};

const DEFAULT_CHALLENGES = {
  python: { title: 'Variables & Printing', description: 'Write a program to print a greeting message and your name.' },
  javascript: { title: 'Console Output', description: 'Log a custom message and calculate a value using console.log.' },
  'html/css': { title: 'HTML Styling', description: 'Create a styled card with custom background color and white text.' },
  sql: { title: 'Select Queries', description: 'Select all columns from the users table.' }
};

// Built-in interactive courses for instant loading inside Sandbox
const BUILTIN_COURSES = [
  {
    id: 'python-basics',
    title: 'Python Essentials',
    language: 'python',
    icon: '🐍',
    description: 'Learn fundamental Python syntax, variables, conditionals, and loops.',
    lessons: [
      {
        id: 'py-1',
        title: 'Lesson 1: Printing & Output',
        instructions: 'Use the print() function to display "Welcome to NextraPath Python!" on the console.',
        starter_code: 'print("Welcome to NextraPath Python!")',
        hint: 'Use print("your text here")',
        solution: 'print("Welcome to NextraPath Python!")'
      },
      {
        id: 'py-2',
        title: 'Lesson 2: Variables & Data Types',
        instructions: 'Create two variables: name="Alex" and score=95. Print them together.',
        starter_code: 'name = "Alex"\nscore = 95\nprint("Student:", name, "| Score:", score)',
        hint: 'Assign values with = and print them using commas inside print()',
        solution: 'name = "Alex"\nscore = 95\nprint("Student:", name, "| Score:", score)'
      },
      {
        id: 'py-3',
        title: 'Lesson 3: If-Else Statements',
        instructions: 'Write a condition: if score >= 80, print "Passed with Distinction", else print "Keep trying!".',
        starter_code: 'score = 85\n\nif score >= 80:\n    print("Passed with Distinction")\nelse:\n    print("Keep trying!")',
        hint: 'Make sure to indent the code inside if and else blocks using 4 spaces.',
        solution: 'score = 85\nif score >= 80:\n    print("Passed with Distinction")\nelse:\n    print("Keep trying!")'
      },
      {
        id: 'py-4',
        title: 'Lesson 4: For Loops',
        instructions: 'Write a for loop using range(1, 6) to print numbers from 1 to 5.',
        starter_code: 'for i in range(1, 6):\n    print("Count:", i)',
        hint: 'range(1, 6) generates numbers 1, 2, 3, 4, 5.',
        solution: 'for i in range(1, 6):\n    print("Count:", i)'
      },
      {
        id: 'py-5',
        title: 'Lesson 5: Functions',
        instructions: 'Define a function add_numbers(a, b) that returns their sum. Call it with (10, 20).',
        starter_code: 'def add_numbers(a, b):\n    return a + b\n\nresult = add_numbers(10, 20)\nprint("Sum is:", result)',
        hint: 'Use def function_name(param1, param2): followed by return statement.',
        solution: 'def add_numbers(a, b):\n    return a + b\n\nprint("Sum is:", add_numbers(10, 20))'
      }
    ]
  },
  {
    id: 'js-essentials',
    title: 'JavaScript Web Fundamentals',
    language: 'javascript',
    icon: '⚡',
    description: 'Master JavaScript variables, arrays, arrow functions, and array methods.',
    lessons: [
      {
        id: 'js-1',
        title: 'Lesson 1: Console & Template Literals',
        instructions: 'Use console.log and backticks (``) to print a greeting with variable substitution.',
        starter_code: 'const name = "NextraPath Coder";\nconsole.log(`Hello, ${name}! Welcome to JavaScript.`);',
        hint: 'Template literals use backticks ` and ${variableName}`',
        solution: 'const name = "NextraPath Coder";\nconsole.log(`Hello, ${name}! Welcome to JavaScript.`);'
      },
      {
        id: 'js-2',
        title: 'Lesson 2: Arrays & Iteration',
        instructions: 'Create an array of 3 programming languages and iterate over them using forEach.',
        starter_code: 'const languages = ["JavaScript", "Python", "Rust"];\nlanguages.forEach((lang, index) => {\n  console.log(`${index + 1}. ${lang}`);\n});',
        hint: 'array.forEach((item, index) => { ... })',
        solution: 'const languages = ["JavaScript", "Python", "Rust"];\nlanguages.forEach((lang, index) => {\n  console.log(`${index + 1}. ${lang}`);\n});'
      },
      {
        id: 'js-3',
        title: 'Lesson 3: Array Filter & Map',
        instructions: 'Filter an array of scores to keep only scores >= 70, then map them to double values.',
        starter_code: 'const scores = [45, 80, 65, 90, 72];\nconst passingScores = scores.filter(score => score >= 70);\nconsole.log("Passing Scores:", passingScores);',
        hint: 'Use .filter(score => score >= 70)',
        solution: 'const scores = [45, 80, 65, 90, 72];\nconst passingScores = scores.filter(score => score >= 70);\nconsole.log("Passing Scores:", passingScores);'
      }
    ]
  },
  {
    id: 'html-css',
    title: 'HTML & CSS UI Design',
    language: 'html/css',
    icon: '🎨',
    description: 'Learn modern web component layouts, styling, flexbox, and typography.',
    lessons: [
      {
        id: 'html-1',
        title: 'Lesson 1: Profile Card Component',
        instructions: 'Create a dark-themed user profile card with a green badge and rounded corners.',
        starter_code: '<div style="background: #1e293b; color: white; padding: 24px; border-radius: 16px; font-family: system-ui; max-w-sm; margin: 20px auto; text-align: center; border: 1px solid #334155;">\n  <h2 style="margin: 0; font-size: 20px;">Alex Johnson</h2>\n  <p style="color: #10b981; font-weight: 600; font-size: 14px; margin-top: 4px;">Full Stack Engineer</p>\n  <p style="color: #94a3b8; font-size: 13px;">Building intelligent web applications with NextraPath.</p>\n</div>',
        hint: 'Use inline CSS style attributes for background, border-radius, and padding.',
        solution: '<div style="background: #1e293b; color: white; padding: 24px; border-radius: 16px; font-family: system-ui; max-w-sm; margin: 20px auto; text-align: center; border: 1px solid #334155;">\n  <h2 style="margin: 0; font-size: 20px;">Alex Johnson</h2>\n  <p style="color: #10b981; font-weight: 600; font-size: 14px; margin-top: 4px;">Full Stack Engineer</p>\n</div>'
      }
    ]
  },
  {
    id: 'sql-db',
    title: 'SQL Database Queries',
    language: 'sql',
    icon: '🛢️',
    description: 'Learn table creation, data insertion, filtering, and aggregate queries.',
    lessons: [
      {
        id: 'sql-1',
        title: 'Lesson 1: Table Creation & SELECT',
        instructions: 'Create a table students, insert records, and query students with grade >= 80.',
        starter_code: '-- Create Students Table\nCREATE TABLE students (id INT, name TEXT, grade INT);\n\n-- Insert Student Records\nINSERT INTO students VALUES (1, "Alex", 92), (2, "Sam", 74), (3, "Jordan", 88);\n\n-- Select high-performing students\nSELECT * FROM students WHERE grade >= 80;',
        hint: 'Use SELECT * FROM students WHERE grade >= 80;',
        solution: 'CREATE TABLE students (id INT, name TEXT, grade INT);\nINSERT INTO students VALUES (1, "Alex", 92), (2, "Sam", 74), (3, "Jordan", 88);\nSELECT * FROM students WHERE grade >= 80;'
      }
    ]
  }
];

export default function CodePracticeInterface({ initialLanguage = 'python', initialCode = null, onClose = null, externalLearnTrigger = 0 }) {
  const { user } = useAuth();
  const { openChatWithContext } = useChat();
  const [language, setLanguage] = useState(initialLanguage);
  const [code, setCode] = useState(initialCode || STARTER_CODE[initialLanguage]);
  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [executionTime, setExecutionTime] = useState(null);

  // Learn to Code Drawer State
  const [showLearnDrawer, setShowLearnDrawer] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(BUILTIN_COURSES[0]);
  const [activeLesson, setActiveLesson] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  // Listen to externalLearnTrigger from page header button
  useEffect(() => {
    if (externalLearnTrigger > 0) {
      setShowLearnDrawer(true);
    }
  }, [externalLearnTrigger]);

  // Db courses if available
  const [dbCourses, setDbCourses] = useState([]);

  useEffect(() => {
    async function fetchDbCourses() {
      try {
        const { data } = await supabase.from('learning_courses').select('*').order('order_index');
        if (data && data.length > 0) {
          setDbCourses(data);
        }
      } catch (e) {
        // use builtin fallback
      }
    }
    fetchDbCourses();
  }, []);

  useEffect(() => {
    if (!initialCode && !activeLesson) {
      setCode(STARTER_CODE[language]);
    }
    setOutput(null);
    setExecutionTime(null);
  }, [language, initialCode]);

  const runCode = async () => {
    setIsRunning(true);
    setOutput(null);
    setExecutionTime(null);
    const startTime = performance.now();

    try {
      if (language === 'python') {
        const res = await PythonRunner.run(code);
        setOutput({ type: 'text', content: res });
      } else if (language === 'javascript') {
        const res = await JavaScriptRunner.run(code);
        setOutput({ type: 'text', content: res });
      } else if (language === 'sql') {
        const res = await SqlRunner.run(code);
        setOutput(res);
      } else if (language === 'html/css') {
        // Handled by WebPreview
      }
    } catch (err) {
      setOutput({ type: 'text', content: err.message });
    }

    const endTime = performance.now();
    setExecutionTime(((endTime - startTime) / 1000).toFixed(2));
    setIsRunning(false);
  };

  const resetEnvironment = async () => {
    setOutput({ type: 'text', content: 'Resetting environment...' });
    if (language === 'python') {
      const msg = await PythonRunner.reset();
      setOutput({ type: 'text', content: msg });
    } else if (language === 'sql') {
      const msg = await SqlRunner.reset();
      setOutput(msg);
    } else {
      setOutput(null);
    }
    if (activeLesson) {
      setCode(activeLesson.starter_code);
    } else {
      setCode(STARTER_CODE[language]);
    }
    setExecutionTime(null);
  };

  const clearOutput = () => {
    setOutput(null);
    setExecutionTime(null);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    alert('Code copied to clipboard!');
  };

  const downloadCode = () => {
    const extensions = { python: 'py', javascript: 'js', 'html/css': 'html', sql: 'sql' };
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `practice.${extensions[language]}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveCode = async () => {
    if (!user) {
      alert('Please log in to save your programs.');
      return;
    }
    try {
      const { error } = await supabase.from('saved_code').insert([{
        user_id: user.id,
        language: language,
        title: activeLesson ? activeLesson.title : `Saved ${language} Program`,
        code: code
      }]);
      if (error) throw error;
      alert('Program saved successfully!');
    } catch (err) {
      alert('Failed to save code.');
      console.error(err);
    }
  };

  const loadLesson = (course, lesson) => {
    setSelectedCourse(course);
    setActiveLesson(lesson);
    setLanguage(course.language);
    setCode(lesson.starter_code);
    setOutput(null);
    setShowHint(false);
    setShowSolution(false);
    setShowLearnDrawer(false);
  };

  const exitLessonMode = () => {
    setActiveLesson(null);
    setCode(STARTER_CODE[language]);
    setShowHint(false);
    setShowSolution(false);
  };

  const askAIHelper = (mode) => {
    let modeText = "Explain this code and help me improve it.";
    if (mode === 'error') {
      modeText = "I ran my code and encountered an issue. Can you look at my code and tell me what is wrong?";
    } else if (mode === 'optimize') {
      modeText = "Can you help me optimize this code to run faster or be more readable?";
    }
    openChatWithContext({
      type: 'code',
      data: {
        code,
        output: typeof output?.content === 'object' ? JSON.stringify(output.content) : output?.content,
        challengeTitle: activeLesson ? activeLesson.title : `Sandbox (${language})`
      }
    });
  };

  const filteredCourses = BUILTIN_COURSES.map(c => {
    if (!searchQuery.trim()) return c;
    const q = searchQuery.toLowerCase();
    const matchingLessons = c.lessons.filter(l => l.title.toLowerCase().includes(q) || l.instructions.toLowerCase().includes(q));
    if (c.title.toLowerCase().includes(q) || matchingLessons.length > 0) {
      return { ...c, lessons: matchingLessons.length > 0 ? matchingLessons : c.lessons };
    }
    return null;
  }).filter(Boolean);

  return (
    <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col h-[750px] text-slate-300 font-sans relative">
      
      {/* Top Toolbar */}
      <div className="bg-slate-950 p-4 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-lg">
            <Code className="h-5 w-5" /> Code Sandbox
          </div>

          {/* Learn to Code Button */}
          <button
            onClick={() => setShowLearnDrawer(true)}
            className="flex items-center gap-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded-lg text-sm font-bold transition-all"
          >
            <BookOpen className="w-4 h-4 text-blue-400" /> Learn to Code
            <span className="bg-blue-600 text-white text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full animate-pulse">New</span>
          </button>

          <select 
            className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="html/css">HTML/CSS</option>
            <option value="sql">SQL</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {onClose && (
            <button onClick={onClose} className="px-3 py-1.5 mr-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors text-sm font-bold border border-slate-700">
              Close Editor
            </button>
          )}
          <button onClick={resetEnvironment} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors" title="Reset Environment">
            <RotateCcw className="h-4 w-4" />
          </button>
          <button onClick={copyCode} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors" title="Copy Code">
            <Copy className="h-4 w-4" />
          </button>
          <button onClick={downloadCode} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors" title="Download">
            <Download className="h-4 w-4" />
          </button>
          <button onClick={saveCode} className={`p-2 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 px-3 ${!user ? 'text-slate-500 hover:text-slate-400' : 'text-emerald-400 hover:text-emerald-300'}`} title="Save Program">
            <Save className="h-4 w-4" /> <span className="text-sm font-medium hidden sm:block">Save</span>
          </button>
          <button 
            onClick={runCode} 
            disabled={isRunning}
            className="ml-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {isRunning ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <Play className="h-4 w-4" />}
            {isRunning ? 'Running...' : `Run ${language === 'sql' ? 'Query' : 'Code'}`}
          </button>
        </div>
      </div>

      {/* Main Workspace Grid */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side: Editor & Active Challenge / Lesson */}
        <div className="w-full lg:w-1/2 flex flex-col border-r border-slate-800 min-h-[350px]">
          {/* Challenge / Lesson Info Header */}
          <div className="bg-slate-800/50 p-4 border-b border-slate-800 relative">
            {activeLesson ? (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                      Interactive Lesson
                    </span>
                    <span className="text-xs text-blue-400 font-semibold">{selectedCourse.title}</span>
                  </div>
                  <button
                    onClick={exitLessonMode}
                    className="text-xs text-slate-400 hover:text-white transition-colors bg-slate-800 px-2 py-1 rounded border border-slate-700"
                  >
                    Switch to Free Sandbox
                  </button>
                </div>
                <h4 className="text-base font-bold text-white mb-1">{activeLesson.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed mb-3">{activeLesson.instructions}</p>

                {/* Hint & Solution Toggles */}
                <div className="flex items-center gap-3 pt-2 border-t border-slate-700/50">
                  {activeLesson.hint && (
                    <button
                      onClick={() => setShowHint(!showHint)}
                      className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20"
                    >
                      <Lightbulb className="h-3.5 w-3.5" /> {showHint ? 'Hide Hint' : 'Show Hint'}
                    </button>
                  )}
                  {activeLesson.solution && (
                    <button
                      onClick={() => setShowSolution(!showSolution)}
                      className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-cyan-500/10 px-2.5 py-1 rounded-md border border-cyan-500/20"
                    >
                      <Key className="h-3.5 w-3.5" /> {showSolution ? 'Hide Solution' : 'Show Solution'}
                    </button>
                  )}
                </div>

                {showHint && (
                  <div className="mt-2.5 p-3 bg-amber-950/40 border border-amber-500/30 rounded-lg text-xs text-amber-200">
                    💡 <strong>Hint:</strong> {activeLesson.hint}
                  </div>
                )}

                {showSolution && (
                  <div className="mt-2.5 p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-lg text-xs font-mono text-cyan-200">
                    🔑 <strong>Solution:</strong>
                    <pre className="mt-1 whitespace-pre-wrap">{activeLesson.solution}</pre>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-1">
                  Challenge: {DEFAULT_CHALLENGES[language]?.title || 'Practice Code'}
                </div>
                <div className="text-sm text-slate-300">
                  {DEFAULT_CHALLENGES[language]?.description || 'Write, test, and debug code.'}
                </div>
              </div>
            )}
          </div>

          {/* Code Editor */}
          <div className="flex-1 p-4 min-h-[300px]">
            <CodeEditor language={language} value={code} onChange={setCode} />
          </div>
        </div>

        {/* Right Side: Output & AI Assistant */}
        <div className="w-full lg:w-1/2 flex flex-col bg-black/40 min-h-[250px]">
          <div className="bg-slate-900 p-3 border-b border-slate-800 flex items-center justify-between">
            <div className="text-sm font-medium text-slate-400 uppercase tracking-wider">Output</div>
            <div className="flex items-center gap-4">
              {executionTime && (
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {executionTime}s
                </div>
              )}
              <button onClick={clearOutput} className="text-slate-500 hover:text-slate-300 transition-colors" title="Clear Output">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 p-4 overflow-auto font-mono text-sm">
            {language === 'html/css' ? (
              <WebPreview html={code} css="" />
            ) : output ? (
              output.type === 'table' ? (
                <div className="overflow-x-auto">
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
              ) : (
                <pre className="whitespace-pre-wrap text-emerald-400">{output.content}</pre>
              )
            ) : (
              <div className="text-slate-600 flex items-center justify-center h-full italic">Click Run to see output...</div>
            )}
          </div>

          {/* AI Helper Bar */}
          <div className="p-3 border-t border-slate-800 bg-slate-900 flex gap-2 overflow-x-auto">
            <button 
              onClick={() => askAIHelper('explain')}
              className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="h-3 w-3" /> Explain Code
            </button>
            <button 
              onClick={() => askAIHelper('error')}
              className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="h-3 w-3" /> Find Error
            </button>
            <button 
              onClick={() => askAIHelper('optimize')}
              className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="h-3 w-3" /> Optimize Code
            </button>
          </div>
        </div>
      </div>

      {/* ================= LEARN TO CODE DRAWER OVERLAY ================= */}
      {showLearnDrawer && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex flex-col p-4 sm:p-6 overflow-hidden animate-fade-in">
          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  Learn to Code <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full uppercase">Interactive</span>
                </h3>
                <p className="text-xs text-slate-400">Select a course and lesson to load directly into your Sandbox editor.</p>
              </div>
            </div>
            <button 
              onClick={() => setShowLearnDrawer(false)}
              className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="my-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search interactive lessons, Python, JS, SQL..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
          </div>

          {/* Course List & Lessons Grid */}
          <div className="flex-1 overflow-y-auto space-y-6 pr-2">
            {filteredCourses.map(course => (
              <div key={course.id} className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 sm:p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{course.icon}</span>
                  <div>
                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                      {course.title}
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                        {course.language}
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400">{course.description}</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-2.5 mt-3">
                  {course.lessons.map(lesson => (
                    <button
                      key={lesson.id}
                      onClick={() => loadLesson(course, lesson)}
                      className={`text-left p-3 rounded-xl border transition-all flex items-center justify-between group ${
                        activeLesson?.id === lesson.id 
                          ? 'bg-blue-600/20 border-blue-500 text-blue-200'
                          : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/80 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-bold truncate group-hover:text-blue-400 transition-colors">
                          {lesson.title}
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {lesson.instructions}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
