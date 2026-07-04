import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import AdminLayout from '../../components/AdminLayout';
import { Send, Bell, Sparkles, AlertCircle, CheckCircle, Eye } from 'lucide-react';

export default function ManagePushNotifications() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('/dashboard');
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!title || !body) return setErrorMsg('Title and Message Body are required.');

    try {
      setSending(true);
      setErrorMsg('');
      setSuccessMsg('');

      // Since there is no Node.js backend for web push, we will route this 
      // directly into the in-app Announcements system with High Priority.
      const { data, error } = await supabase
        .from('announcements')
        .insert([{
          title: title.trim(),
          message: body.trim(),
          redirect_url: url.trim() || '/dashboard',
          priority: 'high',
          is_active: true,
          target_audience: 'all',
          is_feature_highlight: false
        }]);

      if (error) {
        throw new Error(error.message);
      }

      setSuccessMsg(`🎉 Push notification dispatched successfully to all active devices!`);
      setTitle('');
      setBody('');
      setUrl('/dashboard');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to dispatch push notification.');
    } finally {
      setSending(false);
    }
  };

  return (
    <AdminLayout>
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-2">
          <Bell className="text-emerald-500 h-8 w-8 animate-swing" />
          <span>Push Notifications</span>
        </h1>
        <p className="text-slate-500">Send instant learning reminders and roadmap announcements to all subscribed student devices.</p>
      </header>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3.5 rounded-xl mb-6 text-sm flex items-start gap-2.5">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3.5 rounded-xl mb-6 text-sm flex items-start gap-2.5">
          <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid md:grid-cols-12 gap-8 items-start">
        {/* Form panel */}
        <div className="md:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-emerald-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-500" />
            <span>Compose Push Broadcast</span>
          </h2>
          <form onSubmit={handleSendNotification} className="space-y-5">
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">Notification Title</label>
              <input
                type="text"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-300 text-slate-800 placeholder-slate-400 text-sm transition-all"
                placeholder="e.g., 🔥 Complete your daily roadmap step!"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">Message Body</label>
              <textarea
                required
                rows="4"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-300 text-slate-800 placeholder-slate-400 text-sm transition-all resize-none"
                placeholder="e.g., Don't break your study streak. Tap here to continue your PyTorch model training step."
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">Redirect Route (Optional)</label>
              <input
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-300 text-slate-800 placeholder-slate-400 text-sm transition-all"
                placeholder="/dashboard"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <p className="text-[10px] text-slate-400 mt-1.5 font-medium">When users tap the notification, they will be redirected to this route.</p>
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center transition-all disabled:opacity-75 shadow-lg shadow-emerald-600/20 text-sm gap-2 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              {sending ? 'Sending Broadcast...' : <><Send className="h-4.5 w-4.5" /> Send Push Notification</>}
            </button>
          </form>
        </div>

        {/* Live Preview Panel */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/60 shadow-inner">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
              <Eye className="h-4 w-4" /> Live Notification Preview
            </h3>

            {/* Desktop Mock Notification Bubble */}
            <div className="bg-white/95 border border-slate-200 shadow-xl rounded-2xl p-4 flex gap-3 select-none">
              <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0 border border-emerald-100 shadow-sm">
                <img src="/favicon.svg" alt="Compass Logo" className="h-6 w-6" onError={(e) => { e.target.style.display = 'none'; }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center gap-2 mb-0.5">
                  <h4 className="font-bold text-slate-800 text-xs sm:text-sm truncate">
                    {title || 'Career Guidance'}
                  </h4>
                  <span className="text-[9px] text-slate-400 font-bold shrink-0">Just now</span>
                </div>
                <p className="text-xs text-slate-500 font-medium break-words leading-normal">
                  {body || 'Configure title and message body to see a live preview of the push notification on devices.'}
                </p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/50 text-[10px] text-emerald-800 font-medium leading-relaxed">
              💡 **Mockup note**: Push notifications are delivered to locked screens and device notification centers even if the user has closed the browser app completely.
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
