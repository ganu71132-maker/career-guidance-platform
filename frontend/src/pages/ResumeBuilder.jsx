import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { supabase } from '../lib/supabase';
import { useChat } from '../contexts/ChatContext';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, User, Briefcase, GraduationCap, Code, Lightbulb, 
  FileText, Sparkles, Download, Save, Plus, Trash, Globe, 
  Phone, Mail, MapPin, ChevronRight, Eye, Check, Link2, Award
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
    portfolio: '',
    photoUrl: '',
    showPhoto: true
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

  const [certifications, setCertifications] = useState([
    { id: '1', title: '', issuer: '', year: '', credentialUrl: '' }
  ]);
  
  const [technicalSkills, setTechnicalSkills] = useState([]);
  const [softSkills, setSoftSkills] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [domainSkills, setDomainSkills] = useState([]);
  const [toolsTech, setToolsTech] = useState([]);
  const [currentlyLearning, setCurrentlyLearning] = useState([]);
  
  // Custom Input States
  const [newTechSkill, setNewTechSkill] = useState('');
  const [newSoftSkill, setNewSoftSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [newDomainSkill, setNewDomainSkill] = useState('');
  const [newToolTech, setNewToolTech] = useState('');
  const [newLearningItem, setNewLearningItem] = useState('');

  // Toast Trigger Helper
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  // ======== LOAD SAVED RESUME FROM SUPABASE & LOCALSTORAGE ========
  const initialLoadDone = React.useRef(false);
  
  useEffect(() => {
    async function loadResume() {
      if (!user || initialLoadDone.current) return;
      initialLoadDone.current = true;
      setLoading(true);
      try {
        // Load LocalStorage fallback first for instant responsiveness
        const localBackupRaw = localStorage.getItem(`nextrapath_resume_draft_${user.id}`);
        if (localBackupRaw) {
          try {
            const backup = JSON.parse(localBackupRaw);
            if (backup.personalInfo) setPersonalInfo(prev => ({ ...prev, ...backup.personalInfo }));
            if (backup.summary) setSummary(backup.summary);
            if (backup.selectedTemplate) setSelectedTemplate(backup.selectedTemplate);
            if (backup.experience?.length) setExperience(backup.experience);
            if (backup.education?.length) setEducation(backup.education);
            if (backup.projects?.length) setProjects(backup.projects);
            if (backup.technicalSkills) setTechnicalSkills(backup.technicalSkills);
            if (backup.softSkills) setSoftSkills(backup.softSkills);
            if (backup.languages) setLanguages(backup.languages);
            if (backup.domainSkills) setDomainSkills(backup.domainSkills);
            if (backup.toolsTech) setToolsTech(backup.toolsTech);
            if (backup.currentlyLearning) setCurrentlyLearning(backup.currentlyLearning);
            if (backup.certifications) setCertifications(backup.certifications);
          } catch (e) {
            console.warn('LocalStorage backup parse error:', e);
          }
        }

        // Fetch from Supabase
        const { data: profile, error: profileErr } = await supabase
          .from('resume_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileErr) console.warn('Profile fetch warning:', profileErr);
        
        if (profile) {
          setPersonalInfo(prev => ({
            ...prev,
            fullName: profile.full_name || prev.fullName || '',
            professionalTitle: profile.professional_title || prev.professionalTitle || '',
            careerPath: profile.career_path || prev.careerPath || '',
            autoFillTitle: profile.auto_fill_title !== false,
            email: profile.email || prev.email || '',
            phone: profile.phone || prev.phone || '',
            location: profile.location || prev.location || '',
            github: profile.github || prev.github || '',
            linkedin: profile.linkedin || prev.linkedin || '',
            portfolio: profile.portfolio || prev.portfolio || '',
            photoUrl: profile.photo_url || prev.photoUrl || '',
            showPhoto: profile.show_photo !== undefined ? profile.show_photo : prev.showPhoto
          }));
          if (profile.summary) setSummary(profile.summary);
          if (profile.template) setSelectedTemplate(profile.template);

          // Fetch Experience
          try {
            const { data: expData } = await supabase.from('resume_experience').select('*').eq('resume_id', profile.id);
            if (expData && expData.length > 0) {
              setExperience(expData.map(e => ({
                id: e.id,
                company: e.company || '',
                role: e.role || '',
                startDate: e.start_date || '',
                endDate: e.end_date || '',
                description: e.description || ''
              })));
            }
          } catch (e) { console.warn('Exp fetch error:', e); }

          // Fetch Education
          try {
            const { data: eduData } = await supabase.from('resume_education').select('*').eq('resume_id', profile.id);
            if (eduData && eduData.length > 0) {
              setEducation(eduData.map(e => ({
                id: e.id,
                institution: e.institution || '',
                degree: e.degree || '',
                year: e.year || '',
                gpa: e.gpa || ''
              })));
            }
          } catch (e) { console.warn('Edu fetch error:', e); }

          // Fetch Projects
          try {
            const { data: projData } = await supabase.from('resume_projects').select('*').eq('resume_id', profile.id);
            if (projData && projData.length > 0) {
              setProjects(projData.map(p => ({
                id: p.id,
                title: p.title || '',
                description: p.description || '',
                technologies: p.technologies || ''
              })));
            }
          } catch (e) { console.warn('Proj fetch error:', e); }

          // Fetch Skills
          try {
            const { data: skillData } = await supabase.from('resume_skills').select('*').eq('resume_id', profile.id);
            if (skillData && skillData.length > 0) {
              const tech = skillData.filter(s => s.skill_type === 'technical').map(s => s.skill_name);
              const soft = skillData.filter(s => s.skill_type === 'soft').map(s => s.skill_name);
              const lang = skillData.filter(s => s.skill_type === 'language').map(s => s.skill_name);
              const dom = skillData.filter(s => s.skill_type === 'domain').map(s => s.skill_name);
              const tool = skillData.filter(s => s.skill_type === 'tools').map(s => s.skill_name);
              const learn = skillData.filter(s => s.skill_type === 'learning').map(s => s.skill_name);
              if (tech.length) setTechnicalSkills(tech);
              if (soft.length) setSoftSkills(soft);
              if (lang.length) setLanguages(lang);
              if (dom.length) setDomainSkills(dom);
              if (tool.length) setToolsTech(tool);
              if (learn.length) setCurrentlyLearning(learn);
            }
          } catch (e) { console.warn('Skills fetch error:', e); }

          // Fetch Certifications
          try {
            const { data: certData } = await supabase.from('resume_certifications').select('*').eq('resume_id', profile.id);
            if (certData && certData.length > 0) {
              setCertifications(certData.map(c => ({
                id: c.id,
                title: c.title || '',
                issuer: c.issuer || '',
                year: c.year || '',
                credentialUrl: c.credential_url || ''
              })));
            }
          } catch (e) { console.warn('Certs fetch error:', e); }
        }
      } catch (err) {
        console.error('Error loading resume:', err);
      } finally {
        setLoading(false);
      }
    }
    loadResume();
  }, [user?.id]);

  // ======== SAVE RESUME TO SUPABASE & LOCALSTORAGE ========
  const handleSaveResume = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Instant LocalStorage backup (guarantees local safety immediately)
      const fullBackup = {
        personalInfo,
        summary,
        selectedTemplate,
        experience,
        education,
        projects,
        technicalSkills,
        softSkills,
        languages,
        domainSkills,
        toolsTech,
        currentlyLearning,
        certifications,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(`nextrapath_resume_draft_${user.id}`, JSON.stringify(fullBackup));

      // 2. Base profile payload
      const basePayload = {
        user_id: user.id,
        full_name: personalInfo.fullName || '',
        professional_title: personalInfo.professionalTitle || '',
        career_path: personalInfo.careerPath || '',
        auto_fill_title: personalInfo.autoFillTitle !== false,
        email: personalInfo.email || '',
        phone: personalInfo.phone || '',
        location: personalInfo.location || '',
        github: personalInfo.github || '',
        linkedin: personalInfo.linkedin || '',
        portfolio: personalInfo.portfolio || '',
        summary: summary || '',
        template: selectedTemplate || 'modern',
        updated_at: new Date().toISOString()
      };

      // Extended payload with photo fields
      const extendedPayload = {
        ...basePayload,
        photo_url: personalInfo.photoUrl || '',
        show_photo: personalInfo.showPhoto !== false
      };

      // 3. Upsert Profile
      const { data: existingProfile } = await supabase
        .from('resume_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      let profileId;

      if (existingProfile) {
        profileId = existingProfile.id;
        // Try saving extended payload first
        let { error: updateErr } = await supabase
          .from('resume_profiles')
          .update(extendedPayload)
          .eq('id', profileId);

        // Fallback to base payload if custom columns (like photo_url) fail
        if (updateErr) {
          console.warn('Extended profile update failed, retrying with base payload:', updateErr);
          const { error: retryErr } = await supabase
            .from('resume_profiles')
            .update(basePayload)
            .eq('id', profileId);
          if (retryErr) console.warn('Base profile update error:', retryErr);
        }
      } else {
        let { data: insData, error: insErr } = await supabase
          .from('resume_profiles')
          .insert(extendedPayload)
          .select('id')
          .maybeSingle();

        if (insErr) {
          console.warn('Extended profile insert failed, retrying with base payload:', insErr);
          const { data: retryData, error: retryErr } = await supabase
            .from('resume_profiles')
            .insert(basePayload)
            .select('id')
            .single();
          if (retryErr) console.warn('Base profile insert error:', retryErr);
          profileId = retryData?.id;
        } else {
          profileId = insData?.id;
        }
      }

      // If we have a profile ID from Supabase, save relational sub-tables safely
      if (profileId) {
        // 4. Save Experience
        try {
          await supabase.from('resume_experience').delete().eq('resume_id', profileId);
          const validExp = experience.filter(e => e.company || e.role);
          if (validExp.length > 0) {
            await supabase.from('resume_experience').insert(
              validExp.map(e => ({
                resume_id: profileId,
                company: e.company || '',
                role: e.role || '',
                start_date: e.startDate || '',
                end_date: e.endDate || '',
                description: e.description || ''
              }))
            );
          }
        } catch (e) { console.warn('Save Exp error:', e); }

        // 5. Save Education
        try {
          await supabase.from('resume_education').delete().eq('resume_id', profileId);
          const validEdu = education.filter(e => e.institution || e.degree);
          if (validEdu.length > 0) {
            await supabase.from('resume_education').insert(
              validEdu.map(e => ({
                resume_id: profileId,
                institution: e.institution || '',
                degree: e.degree || '',
                year: e.year || '',
                gpa: e.gpa || ''
              }))
            );
          }
        } catch (e) { console.warn('Save Edu error:', e); }

        // 6. Save Projects
        try {
          await supabase.from('resume_projects').delete().eq('resume_id', profileId);
          const validProj = projects.filter(p => p.title);
          if (validProj.length > 0) {
            await supabase.from('resume_projects').insert(
              validProj.map(p => ({
                resume_id: profileId,
                title: p.title || '',
                description: p.description || '',
                technologies: p.technologies || ''
              }))
            );
          }
        } catch (e) { console.warn('Save Proj error:', e); }

        // 7. Save Skills
        try {
          await supabase.from('resume_skills').delete().eq('resume_id', profileId);
          const skillsPayload = [
            ...technicalSkills.map(s => ({ resume_id: profileId, skill_name: s, skill_type: 'technical' })),
            ...softSkills.map(s => ({ resume_id: profileId, skill_name: s, skill_type: 'soft' })),
            ...languages.map(s => ({ resume_id: profileId, skill_name: s, skill_type: 'language' })),
            ...domainSkills.map(s => ({ resume_id: profileId, skill_name: s, skill_type: 'domain' })),
            ...toolsTech.map(s => ({ resume_id: profileId, skill_name: s, skill_type: 'tools' })),
            ...currentlyLearning.map(s => ({ resume_id: profileId, skill_name: s, skill_type: 'learning' }))
          ];
          if (skillsPayload.length > 0) {
            await supabase.from('resume_skills').insert(skillsPayload);
          }
        } catch (e) { console.warn('Save Skills error:', e); }

        // 8. Save Certifications
        try {
          await supabase.from('resume_certifications').delete().eq('resume_id', profileId);
          const validCert = certifications.filter(c => c.title || c.issuer);
          if (validCert.length > 0) {
            await supabase.from('resume_certifications').insert(
              validCert.map(c => ({
                resume_id: profileId,
                title: c.title || '',
                issuer: c.issuer || '',
                year: c.year || '',
                credential_url: c.credentialUrl || ''
              }))
            );
          }
        } catch (e) { console.warn('Save Certs error:', e); }
      }

      showToast('Resume draft saved successfully!');
    } catch (err) {
      console.error('Error saving resume:', err);
      showToast('Saved to local storage!', 'success');
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

  // ======== CERTIFICATIONS ARRAY HANDLERS ========
  const addCertification = () => {
    setCertifications(prev => [...prev, { id: String(Date.now()), title: '', issuer: '', year: '', credentialUrl: '' }]);
  };
  const removeCertification = (id) => {
    setCertifications(prev => prev.length > 1 ? prev.filter(c => c.id !== id) : prev);
  };
  const updateCertificationField = (id, field, value) => {
    setCertifications(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleImportCertifications = () => {
    const importedCerts = [];
    careersData.forEach(career => {
      if (savedCareers.includes(career.id)) {
        const completedCount = career.roadmap.filter(s => completedSteps.includes(s.id)).length;
        if (completedCount > 0) {
          importedCerts.push({
            title: `${career.title} Mastery Roadmap`,
            issuer: 'NextraPath Career Platform',
            year: new Date().getFullYear().toString(),
            credentialUrl: 'nextrapath.in'
          });
        }
      }
    });

    if (importedCerts.length === 0) {
      showToast('No completed roadmap credentials found to import.', 'error');
      return;
    }

    setCertifications(prev => {
      if (prev.length === 1 && !prev[0].title) {
        return importedCerts.map((c, idx) => ({ id: String(idx + 1), ...c }));
      }
      return [...prev, ...importedCerts.map((c, idx) => ({ id: String(prev.length + idx + 1), ...c }))];
    });
    showToast(`Imported ${importedCerts.length} platform certifications!`);
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

  const addLanguage = (e) => {
    if (e) e.preventDefault();
    if (newLanguage.trim() && !languages.includes(newLanguage.trim())) {
      setLanguages([...languages, newLanguage.trim()]);
      setNewLanguage('');
    }
  };
  const removeLanguage = (lang) => {
    setLanguages(languages.filter(l => l !== lang));
  };

  const addDomainSkill = (e) => {
    if (e) e.preventDefault();
    if (newDomainSkill.trim() && !domainSkills.includes(newDomainSkill.trim())) {
      setDomainSkills([...domainSkills, newDomainSkill.trim()]);
      setNewDomainSkill('');
    }
  };
  const removeDomainSkill = (s) => setDomainSkills(domainSkills.filter(item => item !== s));

  const addToolTech = (e) => {
    if (e) e.preventDefault();
    if (newToolTech.trim() && !toolsTech.includes(newToolTech.trim())) {
      setToolsTech([...toolsTech, newToolTech.trim()]);
      setNewToolTech('');
    }
  };
  const removeToolTech = (s) => setToolsTech(toolsTech.filter(item => item !== s));

  const addCurrentlyLearning = (e) => {
    if (e) e.preventDefault();
    if (newLearningItem.trim() && !currentlyLearning.includes(newLearningItem.trim())) {
      setCurrentlyLearning([...currentlyLearning, newLearningItem.trim()]);
      setNewLearningItem('');
    }
  };
  const removeCurrentlyLearning = (s) => setCurrentlyLearning(currentlyLearning.filter(item => item !== s));

  // ======== PASSPORT PHOTO HANDLERS ========
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('Photo file size should be less than 5MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setPersonalInfo(prev => ({
        ...prev,
        photoUrl: reader.result,
        showPhoto: true
      }));
      showToast('Passport photo added!');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPersonalInfo(prev => ({
      ...prev,
      photoUrl: '',
      showPhoto: false
    }));
    showToast('Passport photo removed.');
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
                { id: 'certifications', label: 'Certificates', icon: <Award className="h-3.5 w-3.5" /> },
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

                    {/* Passport Size Photo (Optional) */}
                    <div className="col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3 mt-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">Passport Size Photo (Optional)</label>
                          <p className="text-[11px] text-slate-500">Upload a professional headshot to display on your resume template</p>
                        </div>
                        {personalInfo.photoUrl && (
                          <div className="flex items-center gap-2">
                            <input 
                              type="checkbox"
                              id="showPhoto"
                              checked={personalInfo.showPhoto}
                              onChange={(e) => setPersonalInfo({ ...personalInfo, showPhoto: e.target.checked })}
                              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <label htmlFor="showPhoto" className="text-xs font-medium text-slate-600 cursor-pointer">
                              Show Photo
                            </label>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        {personalInfo.photoUrl ? (
                          <div className="relative group shrink-0">
                            <img 
                              src={personalInfo.photoUrl} 
                              alt="Passport Preview" 
                              className="w-16 h-20 object-cover rounded-xl border-2 border-emerald-500 shadow-sm"
                            />
                            <button
                              type="button"
                              onClick={handleRemovePhoto}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                              title="Remove Photo"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-16 h-20 bg-slate-200/70 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 shrink-0">
                            <User className="w-6 h-6" />
                            <span className="text-[9px] font-bold mt-1">Photo</span>
                          </div>
                        )}

                        <div className="space-y-1.5 flex-1">
                          <label 
                            htmlFor="passport-photo-input" 
                            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-xl cursor-pointer shadow-sm transition-all"
                          >
                            <User className="w-3.5 h-3.5" /> {personalInfo.photoUrl ? 'Change Photo' : 'Upload Passport Photo'}
                          </label>
                          <input 
                            id="passport-photo-input"
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                          <p className="text-[10px] text-slate-400">Recommended: Passport aspect ratio (3:4 or 1:1, max 5MB)</p>
                        </div>
                      </div>
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

              {/* certifications section */}
              {activeTab === 'certifications' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><Award className="h-4 w-4 text-emerald-500" /> Licenses & Certifications</h3>
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={handleImportCertifications}
                        className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1.5 rounded-lg hover:bg-emerald-100/50 transition-colors cursor-pointer"
                      >
                        <Sparkles className="h-3 w-3" /> Auto-Import
                      </button>
                      <button 
                        onClick={addCertification}
                        className="flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Certificate
                      </button>
                    </div>
                  </div>

                  {certifications.map((cert, index) => (
                    <div key={cert.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 relative space-y-4">
                      {certifications.length > 1 && (
                        <button 
                          onClick={() => removeCertification(cert.id)}
                          className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      )}
                      
                      <div className="text-xs font-bold text-emerald-600 mb-1">Certification #{index + 1}</div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Certification Title / License Name</label>
                          <input 
                            type="text" 
                            placeholder="e.g. AWS Certified Solutions Architect / Python Data Science Specialization"
                            value={cert.title} 
                            onChange={(e) => updateCertificationField(cert.id, 'title', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Issuing Body / Platform</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Amazon Web Services, Coursera, NPTEL, Udemy"
                            value={cert.issuer} 
                            onChange={(e) => updateCertificationField(cert.id, 'issuer', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Year / Date Issued</label>
                          <input 
                            type="text" 
                            placeholder="e.g. 2024"
                            value={cert.year} 
                            onChange={(e) => updateCertificationField(cert.id, 'year', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Credential URL / Verification ID (Optional)</label>
                          <input 
                            type="text" 
                            placeholder="e.g. aws.amazon.com/verify/ABC123XYZ"
                            value={cert.credentialUrl} 
                            onChange={(e) => updateCertificationField(cert.id, 'credentialUrl', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          />
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
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><Code className="h-4 w-4 text-emerald-500" /> Skills & Competencies</h3>
                    <button 
                      onClick={handleImportSkills}
                      className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1.5 rounded-lg hover:bg-emerald-100/50 transition-colors cursor-pointer"
                    >
                      <Sparkles className="h-3 w-3" /> Auto-Import Skills
                    </button>
                  </div>

                  {/* Domain Operations / Functional Expertise */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Domain Operations / Core Expertise (e.g. HR, Operations, Finance, Design)</label>
                    <form onSubmit={addDomainSkill} className="flex gap-2 mb-2">
                      <input 
                        type="text" 
                        placeholder="e.g. HR Operations, Employee Onboarding, Recruitment Coordination, Shift Management"
                        value={newDomainSkill} 
                        onChange={(e) => setNewDomainSkill(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 rounded-xl text-xs cursor-pointer">Add</button>
                    </form>
                    
                    {/* Quick Suggestions */}
                    <div className="mb-3">
                      <span className="text-[10px] text-slate-400 font-medium block mb-1">Quick Add Popular HR & Ops Skills:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {['HR Operations', 'Employee Onboarding', 'Recruitment Coordination', 'Shift Management', 'Grievance Redressal', 'Leave Tracking', 'Policy Compliance', 'HR Reporting'].map(sugg => (
                          <button
                            key={sugg}
                            type="button"
                            onClick={() => {
                              if (!domainSkills.includes(sugg)) setDomainSkills([...domainSkills, sugg]);
                            }}
                            className="text-[10px] bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 px-2 py-0.5 rounded-md font-medium transition-colors"
                          >
                            + {sugg}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {domainSkills.map(skill => (
                        <span key={skill} className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-100 text-xs font-semibold rounded-lg">
                          {skill}
                          <button type="button" onClick={() => removeDomainSkill(skill)} className="text-emerald-500 hover:text-emerald-700 font-bold ml-0.5">×}</button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Tools & Technology */}
                  <div className="pt-2 border-t border-slate-100">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tools & Software (e.g. MS Excel, Word, Outlook, Attendance Tools)</label>
                    <form onSubmit={addToolTech} className="flex gap-2 mb-2">
                      <input 
                        type="text" 
                        placeholder="e.g. MS Excel, Word, Outlook, Attendance Management Tools"
                        value={newToolTech} 
                        onChange={(e) => setNewToolTech(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <button type="submit" className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 rounded-xl text-xs cursor-pointer">Add</button>
                    </form>
                    
                    {/* Quick Suggestions */}
                    <div className="mb-3">
                      <span className="text-[10px] text-slate-400 font-medium block mb-1">Quick Add Common Tools:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {['MS Excel', 'Word', 'Outlook', 'Attendance Management Tools', 'Figma', 'VS Code', 'Canva'].map(sugg => (
                          <button
                            key={sugg}
                            type="button"
                            onClick={() => {
                              if (!toolsTech.includes(sugg)) setToolsTech([...toolsTech, sugg]);
                            }}
                            className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md font-medium transition-colors"
                          >
                            + {sugg}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {toolsTech.map(skill => (
                        <span key={skill} className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg">
                          🛠️ {skill}
                          <button type="button" onClick={() => removeToolTech(skill)} className="text-slate-400 hover:text-slate-600 font-bold ml-0.5">×}</button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Technical Skills */}
                  <div className="pt-2 border-t border-slate-100">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Technical & Programming Skills</label>
                    <form onSubmit={addTechSkill} className="flex gap-2 mb-3">
                      <input 
                        type="text" 
                        placeholder="e.g. Python, React.js, SQL, JavaScript"
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
                          <button type="button" onClick={() => removeTechSkill(skill)} className="text-slate-400 hover:text-slate-600 font-bold ml-0.5">×}</button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Soft Skills */}
                  <div className="pt-2 border-t border-slate-100">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Soft Skills</label>
                    <form onSubmit={addSoftSkill} className="flex gap-2 mb-3">
                      <input 
                        type="text" 
                        placeholder="e.g. Leadership, Communication, Empathy, Conflict Resolution"
                        value={newSoftSkill} 
                        onChange={(e) => setNewSoftSkill(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <button type="submit" className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 rounded-xl text-xs cursor-pointer">Add</button>
                    </form>
                    
                    {/* Quick Suggestions */}
                    <div className="mb-3">
                      <span className="text-[10px] text-slate-400 font-medium block mb-1">Quick Add Soft Skills:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {['Leadership', 'Communication', 'Empathy', 'Conflict Resolution', 'Time Management', 'Problem Solving'].map(sugg => (
                          <button
                            key={sugg}
                            type="button"
                            onClick={() => {
                              if (!softSkills.includes(sugg)) setSoftSkills([...softSkills, sugg]);
                            }}
                            className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md font-medium transition-colors"
                          >
                            + {sugg}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {softSkills.map(skill => (
                        <span key={skill} className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg">
                          {skill}
                          <button type="button" onClick={() => removeSoftSkill(skill)} className="text-slate-400 hover:text-slate-600 font-bold ml-0.5">×}</button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Languages Spoken / Known */}
                  <div className="pt-2 border-t border-slate-100">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Languages Spoken / Known</label>
                    <form onSubmit={addLanguage} className="flex gap-2 mb-3">
                      <input 
                        type="text" 
                        placeholder="e.g. English (Fluent), Hindi (Fluent), Kannada (Native)"
                        value={newLanguage} 
                        onChange={(e) => setNewLanguage(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 rounded-xl text-xs cursor-pointer">Add</button>
                    </form>
                    
                    {/* Quick suggestion pills */}
                    <div className="mb-3">
                      <span className="text-[10px] text-slate-400 font-medium block mb-1">Quick Add Popular Languages:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {['English (Fluent)', 'Hindi (Fluent)', 'Kannada (Native)', 'Telugu (Proficient)', 'Marathi (Conversational)', 'Tamil'].map(langSuggestion => (
                          <button
                            key={langSuggestion}
                            type="button"
                            onClick={() => {
                              if (!languages.includes(langSuggestion)) {
                                setLanguages([...languages, langSuggestion]);
                              }
                            }}
                            className="text-[10px] bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 px-2 py-0.5 rounded-md font-medium transition-colors"
                          >
                            + {langSuggestion}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {languages.map(lang => (
                        <span key={lang} className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-100 text-xs font-semibold rounded-lg">
                          💬 {lang}
                          <button type="button" onClick={() => removeLanguage(lang)} className="text-emerald-500 hover:text-emerald-700 font-bold ml-0.5">×}</button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Currently Learning (Optional) */}
                  <div className="pt-2 border-t border-slate-100">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Currently Learning (Optional)</label>
                    <form onSubmit={addCurrentlyLearning} className="flex gap-2 mb-2">
                      <input 
                        type="text" 
                        placeholder="e.g. Zoho Recruit, HRIS, ATS Platforms, AWS Cloud"
                        value={newLearningItem} 
                        onChange={(e) => setNewLearningItem(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 rounded-xl text-xs cursor-pointer">Add</button>
                    </form>

                    {/* Quick Suggestions */}
                    <div className="mb-3">
                      <span className="text-[10px] text-slate-400 font-medium block mb-1">Quick Add Currently Learning Suggestions:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {['Zoho Recruit', 'HRIS', 'ATS Platforms', 'Docker', 'AWS Cloud'].map(sugg => (
                          <button
                            key={sugg}
                            type="button"
                            onClick={() => {
                              if (!currentlyLearning.includes(sugg)) setCurrentlyLearning([...currentlyLearning, sugg]);
                            }}
                            className="text-[10px] bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 px-2 py-0.5 rounded-md font-medium transition-colors"
                          >
                            + {sugg}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {currentlyLearning.map(item => (
                        <span key={item} className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-800 border border-indigo-100 text-xs font-semibold rounded-lg">
                          📖 {item}
                          <button type="button" onClick={() => removeCurrentlyLearning(item)} className="text-indigo-500 hover:text-indigo-700 font-bold ml-0.5">×}</button>
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
                  <div className="border-b-2 border-emerald-600 pb-4 flex items-center justify-between gap-4">
                    <div className="flex-1 text-left">
                      <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 uppercase">{personalInfo.fullName || 'YOUR NAME'}</h2>
                      <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mt-1">{personalInfo.professionalTitle || 'Professional Title'}</div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-500 font-medium mt-2">
                        {personalInfo.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{personalInfo.email}</span>}
                        {personalInfo.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{personalInfo.phone}</span>}
                        {personalInfo.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{personalInfo.location}</span>}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-400 font-medium mt-1">
                        {personalInfo.github && <span className="flex items-center gap-1"><Code className="h-3.5 w-3.5" />{personalInfo.github}</span>}
                        {personalInfo.linkedin && <span className="flex items-center gap-1"><Link2 className="h-3.5 w-3.5" />{personalInfo.linkedin}</span>}
                        {personalInfo.portfolio && <span className="flex items-center gap-1"><Globe className="h-3.5 w-3.5" />{personalInfo.portfolio}</span>}
                      </div>
                    </div>
                    {personalInfo.photoUrl && personalInfo.showPhoto && (
                      <img 
                        src={personalInfo.photoUrl} 
                        alt="Passport Photo" 
                        className="w-20 h-24 object-cover rounded-lg border-2 border-emerald-600 shadow-md shrink-0" 
                      />
                    )}
                  </div>

                  {/* Summary */}
                  {summary && (
                    <div className="space-y-1.5">
                      <h3 className="text-sm font-bold text-emerald-700 uppercase tracking-wide border-b border-slate-100 pb-0.5">Professional Summary</h3>
                      <p className="text-slate-600 leading-relaxed text-justify">{summary}</p>
                    </div>
                  )}

                  {/* Skills */}
                  {(domainSkills.length > 0 || toolsTech.length > 0 || technicalSkills.length > 0 || softSkills.length > 0 || languages.length > 0) && (
                    <div className="space-y-1.5">
                      <h3 className="text-sm font-bold text-emerald-700 uppercase tracking-wide border-b border-slate-100 pb-0.5">Skills & Competencies</h3>
                      <div className="space-y-1">
                        {domainSkills.length > 0 && (
                          <p className="text-slate-600"><strong className="text-slate-700">Domain Operations:</strong> {domainSkills.join(', ')}</p>
                        )}
                        {toolsTech.length > 0 && (
                          <p className="text-slate-600"><strong className="text-slate-700">Tools Technology:</strong> {toolsTech.join(', ')}</p>
                        )}
                        {technicalSkills.length > 0 && (
                          <p className="text-slate-600"><strong className="text-slate-700">Technical Skills:</strong> {technicalSkills.join(', ')}</p>
                        )}
                        {softSkills.length > 0 && (
                          <p className="text-slate-600"><strong className="text-slate-700">Soft Skills:</strong> {softSkills.join(', ')}</p>
                        )}
                        {languages.length > 0 && (
                          <p className="text-slate-600"><strong className="text-slate-700">Languages:</strong> {languages.join(', ')}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Currently Learning */}
                  {currentlyLearning.length > 0 && (
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-emerald-700 uppercase tracking-wide border-b border-slate-100 pb-0.5">Currently Learning</h3>
                      <p className="text-slate-600 font-medium">{currentlyLearning.join(', ')}</p>
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

                  {/* Certifications */}
                  {certifications.some(c => c.title) && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-emerald-700 uppercase tracking-wide border-b border-slate-100 pb-0.5">Licenses & Certifications</h3>
                      <div className="space-y-2">
                        {certifications.filter(c => c.title).map((cert, idx) => (
                          <div key={idx} className="flex justify-between items-start">
                            <div>
                              <div className="font-bold text-slate-800">{cert.title}</div>
                              <div className="text-slate-500 font-medium">{cert.issuer} {cert.credentialUrl && <span className="text-emerald-600 text-[10px]">({cert.credentialUrl})</span>}</div>
                            </div>
                            <div className="text-right text-slate-400 font-medium">{cert.year}</div>
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
                  <div className="flex items-start justify-between border-b border-slate-200 pb-3 gap-4">
                    <div className="flex-1 text-left space-y-1">
                      <h2 className="text-xl font-bold tracking-normal text-slate-900 uppercase">{personalInfo.fullName || 'YOUR NAME'}</h2>
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider -mt-0.5 mb-1">{personalInfo.professionalTitle || 'Professional Title'}</div>
                      <div className="text-slate-600 flex flex-wrap gap-x-3 text-[11px]">
                        {personalInfo.location && <span>{personalInfo.location}</span>}
                        {personalInfo.phone && <span>· {personalInfo.phone}</span>}
                        {personalInfo.email && <span>· {personalInfo.email}</span>}
                      </div>
                      <div className="text-slate-500 flex flex-wrap gap-x-3 text-[11px]">
                        {personalInfo.github && <span>GitHub: {personalInfo.github}</span>}
                        {personalInfo.linkedin && <span>LinkedIn: {personalInfo.linkedin}</span>}
                        {personalInfo.portfolio && <span>Portfolio: {personalInfo.portfolio}</span>}
                      </div>
                    </div>
                    {personalInfo.photoUrl && personalInfo.showPhoto && (
                      <img 
                        src={personalInfo.photoUrl} 
                        alt="Passport Photo" 
                        className="w-20 h-24 object-cover rounded-md border border-slate-300 shadow-sm shrink-0" 
                      />
                    )}
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
                  {(domainSkills.length > 0 || toolsTech.length > 0 || technicalSkills.length > 0 || softSkills.length > 0 || languages.length > 0) && (
                    <div className="space-y-1">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-300 pb-0.5">SKILLS</h3>
                      <div className="space-y-0.5">
                        {domainSkills.length > 0 && (
                          <p className="text-slate-700"><strong className="text-slate-900">HR Operations / Core:</strong> {domainSkills.join(', ')}</p>
                        )}
                        {toolsTech.length > 0 && (
                          <p className="text-slate-700"><strong className="text-slate-900">Tools Technology:</strong> {toolsTech.join(', ')}</p>
                        )}
                        {technicalSkills.length > 0 && (
                          <p className="text-slate-700"><strong className="text-slate-900">Technical Skills:</strong> {technicalSkills.join(', ')}</p>
                        )}
                        {softSkills.length > 0 && (
                          <p className="text-slate-700"><strong className="text-slate-900">Soft Skills:</strong> {softSkills.join(', ')}</p>
                        )}
                        {languages.length > 0 && (
                          <p className="text-slate-700"><strong className="text-slate-900">Languages:</strong> {languages.join(', ')}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Currently Learning */}
                  {currentlyLearning.length > 0 && (
                    <div className="space-y-1">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-300 pb-0.5">CURRENTLY LEARNING</h3>
                      <p className="text-slate-700 font-medium">{currentlyLearning.join(', ')}</p>
                    </div>
                  )}

                  {/* Certifications */}
                  {certifications.some(c => c.title) && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-300 pb-0.5">Certifications & Licenses</h3>
                      <div className="space-y-1.5">
                        {certifications.filter(c => c.title).map((cert, idx) => (
                          <div key={idx} className="flex justify-between items-start">
                            <div>
                              <span className="font-bold">{cert.title}</span>
                              <span className="text-slate-600 font-medium"> — {cert.issuer}</span>
                            </div>
                            <div className="text-right text-slate-600 font-medium">{cert.year}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}


              {/* ================= TECH / SOFTWARE DEVELOPER TEMPLATE ================= */}
              {selectedTemplate === 'software' && (
                <div className="space-y-5 text-slate-800 text-xs font-mono">
                  {/* Minimal tech block header */}
                  <div className="flex items-start justify-between border-l-4 border-indigo-600 pl-4 py-1 gap-4">
                    <div className="flex-1">
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
                    {personalInfo.photoUrl && personalInfo.showPhoto && (
                      <img 
                        src={personalInfo.photoUrl} 
                        alt="Passport Photo" 
                        className="w-20 h-24 object-cover rounded-md border-2 border-indigo-600 shadow-sm shrink-0" 
                      />
                    )}
                  </div>

                  {/* Summary */}
                  {summary && (
                    <div className="space-y-1">
                      <div className="text-slate-400 font-bold text-[10px] uppercase">// SUMMARY</div>
                      <p className="text-slate-600 leading-relaxed text-justify">{summary}</p>
                    </div>
                  )}

                  {/* Skills Grid */}
                  {(technicalSkills.length > 0 || softSkills.length > 0 || languages.length > 0) && (
                    <div className="space-y-1">
                      <div className="text-slate-400 font-bold text-[10px] uppercase">// SKILL_STACK</div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                        {technicalSkills.length > 0 && (
                          <p><span className="text-indigo-600 font-bold">[tech]</span> {technicalSkills.join(', ')}</p>
                        )}
                        {softSkills.length > 0 && (
                          <p><span className="text-indigo-600 font-bold">[soft]</span> {softSkills.join(', ')}</p>
                        )}
                        {languages.length > 0 && (
                          <p><span className="text-indigo-600 font-bold">[lang]</span> {languages.join(', ')}</p>
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

                  {/* Certifications */}
                  {certifications.some(c => c.title) && (
                    <div className="space-y-1">
                      <div className="text-slate-400 font-bold text-[10px] uppercase">// CERTIFICATIONS</div>
                      <div className="space-y-1.5">
                        {certifications.filter(c => c.title).map((cert, idx) => (
                          <div key={idx} className="flex justify-between text-slate-700">
                            <span>&gt; {cert.title} <span className="text-indigo-600 font-medium">({cert.issuer})</span></span>
                            <span className="text-slate-400">{cert.year}</span>
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
                  <div className="flex justify-between items-start border-b border-teal-700 pb-3 gap-4">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-teal-800 uppercase">{personalInfo.fullName || 'YOUR NAME'}</h2>
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">{personalInfo.professionalTitle || 'Professional Title'}</div>
                      <div className="text-[10px] text-slate-500 space-y-0.5 mt-1">
                        <div>{personalInfo.email} | {personalInfo.phone}</div>
                        <div>{personalInfo.location}</div>
                        <div className="font-semibold text-teal-700">
                          {personalInfo.github && `gh/${personalInfo.github}`} · {personalInfo.linkedin && `in/${personalInfo.linkedin}`}
                        </div>
                      </div>
                    </div>
                    {personalInfo.photoUrl && personalInfo.showPhoto && (
                      <img 
                        src={personalInfo.photoUrl} 
                        alt="Passport Photo" 
                        className="w-20 h-24 object-cover rounded-lg border-2 border-teal-700 shadow-sm shrink-0" 
                      />
                    )}
                  </div>

                  {/* Summary */}
                  {summary && (
                    <div className="space-y-1">
                      <h3 className="text-[11px] font-extrabold text-teal-800 uppercase tracking-wider">// Profile Analytics</h3>
                      <p className="text-slate-600 leading-relaxed text-justify">{summary}</p>
                    </div>
                  )}

                  {/* Skills Grid */}
                  {(technicalSkills.length > 0 || softSkills.length > 0 || languages.length > 0) && (
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
                        {languages.length > 0 && (
                          <div className="col-span-2 pt-1 border-t border-teal-100/40">
                            <div className="font-bold text-[10px] text-teal-850 uppercase mb-0.5">Languages Spoken</div>
                            <p className="text-slate-600">{languages.join(', ')}</p>
                          </div>
                        )}
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

                  {/* Certifications */}
                  {certifications.some(c => c.title) && (
                    <div className="space-y-2">
                      <h3 className="text-[11px] font-extrabold text-teal-800 uppercase tracking-wider">// Verified Credentials & Certifications</h3>
                      <div className="space-y-2">
                        {certifications.filter(c => c.title).map((cert, idx) => (
                          <div key={idx} className="flex justify-between items-start text-slate-700">
                            <div>
                              <div className="font-bold text-slate-800">{cert.title}</div>
                              <div className="text-slate-500">{cert.issuer}</div>
                            </div>
                            <div className="text-right text-slate-400">{cert.year}</div>
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
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 gap-4">
                    <div className="flex-1 text-left">
                      <h2 className="text-2xl font-bold text-slate-900">{personalInfo.fullName || 'YOUR NAME'}</h2>
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">{personalInfo.professionalTitle || 'Professional Title'}</div>
                      <p className="text-slate-500 mt-1 flex gap-2 flex-wrap text-[11px]">
                        {personalInfo.email && <span>{personalInfo.email}</span>}
                        {personalInfo.phone && <span>| {personalInfo.phone}</span>}
                        {personalInfo.location && <span>| {personalInfo.location}</span>}
                      </p>
                      <p className="text-slate-400 text-[10px] mt-0.5 flex gap-2 flex-wrap">
                        {personalInfo.github && <span>GitHub: {personalInfo.github}</span>}
                        {personalInfo.linkedin && <span>LinkedIn: {personalInfo.linkedin}</span>}
                        {personalInfo.portfolio && <span>Web: {personalInfo.portfolio}</span>}
                      </p>
                    </div>
                    {personalInfo.photoUrl && personalInfo.showPhoto && (
                      <img 
                        src={personalInfo.photoUrl} 
                        alt="Passport Photo" 
                        className="w-20 h-24 object-cover rounded-md border border-slate-300 shadow-sm shrink-0" 
                      />
                    )}
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
                  {(technicalSkills.length > 0 || softSkills.length > 0 || languages.length > 0) && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-slate-900 border-l-2 border-slate-800 pl-2 uppercase tracking-wider">Skills & Languages</h3>
                      <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {technicalSkills.length > 0 && (
                          <p><strong className="text-slate-700">Tech Stack:</strong> {technicalSkills.join(', ')}</p>
                        )}
                        {softSkills.length > 0 && (
                          <p><strong className="text-slate-700">Soft Skills:</strong> {softSkills.join(', ')}</p>
                        )}
                        {languages.length > 0 && (
                          <p><strong className="text-slate-700">Languages Known:</strong> {languages.join(', ')}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Certifications */}
                  {certifications.some(c => c.title) && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-slate-900 border-l-2 border-slate-800 pl-2 uppercase tracking-wider">Certifications & Courses</h3>
                      <div className="space-y-2">
                        {certifications.filter(c => c.title).map((cert, idx) => (
                          <div key={idx} className="flex justify-between items-start">
                            <div>
                              <div className="font-bold text-slate-800">{cert.title}</div>
                              <div className="text-slate-500 font-medium">{cert.issuer}</div>
                            </div>
                            <div className="text-right text-slate-400 font-bold">{cert.year}</div>
                          </div>
                        ))}
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
