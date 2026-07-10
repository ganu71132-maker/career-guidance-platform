import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../contexts/ChatContext';
import { X, Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

export default function AIChatbot() {
  const { isOpen, setIsOpen, messages, addMessage, contextData } = useChat();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    addMessage({ role: 'user', content: userMessage });
    setLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!apiKey) {
        addMessage({ 
          role: 'model', 
          content: 'AI key not found! Please add VITE_GROQ_API_KEY to your environment variables.' 
        });
        setLoading(false);
        return;
      }

      // Construct the system prompt based on context
      let systemInstruction = "You are a friendly, helpful AI assistant for the NextraPath Career Platform. Be concise, encouraging, and keep responses short.";
      
      if (contextData?.type === 'code') {
        systemInstruction = `You are an expert coding tutor. The user is working on a challenge: "${contextData.data?.challengeTitle || 'Unknown'}". 
        Here is their current code:\n${contextData.data?.code || '(no code yet)'}
        Here is the output/error they got:\n${contextData.data?.output || '(no output yet)'}
        Help them understand what is wrong and guide them to the solution. Do NOT just give the final code directly. Keep it brief.`;
      } else if (contextData?.type === 'resume') {
        systemInstruction = `You are an expert tech recruiter and resume reviewer. The user is building their resume. 
        Here is their resume data: ${JSON.stringify(contextData.data, null, 2)}
        Review this and provide 3 specific, actionable tips to improve it.`;
      }

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: userMessage }
          ],
          temperature: 0.7,
          max_tokens: 800
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData?.error?.message || 'API request failed');
      }

      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content || "I couldn't generate a response. Please try again.";
      addMessage({ role: 'model', content: text });
    } catch (error) {
      console.error("AI Error:", error);
      addMessage({ role: 'model', content: `Error: ${error.message || "Something went wrong. Please try again."}` });

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 w-96 max-w-[90vw] h-[500px] max-h-[80vh] bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50 flex justify-between items-center bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">AI Tutor</h3>
            <p className="text-xs text-slate-400">Context-Aware</p>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors p-1">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
              msg.role === 'user' ? 'bg-indigo-600' : 'bg-slate-800'
            }`}>
              {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-purple-400" />}
            </div>
            <div className={`p-3 rounded-2xl max-w-[75%] text-sm ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-sm' 
                : 'bg-slate-800/80 text-slate-200 rounded-tl-sm border border-slate-700/50'
            }`}>
              {/* Note: In a real app we'd use react-markdown here, but plain text is ok for prototype */}
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
              <Bot className="w-4 h-4 text-purple-400" />
            </div>
            <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/50 rounded-tl-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
              <span className="text-sm text-slate-400">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-700/50 bg-slate-900/50">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || loading}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
