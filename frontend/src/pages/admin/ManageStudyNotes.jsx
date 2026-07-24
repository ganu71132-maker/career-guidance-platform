import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { 
  BookOpen, FolderTree, Layers, Book, Bookmark, FileText, 
  Plus, Trash2, Upload, Loader2, AlertCircle, CheckCircle2,
  ListFilter
} from 'lucide-react';

export default function ManageStudyNotes() {
  const [activeTab, setActiveTab] = useState('branches');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // Data states
  const [branches, setBranches] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [units, setUnits] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [resources, setResources] = useState([]);
  const [resourceTypes, setResourceTypes] = useState([]);

  // Form States
  const [branchForm, setBranchForm] = useState({ name: '' });
  const [semesterForm, setSemesterForm] = useState({ branch_id: '', semester_number: '' });
  const [subjectForm, setSubjectForm] = useState({ semester_id: '', name: '', code: '' });
  const [unitForm, setUnitForm] = useState({ subject_id: '', title: '', unit_number: '' });
  const [chapterForm, setChapterForm] = useState({ unit_id: '', title: '', chapter_number: '', difficulty_level: 'Medium' });
  const [resourceForm, setResourceForm] = useState({ chapter_id: '', type_id: '', file: null });

  // Fetch all data
  const fetchData = async () => {
    setInitialLoading(true);
    try {
      const [
        { data: bData },
        { data: smData },
        { data: sbData },
        { data: uData },
        { data: cData },
        { data: rData },
        { data: rtData }
      ] = await Promise.all([
        supabase.from('branches').select('*').order('name'),
        supabase.from('semesters').select('*, branches(name)').order('number'),
        supabase.from('subjects').select('*, semesters(number, branches(name))').order('name'),
        supabase.from('units').select('*, subjects(name)').order('number'),
        supabase.from('chapters').select('*, units(title, subjects(name))').order('number'),
        supabase.from('chapter_resources').select('*, chapters(title), resource_types(name)').order('uploaded_at', { ascending: false }),
        supabase.from('resource_types').select('*').order('name')
      ]);

      setBranches(bData || []);
      setSemesters(smData || []);
      setSubjects(sbData || []);
      setUnits(uData || []);
      setChapters(cData || []);
      setResources(rData || []);
      setResourceTypes(rtData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      showMessage('Failed to load data', 'error');
    }
    setInitialLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const handleDelete = async (table, id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      
      showMessage('Item deleted successfully');
      fetchData();
    } catch (error) {
      console.error(error);
      showMessage('Failed to delete item', 'error');
    }
  };

  const handleAddBranch = async (e) => {
    e.preventDefault();
    if (!branchForm.name) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('branches').insert([{ name: branchForm.name }]);
      if (error) throw error;
      showMessage('Branch added successfully');
      setBranchForm({ name: '' });
      fetchData();
    } catch (error) {
      console.error(error);
      showMessage('Failed to add branch', 'error');
    }
    setLoading(false);
  };

  const handleAddSemester = async (e) => {
    e.preventDefault();
    if (!semesterForm.branch_id || !semesterForm.semester_number) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('semesters').insert([{
        branch_id: semesterForm.branch_id,
        number: parseInt(semesterForm.semester_number, 10)
      }]);
      if (error) throw error;
      showMessage('Semester added successfully');
      setSemesterForm({ branch_id: '', semester_number: '' });
      fetchData();
    } catch (error) {
      console.error(error);
      showMessage('Failed to add semester', 'error');
    }
    setLoading(false);
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!subjectForm.semester_id || !subjectForm.name) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('subjects').insert([{
        semester_id: subjectForm.semester_id,
        name: subjectForm.name
      }]);
      if (error) throw error;
      showMessage('Subject added successfully');
      setSubjectForm({ semester_id: '', name: '', code: '' });
      fetchData();
    } catch (error) {
      console.error(error);
      showMessage('Failed to add subject', 'error');
    }
    setLoading(false);
  };

  const handleAddUnit = async (e) => {
    e.preventDefault();
    if (!unitForm.subject_id || !unitForm.title || !unitForm.unit_number) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('units').insert([{
        subject_id: unitForm.subject_id,
        title: unitForm.title,
        number: parseInt(unitForm.unit_number, 10)
      }]);
      if (error) throw error;
      showMessage('Unit added successfully');
      setUnitForm({ subject_id: '', title: '', unit_number: '' });
      fetchData();
    } catch (error) {
      console.error(error);
      showMessage('Failed to add unit', 'error');
    }
    setLoading(false);
  };

  const handleAddChapter = async (e) => {
    e.preventDefault();
    if (!chapterForm.unit_id || !chapterForm.title || !chapterForm.chapter_number) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('chapters').insert([{
        unit_id: chapterForm.unit_id,
        title: chapterForm.title,
        number: parseInt(chapterForm.chapter_number, 10),
        difficulty: chapterForm.difficulty_level
      }]);
      if (error) throw error;
      showMessage('Chapter added successfully');
      setChapterForm({ unit_id: '', title: '', chapter_number: '', difficulty_level: 'Medium' });
      fetchData();
    } catch (error) {
      console.error(error);
      showMessage('Failed to add chapter', 'error');
    }
    setLoading(false);
  };

  const handleAddResource = async (e) => {
    e.preventDefault();
    if (!resourceForm.chapter_id || !resourceForm.type_id || !resourceForm.file) return;
    setLoading(true);
    
    try {
      const file = resourceForm.file;
      const filePath = `resources/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
      
      const { error: uploadErr } = await supabase.storage
        .from('study-notes-private')
        .upload(filePath, file);
        
      if (uploadErr) throw uploadErr;

      const { error: dbErr } = await supabase.from('chapter_resources').insert([{
        chapter_id: resourceForm.chapter_id,
        type_id: resourceForm.type_id,
        file_path: filePath,
        file_name: file.name,
        mime_type: file.type || 'application/pdf',
        size_bytes: file.size
      }]);

      if (dbErr) throw dbErr;

      showMessage('Resource uploaded successfully');
      setResourceForm({ chapter_id: '', type_id: '', file: null });
      fetchData();
    } catch (error) {
      console.error(error);
      showMessage('Failed to upload resource: ' + (error.message || 'Error'), 'error');
    }
    setLoading(false);
  };

  const tabs = [
    { id: 'branches', label: 'Branches', icon: FolderTree },
    { id: 'semesters', label: 'Semesters', icon: Layers },
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
    { id: 'units', label: 'Units', icon: Book },
    { id: 'chapters', label: 'Chapters', icon: Bookmark },
    { id: 'resources', label: 'Resources', icon: FileText },
  ];

  if (initialLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Study Notes</h1>
          <p className="text-sm text-slate-500">Organize branches, semesters, subjects, and study materials.</p>
        </div>

        {/* Message Banner */}
        {message.text && (
          <div className={`p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}>
            {message.type === 'error' ? <AlertCircle className="h-5 w-5 shrink-0" /> : <CheckCircle2 className="h-5 w-5 shrink-0" />}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-slate-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                    ${activeTab === tab.id 
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Form Column */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Plus className="h-5 w-5 text-emerald-500" />
                Add New {tabs.find(t => t.id === activeTab)?.label.slice(0, -1)}
              </h2>

              {/* BRANCHES FORM */}
              {activeTab === 'branches' && (
                <form onSubmit={handleAddBranch} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Branch Name</label>
                    <input
                      type="text"
                      required
                      className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                      value={branchForm.name}
                      onChange={(e) => setBranchForm({...branchForm, name: e.target.value})}
                      placeholder="e.g. Computer Science"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save Branch'}
                  </button>
                </form>
              )}

              {/* SEMESTERS FORM */}
              {activeTab === 'semesters' && (
                <form onSubmit={handleAddSemester} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Branch</label>
                    <select
                      required
                      className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                      value={semesterForm.branch_id}
                      onChange={(e) => setSemesterForm({...semesterForm, branch_id: e.target.value})}
                    >
                      <option value="">Select Branch</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Semester Number</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="8"
                      className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                      value={semesterForm.semester_number}
                      onChange={(e) => setSemesterForm({...semesterForm, semester_number: e.target.value})}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save Semester'}
                  </button>
                </form>
              )}

              {/* SUBJECTS FORM */}
              {activeTab === 'subjects' && (
                <form onSubmit={handleAddSubject} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Semester</label>
                    <select
                      required
                      className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                      value={subjectForm.semester_id}
                      onChange={(e) => setSubjectForm({...subjectForm, semester_id: e.target.value})}
                    >
                      <option value="">Select Semester</option>
                      {semesters.map(s => (
                        <option key={s.id} value={s.id}>
                          Semester {s.number} - {s.branches?.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Subject Name</label>
                    <input
                      type="text"
                      required
                      className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                      value={subjectForm.name}
                      onChange={(e) => setSubjectForm({...subjectForm, name: e.target.value})}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save Subject'}
                  </button>
                </form>
              )}

              {/* UNITS FORM */}
              {activeTab === 'units' && (
                <form onSubmit={handleAddUnit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Subject</label>
                    <select
                      required
                      className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                      value={unitForm.subject_id}
                      onChange={(e) => setUnitForm({...unitForm, subject_id: e.target.value})}
                    >
                      <option value="">Select Subject</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Unit Number</label>
                    <input
                      type="number"
                      required
                      min="1"
                      className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                      value={unitForm.unit_number}
                      onChange={(e) => setUnitForm({...unitForm, unit_number: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Unit Title</label>
                    <input
                      type="text"
                      required
                      className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                      value={unitForm.title}
                      onChange={(e) => setUnitForm({...unitForm, title: e.target.value})}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save Unit'}
                  </button>
                </form>
              )}

              {/* CHAPTERS FORM */}
              {activeTab === 'chapters' && (
                <form onSubmit={handleAddChapter} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Unit</label>
                    <select
                      required
                      className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                      value={chapterForm.unit_id}
                      onChange={(e) => setChapterForm({...chapterForm, unit_id: e.target.value})}
                    >
                      <option value="">Select Unit</option>
                      {units.map(u => (
                        <option key={u.id} value={u.id}>Unit {u.number}: {u.title} ({u.subjects?.name})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Chapter Number</label>
                    <input
                      type="number"
                      required
                      min="1"
                      className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                      value={chapterForm.chapter_number}
                      onChange={(e) => setChapterForm({...chapterForm, chapter_number: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Chapter Title</label>
                    <input
                      type="text"
                      required
                      className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                      value={chapterForm.title}
                      onChange={(e) => setChapterForm({...chapterForm, title: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Difficulty Level</label>
                    <select
                      className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                      value={chapterForm.difficulty_level}
                      onChange={(e) => setChapterForm({...chapterForm, difficulty_level: e.target.value})}
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save Chapter'}
                  </button>
                </form>
              )}

              {/* RESOURCES FORM */}
              {activeTab === 'resources' && (
                <form onSubmit={handleAddResource} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Chapter</label>
                    <select
                      required
                      className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                      value={resourceForm.chapter_id}
                      onChange={(e) => setResourceForm({...resourceForm, chapter_id: e.target.value})}
                    >
                      <option value="">Select Chapter</option>
                      {chapters.map(c => (
                        <option key={c.id} value={c.id}>{c.title} ({c.units?.subjects?.name})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Resource Type</label>
                    <select
                      required
                      className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                      value={resourceForm.type_id}
                      onChange={(e) => setResourceForm({...resourceForm, type_id: e.target.value})}
                    >
                      <option value="">Select Type</option>
                      {resourceTypes.map(rt => (
                        <option key={rt.id} value={rt.id}>{rt.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Upload File</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md relative hover:bg-slate-50 transition-colors">
                      <div className="space-y-1 text-center">
                        <Upload className="mx-auto h-12 w-12 text-slate-400" />
                        <div className="flex text-sm text-slate-600">
                          <label htmlFor="file-upload" className="relative cursor-pointer bg-transparent rounded-md font-medium text-emerald-600 hover:text-emerald-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-emerald-500">
                            <span>Upload a file</span>
                            <input 
                              id="file-upload" 
                              name="file-upload" 
                              type="file" 
                              className="sr-only" 
                              required
                              onChange={(e) => setResourceForm({...resourceForm, file: e.target.files[0]})}
                            />
                          </label>
                        </div>
                        <p className="text-xs text-slate-500">
                          {resourceForm.file ? resourceForm.file.name : 'PDF, DOCX, etc.'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !resourceForm.file}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Upload Resource'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* List Column */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <h3 className="text-lg font-medium text-slate-900 flex items-center gap-2">
                  <ListFilter className="h-5 w-5 text-slate-500" />
                  Existing {tabs.find(t => t.id === activeTab)?.label}
                </h3>
              </div>
              <ul className="divide-y divide-slate-200 max-h-[600px] overflow-y-auto">
                {activeTab === 'branches' && branches.map(item => (
                  <li key={item.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50">
                    <span className="text-sm font-medium text-slate-900">{item.name}</span>
                    <button onClick={() => handleDelete('branches', item.id)} className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}

                {activeTab === 'semesters' && semesters.map(item => (
                  <li key={item.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <p className="text-sm font-medium text-slate-900">Semester {item.number}</p>
                      <p className="text-xs text-slate-500">{item.branches?.name}</p>
                    </div>
                    <button onClick={() => handleDelete('semesters', item.id)} className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}

                {activeTab === 'subjects' && subjects.map(item => (
                  <li key={item.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">Semester {item.semesters?.number} - {item.semesters?.branches?.name}</p>
                    </div>
                    <button onClick={() => handleDelete('subjects', item.id)} className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}

                {activeTab === 'units' && units.map(item => (
                  <li key={item.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <p className="text-sm font-medium text-slate-900">Unit {item.number}: {item.title}</p>
                      <p className="text-xs text-slate-500">{item.subjects?.name}</p>
                    </div>
                    <button onClick={() => handleDelete('units', item.id)} className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}

                {activeTab === 'chapters' && chapters.map(item => (
                  <li key={item.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <p className="text-sm font-medium text-slate-900">Ch {item.number}: {item.title}</p>
                      <p className="text-xs text-slate-500">{item.units?.subjects?.name} - {item.units?.title}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${item.difficulty === 'Easy' ? 'bg-green-100 text-green-700' : item.difficulty === 'Hard' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {item.difficulty}
                      </span>
                      <button onClick={() => handleDelete('chapters', item.id)} className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}

                {activeTab === 'resources' && resources.map(item => (
                  <li key={item.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{item.file_name}</p>
                        <p className="text-xs text-slate-500">{item.chapters?.title} • {item.resource_types?.name}</p>
                      </div>
                    </div>
                    <button onClick={() => handleDelete('chapter_resources', item.id)} className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}

                {/* Empty states */}
                {activeTab === 'branches' && branches.length === 0 && <EmptyState name="branches" />}
                {activeTab === 'semesters' && semesters.length === 0 && <EmptyState name="semesters" />}
                {activeTab === 'subjects' && subjects.length === 0 && <EmptyState name="subjects" />}
                {activeTab === 'units' && units.length === 0 && <EmptyState name="units" />}
                {activeTab === 'chapters' && chapters.length === 0 && <EmptyState name="chapters" />}
                {activeTab === 'resources' && resources.length === 0 && <EmptyState name="resources" />}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

const EmptyState = ({ name }) => (
  <li className="px-6 py-8 text-center text-slate-500 text-sm">
    No {name} found. Create one to get started.
  </li>
);
