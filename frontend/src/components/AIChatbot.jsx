import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useChat } from '../contexts/ChatContext';
import { X, Send, Bot, User, Sparkles, Loader2, Copy, Check, Minimize2, Maximize2, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

/* ─────────────────────────────────────────────
   Timestamp helper
───────────────────────────────────────────── */
function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/* ─────────────────────────────────────────────
   Copy-button for code blocks
───────────────────────────────────────────── */
function CodeCopyButton({ code }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-slate-700/80 hover:bg-slate-600 text-slate-300 hover:text-white transition-all border border-slate-600/50"
      title="Copy code"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

/* ─────────────────────────────────────────────
   Markdown renderer with full GFM support
───────────────────────────────────────────── */
function MarkdownMessage({ content }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className="markdown-body"
      components={{
        /* Code blocks */
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          const codeString = String(children).replace(/\n$/, '');
          if (!inline && match) {
            return (
              <div className="relative my-3 rounded-xl overflow-hidden border border-slate-600/40 shadow-lg">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-600/40">
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">{match[1]}</span>
                  <CodeCopyButton code={codeString} />
                </div>
                <SyntaxHighlighter
                  style={oneDark}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{
                    margin: 0,
                    padding: '1rem',
                    background: '#1e293b',
                    fontSize: '0.8rem',
                    lineHeight: '1.6',
                    borderRadius: 0,
                  }}
                  {...props}
                >
                  {codeString}
                </SyntaxHighlighter>
              </div>
            );
          }
          /* Inline code */
          return (
            <code
              className="px-1.5 py-0.5 rounded-md text-xs font-mono bg-slate-700/80 text-emerald-300 border border-slate-600/40"
              {...props}
            >
              {children}
            </code>
          );
        },
        /* Headings */
        h1: ({ children }) => <h1 className="text-lg font-bold text-white mt-4 mb-2 pb-1 border-b border-slate-600/40">{children}</h1>,
        h2: ({ children }) => <h2 className="text-base font-bold text-white mt-3 mb-2">{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-semibold text-slate-200 mt-3 mb-1">{children}</h3>,
        /* Paragraphs */
        p: ({ children }) => <p className="text-sm text-slate-200 leading-relaxed mb-2 last:mb-0">{children}</p>,
        /* Lists */
        ul: ({ children }) => <ul className="list-disc list-outside pl-4 space-y-1 mb-2 text-sm text-slate-200">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-outside pl-4 space-y-1 mb-2 text-sm text-slate-200">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        /* Blockquote */
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-indigo-500 pl-3 my-2 italic text-slate-300 bg-indigo-500/5 py-1 rounded-r-md">
            {children}
          </blockquote>
        ),
        /* Table */
        table: ({ children }) => (
          <div className="overflow-x-auto my-3 rounded-xl border border-slate-600/40">
            <table className="min-w-full text-sm text-slate-200 border-collapse">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-slate-700/60">{children}</thead>,
        tbody: ({ children }) => <tbody className="divide-y divide-slate-700/40">{children}</tbody>,
        tr: ({ children }) => <tr className="hover:bg-slate-700/20 transition-colors">{children}</tr>,
        th: ({ children }) => <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">{children}</th>,
        td: ({ children }) => <td className="px-3 py-2 text-slate-300">{children}</td>,
        /* HR */
        hr: () => <hr className="my-3 border-slate-600/40" />,
        /* Bold & Italic */
        strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
        em: ({ children }) => <em className="italic text-slate-300">{children}</em>,
        /* Links */
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors"
          >
            {children}
          </a>
        ),
        /* Images */
        img: ({ src, alt }) => (
          <img
            src={src}
            alt={alt}
            className="max-w-full rounded-xl my-2 border border-slate-600/40 shadow-lg"
          />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

/* ─────────────────────────────────────────────
   Typing dots animation
───────────────────────────────────────────── */
function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-purple-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.8s' }}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main AIChatbot component
───────────────────────────────────────────── */
export default function AIChatbot() {
  const { isOpen, setIsOpen, messages, addMessage, contextData, clearMessages } = useChat();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, loading, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  /* ── Floating launcher when closed ── */
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all duration-200 z-50 group border border-indigo-400/30"
        title="Open AI Tutor"
        aria-label="Open AI Tutor Chat"
      >
        <Sparkles className="w-6 h-6" />
        <span className="absolute right-16 bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700/50 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl pointer-events-none">
          Chat with AI Tutor
        </span>
      </button>
    );
  }

  /* ── Send logic (backend untouched) ── */
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput('');
    addMessage({ role: 'user', content: userMessage, timestamp: new Date().toISOString() });
    setLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!apiKey) {
        addMessage({
          role: 'model',
          content: '⚠️ **API key not found!** Please add `VITE_GROQ_API_KEY` to your environment variables.',
          timestamp: new Date().toISOString(),
        });
        setLoading(false);
        return;
      }

      let systemInstruction =
        'You are a friendly, helpful AI assistant for the NextraPath Career Platform. Use Markdown formatting in your responses: use **bold** for important terms, bullet points for lists, and code blocks for code. Be concise, encouraging, and well-structured.';

      if (contextData?.type === 'code') {
        systemInstruction = `You are an expert coding tutor. The user is working on a challenge: "${contextData.data?.challengeTitle || 'Unknown'}".
Here is their current code:\n\`\`\`\n${contextData.data?.code || '(no code yet)'}\n\`\`\`
Here is the output/error they got:\n${contextData.data?.output || '(no output yet)'}
Help them understand what is wrong and guide them step-by-step. Use Markdown. Do NOT give the final answer directly.`;
      } else if (contextData?.type === 'resume') {
        systemInstruction = `You are an expert tech recruiter and resume reviewer. The user is building their resume.
Here is their resume data:\n${JSON.stringify(contextData.data, null, 2)}
Provide **3 specific, actionable tips** in Markdown bullet format to improve it.`;
      }

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.7,
          max_tokens: 1200,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData?.error?.message || 'API request failed');
      }

      const data = await response.json();
      const text =
        data?.choices?.[0]?.message?.content ||
        "I couldn't generate a response. Please try again.";
      addMessage({ role: 'model', content: text, timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('AI Error:', error);
      addMessage({
        role: 'model',
        content: `❌ **Error:** ${error.message || 'Something went wrong. Please try again.'}`,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  /* ── Handle Enter key (Shift+Enter = newline) ── */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const windowClasses = isExpanded
    ? 'fixed inset-4 sm:inset-6 lg:inset-12'
    : 'fixed bottom-6 right-6 w-[26rem] max-w-[calc(100vw-2rem)] h-[580px] max-h-[80vh]';

  return (
    <div
      className={`${windowClasses} bg-[#0f1117] border border-slate-700/60 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden transition-all duration-300`}
      role="dialog"
      aria-label="AI Tutor Chat"
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-600/20 via-purple-600/10 to-transparent border-b border-slate-700/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-900/40">
            <Sparkles className="w-4 h-4 text-white" />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0f1117]" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm leading-tight">AI Tutor</h3>
            <p className="text-[10px] text-emerald-400 font-medium">● Online · Context-Aware</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
              title="Clear chat"
              aria-label="Clear chat history"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsExpanded((v) => !v)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700/50 transition-all"
            title={isExpanded ? 'Minimize' : 'Expand'}
            aria-label={isExpanded ? 'Minimize chat window' : 'Expand chat window'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700/50 transition-all"
            title="Close"
            aria-label="Close chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Messages area ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 scroll-smooth" style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}>
        {/* Welcome message */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-900/40">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-base mb-1">Hello! I'm your AI Tutor</h4>
              <p className="text-slate-400 text-sm max-w-[240px] leading-relaxed">
                Ask me anything about coding, your course, or your resume!
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full max-w-[260px]">
              {['Explain my current challenge', 'What is a Python list?', 'How can I improve my resume?'].map((q) => (
                <button
                  key={q}
                  onClick={() => { setInput(q); inputRef.current?.focus(); }}
                  className="text-xs text-left px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/50 text-slate-300 hover:text-white transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          const ts = msg.timestamp ? formatTime(new Date(msg.timestamp)) : '';
          return (
            <div
              key={idx}
              className={`flex gap-2.5 items-end ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center self-end mb-0.5 ${
                  isUser
                    ? 'bg-gradient-to-br from-indigo-500 to-indigo-700'
                    : 'bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600/40'
                }`}
              >
                {isUser ? (
                  <User className="w-3.5 h-3.5 text-white" />
                ) : (
                  <Bot className="w-3.5 h-3.5 text-purple-400" />
                )}
              </div>

              {/* Bubble */}
              <div className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'} max-w-[82%]`}>
                <div
                  className={`px-4 py-3 rounded-2xl shadow-md text-sm leading-relaxed ${
                    isUser
                      ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-br-sm'
                      : 'bg-slate-800/80 rounded-bl-sm border border-slate-700/40'
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                  ) : (
                    <MarkdownMessage content={msg.content} />
                  )}
                </div>
                {ts && (
                  <span className="text-[10px] text-slate-500 px-1">{ts}</span>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-2.5 items-end">
            <div className="w-7 h-7 rounded-full flex-shrink-0 bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600/40 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-slate-800/80 border border-slate-700/40 shadow-md">
              <TypingDots />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input area ── */}
      <div className="px-4 py-3 border-t border-slate-700/50 bg-slate-900/40 shrink-0">
        <form onSubmit={handleSend} className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                // Auto-resize
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything… (Enter to send, Shift+Enter for new line)"
              disabled={loading}
              className="w-full bg-slate-800/80 border border-slate-700/60 focus:border-indigo-500/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 resize-none transition-all leading-relaxed disabled:opacity-50"
              style={{ minHeight: '42px', maxHeight: '120px', scrollbarWidth: 'none' }}
              aria-label="Message input"
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-900/30 active:scale-95"
            aria-label="Send message"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
        <p className="text-[10px] text-slate-600 text-center mt-2">
          Powered by Llama 3.1 via Groq · Responses may not always be accurate
        </p>
      </div>
    </div>
  );
}
