import React, { useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useData } from '../../contexts/DataContext';
import { Plus, Pencil, Trash2, X, Save, ExternalLink, Video, BookText, FileText, Code, Lightbulb, Star, Loader } from 'lucide-react';

const typeOptions = [
  { value: 'video', label: 'Video', icon: <Video className="h-4 w-4" /> },
  { value: 'course', label: 'Course', icon: <BookText className="h-4 w-4" /> },
  { value: 'documentation', label: 'Documentation', icon: <FileText className="h-4 w-4" /> },
  { value: 'practice', label: 'Practice', icon: <Code className="h-4 w-4" /> },
  { value: 'project', label: 'Project', icon: <Lightbulb className="h-4 w-4" /> },
];

const typeColors = {
  video: 'text-red-700 bg-red-50 border border-red-100',
  course: 'text-blue-700 bg-blue-50 border border-blue-100',
  documentation: 'text-amber-700 bg-amber-50 border border-amber-100',
  practice: 'text-emerald-700 bg-emerald-50 border border-emerald-100',
  project: 'text-purple-700 bg-purple-50 border border-purple-100',
};

export default function ManageResources() {
  const { careers, addResource, updateResource, deleteResource } = useData();
  const [selectedCareer, setSelectedCareer] = useState(careers[0]?.id || '');
  const [selectedStep, setSelectedStep] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [form, setForm] = useState({ title: '', type: 'video', url: '', platform: '', recommended: false });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const career = careers.find(c => c.id === selectedCareer);
  const step = career?.roadmap.find(s => s.id === selectedStep);

  React.useEffect(() => {
    if (career && career.roadmap.length > 0 && !career.roadmap.find(s => s.id === selectedStep)) {
      setSelectedStep(career.roadmap[0].id);
    }
  }, [selectedCareer, career]);

  function openAdd() {
    setForm({ title: '', type: 'video', url: '', platform: '', recommended: false }); setEditingIndex(null); setShowForm(true);
    setSuccessMsg(''); setErrorMsg(''); setSubmitting(false);
  }

  function openEdit(resource, index) {
    setForm({ title: resource.title, type: resource.type, url: resource.url, platform: resource.platform, recommended: resource.recommended || false });
    setEditingIndex(index); setShowForm(true);
    setSuccessMsg(''); setErrorMsg(''); setSubmitting(false);
  }

  async function handleSave() {
    if (!form.title) return;
    setSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      let res;
      if (editingIndex !== null) {
        res = await updateResource(selectedCareer, selectedStep, editingIndex, form);
      } else {
        res = await addResource(selectedCareer, selectedStep, form);
      }
      if (res && res.success) {
        setSuccessMsg(editingIndex !== null ? 'Resource updated successfully!' : 'Resource added successfully!');
        await new Promise(resolve => setTimeout(resolve, 1500));
        setShowForm(false);
        setEditingIndex(null);
      } else {
        setErrorMsg(res?.error?.message || 'An error occurred while saving.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleDelete(index) {
    deleteResource(selectedCareer, selectedStep, index); setConfirmDelete(null);
  }

  return (
    <AdminLayout>
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-1">Manage Resources</h1>
          <p className="text-slate-500 text-sm">Add videos, courses, books, and projects. Mark best ones as ⭐ Recommended for affiliate links.</p>
        </div>
        <button onClick={openAdd} disabled={!step}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50">
          <Plus className="h-5 w-5" /> Add Resource
        </button>
      </header>

      {/* Affiliate Tip */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
        <Star className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <span className="font-bold text-amber-800">💰 Affiliate Tip:</span>
          <span className="text-amber-700 ml-1">Mark resources as "Recommended" and paste your affiliate URL. Recommended resources appear highlighted to users and get more clicks!</span>
        </div>
      </div>

      {/* Selectors */}
      <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-sm mb-6 grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Select Career</label>
          <select value={selectedCareer} onChange={e => { setSelectedCareer(e.target.value); setSelectedStep(''); }}
            className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
            {careers.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Select Roadmap Step</label>
          <select value={selectedStep} onChange={e => setSelectedStep(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
            {career?.roadmap.map(s => <option key={s.id} value={s.id}>Step {s.step}: {s.title}</option>)}
          </select>
        </div>
      </div>

      {/* Resources List */}
      {step ? (
        <div className="space-y-3">
          {step.resources.length === 0 && (
            <div className="bg-white p-8 rounded-2xl border border-emerald-200 shadow-sm text-center text-slate-500 font-medium">
              No resources yet for this step. Click "Add Resource" to add one.
            </div>
          )}
          {step.resources.map((res, index) => (
            <div key={index} className={`p-4 rounded-2xl flex items-center gap-4 transition-colors ${
              res.recommended ? 'border-2 border-amber-500/40 bg-amber-50/30 shadow-sm' : 'bg-white border border-emerald-200 shadow-sm hover:border-emerald-300'
            }`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${typeColors[res.type]}`}>
                {typeOptions.find(t => t.value === res.type)?.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-800 truncate">{res.title}</h3>
                  {res.recommended && (
                    <span className="flex items-center gap-1 px-2.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded-full text-xs font-semibold shrink-0">
                      <Star className="h-3 w-3" /> Recommended
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <span className="capitalize">{res.type}</span>
                  <span>·</span>
                  <span>{res.platform}</span>
                  {res.url && res.url !== '#' && (
                    <>
                      <span>·</span>
                      <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                        Link <ExternalLink className="h-3 w-3" />
                      </a>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEdit(res, index)}
                  className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => setConfirmDelete(index)}
                  className="p-2 hover:bg-red-50 rounded-lg text-red-500 hover:text-red-650 transition-colors"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-2xl border border-emerald-200 shadow-sm text-center text-slate-500 font-medium">
          Select a career and roadmap step to manage resources.
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete !== null && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-bold text-slate-800 mb-3">Delete Resource?</h3>
            <p className="text-slate-500 text-sm mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-500">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800">{editingIndex !== null ? 'Edit Resource' : 'Add New Resource'}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-650 transition-colors"><X className="h-5 w-5" /></button>
            </div>

            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl mb-6 text-sm font-medium animate-fade-in">
                {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm font-medium animate-fade-in">
                {errorMsg}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Resource Title *</label>
                <input type="text" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder="e.g. Andrew Ng ML Course" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
                    {typeOptions.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Platform</label>
                  <input type="text" value={form.platform} onChange={e => setForm(f => ({...f, platform: e.target.value}))}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    placeholder="e.g. Coursera, YouTube, Amazon" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">URL (paste your affiliate link here)</label>
                <input type="text" value={form.url} onChange={e => setForm(f => ({...f, url: e.target.value}))}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder="https://amazon.in/dp/xxx?tag=YOUR_AFFILIATE_ID" />
              </div>

              {/* Recommended Toggle */}
              <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div>
                  <div className="flex items-center gap-2 text-amber-800 font-medium text-sm">
                    <Star className="h-4 w-4" /> Mark as Recommended
                  </div>
                  <p className="text-xs text-amber-700 mt-1">Recommended resources appear highlighted to users</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(f => ({...f, recommended: !f.recommended}))}
                  className={`w-12 h-7 rounded-full transition-all relative ${form.recommended ? 'bg-amber-500' : 'bg-slate-200'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${form.recommended ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            </div>
            <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
              <button onClick={() => setShowForm(false)} disabled={submitting} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors disabled:opacity-50">Cancel</button>
              <button onClick={handleSave} disabled={submitting} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-70">
                {submitting ? (
                  <><Loader className="animate-spin h-4 w-4" /> Saving...</>
                ) : (
                  <><Save className="h-4 w-4" /> {editingIndex !== null ? 'Save Changes' : 'Add Resource'}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
