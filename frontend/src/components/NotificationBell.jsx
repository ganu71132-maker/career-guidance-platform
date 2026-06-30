import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Bell, Megaphone, CheckCircle2, ArrowRight, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [readState, setReadState] = useState({});
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    fetchAnnouncements();

    // Close popover on outside click
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [user]);

  const fetchAnnouncements = async () => {
    try {
      // 1. Fetch active and non-expired announcements
      const nowISO = new Date().toISOString();
      const { data: annData, error: annErr } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .or(`expires_at.is.null,expires_at.gt.${nowISO}`);

      if (annErr) throw annErr;

      // Sort: High priority first, then date created descending
      const sortedAnn = (annData || []).sort((a, b) => {
        if (a.priority === 'high' && b.priority !== 'high') return -1;
        if (a.priority !== 'high' && b.priority === 'high') return 1;
        return new Date(b.created_at) - new Date(a.created_at);
      });

      setAnnouncements(sortedAnn);

      // 2. Fetch read status mapping for the current user
      if (sortedAnn.length > 0) {
        const { data: readData, error: readErr } = await supabase
          .from('user_announcements')
          .select('announcement_id, is_read')
          .eq('user_id', user.id);

        if (readErr) throw readErr;

        const mapping = {};
        (readData || []).forEach(r => {
          mapping[r.announcement_id] = r.is_read;
        });
        setReadState(mapping);

        // 3. Mark newly displayed announcements as viewed (increment view count)
        // Store viewed session key to avoid double-counting within the same page session
        const sessionViewed = sessionStorage.getItem('viewed_announcements') 
          ? JSON.parse(sessionStorage.getItem('viewed_announcements')) 
          : [];

        const newToView = sortedAnn.filter(item => !sessionViewed.includes(item.id));
        if (newToView.length > 0) {
          for (const item of newToView) {
            try {
              await supabase.rpc('increment_announcement_views', { announcement_id: item.id });
            } catch (err) {
              // Fallback direct update if custom RPC is not loaded yet
              await supabase.from('announcements')
                .update({ views_count: (item.views_count || 0) + 1 })
                .eq('id', item.id);
            }
            sessionViewed.push(item.id);
          }
          sessionStorage.setItem('viewed_announcements', JSON.stringify(sessionViewed));
        }
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const handleMarkAsRead = async (annId, e) => {
    if (e) e.stopPropagation();
    try {
      const { error } = await supabase
        .from('user_announcements')
        .upsert({
          user_id: user.id,
          announcement_id: annId,
          is_read: true,
          read_at: new Date().toISOString()
        }, { onConflict: 'user_id,announcement_id' });

      if (error) throw error;

      setReadState(prev => ({ ...prev, [annId]: true }));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleNotificationClick = async (item) => {
    // 1. Mark as read
    if (!readState[item.id]) {
      await handleMarkAsRead(item.id);
    }

    // 2. Increment click count
    try {
      await supabase.rpc('increment_announcement_clicks', { announcement_id: item.id });
    } catch (err) {
      // Fallback
      await supabase.from('announcements')
        .update({ clicks_count: (item.clicks_count || 0) + 1 })
        .eq('id', item.id);
    }

    // 3. Perform redirect
    setIsOpen(false);
    if (item.redirect_url) {
      if (item.redirect_url.startsWith('http')) {
        window.open(item.redirect_url, '_blank');
      } else {
        navigate(item.redirect_url);
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const unreadAnn = announcements.filter(item => !readState[item.id]);
      if (unreadAnn.length === 0) return;

      const promises = unreadAnn.map(item => 
        supabase.from('user_announcements').upsert({
          user_id: user.id,
          announcement_id: item.id,
          is_read: true,
          read_at: new Date().toISOString()
        }, { onConflict: 'user_id,announcement_id' })
      );

      await Promise.all(promises);
      
      const newMapping = { ...readState };
      unreadAnn.forEach(item => {
        newMapping[item.id] = true;
      });
      setReadState(newMapping);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  // Count unread
  const unreadCount = announcements.filter(item => !readState[item.id]).length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Icon */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-all cursor-pointer flex items-center justify-center"
        aria-label="View Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded-full flex items-center justify-center shadow-sm min-w-5 h-5 ring-2 ring-white animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-150 rounded-2xl shadow-2xl z-50 overflow-hidden py-1 animate-scale-up origin-top-right">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <span className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
              <Megaphone className="h-4 w-4 text-emerald-500" /> Notifications
            </span>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold hover:underline cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
            {announcements.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No new announcements to show.
              </div>
            ) : (
              announcements.map((item) => {
                const isRead = readState[item.id];
                return (
                  <div 
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`p-3.5 hover:bg-slate-50/70 transition-colors cursor-pointer flex items-start gap-3 relative ${
                      !isRead ? 'bg-emerald-50/15' : ''
                    }`}
                  >
                    {!isRead && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    )}
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`font-bold text-xs leading-normal truncate ${!isRead ? 'text-slate-900' : 'text-slate-650'}`}>
                          {item.title}
                        </span>
                        {item.priority === 'high' && (
                          <span className="bg-red-50 text-red-650 text-[8px] font-bold uppercase tracking-wider px-1 py-0.2 rounded shrink-0">High</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-normal text-justify line-clamp-3">
                        {item.message}
                      </p>
                      
                      {item.redirect_url && (
                        <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold hover:text-emerald-700 transition-colors pt-0.5">
                          {item.button_text || 'Learn More'} <ArrowRight className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="px-4 py-2 bg-slate-50 text-center border-t border-slate-100">
            <span className="text-[9px] text-slate-400 font-medium">NextraPath Platform Broadcasts</span>
          </div>
        </div>
      )}
    </div>
  );
}
