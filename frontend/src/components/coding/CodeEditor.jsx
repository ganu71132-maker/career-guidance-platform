import React from 'react';
import Editor from '@monaco-editor/react';

export default function CodeEditor({ language, value, onChange }) {
  
  const handleEditorChange = (value) => {
    onChange(value);
  };

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-slate-700/50 bg-[#1e1e1e]">
      <Editor
        height="100%"
        language={language === 'html/css' ? 'html' : language}
        theme="vs-dark"
        value={value}
        onChange={handleEditorChange}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          padding: { top: 16, bottom: 16 },
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          formatOnPaste: true,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace"
        }}
        loading={
          <div className="flex h-full items-center justify-center text-slate-400">
            <div className="animate-pulse">Loading Editor...</div>
          </div>
        }
      />
    </div>
  );
}
