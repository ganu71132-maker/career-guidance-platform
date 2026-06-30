import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Code2, Plus, Edit2, Trash2, X, Check, Search, AlertCircle } from 'lucide-react';

export default function ManageSkills() {
  const { skillsList, addSkill, updateSkill, deleteSkill, loading } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isEditing, setIsEditing] = useState(false);
  const [currentSkill, setCurrentSkill] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    difficulty: 'Beginner',
    estimated_time: '',
    skills_gained: '',
    career_opportunities: ''
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredSkills = skillsList.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenCreate = () => {
    setIsEditing(false);
    setCurrentSkill(null);
    setFormData({
      name: '',
      description: '',
      difficulty: 'Beginner',
      estimated_time: '',
      skills_gained: '',
      career_opportunities: ''
    });
    setErrorMsg('');
  };

  const handleOpenEdit = (skill) => {
    setIsEditing(true);
    setCurrentSkill(skill);
    setFormData({
      name: skill.name,
      description: skill.description || '',
      difficulty: skill.difficulty || 'Beginner',
      estimated_time: skill.estimatedTime || '',
      skills_gained: (skill.skillsGained || []).join(', '),
      career_opportunities: (skill.careerOpportunities || []).join(', ')
    });
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const dbPayload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        difficulty: formData.difficulty,
        estimated_time: formData.estimated_time.trim(),
        skills_gained: formData.skills_gained.split(',').map(s => s.trim()).filter(s => s),
        career_opportunities: formData.career_opportunities.split(',').map(s => s.trim()).filter(s => s)
      };

      if (isEditing) {
        const res = await updateSkill(currentSkill.id, dbPayload);
        if (!res.success) throw new Error(res.error);
      } else {
        const res = await addSkill(dbPayload);
        if (!res.success) throw new Error(res.error);
      }
      
      // Close modal by clearing currentSkill
      document.getElementById('skill-modal').close();
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred while saving.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}? This will also delete all roadmaps associated with it.`)) {
      const res = await deleteSkill(id);
      if (!res.success) alert(`Error deleting skill: ${res.error}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Code2 className="text-indigo-600 h-6 w-6" /> Manage Skills
          </h1>
          <p className="text-slate-500 text-sm mt-1">Add or edit skills and their metadata.</p>
        </div>
        <button
          onClick={() => {
            handleOpenCreate();
            document.getElementById('skill-modal').showModal();
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> Add New Skill
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search skills..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading skills...</div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
                <th className="p-4">Skill Name</th>
                <th className="p-4">Difficulty</th>
                <th className="p-4">Time</th>
                <th className="p-4">Phases</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSkills.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500">
                    No skills found. Click "Add New Skill" to create one.
                  </td>
                </tr>
              ) : (
                filteredSkills.map(skill => (
                  <tr key={skill.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-slate-800">{skill.name}</div>
                      <div className="text-xs text-slate-500 truncate max-w-xs">{skill.description}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                        {skill.difficulty}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-600">
                      {skill.estimatedTime}
                    </td>
                    <td className="p-4 text-sm text-slate-600 font-medium">
                      {skill.phases?.length || 0} Phases
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            handleOpenEdit(skill);
                            document.getElementById('skill-modal').showModal();
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(skill.id, skill.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <dialog id="skill-modal" className="modal bg-transparent p-0 w-full max-w-2xl mx-auto backdrop:bg-slate-900/50 rounded-2xl shadow-2xl">
        <div className="bg-white w-full overflow-hidden flex flex-col max-h-[90vh]">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Code2 className="h-5 w-5 text-indigo-500" />
              {isEditing ? 'Edit Skill' : 'Create New Skill'}
            </h3>
            <button 
              type="button"
              onClick={() => document.getElementById('skill-modal').close()}
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

            <form id="skill-form" onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Skill Name *</label>
                <input
                  required
                  type="text"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-colors text-slate-800"
                  placeholder="e.g. Python, React, SQL"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Short Description</label>
                <textarea
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-colors text-slate-800 min-h-[100px]"
                  placeholder="A brief overview of what this skill is..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Difficulty</label>
                  <select
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-colors text-slate-800 appearance-none"
                    value={formData.difficulty}
                    onChange={e => setFormData({...formData, difficulty: e.target.value})}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Estimated Time</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-colors text-slate-800"
                    placeholder="e.g. 3–6 Months"
                    value={formData.estimated_time}
                    onChange={e => setFormData({...formData, estimated_time: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Skills You'll Gain (Comma separated)</label>
                <textarea
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-colors text-slate-800"
                  placeholder="e.g. Web Scraping, Data Analysis, API Development"
                  value={formData.skills_gained}
                  onChange={e => setFormData({...formData, skills_gained: e.target.value})}
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Career Opportunities (Comma separated)</label>
                <textarea
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-colors text-slate-800"
                  placeholder="e.g. Python Developer, Backend Engineer, Data Analyst"
                  value={formData.career_opportunities}
                  onChange={e => setFormData({...formData, career_opportunities: e.target.value})}
                ></textarea>
              </div>
            </form>
          </div>
          
          <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => document.getElementById('skill-modal').close()}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="skill-form"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
            >
              {isSubmitting ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <Check className="h-4 w-4" />
              )}
              {isSubmitting ? 'Saving...' : 'Save Skill'}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
