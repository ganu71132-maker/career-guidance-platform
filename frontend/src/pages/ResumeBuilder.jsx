import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { supabase } from '../lib/supabase';
import { useChat } from '../contexts/ChatContext';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, User, Briefcase, GraduationCap, Code, Lightbulb, 
  FileText, Sparkles, Download, Save, Plus, Trash, Globe, 
  Phone, Mail, MapPin, ChevronRight, Eye, Check, Link2
} from 'lucide-react';

export default function ResumeBuilder() {
  const { user } = useAuth();
  const { openChatWithContext } = useChat();
  const { careers: careersData, completedSteps, savedCareers } = useData();

  // Tab State
  const [activeTab, setActiveTab] = useState('personal');

  // Loading & Toast States
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Template State
  const [selectedTemplate, setSelectedTemplate] = useState('modern');

  // Resume Data State
  const [personalInfo, setPersonalInfo] = useState({
    fullName: user?.user_metadata?.full_name || '',
    professionalTitle: '',
    careerPath: '',
    autoFillTitle: true,
    email: user?.email || '',
    phone: '',
    location: '',
    github: '',
    linkedin: '',
    portfolio: ''
  });
  
  const [summary, setSummary] = useState('');
  
  const [experience, setExperience] = useState([
    { id: '1', company: '', role: '', startDate: '', endDate: '', description: '' }
  ]);
  
  const [education, setEducation] = useState([
    { id: '1', institution: '', degree: '', year: '', gpa: '' }
  ]);
  
  const [projects, setProjects] = useState([
    { id: '1', title: '', description: '', technologies: '' }
  ]);
  
  const [technicalSkills, setTechnicalSkills] = useState([]);
  const [softSkills, setSoftSkills] = useState([]);
  
  // Custom Skill Input States
  const [newTechSkill, setNewTechSkill] = useState('');
  const [newSoftSkill, setNewSoftSkill] = useState('');

  // Toast Trigger Helper
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  // ======== LOAD SAVED RESUME FROM SUPABASE ========
  const initialLoadDone = React.useRef(false);
  
  useEffect(() => {
    async function loadResume() {
      if (!user || initialLoadDone.current) return;
      initialLoadDone.current = true;
      setLoading(true);
      try {
        // Fetch profile
        const { data: profile, error: profileErr } = await supabase
          .from('resume_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileErr) throw profileErr;
        
        if (profile) {
          setPersonalInfo({
            fullName: profile.full_name || '',
            professionalTitle: profile.professional_title || '',
            careerPath: profile.career_path || '',
            autoFillTitle: profile.auto_fill_title !== false,
            email: profile.email || '',
            phone: profile.phone || '',
            location: profile.location || '',
            github: profile.github || '',
            linkedin: profile.linkedin || '',
            portfolio: profile.portfolio || ''
          });
          setSummary(profile.summary || '');
          setSelectedTemplate(profile.template || 'modern');

          // Fetch Experience
          const { data: expData, error: expErr } = await supabase
            .from('resume_experience')
            .select('*')
            .eq('resume_id', profile.id);
          if (expErr) throw expErr;
          if (expData && expData.length > 0) {
            setExperience(expData.map(e => ({
              id: e.id,
              company: e.company,
              role: e.role,
              startDate: e.start_date || '',
              endDate: e.end_date || '',
              description: e.description || ''
            })));
          }

          // Fetch Education
          const { data: eduData, error: eduErr } = await supabase
            .from('resume_education')
            .select('*')
            .eq('resume_id', profile.id);
          if (eduErr) throw eduErr;
          if (eduData && eduData.length > 0) {
            setEducation(eduData.map(e => ({
              id: e.id,
              institution: e.institution,
              degree: e.degree,
              year: e.year || '',
              gpa: e.gpa || ''
            })));
          }

          // Fetch Projects
          const { data: projData, error: projErr } = await supabase
            .from('resume_projects')
            .select('*')
            .eq('resume_id', profile.id);
          if (projErr) throw projErr;
          if (projData && projData.length > 0) {
            setProjects(projData.map(p => ({
              id: p.id,
              title: p.title,
              description: p.description || '',
              technologies: p.technologies || ''
            })));
          }

          // Fetch Skills
          const { data: skillData, error: skillErr } = await supabase
            .from('resume_skills')
            .select('*')
            .eq('resume_id', profile.id);
          if (skillErr) throw skillErr;
          if (skillData) {
            const tech = skillData.filter(s => s.skill_type === 'technical').map(s => s.skill_name);
            const soft = skillData.filter(s => s.skill_type === 'soft').map(s => s.skill_name);
            setTechnicalSkills(tech);
            setSoftSkills(soft);
          }
        }
      } catch (err) {
        console.error('Error loading resume:', err);
        showToast('Failed to load saved resume.', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadResume();
  }, [user?.id]);

  // ======== SAVE RESUME TO SUPABASE ========
  const handleSaveResume = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Upsert Profile
      const { data: existingProfile } = await supabase
        .from('resume_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const profilePayload = {
        user_id: user.id,
        full_name: personalInfo.fullName,
        professional_title: personalInfo.professionalTitle || '',
        career_path: personalInfo.careerPath || '',
        auto_fill_title: personalInfo.autoFillTitle !== false,
        email: personalInfo.email,
        phone: personalInfo.phone,
        location: personalInfo.location,
        github: personalInfo.github,
        linkedin: personalInfo.linkedin,
        portfolio: personalInfo.portfolio,
        summary: summary,
        template: selectedTemplate,
        updated_at: new Date().toISOString()
      };

      let profileId;
      if (existingProfile) {
        profileId = existingProfile.id;
        const { error } = await supabase
          .from('resume_profiles')
          .update(profilePayload)
          .eq('id', profileId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('resume_profiles')
          .insert(profilePayload)
          .select('id')
          .single();
        if (error) throw error;
        profileId = data.id;
      }

      // 2. Clear and Save Experience
      const { error: delExpErr } = await supabase.from('resume_experience').delete().eq('resume_id', profileId);
      if (delExpErr) throw delExpErr;

      const validExp = experience.filter(e => e.company || e.role);
      if (validExp.length > 0) {
        const { error: insExpErr } = await supabase.from('resume_experience').insert(
          validExp.map(e => ({
            resume_id: profileId,
            company: e.company,
            role: e.role,
            start_date: e.startDate,
            end_date: e.endDate,
            description: e.description
          }))
        );
        if (insExpErr) throw insExpErr;
      }

      // 3. Clear and Save Education
      const { error: delEduErr } = await supabase.from('resume_education').delete().eq('resume_id', profileId);
      if (delEduErr) throw delEduErr;

      const validEdu = education.filter(e => e.institution || e.degree);
      if (validEdu.length > 0) {
        const { error: insEduErr } = await supabase.from('resume_education').insert(
          validEdu.map(e => ({
            resume_id: profileId,
            institution: e.institution,
            degree: e.degree,
            year: e.year,
            gpa: e.gpa
          }))
        );
        if (insEduErr) throw insEduErr;
      }

      // 4. Clear and Save Projects
      const { error: delProjErr } = await supabase.from('resume_projects').delete().eq('resume_id', profileId);
      if (delProjErr) throw delProjErr;

      const validProj = projects.filter(p => p.title);
      if (validProj.length > 0) {
        const { error: insProjErr } = await supabase.from('resume_projects').insert(
          validProj.map(p => ({
            resume_id: profileId,
            title: p.title,
            description: p.description,
            technologies: p.technologies
          }))
        );
        if (insProjErr) throw insProjErr;
      }

      // 5. Clear and Save Skills
      const { error: delSkillErr } = await supabase.from('resume_skills').delete().eq('resume_id', profileId);
      if (delSkillErr) throw delSkillErr;

      const skillsPayload = [
        ...technicalSkills.map(s => ({ resume_id: profileId, skill_name: s, skill_type: 'technical' })),
        ...softSkills.map(s => ({ resume_id: profileId, skill_name: s, skill_type: 'soft' }))
      ];

      if (skillsPayload.length > 0) {
        const { error: insSkillErr } = await supabase.from('resume_skills').insert(skillsPayload);
        if (insSkillErr) throw insSkillErr;
      }

      showToast('Resume saved successfully!');
    } catch (err) {
      console.error('Error saving resume:', err);
      showToast('Failed to save resume.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ======== AUTO-FILL FROM PLATFORM DATA ========
  const getRoadmapSuggestions = () => {
    const techSkillsSet = new Set();
    const projSuggestions = [];

    careersData.forEach(career => {
      career.roadmap.forEach(step => {
        // Only inspect completed steps
        if (completedSteps.includes(step.id)) {
          // Extract skills based on step keywords or titles
          const stepTitle = step.title.toLowerCase();
          
          // Technical Keywords matching
          if (stepTitle.includes('python')) techSkillsSet.add('Python');
          if (stepTitle.includes('javascript') || stepTitle.includes('js')) techSkillsSet.add('JavaScript');
          if (stepTitle.includes('react')) techSkillsSet.add('React.js');
          if (stepTitle.includes('node')) techSkillsSet.add('Node.js');
          if (stepTitle.includes('sql') || stepTitle.includes('postgres') || stepTitle.includes('database')) techSkillsSet.add('SQL');
          if (stepTitle.includes('machine learning') || stepTitle.includes('ml')) techSkillsSet.add('Machine Learning');
          if (stepTitle.includes('deep learning')) techSkillsSet.add('Deep Learning');
          if (stepTitle.includes('statistics') || stepTitle.includes('math')) techSkillsSet.add('Statistics & Math');
          if (stepTitle.includes('cyber') || stepTitle.includes('security')) techSkillsSet.add('Cybersecurity');
          if (stepTitle.includes('docker') || stepTitle.includes('kubernetes')) techSkillsSet.add('DevOps (Docker/K8s)');
          if (stepTitle.includes('aws') || stepTitle.includes('cloud')) techSkillsSet.add('AWS Cloud');
          if (stepTitle.includes('figma') || stepTitle.includes('design')) techSkillsSet.add('Figma (UI/UX Design)');
          if (stepTitle.includes('linux')) techSkillsSet.add('Linux Administration');

          // Extract skills from career requiredSkills directly
          career.requiredSkills.forEach(skill => {
            // Suggest if it intersects or just generally suggest
            if (savedCareers.includes(career.id)) {
              techSkillsSet.add(skill);
            }
          });

          // Check if step contains projects in resources or title
          const stepResources = step.resources || [];
          stepResources.forEach(res => {
            if (res.type === 'project') {
              projSuggestions.push({
                title: res.title,
                description: `A hands-on implementation project completed as part of the ${career.title} path.`,
                technologies: career.requiredSkills.slice(0, 3).join(', ')
              });
            }
          });
        }
      });
    });

    return {
      skills: Array.from(techSkillsSet),
      projects: projSuggestions
    };
  };

  const handleImportSkills = () => {
    const { skills } = getRoadmapSuggestions();
    if (skills.length === 0) {
      showToast('No completed roadmap skills found to import.', 'error');
      return;
    }
    const merged = Array.from(new Set([...technicalSkills, ...skills]));
    setTechnicalSkills(merged);
    showToast(`Imported ${skills.length} skills from your active roadmaps!`);
  };

  const handleImportProjects = () => {
    const { projects: importedProjs } = getRoadmapSuggestions();
    if (importedProjs.length === 0) {
      showToast('No completed projects found in your roadmaps.', 'error');
      return;
    }

    // Filter out duplicates
    const existingTitles = new Set(projects.map(p => p.title.toLowerCase()));
    const newProjs = importedProjs.filter(p => !existingTitles.has(p.title.toLowerCase()));

    if (newProjs.length === 0) {
      showToast('Projects already imported.');
      return;
    }

    setProjects(prev => {
      // If the first element is empty, replace it
      if (prev.length === 1 && !prev[0].title) {
        return newProjs.map((p, idx) => ({ id: String(idx + 1), ...p }));
      }
      return [...prev, ...newProjs.map((p, idx) => ({ id: String(prev.length + idx + 1), ...p }))];
    });
    showToast(`Imported ${newProjs.length} project templates!`);
  };

  // ======== LOCAL AI PROFESSIONAL SUMMARY GENERATOR ========
  const handleGenerateSummary = () => {
    const activeCareer = savedCareers.length > 0 
      ? careersData.find(c => savedCareers.includes(c.id))?.title || 'Professional'
      : 'Software Engineer';

    const topSkills = technicalSkills.slice(0, 4).join(', ') || 'React, JavaScript, SQL, and Git';
    const eduInfo = education[0]?.degree 
      ? `graduated with a degree in ${education[0].degree} from ${education[0].institution || 'University'}`
      : 'experienced professional';

    const generated = `Highly motivated and detail-oriented ${activeCareer} with hands-on expertise in ${topSkills}. Having ${eduInfo}, I possess a strong foundation in problem-solving and software methodologies. Passionate about building robust, modern solutions, collaborating with teams, and applying continuous learning directly to impact organizational goals.`;
    
    setSummary(generated);
    showToast('Professional summary generated!');
  };

  // ======== EXPERIENCE ARRAY HANDLERS ========
  const addExperience = () => {
    setExperience(prev => [...prev, { id: String(Date.now()), company: '', role: '', startDate: '', endDate: '', description: '' }]);
  };
  const removeExperience = (id) => {
    setExperience(prev => prev.length > 1 ? prev.filter(e => e.id !== id) : prev);
  };
  const updateExperienceField = (id, field, value) => {
    setExperience(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  // ======== EDUCATION ARRAY HANDLERS ========
  const addEducation = () => {
    setEducation(prev => [...prev, { id: String(Date.now()), institution: '', degree: '', year: '', gpa: '' }]);
  };
  const removeEducation = (id) => {
    setEducation(prev => prev.length > 1 ? prev.filter(e => e.id !== id) : prev);
  };
  const updateEducationField = (id, field, value) => {
    setEducation(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  // ======== PROJECTS ARRAY HANDLERS ========
  const addProject = () => {
    setProjects(prev => [...prev, { id: String(Date.now()), title: '', description: '', technologies: '' }]);
  };
  const removeProject = (id) => {
    setProjects(prev => prev.length > 1 ? prev.filter(p => p.id !== id) : p);
  };
  const updateProjectField = (id, field, value) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  // ======== SKILLS ADD/REMOVE HANDLERS ========
  const addTechSkill = (e) => {
    e.preventDefault();
    if (newTechSkill.trim() && !technicalSkills.includes(newTechSkill.trim())) {
      setTechnicalSkills([...technicalSkills, newTechSkill.trim()]);
      setNewTechSkill('');
    }
  };
  const removeTechSkill = (skill) => {
    setTechnicalSkills(technicalSkills.filter(s => s !== skill));
  };

  const addSoftSkill = (e) => {
    e.preventDefault();
    if (newSoftSkill.trim() && !softSkills.includes(newSoftSkill.trim())) {
      setSoftSkills([...softSkills, newSoftSkill.trim()]);
      setNewSoftSkill('');
    }
  };
  const removeSoftSkill = (skill) => {
    setSoftSkills(softSkills.filter(s => s !== skill));
  };

  // Trigger Print dialogue
  const handlePrint = () => {
    window.print();
  };

  // Helper function to render text as point-wise bullet lists or formatted paragraphs
  const renderFormattedText = (text, baseClassName = "text-slate-600 leading-relaxed") => {
    if (!text || !text.trim()) return null;

    let normalizedText = text.trim();

    // Convert inline bullet markers (like " • ", " •", "• ") into newlines so inline pasted bullets break into separate points
    normalizedText = normalizedText.replace(/([^\n])\s*[•\u2022]\s*/g, '$1\n• ');
    // Convert inline dashes/asterisks preceded by sentence ending punctuation into newlines (e.g. "end. - Point 2")
    normalizedText = normalizedText.replace(/([\.\!\?])\s*[\-\*]\s+/g, '$1\n- ');

    const rawLines = normalizedText
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (rawLines.length === 0) return null;

    // Check if the text was intended as bullet points or multi-line entries
    const isBulletList = rawLines.length > 1 || /^[•\u2022\-\*\d+\.\>\-]\s*/.test(text.trim());

    if (!isBulletList) {
      return <p className={baseClassName}>{text}</p>;
    }

    // Clean each line of leading bullet characters
    const cleanLines = rawLines
      .map(line => line.replace(/^[•\u2022\-\*\d+\.\>\-]\s*/, '').trim())
      .filter(line => line.length > 0);

    if (cleanLines.length === 0) return null;

    return (
      <ul className="list-disc list-outside ml-4 space-y-1.5 my-1">
        {cleanLines.map((line, idx) => (
          <li key={idx} className={`${baseClassName} pl-0.5`}>
            {line}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="min-h-screen lg:h-screen flex flex-col md:flex-row relative bg-slate-50 lg:overflow-hidden print:overflow-visible print:h-auto print:bg-white">
      {/* Dynamic CSS styles loaded dynamically for custom printing overrides */}
      <style>{`
        @media print {
          @page {
            margin: 0;
            size: auto;
          }
          body, html {
            background-color: white !important;
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          header, nav, aside, button, .print-hidden {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
          }
          .print-full-width {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
          .resume-sheet {
            margin: 0 !important;
            padding: 12mm 15mm !important;
            border: none !important;
            box-shadow: none !important;
            width: 100% !important;
            max-width: 100% !important;
          }
        }
      `}</style>

      {/* Floating toast message */}
      {toast.show && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Sidebar - print-hidden */}
      <aside className="w-64 bg-white border-r border-slate-100 hidden md:flex flex-col shrink-0 shadow-sm print-hidden">
        <div className="h-20 flex items-center px-6 border-b border-slate-100">
          <Link to="/" className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <User className="text-emerald-500 h-6 w-6" /> NextraPath
          </Link>
        </div>
        <div className="flex-1 py-6 px-4 space-y-1">
          <Link to="/dashboard" className="block px-4 py-3 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl text-sm transition-all font-medium">Dashboard</Link>
          <Link to="/explorer" className="block px-4 py-3 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl text-sm transition-all font-medium">Explore Careers</Link>
          <div className="px-4 py-3 bg-emerald-50 text-emerald-700 rounded-xl font-medium text-sm border border-emerald-100">Resume Builder</div>
          <Link to="/profile" className="block px-4 py-3 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl text-sm transition-all font-medium">Profile</Link>
        </div>
        <div className="p-4 border-t border-slate-100">
          <Link to="/dashboard" className="w-full flex items-center justify-center gap-2 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl transition-all text-sm font-medium border border-slate-200">
            <ArrowLeft className="h-4 w-4" /> Exit Builder
          </Link>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col min-h-0 print-full-width">
        {/* Nav Header - print-hidden */}
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-4 sm:px-8 shrink-0 print-hidden">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="md:hidden p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600"><ArrowLeft className="h-5 w-5" /></Link>
            <div>
              <h1 className="font-extrabold text-slate-800 text-sm sm:text-lg md:text-xl flex items-center gap-1.5 sm:gap-2">
                <FileText className="text-emerald-500 h-4 w-4 sm:h-5 sm:w-5" /> ATS Resume Builder
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">Pre-populate details from your roadmap progress</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <button 
              onClick={() => openChatWithContext({ type: 'resume', data: { personalInfo, summary, experience, education, projects, technicalSkills, softSkills } })}
              className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 px-2.5 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-sm cursor-pointer transition-all duration-300"
            >
              <Sparkles className="h-4 w-4" /> <span className="hidden sm:inline">Review with AI</span>
            </button>
            <button 
              onClick={handleSaveResume}
              disabled={loading}
              className="flex items-center gap-1.5 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 px-2.5 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-sm cursor-pointer transition-all duration-300"
              title="Save Draft"
            >
              <Save className="h-4 w-4 text-emerald-600" />
              <span className="hidden sm:inline">{loading ? 'Saving...' : 'Save Draft'}</span>
              {loading && <span className="sm:hidden text-[10px]">...</span>}
            </button>
            <button 
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-500/20 cursor-pointer transition-all duration-300"
              title="Download PDF"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Download PDF</span>
            </button>
          </div>
        </header>

        {/* Two Panel Layout */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 lg:overflow-hidden print-full-width">
          {/* LEFT INPUT PANEL - print-hidden */}
          <div className="w-full lg:w-[48%] bg-white border-r border-slate-100 flex flex-col min-h-0 lg:overflow-y-auto print-hidden">
            {/* Tabs Selector */}
            <div className="border-b border-slate-100 bg-slate-50/50 p-2 overflow-x-auto flex gap-1 scrollbar-hide">
              {[
                { id: 'personal', label: 'Contact', icon: <User className="h-3.5 w-3.5" /> },
                { id: 'summary', label: 'Summary', icon: <Sparkles className="h-3.5 w-3.5" /> },
                { id: 'experience', label: 'Experience', icon: <Briefcase className="h-3.5 w-3.5" /> },
                { id: 'education', label: 'Education', icon: <GraduationCap className="h-3.5 w-3.5" /> },
                { id: 'projects', label: 'Projects', icon: <Lightbulb className="h-3.5 w-3.5" /> },
                { id: 'skills', label: 'Skills', icon: <Code className="h-3.5 w-3.5" /> }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    activeTab === t.id
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  {t.icon}
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* personal info */}
              {activeTab === 'personal' && (
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2 flex items-center gap-2"><User className="h-4 w-4 text-emerald-500" /> Personal Contact Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                      <input 
                        type="text" 
                        value={personalInfo.fullName} 
                        onChange={(e) => setPersonalInfo({ ...personalInfo, fullName: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Career Path</label>
                      <select
                        value={personalInfo.careerPath}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPersonalInfo(prev => {
                            const next = { ...prev, careerPath: val };
                            if (prev.autoFillTitle && val !== 'Other') {
                              next.professionalTitle = val;
                            }
                            return next;
                          });
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      >
                        <option value="">-- Select Career Path --</option>
                        <option value="Data Scientist">Data Scientist</option>
                        <option value="Software Engineer">Software Engineer</option>
                        <option value="VLSI Engineer">VLSI Engineer</option>
                        <option value="Cloud Engineer">Cloud Engineer</option>
                        <option value="Cybersecurity Analyst">Cybersecurity Analyst</option>
                        <option value="UI/UX Designer">UI/UX Designer</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Professional Title</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Aspiring Software Engineer"
                        value={personalInfo.professionalTitle} 
                        onChange={(e) => {
                          const val = e.target.value;
                          setPersonalInfo(prev => ({ 
                            ...prev, 
                            professionalTitle: val,
                            autoFillTitle: false // Turn off auto-fill if user types manually
                          }));
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>

                    <div className="col-span-2 flex items-center gap-2 -mt-2">
                      <input 
                        type="checkbox"
                        id="autoFillTitle"
                        checked={personalInfo.autoFillTitle}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setPersonalInfo(prev => {
                            const next = { ...prev, autoFillTitle: checked };
                            if (checked && prev.careerPath && prev.careerPath !== 'Other') {
                              next.professionalTitle = prev.careerPath;
                            }
                            return next;
                          });
                        }}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <label htmlFor="autoFillTitle" className="text-xs font-medium text-slate-600 cursor-pointer selection:bg-transparent">
                        Auto-fill Professional Title from Career Path
                      </label>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
                      <input 
                        type="email" 
                        value={personalInfo.email} 
                        onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                      <input 
                        type="text" 
                        placeholder="e.g. +91 9876543210"
                        value={personalInfo.phone} 
                        onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Location</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Bangalore, India"
                        value={personalInfo.location} 
                        onChange={(e) => setPersonalInfo({ ...personalInfo, location: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">GitHub URL</label>
                      <input 
                        type="text" 
                        placeholder="github.com/username"
                        value={personalInfo.github} 
                        onChange={(e) => setPersonalInfo({ ...personalInfo, github: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">LinkedIn URL</label>
                      <input 
                        type="text" 
                        placeholder="linkedin.com/in/username"
                        value={personalInfo.linkedin} 
                        onChange={(e) => setPersonalInfo({ ...personalInfo, linkedin: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Portfolio Website</label>
                      <input 
                        type="text" 
                        placeholder="yourportfolio.com"
                        value={personalInfo.portfolio} 
                        onChange={(e) => setPersonalInfo({ ...personalInfo, portfolio: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* professional summary */}
              {activeTab === 'summary' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><Sparkles className="h-4 w-4 text-emerald-500" /> Professional Summary</h3>
                    <button 
                      onClick={handleGenerateSummary}
                      className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1.5 rounded-lg hover:bg-emerald-100/50 transition-colors"
                    >
                      <Sparkles className="h-3 w-3 animate-pulse" /> Generate Summary
                    </button>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Summary Bio</label>
                    <textarea 
                      rows={5}
                      placeholder="Write a brief professional overview of your career, goals, and core engineering focus..."
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* professional experience */}
              {activeTab === 'experience' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><Briefcase className="h-4 w-4 text-emerald-500" /> Professional Experience</h3>
                    <button 
                      onClick={addExperience}
                      className="flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Experience
                    </button>
                  </div>

                  {experience.map((exp, index) => (
                    <div key={exp.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 relative space-y-4">
                      {experience.length > 1 && (
                        <button 
                          onClick={() => removeExperience(exp.id)}
                          className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      )}
                      
                      <div className="text-xs font-bold text-emerald-600 mb-1">Position #{index + 1}</div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Company Name</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Acme Corporation"
                            value={exp.company} 
                            onChange={(e) => updateExperienceField(exp.id, 'company', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Job Role / Designation</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Software Engineer Intern"
                            value={exp.role} 
                            onChange={(e) => updateExperienceField(exp.id, 'role', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Start Date</label>
                          <input 
                            type="text" 
                            placeholder="e.g. June 2024"
                            value={exp.startDate} 
                            onChange={(e) => updateExperienceField(exp.id, 'startDate', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">End Date</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Present"
                            value={exp.endDate} 
                            onChange={(e) => updateExperienceField(exp.id, 'endDate', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Key Responsibilities / Accomplishments</label>
                          <textarea 
                            rows={4}
                            placeholder="• Built scalable web backend using Node.js & Supabase&#10;• Improved page load performance by 40%&#10;• Led team of 3 developers in agile sprints..."
                            value={exp.description} 
                            onChange={(e) => updateExperienceField(exp.id, 'description', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 leading-relaxed font-sans"
                          />
                          <p className="text-[11px] text-slate-400 mt-1">💡 <strong>Tip:</strong> Paste bullet points or type each point on a new line. They will automatically render as clean bullet points in your ATS template!</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* education section */}
              {activeTab === 'education' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><GraduationCap className="h-4 w-4 text-emerald-500" /> Education History</h3>
                    <button 
                      onClick={addEducation}
                      className="flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Education
                    </button>
                  </div>

                  {education.map((edu, index) => (
                    <div key={edu.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 relative space-y-4">
                      {education.length > 1 && (
                        <button 
                          onClick={() => removeEducation(edu.id)}
                          className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      )}
                      
                      <div className="text-xs font-bold text-emerald-600 mb-1">Education #{index + 1}</div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Institution / University</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Indian Institute of Technology"
                            value={edu.institution} 
                            onChange={(e) => updateEducationField(edu.id, 'institution', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Degree / Course</label>
                          <input 
                            type="text" 
                            placeholder="e.g. B.Tech Computer Science"
                            value={edu.degree} 
                            onChange={(e) => updateEducationField(edu.id, 'degree', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Year of Graduation</label>
                          <input 
                            type="text" 
                            placeholder="e.g. 2025"
                            value={edu.year} 
                            onChange={(e) => updateEducationField(edu.id, 'year', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">GPA / CGPA (Optional)</label>
                          <input 
                            type="text" 
                            placeholder="e.g. 9.1 / 10.0"
                            value={edu.gpa} 
                            onChange={(e) => updateEducationField(edu.id, 'gpa', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* projects section */}
              {activeTab === 'projects' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><Lightbulb className="h-4 w-4 text-emerald-500" /> Personal Projects</h3>
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={handleImportProjects}
                        className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1.5 rounded-lg hover:bg-emerald-100/50 transition-colors cursor-pointer"
                      >
                        <Sparkles className="h-3 w-3" /> Auto-Import
                      </button>
                      <button 
                        onClick={addProject}
                        className="flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Project
                      </button>
                    </div>
                  </div>

                  {projects.map((proj, index) => (
                    <div key={proj.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 relative space-y-4">
                      {projects.length > 1 && (
                        <button 
                          onClick={() => removeProject(proj.id)}
                          className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      )}
                      
                      <div className="text-xs font-bold text-emerald-600 mb-1">Project #{index + 1}</div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Project Title</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Sentiment Analysis Dashboard"
                            value={proj.title} 
                            onChange={(e) => updateProjectField(proj.id, 'title', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Technologies Used</label>
                          <input 
                            type="text" 
                            placeholder="e.g. React.js, Python, Flask, Tailwind CSS"
                            value={proj.technologies} 
                            onChange={(e) => updateProjectField(proj.id, 'technologies', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Project Description / Accomplishments</label>
                          <textarea 
                            rows={4}
                            placeholder="• Developed full-stack web application with React and Supabase&#10;• Integrated AI Chatbot powered by Llama 3.1 & Groq API&#10;• Designed responsive ATS resume builder..."
                            value={proj.description} 
                            onChange={(e) => updateProjectField(proj.id, 'description', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 leading-relaxed font-sans"
                          />
                          <p className="text-[11px] text-slate-400 mt-1">💡 <strong>Tip:</strong> Paste bullet points or type each point on a new line. They will automatically render as clean bullet points in your ATS template!</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* skills selection */}
              {activeTab === 'skills' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><Code className="h-4 w-4 text-emerald-500" /> Core Skills</h3>
                    <button 
                      onClick={handleImportSkills}
                      className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1.5 rounded-lg hover:bg-emerald-100/50 transition-colors cursor-pointer"
                    >
                      <Sparkles className="h-3 w-3" /> Auto-Import Skills
                    </button>
                  </div>

                  {/* Technical Skills */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Technical / Hard Skills</label>
                    <form onSubmit={addTechSkill} className="flex gap-2 mb-3">
                      <input 
                        type="text" 
                        placeholder="e.g. React.js, Python, Verilog"
                        value={newTechSkill} 
                        onChange={(e) => setNewTechSkill(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <button type="submit" className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 rounded-xl text-xs cursor-pointer">Add</button>
                    </form>
                    <div className="flex flex-wrap gap-2">
                      {technicalSkills.map(skill => (
                        <span key={skill} className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg">
                          {skill}
                          <button type="button" onClick={() => removeTechSkill(skill)} className="text-slate-400 hover:text-slate-600 font-bold ml-0.5">×</button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Soft Skills */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Soft Skills</label>
                    <form onSubmit={addSoftSkill} className="flex gap-2 mb-3">
                      <input 
                        type="text" 
                        placeholder="e.g. Communication, Problem Solving"
                        value={newSoftSkill} 
                        onChange={(e) => setNewSoftSkill(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <button type="submit" className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 rounded-xl text-xs cursor-pointer">Add</button>
                    </form>
                    <div className="flex flex-wrap gap-2">
                      {softSkills.map(skill => (
                        <span key={skill} className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg">
                          {skill}
                          <button type="button" onClick={() => removeSoftSkill(skill)} className="text-slate-400 hover:text-slate-600 font-bold ml-0.5">×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PREVIEW PANEL */}
          <div className="flex-1 bg-slate-100 flex flex-col p-4 sm:p-6 min-h-0 lg:overflow-y-auto print:p-0 print:bg-white print-full-width">
            {/* Template Selector - print-hidden */}
            <div className="flex items-center justify-between mb-4 print-hidden bg-white p-3 rounded-2xl border border-slate-200/50 shadow-sm shrink-0">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Template Theme</span>
              <div className="flex gap-1.5 overflow-x-auto">
                {[
                  { id: 'modern', label: 'Modern Professional' },
                  { id: 'ats', label: 'ATS Minimalist' },
                  { id: 'software', label: 'Tech / Developer' },
                  { id: 'datascientist', label: 'Data Specialist' },
                  { id: 'fresher', label: 'Fresher Basic' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      selectedTemplate === t.id
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Resume Sheet - Live ATS A4 Preview */}
            <div className="w-full max-w-[800px] mx-auto bg-white shadow-2xl rounded-sm border border-slate-200 p-8 sm:p-12 min-h-[1000px] resume-sheet font-sans print-full-width print:shadow-none print:border-none print:min-h-0">
              
              {/* ================= MODERN TEMPLATE ================= */}
              {selectedTemplate === 'modern' && (
                <div className="space-y-6 text-slate-800 text-xs">
                  {/* Header */}
                  <div className="border-b-2 border-emerald-600 pb-4 text-center">
                    <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 uppercase">{personalInfo.fullName || 'YOUR NAME'}</h2>
                    <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mt-1">{personalInfo.professionalTitle || 'Professional Title'}</div>
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-slate-500 font-medium mt-2">
                      {personalInfo.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{personalInfo.email}</span>}
                      {personalInfo.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{personalInfo.phone}</span>}
                      {personalInfo.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{personalInfo.location}</span>}
                    </div>
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-slate-400 font-medium mt-1">
                      {personalInfo.github && <span className="flex items-center gap-1"><Code className="h-3.5 w-3.5" />{personalInfo.github}</span>}
                      {personalInfo.linkedin && <span className="flex items-center gap-1"><Link2 className="h-3.5 w-3.5" />{personalInfo.linkedin}</span>}
                      {personalInfo.portfolio && <span className="flex items-center gap-1"><Globe className="h-3.5 w-3.5" />{personalInfo.portfolio}</span>}
                    </div>
                  </div>

                  {/* Summary */}
                  {summary && (
                    <div className="space-y-1.5">
                      <h3 className="text-sm font-bold text-emerald-700 uppercase tracking-wide border-b border-slate-100 pb-0.5">Professional Summary</h3>
                      <p className="text-slate-600 leading-relaxed text-justify">{summary}</p>
                    </div>
                  )}

                  {/* Skills */}
                  {(technicalSkills.length > 0 || softSkills.length > 0) && (
                    <div className="space-y-1.5">
                      <h3 className="text-sm font-bold text-emerald-700 uppercase tracking-wide border-b border-slate-100 pb-0.5">Skills Inventory</h3>
                      <div className="space-y-1">
                        {technicalSkills.length > 0 && (
                          <p className="text-slate-600"><strong className="text-slate-700">Technical Skills:</strong> {technicalSkills.join(', ')}</p>
                        )}
                        {softSkills.length > 0 && (
                          <p className="text-slate-600"><strong className="text-slate-700">Soft Skills:</strong> {softSkills.join(', ')}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Experience */}
                  {experience.some(e => e.company || e.role) && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-emerald-700 uppercase tracking-wide border-b border-slate-100 pb-0.5">Professional Experience</h3>
                      <div className="space-y-3">
                        {experience.filter(e => e.company || e.role).map((exp, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between font-bold text-slate-800">
                              <span>{exp.role || 'Role'} · <span className="text-slate-500 font-semibold">{exp.company || 'Company'}</span></span>
                              <span className="text-slate-400 font-normal">{exp.startDate || 'Start'} - {exp.endDate || 'End'}</span>
                            </div>
                            {exp.description && renderFormattedText(exp.description, "text-slate-600 leading-relaxed")}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Projects */}
                  {projects.some(p => p.title) && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-emerald-700 uppercase tracking-wide border-b border-slate-100 pb-0.5">Key Projects</h3>
                      <div className="space-y-3">
                        {projects.filter(p => p.title).map((proj, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between font-bold text-slate-800">
                              <span>{proj.title}</span>
                              {proj.technologies && <span className="text-emerald-600 font-medium text-[11px]">{proj.technologies}</span>}
                            </div>
                            {proj.description && renderFormattedText(proj.description, "text-slate-600 leading-relaxed")}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {education.some(e => e.institution || e.degree) && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-emerald-700 uppercase tracking-wide border-b border-slate-100 pb-0.5">Education</h3>
                      <div className="space-y-2">
                        {education.filter(e => e.institution || e.degree).map((edu, idx) => (
                          <div key={idx} className="flex justify-between items-start">
                            <div>
                              <div className="font-bold text-slate-800">{edu.degree || 'Degree'}</div>
                              <div className="text-slate-500 font-medium">{edu.institution || 'University'}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-slate-400">{edu.year || 'Graduation'}</div>
                              {edu.gpa && <div className="text-slate-600 font-medium">GPA: {edu.gpa}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}


              {/* ================= ATS MINIMALIST TEMPLATE ================= */}
              {selectedTemplate === 'ats' && (
                <div className="space-y-5 text-slate-900 text-xs font-serif leading-relaxed">
                  {/* Centered clean contact info */}
                  <div className="text-center space-y-1 border-b border-slate-200 pb-3">
                    <h2 className="text-xl font-bold tracking-normal text-slate-900 uppercase">{personalInfo.fullName || 'YOUR NAME'}</h2>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider -mt-0.5 mb-1">{personalInfo.professionalTitle || 'Professional Title'}</div>
                    <div className="text-slate-600 flex flex-wrap justify-center gap-x-3 text-[11px]">
                      {personalInfo.location && <span>{personalInfo.location}</span>}
                      {personalInfo.phone && <span>· {personalInfo.phone}</span>}
                      {personalInfo.email && <span>· {personalInfo.email}</span>}
                    </div>
                    <div className="text-slate-500 flex flex-wrap justify-center gap-x-3 text-[11px]">
                      {personalInfo.github && <span>GitHub: {personalInfo.github}</span>}
                      {personalInfo.linkedin && <span>LinkedIn: {personalInfo.linkedin}</span>}
                      {personalInfo.portfolio && <span>Portfolio: {personalInfo.portfolio}</span>}
                    </div>
                  </div>

                  {/* Summary */}
                  {summary && (
                    <div className="space-y-1">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-300 pb-0.5">Professional Statement</h3>
                      <p className="text-slate-700 text-justify">{summary}</p>
                    </div>
                  )}

                  {/* Experience */}
                  {experience.some(e => e.company || e.role) && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-300 pb-0.5">Experience</h3>
                      <div className="space-y-2.5">
                        {experience.filter(e => e.company || e.role).map((exp, idx) => (
                          <div key={idx} className="space-y-0.5">
                            <div className="flex justify-between font-bold">
                              <span>{exp.company || 'Company'}</span>
                              <span className="font-normal text-slate-600">{exp.startDate || 'Start'} - {exp.endDate || 'End'}</span>
                            </div>
                            <div className="italic text-slate-700">{exp.role || 'Role'}</div>
                            {exp.description && renderFormattedText(exp.description, "text-slate-700 leading-relaxed")}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Projects */}
                  {projects.some(p => p.title) && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-300 pb-0.5">Projects</h3>
                      <div className="space-y-2">
                        {projects.filter(p => p.title).map((proj, idx) => (
                          <div key={idx} className="space-y-0.5">
                            <div className="flex justify-between font-bold">
                              <span>{proj.title} {proj.technologies && <span className="font-normal text-slate-500">({proj.technologies})</span>}</span>
                            </div>
                            {proj.description && renderFormattedText(proj.description, "text-slate-700 leading-relaxed")}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {education.some(e => e.institution || e.degree) && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-300 pb-0.5">Education</h3>
                      <div className="space-y-2">
                        {education.filter(e => e.institution || e.degree).map((edu, idx) => (
                          <div key={idx} className="flex justify-between items-start">
                            <div>
                              <span className="font-bold">{edu.institution || 'University'}</span>
                              <span className="text-slate-600 font-medium"> — {edu.degree || 'Degree'}</span>
                            </div>
                            <div className="text-right text-slate-600">
                              <span>{edu.year || 'Graduation'}</span>
                              {edu.gpa && <span className="font-bold"> (GPA: {edu.gpa})</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skills */}
                  {(technicalSkills.length > 0 || softSkills.length > 0) && (
                    <div className="space-y-1">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-300 pb-0.5">Skills</h3>
                      <div className="space-y-0.5">
                        {technicalSkills.length > 0 && (
                          <p className="text-slate-700"><strong className="text-slate-800">Languages & Technologies:</strong> {technicalSkills.join(', ')}</p>
                        )}
                        {softSkills.length > 0 && (
                          <p className="text-slate-700"><strong className="text-slate-800">Methodologies & Interpersonal:</strong> {softSkills.join(', ')}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}


              {/* ================= TECH / SOFTWARE DEVELOPER TEMPLATE ================= */}
              {selectedTemplate === 'software' && (
                <div className="space-y-5 text-slate-800 text-xs font-mono">
                  {/* Minimal tech block header */}
                  <div className="border-l-4 border-indigo-600 pl-4 py-1">
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">{personalInfo.fullName || 'DEV_NAME'}</h2>
                    <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mt-0.5">{personalInfo.professionalTitle || 'Professional Title'}</div>
                    <div className="text-[11px] text-indigo-600 font-bold mt-1">
                      {personalInfo.github && <span className="mr-3">git://{personalInfo.github}</span>}
                      {personalInfo.linkedin && <span className="mr-3">in/{personalInfo.linkedin}</span>}
                      {personalInfo.portfolio && <span>web/{personalInfo.portfolio}</span>}
                    </div>
                    <div className="text-slate-500 text-[10px] mt-1">
                      {personalInfo.email} · {personalInfo.phone} · {personalInfo.location}
                    </div>
                  </div>

                  {/* Summary */}
                  {summary && (
                    <div className="space-y-1">
                      <div className="text-slate-400 font-bold text-[10px] uppercase">// SUMMARY</div>
                      <p className="text-slate-600 leading-relaxed text-justify">{summary}</p>
                    </div>
                  )}

                  {/* Skills Grid */}
                  {(technicalSkills.length > 0 || softSkills.length > 0) && (
                    <div className="space-y-1">
                      <div className="text-slate-400 font-bold text-[10px] uppercase">// SKILL_STACK</div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                        {technicalSkills.length > 0 && (
                          <p><span className="text-indigo-600 font-bold">[tech]</span> {technicalSkills.join(', ')}</p>
                        )}
                        {softSkills.length > 0 && (
                          <p><span className="text-indigo-600 font-bold">[soft]</span> {softSkills.join(', ')}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Projects */}
                  {projects.some(p => p.title) && (
                    <div className="space-y-2">
                      <div className="text-slate-400 font-bold text-[10px] uppercase">// DEVELOPED_PROJECTS</div>
                      <div className="space-y-3">
                        {projects.filter(p => p.title).map((proj, idx) => (
                          <div key={idx} className="space-y-0.5">
                            <div className="flex justify-between font-bold text-slate-800">
                              <span>&gt; {proj.title}</span>
                              <span className="text-indigo-600 text-[11px] font-semibold font-sans">#{proj.technologies || 'Code'}</span>
                            </div>
                            {proj.description && renderFormattedText(proj.description, "text-slate-600 leading-relaxed")}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Experience */}
                  {experience.some(e => e.company || e.role) && (
                    <div className="space-y-2">
                      <div className="text-slate-400 font-bold text-[10px] uppercase">// WORK_HISTORY</div>
                      <div className="space-y-3">
                        {experience.filter(e => e.company || e.role).map((exp, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between font-bold text-slate-800">
                              <span>{exp.role} @ {exp.company}</span>
                              <span className="text-slate-400 font-normal">{exp.startDate} - {exp.endDate}</span>
                            </div>
                            {exp.description && renderFormattedText(exp.description, "text-slate-600 leading-relaxed")}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {education.some(e => e.institution || e.degree) && (
                    <div className="space-y-1">
                      <div className="text-slate-400 font-bold text-[10px] uppercase">// ACADEMICS</div>
                      <div className="space-y-2">
                        {education.filter(e => e.institution || e.degree).map((edu, idx) => (
                          <div key={idx} className="flex justify-between text-slate-700">
                            <span>{edu.degree} from {edu.institution}</span>
                            <span className="text-slate-400">{edu.year} {edu.gpa ? `(GPA: ${edu.gpa})` : ''}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}


              {/* ================= DATA SCIENTIST TEMPLATE ================= */}
              {selectedTemplate === 'datascientist' && (
                <div className="space-y-5 text-slate-800 text-xs">
                  {/* Top aligned header with deep teal details */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-teal-700 pb-3 gap-2">
                    <div>
                      <h2 className="text-2xl font-bold text-teal-800 uppercase">{personalInfo.fullName || 'YOUR NAME'}</h2>
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">{personalInfo.professionalTitle || 'Professional Title'}</div>
                    </div>
                    <div className="text-[10px] text-slate-500 text-left sm:text-right space-y-0.5">
                      <div>{personalInfo.email} | {personalInfo.phone}</div>
                      <div>{personalInfo.location}</div>
                      <div className="font-semibold text-teal-700">
                        {personalInfo.github && `gh/${personalInfo.github}`} · {personalInfo.linkedin && `in/${personalInfo.linkedin}`}
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  {summary && (
                    <div className="space-y-1">
                      <h3 className="text-[11px] font-extrabold text-teal-800 uppercase tracking-wider">// Profile Analytics</h3>
                      <p className="text-slate-600 leading-relaxed text-justify">{summary}</p>
                    </div>
                  )}

                  {/* Skills Grid */}
                  {(technicalSkills.length > 0 || softSkills.length > 0) && (
                    <div className="space-y-1">
                      <h3 className="text-[11px] font-extrabold text-teal-800 uppercase tracking-wider">// Core Toolkits & Proficiencies</h3>
                      <div className="grid grid-cols-2 gap-4 bg-teal-50/30 p-3 rounded-xl border border-teal-100/50">
                        <div>
                          <div className="font-bold text-[10px] text-teal-850 uppercase mb-1">Analytical & Tech Stack</div>
                          <p className="text-slate-600 leading-relaxed">{technicalSkills.join(', ') || 'N/A'}</p>
                        </div>
                        <div>
                          <div className="font-bold text-[10px] text-teal-850 uppercase mb-1">Methodologies & Soft</div>
                          <p className="text-slate-600 leading-relaxed">{softSkills.join(', ') || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Projects */}
                  {projects.some(p => p.title) && (
                    <div className="space-y-2">
                      <h3 className="text-[11px] font-extrabold text-teal-800 uppercase tracking-wider">// Key Datasets & Project Pipelines</h3>
                      <div className="space-y-3">
                        {projects.filter(p => p.title).map((proj, idx) => (
                          <div key={idx} className="space-y-0.5">
                            <div className="flex justify-between font-bold text-slate-800">
                              <span>{proj.title}</span>
                              <span className="text-teal-700 font-semibold text-[11px]">{proj.technologies}</span>
                            </div>
                            {proj.description && renderFormattedText(proj.description, "text-slate-600 leading-relaxed")}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Experience */}
                  {experience.some(e => e.company || e.role) && (
                    <div className="space-y-2">
                      <h3 className="text-[11px] font-extrabold text-teal-800 uppercase tracking-wider">// Professional Milestones</h3>
                      <div className="space-y-3">
                        {experience.filter(e => e.company || e.role).map((exp, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between font-bold text-slate-800">
                              <span>{exp.role} @ {exp.company}</span>
                              <span className="text-slate-400 font-normal">{exp.startDate} - {exp.endDate}</span>
                            </div>
                            {exp.description && renderFormattedText(exp.description, "text-slate-600 leading-relaxed")}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {education.some(e => e.institution || e.degree) && (
                    <div className="space-y-2">
                      <h3 className="text-[11px] font-extrabold text-teal-800 uppercase tracking-wider">// Academic Background</h3>
                      <div className="space-y-2">
                        {education.filter(e => e.institution || e.degree).map((edu, idx) => (
                          <div key={idx} className="flex justify-between items-start text-slate-700">
                            <div>
                              <div className="font-bold text-slate-800">{edu.degree}</div>
                              <div className="text-slate-500">{edu.institution}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-slate-400">{edu.year}</div>
                              {edu.gpa && <div className="text-slate-600 font-semibold">CGPA: {edu.gpa}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}


              {/* ================= FRESHER / BASIC TEMPLATE ================= */}
              {selectedTemplate === 'fresher' && (
                <div className="space-y-5 text-slate-800 text-xs">
                  {/* Clean classical block header */}
                  <div className="text-center pb-2 border-b border-slate-100">
                    <h2 className="text-2xl font-bold text-slate-900">{personalInfo.fullName || 'YOUR NAME'}</h2>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">{personalInfo.professionalTitle || 'Professional Title'}</div>
                    <p className="text-slate-500 mt-1 flex justify-center gap-2 flex-wrap">
                      {personalInfo.email && <span>{personalInfo.email}</span>}
                      {personalInfo.phone && <span>| {personalInfo.phone}</span>}
                      {personalInfo.location && <span>| {personalInfo.location}</span>}
                    </p>
                    <p className="text-slate-400 text-[10px] mt-0.5 flex justify-center gap-2 flex-wrap">
                      {personalInfo.github && <span>GitHub: {personalInfo.github}</span>}
                      {personalInfo.linkedin && <span>LinkedIn: {personalInfo.linkedin}</span>}
                      {personalInfo.portfolio && <span>Web: {personalInfo.portfolio}</span>}
                    </p>
                  </div>

                  {/* Summary */}
                  {summary && (
                    <div className="space-y-1">
                      <h3 className="text-xs font-bold text-slate-900 border-l-2 border-slate-800 pl-2 uppercase tracking-wider">Objective</h3>
                      <p className="text-slate-600 leading-relaxed text-justify">{summary}</p>
                    </div>
                  )}

                  {/* Education (Prominent for freshers) */}
                  {education.some(e => e.institution || e.degree) && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-slate-900 border-l-2 border-slate-800 pl-2 uppercase tracking-wider">Education</h3>
                      <div className="space-y-3">
                        {education.filter(e => e.institution || e.degree).map((edu, idx) => (
                          <div key={idx} className="flex justify-between items-start">
                            <div>
                              <div className="font-bold text-slate-800">{edu.degree || 'Degree'}</div>
                              <div className="text-slate-500 font-medium">{edu.institution || 'University'}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-slate-400 font-bold">{edu.year || 'Graduation Year'}</div>
                              {edu.gpa && <div className="text-slate-600 font-bold text-[11px]">GPA/Percentage: {edu.gpa}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skills */}
                  {(technicalSkills.length > 0 || softSkills.length > 0) && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-slate-900 border-l-2 border-slate-800 pl-2 uppercase tracking-wider">Skills & Abilities</h3>
                      <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {technicalSkills.length > 0 && (
                          <p><strong className="text-slate-700">Tech Stack:</strong> {technicalSkills.join(', ')}</p>
                        )}
                        {softSkills.length > 0 && (
                          <p><strong className="text-slate-700">Soft Skills:</strong> {softSkills.join(', ')}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Projects */}
                  {projects.some(p => p.title) && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-slate-900 border-l-2 border-slate-800 pl-2 uppercase tracking-wider">Academic / Self Projects</h3>
                      <div className="space-y-3">
                        {projects.filter(p => p.title).map((proj, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between font-bold text-slate-800">
                              <span>{proj.title}</span>
                              {proj.technologies && <span className="text-slate-500 font-medium text-[10px]">({proj.technologies})</span>}
                            </div>
                            {proj.description && renderFormattedText(proj.description, "text-slate-600 leading-relaxed")}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Experience (If any) */}
                  {experience.some(e => e.company || e.role) && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-slate-900 border-l-2 border-slate-800 pl-2 uppercase tracking-wider">Internships & Co-curricular</h3>
                      <div className="space-y-3">
                        {experience.filter(e => e.company || e.role).map((exp, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between font-bold text-slate-800">
                              <span>{exp.role} — <span className="text-slate-500">{exp.company}</span></span>
                              <span className="text-slate-400 font-normal">{exp.startDate} - {exp.endDate}</span>
                            </div>
                            {exp.description && renderFormattedText(exp.description, "text-slate-600 leading-relaxed")}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
