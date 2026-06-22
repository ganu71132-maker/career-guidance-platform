import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import AdminLayout from '../../components/AdminLayout';
import { 
  Megaphone, Plus, Trash2, Edit2, CheckCircle2, XCircle, 
  TrendingUp, BarChart3, Eye, MousePointerClick, Calendar, ArrowUpRight
} from 'lucide-react';

export default function ManageAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [buttonText, setButtonText] = useState('Try Now');
  const [redirectUrl, setRedirectUrl] = useState('');
  const [priority, setPriority] = useState('medium');
  const [isActive, setIsActive] = useState(true);
  const [isFeatureHighlight, setIsFeatureHighlight] = useState(false);
  const [targetAudience, setTargetAudience] = useState('all');
  const [expiresAt, setExpiresAt] = useState('');

  // Toast State
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (err) {
      console.error(err);
      if (!silent) showToast('Error loading announcements', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setTitle('');
    setMessage('');
    setButtonText('Try Now');
    setRedirectUrl('');
    setPriority('medium');
    setIsActive(true);
    setIsFeatureHighlight(false);
    setTargetAudience('all');
    setExpiresAt('');
    setShowFormModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingId(item.id);
    setTitle(item.title);
    setMessage(item.message);
    setButtonText(item.button_text || 'Try Now');
    setRedirectUrl(item.redirect_url || '');
    setPriority(item.priority || 'medium');
    setIsActive(item.is_active);
    setIsFeatureHighlight(item.is_feature_highlight || false);
    setTargetAudience(item.target_audience || 'all');
    setExpiresAt(item.expires_at ? new Date(item.expires_at).toISOString().split('T')[0] : '');
    setShowFormModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      showToast('Please fill in title and message', 'error');
      return;
    }

    setActionLoading(true);
    const payload = {
      title: title.trim(),
      message: message.trim(),
      button_text: buttonText.trim() ? buttonText.trim() : null,
      redirect_url: redirectUrl.trim() ? redirectUrl.trim() : null,
      priority,
      is_active: isActive,
      is_feature_highlight: isFeatureHighlight,
      target_audience: targetAudience,
      expires_at: expiresAt && !isNaN(Date.parse(expiresAt)) ? new Date(expiresAt).toISOString() : null,
    };

    // Close the modal instantly for a snappy UI feel
    setShowFormModal(false);

    try {
      if (editingId) {
        // Optimistically update the row in local state first
        setAnnouncements(prev => prev.map(item => item.id === editingId ? { ...item, ...payload } : item));
        
        const { error } = await supabase
          .from('announcements')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
        showToast('Announcement updated successfully!');
      } else {
        const { data, error } = await supabase
          .from('announcements')
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        
        // Optimistically insert newly created announcement at the top
        if (data) {
          setAnnouncements(prev => [data, ...prev]);
        }
        showToast('Announcement created successfully!');
      }
      
      // Perform silent background refetch to ensure database consistency
      fetchAnnouncements(true);
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Error saving announcement', 'error');
      // Re-fetch to rollback to correct database state if it failed
      fetchAnnouncements(true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);
      if (error) throw error;
      showToast('Announcement deleted!');
      fetchAnnouncements();
    } catch (err) {
      console.error(err);
      showToast('Error deleting announcement', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleActiveStatus = async (item) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ is_active: !item.is_active })
        .eq('id', item.id);
      if (error) throw error;
      showToast(item.is_active ? 'Announcement disabled' : 'Announcement enabled');
      fetchAnnouncements();
    } catch (err) {
      console.error(err);
      showToast('Error updating status', 'error');
    }
  };

  // Analytics helper calculations
  const totalSent = announcements.length;
  const totalViews = announcements.reduce((sum, item) => sum + (item.views_count || 0), 0);
  const totalClicks = announcements.reduce((sum, item) => sum + (item.clicks_count || 0), 0);
  const clickThroughRate = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : '0';

  const mostClicked = announcements.reduce((max, item) => {
    return (item.clicks_count || 0) > (max?.clicks_count || 0) ? item : max;
  }, null);

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-805 flex items-center gap-2">
              <Megaphone className="text-emerald-500 h-8 w-8 animate-pulse" /> Platform Announcements
            </h1>
            <p className="text-slate-500 text-sm mt-1">Deploy global updates, features highlight, and target messages to users.</p>
          </div>
          <button 
            onClick={handleOpenCreate}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-5 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
          >
            <Plus className="h-5 w-5" /> New Announcement
          </button>
        </div>

        {/* Toast Notification */}
        {toast.show && (
          <div className={`fixed bottom-5 right-5 px-4 py-3 rounded-xl shadow-2xl border text-sm z-50 transition-all ${
            toast.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-800 border-emerald-250'
          }`}>
            {toast.message}
          </div>
        )}

        {/* Analytics Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Broadcasts</span>
              <div className="p-2 bg-slate-50 rounded-lg text-slate-600"><Megaphone className="h-4 w-4" /></div>
            </div>
            <div className="text-3xl font-bold text-slate-800">{totalSent}</div>
            <p className="text-[10px] text-slate-400 mt-1">Announcements created</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Views</span>
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Eye className="h-4 w-4" /></div>
            </div>
            <div className="text-3xl font-bold text-slate-800">{totalViews}</div>
            <p className="text-[10px] text-slate-400 mt-1">Global user views</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Clicks</span>
              <div className="p-2 bg-orange-50 rounded-lg text-orange-600"><MousePointerClick className="h-4 w-4" /></div>
            </div>
            <div className="text-3xl font-bold text-slate-800">{totalClicks}</div>
            <p className="text-[10px] text-slate-400 mt-1">Link redirects clicked</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Click Rate (CTR)</span>
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><TrendingUp className="h-4 w-4" /></div>
            </div>
            <div className="text-3xl font-bold text-slate-800">{clickThroughRate}%</div>
            <p className="text-[10px] text-slate-400 mt-1">Engagement level conversion</p>
          </div>
        </div>

        {/* Most Clicked Highlights */}
        {mostClicked && mostClicked.clicks_count > 0 && (
          <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-700"><BarChart3 className="h-5 w-5" /></div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Most Popular Announcement</h4>
                <p className="text-slate-500 text-xs mt-0.5">"{mostClicked.title}" received {mostClicked.clicks_count} clicks</p>
              </div>
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg flex items-center gap-1 shrink-0">
              CTR: {mostClicked.views_count > 0 ? ((mostClicked.clicks_count / mostClicked.views_count) * 100).toFixed(0) : 0}% <ArrowUpRight className="h-3 w-3" />
            </span>
          </div>
        )}

        {/* List Grid Table */}
        <div className="bg-white rounded-3xl border border-slate-150 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-extrabold text-slate-800 text-base">Announcement History</h3>
            <span className="text-xs text-slate-400 font-medium">Showing {announcements.length} records</span>
          </div>
          
          {loading ? (
            <div className="p-12 text-center text-slate-450">
              <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4" />
              Loading records...
            </div>
          ) : announcements.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              No announcements created yet. Click "New Announcement" to send one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-450 uppercase tracking-wider border-b border-slate-100">
                    <th className="py-4 px-6">Announcement Details</th>
                    <th className="py-4 px-4 text-center">Priority</th>
                    <th className="py-4 px-4 text-center">Feature Highlight</th>
                    <th className="py-4 px-4 text-center">Stats</th>
                    <th className="py-4 px-4 text-center">Expiry</th>
                    <th className="py-4 px-4 text-center">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {announcements.map((item) => {
                    const isExpired = item.expires_at && new Date(item.expires_at) < new Date();
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4.5 px-6 max-w-sm">
                          <div className="font-bold text-slate-805 text-sm">{item.title}</div>
                          <div className="text-slate-500 line-clamp-2 mt-1 leading-relaxed">{item.message}</div>
                          {item.redirect_url && (
                            <div className="text-[10px] text-emerald-600 font-medium mt-1">
                              Redirects to: <span className="underline">{item.redirect_url}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-4.5 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[9px] ${
                            item.priority === 'high' ? 'bg-red-50 text-red-650' : 
                            item.priority === 'medium' ? 'bg-orange-50 text-orange-600' : 
                            'bg-blue-50 text-blue-600'
                          }`}>
                            {item.priority}
                          </span>
                        </td>
                        <td className="py-4.5 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                            item.is_feature_highlight 
                              ? 'bg-purple-50 text-purple-700 border border-purple-100' 
                              : 'text-slate-400'
                          }`}>
                            {item.is_feature_highlight ? 'Yes 🚀' : 'No'}
                          </span>
                        </td>
                        <td className="py-4.5 px-4 text-center font-medium text-slate-600">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="flex items-center gap-1"><Eye className="h-3 w-3 text-slate-400" /> {item.views_count || 0}</span>
                            <span className="flex items-center gap-1 text-[10px] text-slate-400"><MousePointerClick className="h-2.5 w-2.5" /> {item.clicks_count || 0}</span>
                          </div>
                        </td>
                        <td className="py-4.5 px-4 text-center">
                          {item.expires_at ? (
                            <span className={`flex items-center justify-center gap-1 ${isExpired ? 'text-red-500 font-medium' : 'text-slate-500'}`}>
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(item.expires_at).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-4.5 px-4 text-center">
                          <button 
                            onClick={() => toggleActiveStatus(item)}
                            className="cursor-pointer transition-transform hover:scale-105"
                          >
                            {item.is_active && !isExpired ? (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 mx-auto w-fit">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Active
                              </span>
                            ) : (
                              <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 mx-auto w-fit">
                                <XCircle className="h-3.5 w-3.5" /> {isExpired ? 'Expired' : 'Inactive'}
                              </span>
                            )}
                          </button>
                        </td>
                        <td className="py-4.5 px-6 text-right">
                          <div className="flex justify-end gap-2.5">
                            <button 
                              onClick={() => handleOpenEdit(item)}
                              className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                              title="Edit Announcement"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(item.id)}
                              className="p-2 text-red-400 hover:text-red-650 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                              title="Delete Announcement"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Form Overlay */}
        {showFormModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-100 shadow-2xl overflow-hidden animate-scale-up">
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-extrabold text-slate-800 text-base">
                  {editingId ? 'Edit Announcement' : 'Create New Announcement'}
                </h3>
                <button 
                  onClick={() => setShowFormModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Announcement Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. New Resume Builder Available"
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    maxLength={70}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Announcement Message</label>
                  <textarea 
                    placeholder="Provide a description of the update or platform message..."
                    value={message} 
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 h-24 resize-none"
                    maxLength={200}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Button Text (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Try Now"
                      value={buttonText} 
                      onChange={(e) => setButtonText(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Redirect Link (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. /resume (optional)"
                      value={redirectUrl} 
                      onChange={(e) => setRedirectUrl(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Expiry Date (Optional)</label>
                    <input 
                      type="date" 
                      value={expiresAt} 
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Target Audience</label>
                    <select
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="all">All Users</option>
                      <option value="student">Students</option>
                      <option value="professional">Professionals</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-slate-800">Feature Highlight Option</span>
                    <span className="text-[10px] text-slate-400">Display as floating banner popup upon login.</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={isFeatureHighlight} 
                    onChange={(e) => setIsFeatureHighlight(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 h-4.5 w-4.5 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-slate-800">Active Status</span>
                    <span className="text-[10px] text-slate-400">Make this announcement live for users instantly.</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={isActive} 
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 h-4.5 w-4.5 cursor-pointer"
                  />
                </div>

                <div className="flex gap-3.5 pt-3 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setShowFormModal(false)}
                    className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors text-sm cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-500 transition-all shadow-md shadow-emerald-500/10 disabled:opacity-50 cursor-pointer text-sm"
                  >
                    {actionLoading ? 'Saving...' : 'Broadcast Update'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
