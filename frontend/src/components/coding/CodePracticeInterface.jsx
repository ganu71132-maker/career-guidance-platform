import React, { useState, useEffect } from 'react';
import CodeEditor from './CodeEditor';
import { PythonRunner } from './runners/PythonRunner';
import { JavaScriptRunner } from './runners/JavaScriptRunner';
import { SqlRunner } from './runners/SqlRunner';
import WebPreview from './runners/WebPreview';
import { Play, RotateCcw, Trash2, Copy, Download, Save, Code, Sparkles, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const STARTER_CODE = {
  python: 'print("Hello, NextraPath!")',
  javascript: 'console.log("Hello, NextraPath!");',
  'html/css': '<h1 style="color: #10b981; text-align: center; font-family: sans-serif;">Hello, NextraPath!</h1>\n<p style="text-align: center; color: #64748b;">Start building your UI here.</p>',
  sql: '-- Create a table\nCREATE TABLE users (id INT, name TEXT);\n\n-- Insert data\nINSERT INTO users VALUES (1, "Alice"), (2, "Bob");\n\n-- Select data\nSELECT * FROM users;'
};

const CHALLENGES = {
  python: { title: 'Variables', description: 'Write a program to print your name.' },
  javascript: { title: 'Console Log', description: 'Log a greeting message to the console.' },
  'html/css': { title: 'Styling', description: 'Create a button with a blue background and white text.' },
  sql: { title: 'Select Data', description: 'Select all columns from the users table where id is 1.' }
};

export default function CodePracticeInterface({ initialLanguage = 'python', initialCode = null, onClose = null }) {
  const { user } = useAuth();
  const [language, setLanguage] = useState(initialLanguage);
  const [code, setCode] = useState(initialCode || STARTER_CODE[initialLanguage]);
  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [executionTime, setExecutionTime] = useState(null);

  useEffect(() => {
    // Only reset code if initialCode wasn't explicitly passed for this language
    if (!initialCode) {
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
    setCode(STARTER_CODE[language]);
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
        title: `Saved ${language} Program`,
        code: code
      }]);
      if (error) throw error;
      alert('Program saved successfully!');
    } catch (err) {
      alert('Failed to save code. Note: saved_code table may not exist yet.');
      console.error(err);
    }
  };

  return (
    <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col h-[700px] text-slate-300 font-sans">
      
      {/* Top Toolbar */}
      <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-lg">
            <Code className="h-5 w-5" /> Coding Practice
          </div>
          <select 
            className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="html/css">HTML/CSS</option>
            <option value="sql">SQL</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
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

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side: Editor & Challenge */}
        <div className="w-full lg:w-1/2 flex flex-col border-r border-slate-800">
          <div className="bg-slate-800/50 p-4 border-b border-slate-800">
            <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-1">Challenge: {CHALLENGES[language].title}</div>
            <div className="text-sm text-slate-300">{CHALLENGES[language].description}</div>
          </div>
          <div className="flex-1 p-4">
            <CodeEditor language={language} value={code} onChange={setCode} />
          </div>
        </div>

        {/* Right Side: Output */}
        <div className="w-full lg:w-1/2 flex flex-col bg-black/40">
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

          {/* AI Features Placeholder */}
          <div className="p-3 border-t border-slate-800 bg-slate-900 flex gap-2 overflow-x-auto">
            <button className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 text-xs font-medium flex items-center gap-1.5 transition-colors">
              <Sparkles className="h-3 w-3" /> Explain Code
            </button>
            <button className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 text-xs font-medium flex items-center gap-1.5 transition-colors">
              <Sparkles className="h-3 w-3" /> Find Error
            </button>
            <button className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 text-xs font-medium flex items-center gap-1.5 transition-colors">
              <Sparkles className="h-3 w-3" /> Optimize Code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
