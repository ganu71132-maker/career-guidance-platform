import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Helmet } from 'react-helmet-async';
import {
  BookOpen, ChevronRight, Download, Eye, Heart,
  FileText, HelpCircle, ListChecks, Code2, Video,
  PenTool, BookMarked, Archive, Plus, ArrowLeft,
  Star, ThumbsUp, ExternalLink, Clock, Layers,
  Share2, CheckCircle2
} from 'lucide-react';

// Map resource type names to icons and colors
const RESOURCE_TYPE_CONFIG = {
  handwritten: { icon: PenTool, label: '📖 Handwritten Notes', color: 'from-violet-500 to-purple-600', bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700' },
  quick_revision: { icon: BookMarked, label: '📝 Quick Revision', color: 'from-blue-500 to-cyan-600', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  important_questions: { icon: HelpCircle, label: '❓ Important Questions', color: 'from-amber-500 to-orange-600', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  mcq: { icon: ListChecks, label: '🎯 MCQs', color: 'from-emerald-500 to-green-600', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
  previous_year: { icon: Archive, label: '📄 Previous Year Questions', color: 'from-rose-500 to-pink-600', bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700' },
  program: { icon: Code2, label: '💻 Programs', color: 'from-indigo-500 to-blue-600', bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700' },
  video: { icon: Video, label: '🎥 Video Links', color: 'from-red-500 to-rose-600', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
  additional: { icon: Plus, label: '📎 Additional Resources', color: 'from-slate-500 to-gray-600', bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700' },
};

const getResourceConfig = (typeName) => RESOURCE_TYPE_CONFIG[typeName] || RESOURCE_TYPE_CONFIG.additional;

export default function StudyNotesChapter() {
  const { cid } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [chapter, setChapter] = useState(null);
  const [resources, setResources] = useState([]);
  const [unit, setUnit] = useState(null);
  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [downloadingId, setDownloadingId] = useState(null);
  const [viewingId, setViewingId] = useState(null);

  useEffect(() => {
    async function fetchChapter() {
      try {
        // Fetch chapter
        const { data: ch, error: chErr } = await supabase
          .from('chapters')
          .select('*')
          .eq('id', cid)
          .single();
        if (chErr) throw chErr;
        setChapter(ch);

        // Fetch resources with type info
        const { data: res, error: resErr } = await supabase
          .from('chapter_resources')
          .select('*, resource_types(name, icon)')
          .eq('chapter_id', cid);
        if (resErr) throw resErr;
        setResources(res || []);

        // Fetch unit and subject for breadcrumb
        if (ch.unit_id) {
          const { data: u } = await supabase.from('units').select('*').eq('id', ch.unit_id).single();
          setUnit(u);
          if (u?.subject_id) {
            const { data: s } = await supabase.from('subjects').select('*').eq('id', u.subject_id).single();
            setSubject(s);
          }
        }

        // Fetch user favorites
        if (user) {
          const { data: favs } = await supabase
            .from('student_favorites')
            .select('resource_id')
            .eq('user_id', user.id);
          if (favs) setFavorites(new Set(favs.map(f => f.resource_id)));
        }

        // Track recent view
        const recent = JSON.parse(localStorage.getItem('sn_recent') || '[]');
        const updated = [{ id: ch.id, title: ch.title, number: ch.number, viewedAt: new Date().toISOString() },
          ...recent.filter(r => r.id !== ch.id)].slice(0, 10);
        localStorage.setItem('sn_recent', JSON.stringify(updated));

        // Track in DB if logged in
        if (user) {
          await supabase.from('student_recent').upsert(
            { user_id: user.id, chapter_id: cid, last_viewed: new Date().toISOString() },
            { onConflict: 'user_id,chapter_id' }
          );
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchChapter();
  }, [cid, user]);

  const handleView = async (resource) => {
    setViewingId(resource.id);
    try {
      let url = null;
      const { data: signed, error: signErr } = await supabase.storage
        .from('study-notes-private')
        .createSignedUrl(resource.file_path, 3600);

      if (!signErr && signed?.signedUrl) {
        url = signed.signedUrl;
      } else {
        // Fallback to backend API route
        const res = await fetch(`/api/study-notes/resources/${resource.id}/signed-url`);
        if (res.ok) {
          const data = await res.json();
          url = data.url;
        }
      }

      if (!url) throw new Error('Could not generate view URL');

      // Increment view counter
      supabase.from('chapter_resources')
        .update({ views: (resource.views || 0) + 1 })
        .eq('id', resource.id)
        .then(() => {});

      window.open(url, '_blank');
    } catch (e) {
      console.error('Error opening resource:', e);
      alert('Failed to open resource: ' + (e.message || 'Please check storage bucket policies.'));
    } finally {
      setViewingId(null);
    }
  };

  const handleDownload = async (resource) => {
    setDownloadingId(resource.id);
    try {
      let url = null;
      const { data: signed, error: signErr } = await supabase.storage
        .from('study-notes-private')
        .createSignedUrl(resource.file_path, 3600, { download: true });

      if (!signErr && signed?.signedUrl) {
        url = signed.signedUrl;
      } else {
        const res = await fetch(`/api/study-notes/resources/${resource.id}/signed-url`);
        if (res.ok) {
          const data = await res.json();
          url = data.url;
        }
      }

      if (!url) throw new Error('Could not generate download URL');

      // Increment download counter
      supabase.from('chapter_resources')
        .update({ downloads: (resource.downloads || 0) + 1 })
        .eq('id', resource.id)
        .then(() => {});

      const a = document.createElement('a');
      a.href = url;
      a.download = resource.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error('Error downloading resource:', e);
      alert('Failed to download: ' + (e.message || 'Please check storage bucket policies.'));
    } finally {
      setDownloadingId(null);
    }
  };

  const toggleFavorite = async (resourceId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    const newFavs = new Set(favorites);
    if (newFavs.has(resourceId)) {
      newFavs.delete(resourceId);
      await supabase.from('student_favorites').delete()
        .eq('user_id', user.id).eq('resource_id', resourceId);
    } else {
      newFavs.add(resourceId);
      await supabase.from('student_favorites').insert({ user_id: user.id, resource_id: resourceId });
    }
    setFavorites(newFavs);
  };

  // Group resources by type
  const groupedResources = resources.reduce((acc, r) => {
    const typeName = r.resource_types?.name || 'additional';
    if (!acc[typeName]) acc[typeName] = [];
    acc[typeName].push(r);
    return acc;
  }, {});

  // Difficulty colors
  const difficultyColors = {
    Easy: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Medium: 'bg-amber-100 text-amber-700 border-amber-200',
    Hard: 'bg-red-100 text-red-700 border-red-200',
  };

  // =============== LOADING ===============
  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: '#f8fafc' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="h-4 w-64 bg-slate-200 rounded shimmer mb-6" />
          <div className="h-10 w-96 bg-slate-200 rounded-xl shimmer mb-3" />
          <div className="h-5 w-48 bg-slate-100 rounded-lg shimmer mb-8" />
          <div className="grid sm:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="h-5 w-40 bg-slate-200 rounded-lg shimmer mb-3" />
                <div className="h-4 w-56 bg-slate-100 rounded shimmer mb-4" />
                <div className="flex gap-2">
                  <div className="h-9 w-28 bg-slate-200 rounded-lg shimmer" />
                  <div className="h-9 w-28 bg-slate-200 rounded-lg shimmer" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !chapter) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8fafc' }}>
        <div className="text-center">
          <div className="text-6xl mb-4">📄</div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Chapter not found</h2>
          <p className="text-slate-500 mb-4">{error || 'This chapter may have been removed.'}</p>
          <Link to="/study-notes" className="px-6 py-2.5 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-500 transition-all inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Study Notes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#f8fafc' }}>
      <Helmet>
        <title>{chapter.title} - Study Notes | NextraPath</title>
        <meta name="description" content={`Study resources for ${chapter.title} including handwritten notes, revision materials, MCQs, and important questions.`} />
      </Helmet>

      {/* Background */}
      <div className="fixed top-0 right-[-10%] w-[50vw] h-[50vw] rounded-full bg-violet-100/20 blur-[120px] -z-10" />
      <div className="fixed bottom-[20%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-blue-100/20 blur-[120px] -z-10" />

      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <Link to="/" className="text-xl sm:text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <img src="/logo.png" alt="NextraPath Logo" className="h-6 w-6 sm:h-8 sm:w-8 object-contain drop-shadow-sm" /> NextraPath
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/study-notes" className="text-xs sm:text-sm font-medium text-violet-600 hover:text-violet-700 flex items-center gap-1">
              <BookOpen className="h-4 w-4" /> Study Notes
            </Link>
            {user ? (
              <Link to="/dashboard" className="text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition-all shadow-md shadow-emerald-600/20">
                Dashboard
              </Link>
            ) : (
              <Link to="/login" className="text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition-all shadow-md shadow-emerald-600/20">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Breadcrumb */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-400 mb-6 animate-fade-in">
          <Link to="/study-notes" className="hover:text-slate-600 transition-colors">Study Notes</Link>
          {subject && (
            <>
              <ChevronRight className="h-3 w-3" />
              <Link to="/study-notes" className="hover:text-slate-600 transition-colors">{subject.name}</Link>
            </>
          )}
          {unit && (
            <>
              <ChevronRight className="h-3 w-3" />
              <span className="text-slate-500">Unit {unit.number}</span>
            </>
          )}
          <ChevronRight className="h-3 w-3" />
          <span className="text-violet-600 font-bold">{chapter.title}</span>
        </div>

        {/* Chapter Header */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-8 animate-fade-in relative overflow-hidden">
          {/* Decorative */}
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br from-violet-100 to-indigo-100 rounded-full opacity-50" />
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full opacity-30" />

          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-xs font-bold text-violet-600 bg-violet-50 px-3 py-1 rounded-full border border-violet-100">
                Chapter {chapter.number}
              </span>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${difficultyColors[chapter.difficulty] || difficultyColors.Medium}`}>
                {chapter.difficulty || 'Medium'}
              </span>
              {unit && (
                <span className="text-xs text-slate-400 font-medium">
                  Unit {unit.number}: {unit.title}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mb-2 tracking-tight">
              {chapter.title}
            </h1>
            {subject && (
              <p className="text-sm text-slate-500">
                {subject.name}
              </p>
            )}

            {/* Quick stats */}
            <div className="flex flex-wrap items-center gap-4 mt-5 pt-5 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-semibold">{resources.length}</span> resources
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Eye className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-semibold">{resources.reduce((s, r) => s + (r.views || 0), 0)}</span> views
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Download className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-semibold">{resources.reduce((s, r) => s + (r.downloads || 0), 0)}</span> downloads
              </div>
            </div>
          </div>
        </div>

        {/* ======= RESOURCES BY TYPE ======= */}
        {resources.length > 0 ? (
          <div className="space-y-6 animate-fade-in">
            {Object.entries(groupedResources).map(([typeName, typeResources]) => {
              const config = getResourceConfig(typeName);
              const Icon = config.icon;

              return (
                <div key={typeName} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  {/* Type Header */}
                  <div className={`px-5 sm:px-6 py-4 ${config.bg} border-b ${config.border}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 bg-gradient-to-br ${config.color} rounded-xl flex items-center justify-center shadow-sm`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className={`font-bold ${config.text}`}>{config.label}</h3>
                        <p className="text-xs text-slate-500">{typeResources.length} file{typeResources.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  </div>

                  {/* Resource items */}
                  <div className="divide-y divide-slate-100">
                    {typeResources.map(resource => (
                      <div key={resource.id} className="px-5 sm:px-6 py-4 hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-sm text-slate-800 truncate">
                              {resource.file_name}
                            </h4>
                            <div className="flex flex-wrap items-center gap-3 mt-1.5">
                              {resource.size_bytes && (
                                <span className="text-[10px] text-slate-400 font-medium">
                                  {(resource.size_bytes / (1024 * 1024)).toFixed(1)} MB
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400 font-medium flex items-center gap-0.5">
                                <Eye className="h-3 w-3" /> {resource.views || 0}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium flex items-center gap-0.5">
                                <Download className="h-3 w-3" /> {resource.downloads || 0}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium flex items-center gap-0.5">
                                <Heart className="h-3 w-3" /> {resource.likes || 0}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* Favorite */}
                            <button
                              onClick={() => toggleFavorite(resource.id)}
                              className={`p-2 rounded-lg transition-all ${
                                favorites.has(resource.id)
                                  ? 'bg-red-50 text-red-500 hover:bg-red-100'
                                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'
                              }`}
                              title={favorites.has(resource.id) ? 'Remove from favorites' : 'Add to favorites'}
                            >
                              <Heart className={`h-4 w-4 ${favorites.has(resource.id) ? 'fill-current' : ''}`} />
                            </button>

                            {/* View */}
                            <button
                              onClick={() => handleView(resource)}
                              disabled={viewingId === resource.id}
                              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-violet-50 text-violet-700 rounded-lg hover:bg-violet-100 border border-violet-100 transition-all disabled:opacity-50"
                            >
                              {viewingId === resource.id ? (
                                <div className="h-3.5 w-3.5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Eye className="h-3.5 w-3.5" />
                              )}
                              View
                            </button>

                            {/* Download */}
                            <button
                              onClick={() => handleDownload(resource)}
                              disabled={downloadingId === resource.id}
                              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 border border-emerald-100 transition-all disabled:opacity-50"
                            >
                              {downloadingId === resource.id ? (
                                <div className="h-3.5 w-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Download className="h-3.5 w-3.5" />
                              )}
                              Download
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty state */
          <div className="text-center py-20 animate-fade-in">
            <div className="w-20 h-20 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <FileText className="h-10 w-10 text-violet-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">No resources yet</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
              Resources for this chapter are being prepared. Check back soon for handwritten notes, revision materials, and more!
            </p>
            <Link to="/study-notes" className="inline-flex items-center px-6 py-3 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-500 transition-all shadow-md shadow-violet-600/20">
              <ArrowLeft className="mr-2 h-4 w-4" /> Browse Other Subjects
            </Link>
          </div>
        )}

        {/* Back button */}
        <div className="mt-10 text-center">
          <Link to="/study-notes" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-violet-600 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Study Notes
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-xs text-slate-400">
          &copy; {new Date().getFullYear()} NextraPath. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
