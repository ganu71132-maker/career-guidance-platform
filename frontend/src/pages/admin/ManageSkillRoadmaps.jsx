import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Map, Plus, Edit2, Trash2, X, Check, Search, AlertCircle, ChevronDown, AlignLeft } from 'lucide-react';

export default function ManageSkillRoadmaps() {
  const { skillsList, addSkillPhase, updateSkillPhase, deleteSkillPhase, loading } = useData();
  const [selectedSkillId, setSelectedSkillId] = useState('');
  
  const [isEditing, setIsEditing] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(null);
  
  const [formData, setFormData] = useState({
    phase_number: 1,
    phase_title: '',
    topic_title: '',
    topic_description: '', // Textarea for line-separated bullets
    display_order: 1
  });
  
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedSkill = skillsList.find(s => s.id === selectedSkillId);
  const phases = selectedSkill?.phases || [];

  const handleOpenCreate = () => {
    setIsEditing(false);
    setCurrentPhase(null);
    setFormData({
      phase_number: phases.length > 0 ? Math.max(...phases.map(p => p.phaseNumber)) + 1 : 1,
      phase_title: '',
      topic_title: '',
      topic_description: '',
      display_order: 1
    });
    setErrorMsg('');
  };

  const handleOpenEdit = (phase, topic) => {
    setIsEditing(true);
    setCurrentPhase({ phase, topic });
    setFormData({
      phase_number: phase.phaseNumber,
      phase_title: phase.phaseTitle,
      topic_title: topic.title,
      topic_description: (topic.description || []).join('\n'), // Join with newline for the textarea
      display_order: topic.order
    });
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      if (!selectedSkillId) throw new Error("Please select a skill first.");

      const dbPayload = {
        skill_id: selectedSkillId,
        phase_number: parseInt(formData.phase_number),
        phase_title: formData.phase_title.trim(),
        topic_title: formData.topic_title.trim(),
        topic_description: formData.topic_description.split('\n').map(s => s.trim()).filter(s => s), // Split by newline
        display_order: parseInt(formData.display_order)
      };

      if (isEditing) {
        const res = await updateSkillPhase(currentPhase.topic.id, dbPayload);
        if (!res.success) throw new Error(res.error);
      } else {
        const res = await addSkillPhase(dbPayload);
        if (!res.success) throw new Error(res.error);
      }
      
      document.getElementById('roadmap-modal').close();
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred while saving.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete the topic "${title}"?`)) {
      const res = await deleteSkillPhase(id);
      if (!res.success) alert(`Error deleting phase: ${res.error}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Map className="text-emerald-600 h-6 w-6" /> Manage Skill Roadmaps
          </h1>
          <p className="text-slate-500 text-sm mt-1">Design step-by-step learning paths for your skills.</p>
        </div>
        <button
          onClick={() => {
            if (!selectedSkillId) return alert('Please select a skill first!');
            handleOpenCreate();
            document.getElementById('roadmap-modal').showModal();
          }}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> Add Roadmap Topic
        </button>
      </div>

      {/* Skill Selector */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <label className="block text-sm font-medium text-slate-700 mb-2">Select a Skill to Manage its Roadmap:</label>
        <div className="relative max-w-md">
          <select
            className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none font-medium text-slate-800"
            value={selectedSkillId}
            onChange={(e) => setSelectedSkillId(e.target.value)}
          >
            <option value="">-- Choose a Skill --</option>
            {skillsList.map(skill => (
              <option key={skill.id} value={skill.id}>{skill.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-3 h-5 w-5 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Roadmap Content */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading...</div>
      ) : selectedSkill ? (
        <div className="space-y-6">
          {phases.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center shadow-sm">
              <Map className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-700 mb-1">No Roadmap Yet</h3>
              <p className="text-slate-500">This skill doesn't have a learning roadmap. Add the first phase to get started!</p>
            </div>
          ) : (
            phases.map(phase => (
              <div key={phase.phaseNumber} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800">
                    Phase {phase.phaseNumber} — {phase.phaseTitle}
                  </h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {phase.topics.map(topic => (
                    <div key={topic.id} className="p-6 flex flex-col sm:flex-row gap-4 justify-between hover:bg-slate-50/50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded">
                            Order: {topic.order}
                          </span>
                          <h4 className="font-bold text-slate-800">{topic.title}</h4>
                        </div>
                        <ul className="list-disc list-inside text-sm text-slate-600 space-y-1 ml-1">
                          {topic.description.map((bullet, i) => (
                            <li key={i}>{bullet}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="flex items-start gap-2 shrink-0">
                        <button
                          onClick={() => {
                            handleOpenEdit(phase, topic);
                            document.getElementById('roadmap-modal').showModal();
                          }}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(topic.id, topic.title)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}

      {/* Modal */}
      <dialog id="roadmap-modal" className="modal bg-transparent p-0 w-full max-w-2xl mx-auto backdrop:bg-slate-900/50 rounded-2xl shadow-2xl">
        <div className="bg-white w-full overflow-hidden flex flex-col max-h-[90vh]">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Map className="h-5 w-5 text-emerald-500" />
              {isEditing ? 'Edit Topic' : 'Add New Topic'}
            </h3>
            <button 
              type="button"
              onClick={() => document.getElementById('roadmap-modal').close()}
              className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 p-1 rounded-full transition-colors border border-transparent hover:border-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto">
            {errorMsg && (
              <div className="mb-6 p-4 bg-rose-50 text-rose-700 text-sm rounded-xl flex items-start gap-3 border border-rose-100/50">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <p>{errorMsg}</p>
              </div>
            )}

            <form id="roadmap-form" onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phase Number</label>
                  <input
                    required
                    type="number"
                    min="1"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-colors text-slate-800"
                    value={formData.phase_number}
                    onChange={e => setFormData({...formData, phase_number: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phase Title (e.g. Python Foundations)</label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-colors text-slate-800"
                    value={formData.phase_title}
                    onChange={e => setFormData({...formData, phase_title: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Topic Title (e.g. Basic Syntax)</label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-colors text-slate-800"
                    value={formData.topic_title}
                    onChange={e => setFormData({...formData, topic_title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Display Order (within phase)</label>
                  <input
                    required
                    type="number"
                    min="1"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-colors text-slate-800"
                    value={formData.display_order}
                    onChange={e => setFormData({...formData, display_order: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center justify-between">
                  <span>Sub-Topics (Bulleted List)</span>
                  <span className="text-xs text-slate-400 font-normal">Type each topic on a new line</span>
                </label>
                <div className="relative">
                  <AlignLeft className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <textarea
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-colors text-slate-800 min-h-[150px]"
                    placeholder="Learn indentation&#10;Comments&#10;Python interpreter"
                    value={formData.topic_description}
                    onChange={e => setFormData({...formData, topic_description: e.target.value})}
                  ></textarea>
                </div>
              </div>
            </form>
          </div>
          
          <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => document.getElementById('roadmap-modal').close()}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="roadmap-form"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
            >
              {isSubmitting ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <Check className="h-4 w-4" />
              )}
              {isSubmitting ? 'Saving...' : 'Save Topic'}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
