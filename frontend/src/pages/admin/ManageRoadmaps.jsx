import React, { useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useData } from '../../contexts/DataContext';
import { Plus, Pencil, Trash2, X, Save, ArrowUp, ArrowDown, ChevronDown, ChevronRight, Loader } from 'lucide-react';

export default function ManageRoadmaps() {
  const { careers, addRoadmapStep, updateRoadmapStep, deleteRoadmapStep, reorderRoadmapSteps } = useData();
  const [selectedCareer, setSelectedCareer] = useState(careers[0]?.id || '');
  const [showForm, setShowForm] = useState(false);
  const [editingStep, setEditingStep] = useState(null);
  const [form, setForm] = useState({ title: '', description: '' });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const career = careers.find(c => c.id === selectedCareer);

  function openAdd() {
    setForm({ title: '', description: '' }); setEditingStep(null); setShowForm(true);
    setSuccessMsg(''); setErrorMsg(''); setSubmitting(false);
  }

  function openEdit(step) {
    setForm({ title: step.title, description: step.description }); setEditingStep(step.id); setShowForm(true);
    setSuccessMsg(''); setErrorMsg(''); setSubmitting(false);
  }

  async function handleSave() {
    if (!form.title) return;
    setSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      let res;
      if (editingStep) {
        res = await updateRoadmapStep(selectedCareer, editingStep, form);
      } else {
        res = await addRoadmapStep(selectedCareer, form);
      }
      if (res && res.success) {
        setSuccessMsg(editingStep ? 'Step updated successfully!' : 'Step added successfully!');
        await new Promise(resolve => setTimeout(resolve, 1500));
        setShowForm(false);
        setEditingStep(null);
      } else {
        setErrorMsg(res?.error?.message || 'An error occurred while saving.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleDelete(stepId) {
    deleteRoadmapStep(selectedCareer, stepId); setConfirmDelete(null);
  }

  function moveUp(index) {
    if (index > 0) reorderRoadmapSteps(selectedCareer, index, index - 1);
  }

  function moveDown(index) {
    if (career && index < career.roadmap.length - 1) reorderRoadmapSteps(selectedCareer, index, index + 1);
  }

  return (
    <AdminLayout>
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-1">Manage Roadmaps</h1>
          <p className="text-slate-500 text-sm">Add, edit, reorder, or delete roadmap steps for each career.</p>
        </div>
        <button onClick={openAdd} disabled={!selectedCareer}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50">
          <Plus className="h-5 w-5" /> Add Step
        </button>
      </header>

      {/* Career Selector */}
      <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-sm mb-6">
        <label className="text-sm font-medium text-slate-700 mb-2 block">Select Career</label>
        <select value={selectedCareer} onChange={e => setSelectedCareer(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
          {careers.map(c => (
            <option key={c.id} value={c.id}>{c.title} ({c.roadmap.length} steps)</option>
          ))}
        </select>
      </div>

      {/* Steps List */}
      {career && (
        <div className="space-y-3">
          {career.roadmap.length === 0 && (
            <div className="bg-white p-8 rounded-2xl border border-emerald-200 shadow-sm text-center text-slate-500 font-medium">
              No roadmap steps yet. Click "Add Step" to create the first one.
            </div>
          )}
          {career.roadmap.map((step, index) => (
            <div key={step.id} className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm flex items-center gap-4 hover:border-emerald-300 transition-colors">
              {/* Order Number */}
              <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-center text-emerald-700 font-bold shrink-0 animate-pulse-subtle">
                {step.step}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-800 truncate">{step.title}</h3>
                <p className="text-xs text-slate-500 truncate">{step.description}</p>
                <span className="text-xs text-slate-400 mt-1 inline-block">{step.resources.length} resources</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => moveUp(index)} disabled={index === 0}
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors disabled:opacity-30" title="Move Up">
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button onClick={() => moveDown(index)} disabled={index === career.roadmap.length - 1}
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors disabled:opacity-30" title="Move Down">
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button onClick={() => openEdit(step)}
                  className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors" title="Edit">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => setConfirmDelete(step.id)}
                  className="p-2 hover:bg-red-50 rounded-lg text-red-500 hover:text-red-700 transition-colors" title="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-bold text-slate-800 mb-3">Delete Step?</h3>
            <p className="text-slate-500 text-sm mb-6">This will also delete all resources attached to this step.</p>
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
              <h3 className="text-xl font-bold text-slate-800">{editingStep ? 'Edit Step' : 'Add New Step'}</h3>
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
                <label className="text-sm font-medium text-slate-700 mb-1 block">Step Title *</label>
                <input type="text" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder="e.g. Learn Python Programming" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={3}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                  placeholder="What does this step involve?" />
              </div>
            </div>
            <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
              <button onClick={() => setShowForm(false)} disabled={submitting} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors disabled:opacity-50">Cancel</button>
              <button onClick={handleSave} disabled={submitting} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-70">
                {submitting ? (
                  <><Loader className="animate-spin h-4 w-4" /> Saving...</>
                ) : (
                  <><Save className="h-4 w-4" /> {editingStep ? 'Save Changes' : 'Add Step'}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
