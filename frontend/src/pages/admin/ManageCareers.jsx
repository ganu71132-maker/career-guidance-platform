import React, { useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useData } from '../../contexts/DataContext';
import { Plus, Pencil, Trash2, X, Save, Search, GraduationCap } from 'lucide-react';

const AVAILABLE_FIELDS = ['CSE', 'IT', 'ECE', 'EEE', 'ME', 'CE', 'BioTech', 'Mathematics', 'Design', 'Commerce', 'Science'];

const emptyCareer = {
  title: '', description: '', category: '', salary: '',
  demandLevel: 'High', growthPotential: '', requiredSkills: [],
  jobOpportunities: [], industryDemand: '', field: [],
};

export default function ManageCareers() {
  const { careers, addCareer, updateCareer, deleteCareer } = useData();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null); // career id or null
  const [form, setForm] = useState(emptyCareer);
  const [skillInput, setSkillInput] = useState('');
  const [jobInput, setJobInput] = useState('');
  const [fieldInput, setFieldInput] = useState('');
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Merge predefined fields with any custom fields already used in existing careers (normalized)
  const allFields = [...new Set([
    ...AVAILABLE_FIELDS.map(f => f.trim().toUpperCase()),
    ...careers.flatMap(c => (c.field || []).map(f => f.trim().toUpperCase())),
    ...(form.field || []).map(f => f.trim().toUpperCase()),
  ])].filter(Boolean);

  function openAdd() {
    setForm(emptyCareer); setEditing(null); setShowForm(true); setSkillInput(''); setJobInput('');
  }

  function openEdit(career) {
    setForm({
      title: career.title, description: career.description, category: career.category,
      salary: career.salary, demandLevel: career.demandLevel, growthPotential: career.growthPotential,
      requiredSkills: [...career.requiredSkills], jobOpportunities: [...career.jobOpportunities],
      industryDemand: career.industryDemand, field: [...(career.field || [])],
    });
    setEditing(career.id); setShowForm(true); setSkillInput(''); setJobInput('');
  }

  function handleSave() {
    if (!form.title || !form.category) return;
    if (editing) {
      updateCareer(editing, form);
    } else {
      addCareer(form);
    }
    setShowForm(false); setEditing(null);
  }

  function addSkill() {
    if (skillInput.trim()) {
      setForm(f => ({ ...f, requiredSkills: [...f.requiredSkills, skillInput.trim()] }));
      setSkillInput('');
    }
  }

  function removeSkill(i) {
    setForm(f => ({ ...f, requiredSkills: f.requiredSkills.filter((_, idx) => idx !== i) }));
  }

  function addJob() {
    if (jobInput.trim()) {
      setForm(f => ({ ...f, jobOpportunities: [...f.jobOpportunities, jobInput.trim()] }));
      setJobInput('');
    }
  }

  function removeJob(i) {
    setForm(f => ({ ...f, jobOpportunities: f.jobOpportunities.filter((_, idx) => idx !== i) }));
  }

  function handleDelete(id) {
    deleteCareer(id);
    setConfirmDelete(null);
  }

  const filtered = careers.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-1">Manage Careers</h1>
          <p className="text-slate-500 text-sm">Add, edit, or delete careers that users can explore.</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-md shadow-emerald-600/20">
          <Plus className="h-5 w-5" /> Add Career
        </button>
      </header>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
        <input type="text" placeholder="Search careers..."
          className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 placeholder-slate-400 shadow-sm"
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Careers Table */}
      <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 bg-slate-50/50">
                <th className="text-left px-6 py-3 font-medium">Career</th>
                <th className="text-left px-6 py-3 font-medium">Category</th>
                <th className="text-left px-6 py-3 font-medium">Fields</th>
                <th className="text-left px-6 py-3 font-medium">Salary</th>
                <th className="text-left px-6 py-3 font-medium">Demand</th>
                <th className="text-left px-6 py-3 font-medium">Steps</th>
                <th className="text-right px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(career => (
                <tr key={career.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-800">{career.title}</td>
                  <td className="px-6 py-4"><span className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-slate-600 text-xs">{career.category}</span></td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {(career.field || []).length > 0 ? career.field.map(f => (
                        <span key={f} className="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded text-[10px] font-medium">{f}</span>
                      )) : <span className="text-slate-400 text-xs">—</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{career.salary}</td>
                  <td className="px-6 py-4 text-emerald-600 font-semibold">{career.demandLevel}</td>
                  <td className="px-6 py-4 text-slate-500">{career.roadmap.length}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(career)}
                        className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors" title="Edit">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => setConfirmDelete(career.id)}
                        className="p-2 hover:bg-red-50 rounded-lg text-red-500 hover:text-red-700 transition-colors" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-500 font-medium">No careers found.</div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-bold text-slate-800 mb-3">Delete Career?</h3>
            <p className="text-slate-500 text-sm mb-6">This will also delete all roadmap steps and resources. This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-500 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800">{editing ? 'Edit Career' : 'Add New Career'}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Career Title *</label>
                  <input type="text" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    placeholder="e.g. AI Engineer" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Category *</label>
                  <input type="text" value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    placeholder="e.g. AI & ML" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={3}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                  placeholder="Brief career description..." />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Salary Range</label>
                  <input type="text" value={form.salary} onChange={e => setForm(f => ({...f, salary: e.target.value}))}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    placeholder="e.g. 10 LPA - 18 LPA" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Demand Level</label>
                  <select value={form.demandLevel} onChange={e => setForm(f => ({...f, demandLevel: e.target.value}))}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
                    <option value="Very High">Very High</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Growth Potential</label>
                  <input type="text" value={form.growthPotential} onChange={e => setForm(f => ({...f, growthPotential: e.target.value}))}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    placeholder="30% growth in 5 years" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Industry Demand</label>
                <textarea value={form.industryDemand} onChange={e => setForm(f => ({...f, industryDemand: e.target.value}))} rows={2}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                  placeholder="Explain why this career is in demand..." />
              </div>

              {/* Field / Branch Selection */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4 text-blue-500" /> Relevant Branches / Fields
                </label>
                <p className="text-xs text-slate-400 mb-3">Select all educational branches this career is relevant to.</p>
                <div className="flex flex-wrap gap-2">
                  {allFields.map(field => {
                    const isSelected = (form.field || []).map(x => x.trim().toUpperCase()).includes(field);
                    return (
                      <button
                        key={field}
                        type="button"
                        onClick={() => {
                          setForm(f => {
                            const currentFields = (f.field || []).map(x => x.trim().toUpperCase());
                            const nextFields = isSelected
                              ? currentFields.filter(x => x !== field)
                              : [...currentFields, field];
                            return { ...f, field: nextFields };
                          });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-600/20'
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200'
                        }`}
                      >
                        {isSelected ? '✓ ' : ''}{field}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2 mt-3">
                  <input type="text" value={fieldInput} onChange={e => setFieldInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = fieldInput.trim().toUpperCase();
                        if (val && !((form.field || []).map(x => x.trim().toUpperCase()).includes(val))) {
                          setForm(f => ({ ...f, field: [...(f.field || []), val] }));
                        }
                        setFieldInput('');
                      }
                    }}
                    className="flex-1 bg-white border border-slate-200 rounded-xl py-2 px-4 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="Add custom field & press Enter" />
                  <button type="button" onClick={() => {
                    const val = fieldInput.trim().toUpperCase();
                    if (val && !((form.field || []).map(x => x.trim().toUpperCase()).includes(val))) {
                      setForm(f => ({ ...f, field: [...(f.field || []), val] }));
                    }
                    setFieldInput('');
                  }} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors">Add</button>
                </div>
              </div>

              {/* Skills */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Required Skills</label>
                <div className="flex gap-2 mb-2">
                  <input type="text" value={skillInput} onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    className="flex-1 bg-white border border-slate-200 rounded-xl py-2 px-4 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    placeholder="Type skill & press Enter" />
                  <button onClick={addSkill} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-colors">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.requiredSkills.map((s, i) => (
                    <span key={i} className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-sm font-medium">
                      {s} <button onClick={() => removeSkill(i)} className="hover:text-red-600 transition-colors"><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Job Opportunities */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Job Opportunities</label>
                <div className="flex gap-2 mb-2">
                  <input type="text" value={jobInput} onChange={e => setJobInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addJob())}
                    className="flex-1 bg-white border border-slate-200 rounded-xl py-2 px-4 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    placeholder="Type job title & press Enter" />
                  <button onClick={addJob} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-colors">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.jobOpportunities.map((j, i) => (
                    <span key={i} className="flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 border border-purple-100 rounded-lg text-sm font-medium">
                      {j} <button onClick={() => removeJob(i)} className="hover:text-red-600 transition-colors"><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors">Cancel</button>
              <button onClick={handleSave} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2">
                <Save className="h-4 w-4" /> {editing ? 'Save Changes' : 'Create Career'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
