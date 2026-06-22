import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function FeatureHighlightPopup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [highlight, setHighlight] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchHighlight();
  }, [user]);

  const fetchHighlight = async () => {
    try {
      const nowISO = new Date().toISOString();
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .eq('is_feature_highlight', true)
        .or(`expires_at.is.null,expires_at.gt.${nowISO}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data && data.length > 0) {
        // Select the most recent highlight announcement
        const mostRecent = data[0];
        const dismissedKey = `dismissed_highlight_${user.id}_${mostRecent.id}`;
        const isDismissed = localStorage.getItem(dismissedKey);

        if (!isDismissed) {
          setHighlight(mostRecent);
          // Show with short delay
          const timer = setTimeout(() => setShow(true), 2500);
          return () => clearTimeout(timer);
        }
      }
    } catch (err) {
      console.error('Error fetching highlight:', err);
    }
  };

  const handleDismiss = (e) => {
    if (e) e.stopPropagation();
    if (highlight && user) {
      const dismissedKey = `dismissed_highlight_${user.id}_${highlight.id}`;
      localStorage.setItem(dismissedKey, 'true');
    }
    setShow(false);
  };

  const handleAction = async () => {
    if (!highlight) return;

    try {
      await supabase.rpc('increment_announcement_clicks', { announcement_id: highlight.id });
    } catch (err) {
      await supabase.from('announcements')
        .update({ clicks_count: (highlight.clicks_count || 0) + 1 })
        .eq('id', highlight.id);
    }

    handleDismiss();

    if (highlight.redirect_url) {
      if (highlight.redirect_url.startsWith('http')) {
        window.open(highlight.redirect_url, '_blank');
      } else {
        navigate(highlight.redirect_url);
      }
    }
  };

  if (!show || !highlight) return null;

  return (
    <div className="fixed bottom-6 right-6 max-w-sm w-full bg-slate-900 border border-slate-800 text-white rounded-3xl shadow-2xl z-40 p-5 animate-slide-in overflow-hidden relative">
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 right-0 p-6 opacity-[0.03] select-none pointer-events-none">
        <Sparkles className="h-28 w-28 text-white" />
      </div>

      <div className="flex justify-between items-start gap-3 relative z-10 mb-2">
        <span className="bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
          <Sparkles className="h-3 w-3 fill-emerald-450 text-emerald-400 animate-pulse" /> New Feature
        </span>
        <button 
          onClick={handleDismiss}
          className="text-slate-400 hover:text-white p-1 hover:bg-slate-800/80 rounded-lg transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4.5 relative z-10">
        <div>
          <h3 className="font-extrabold text-sm text-slate-100 tracking-wide">{highlight.title}</h3>
          <p className="text-slate-400 text-[11px] leading-relaxed text-justify mt-1.5">{highlight.message}</p>
        </div>

        <div className="flex gap-2">
          {highlight.redirect_url ? (
            <>
              <button 
                onClick={handleAction}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {highlight.button_text || 'Try Now'} <ArrowRight className="h-3.5 w-3.5" />
              </button>
              <button 
                onClick={handleDismiss}
                className="px-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-2 rounded-xl transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </>
          ) : (
            <button 
              onClick={handleDismiss}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-350 text-xs py-2 rounded-xl transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
