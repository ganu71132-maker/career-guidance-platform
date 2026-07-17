import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const DataContext = createContext();

// ======== HELPERS: Convert between DB (snake_case) and Frontend (camelCase) ========
function dbToCareer(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    field: row.field || [],
    salary: row.salary,
    demandLevel: row.demand_level,
    growthPotential: row.growth_potential,
    industryDemand: row.industry_demand,
    requiredSkills: row.required_skills || [],
    jobOpportunities: row.job_opportunities || [],
    createdAt: row.created_at,
    roadmap: (row.roadmaps || [])
      .sort((a, b) => a.step_order - b.step_order)
      .map(step => ({
        id: step.id,
        title: step.step_title,
        description: step.description,
        step: step.step_order,
        resources: (step.step_resources || []).map(r => ({
          id: r.id,
          title: r.title,
          type: r.type,
          url: r.url,
          platform: r.platform,
          recommended: r.recommended,
        })),
      }))
  };
}

function careerToDb(career) {
  const data = {};
  if (career.title !== undefined) data.title = career.title;
  if (career.description !== undefined) data.description = career.description;
  if (career.category !== undefined) data.category = career.category;
  if (career.field !== undefined) data.field = career.field;
  if (career.salary !== undefined) data.salary = career.salary;
  if (career.demandLevel !== undefined) data.demand_level = career.demandLevel;
  if (career.growthPotential !== undefined) data.growth_potential = career.growthPotential;
  if (career.industryDemand !== undefined) data.industry_demand = career.industryDemand;
  if (career.requiredSkills !== undefined) data.required_skills = career.requiredSkills;
  if (career.jobOpportunities !== undefined) data.job_opportunities = career.jobOpportunities;
  return data;
}

export function DataProvider({ children }) {
  const [careers, setCareers] = useState([]);
  const [careerResources, setCareerResources] = useState({});
  const [savedCareers, setSavedCareers] = useState([]);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [completionsList, setCompletionsList] = useState([]);
  const [skillsList, setSkillsList] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ======== FETCH ALL DATA ========
  const fetchAllSkills = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('skills')
        .select('*, skill_roadmaps(*)')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching skills:', error);
        return;
      }
      
      // Process the roadmaps to group by phase
      const formattedSkills = (data || []).map(skill => {
        const roadmaps = skill.skill_roadmaps || [];
        
        // Group by phase
        const phasesMap = {};
        roadmaps.forEach(r => {
          if (!phasesMap[r.phase_number]) {
            phasesMap[r.phase_number] = {
              phaseNumber: r.phase_number,
              phaseTitle: r.phase_title,
              topics: []
            };
          }
          phasesMap[r.phase_number].topics.push({
            id: r.id,
            title: r.topic_title,
            description: r.topic_description || [],
            order: r.display_order
          });
        });
        
        // Sort topics within phases
        Object.values(phasesMap).forEach(phase => {
          phase.topics.sort((a, b) => a.order - b.order);
        });
        
        // Convert to sorted array of phases
        const phasesArray = Object.values(phasesMap).sort((a, b) => a.phaseNumber - b.phaseNumber);

        return {
          id: skill.id,
          name: skill.name,
          description: skill.description,
          difficulty: skill.difficulty,
          estimatedTime: skill.estimated_time,
          skillsGained: skill.skills_gained || [],
          careerOpportunities: skill.career_opportunities || [],
          phases: phasesArray
        };
      });
      
      setSkillsList(formattedSkills);
    } catch (err) {
      console.error('Error in fetchAllSkills:', err);
    }
  }, []);
  const fetchCareers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('careers')
        .select('*, roadmaps(*, step_resources(*))')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setCareers((data || []).map(dbToCareer));
    } catch (err) {
      console.error('Error fetching careers:', err);
    }
  }, []);

  const fetchCareerResources = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('career_resources')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      // Group by career_id
      const grouped = {};
      (data || []).forEach(r => {
        if (!grouped[r.career_id]) grouped[r.career_id] = [];
        grouped[r.career_id].push({
          id: r.id,
          title: r.title,
          description: r.description,
          type: r.type,
          url: r.url,
          platform: r.platform,
          recommended: r.recommended,
        });
      });
      setCareerResources(grouped);
    } catch (err) {
      console.error('Error fetching career resources:', err);
    }
  }, []);

  const fetchUserProgress = useCallback(async () => {
    if (!currentUser) {
      setSavedCareers([]);
      setCompletedSteps([]);
      return;
    }
    try {
      // Fetch saved careers
      const { data: saved, error: savedErr } = await supabase
        .from('saved_careers')
        .select('career_id')
        .eq('user_id', currentUser.id);

      if (savedErr) throw savedErr;
      setSavedCareers((saved || []).map(row => row.career_id));

      // Fetch user progress
      const { data: progress, error: progErr } = await supabase
        .from('user_progress')
        .select('roadmap_step_id, completed_at')
        .eq('user_id', currentUser.id)
        .eq('completed', true);

      if (progErr) throw progErr;
      setCompletedSteps((progress || []).map(row => row.roadmap_step_id));
      setCompletionsList((progress || []).map(row => ({
        stepId: row.roadmap_step_id,
        completedAt: row.completed_at
      })));
    } catch (err) {
      console.error('Error fetching user progress:', err);
    }
  }, [currentUser]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([fetchCareers(), fetchCareerResources(), fetchAllSkills()]);
      setLoading(false);
    }
    init();

    // Listen to user auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setCurrentUser(prev => (prev?.id === u?.id ? prev : u));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setCurrentUser(prev => (prev?.id === u?.id ? prev : u));
    });

    return () => subscription.unsubscribe();
  }, [fetchCareers, fetchCareerResources]);

  useEffect(() => {
    fetchUserProgress();
  }, [fetchUserProgress]);

  // ======== SAVE & PROGRESS ACTIONS ========
  async function toggleSaveCareer(careerId) {
    if (!currentUser) return;
    const isSaved = savedCareers.includes(careerId);
    
    // Optimistic UI update
    if (isSaved) {
      setSavedCareers(prev => prev.filter(id => id !== careerId));
    } else {
      setSavedCareers(prev => [...prev, careerId]);
    }

    try {
      if (isSaved) {
        const { error } = await supabase
          .from('saved_careers')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('career_id', careerId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('saved_careers')
          .insert({
            user_id: currentUser.id,
            career_id: careerId
          });
        if (error) throw error;
      }
    } catch (err) {
      console.error('Error toggling save career:', err);
      // Revert optimistic update on failure
      fetchUserProgress();
    }
  }

  async function toggleStepCompletion(stepId) {
    if (!currentUser) return;
    const isCompleted = completedSteps.includes(stepId);
    
    // Optimistic UI update
    if (isCompleted) {
      setCompletedSteps(prev => prev.filter(id => id !== stepId));
      setCompletionsList(prev => prev.filter(item => item.stepId !== stepId));
    } else {
      const completedAt = new Date().toISOString();
      setCompletedSteps(prev => [...prev, stepId]);
      setCompletionsList(prev => [...prev, { stepId, completedAt }]);
    }

    try {
      if (isCompleted) {
        const { error } = await supabase
          .from('user_progress')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('roadmap_step_id', stepId);
        if (error) throw error;
      } else {
        const completedAt = new Date().toISOString();
        const { error } = await supabase
          .from('user_progress')
          .insert({
            user_id: currentUser.id,
            roadmap_step_id: stepId,
            completed: true,
            completed_at: completedAt
          });
        if (error) throw error;
      }
    } catch (err) {
      console.error('Error toggling step completion:', err);
      // Revert optimistic update on failure
      fetchUserProgress();
    }
  }

  // ======== CAREER CRUD ========
  async function addCareer(career) {
    const { data, error } = await supabase
      .from('careers')
      .insert(careerToDb(career))
      .select()
      .single();
    if (error) { 
      console.error('Error adding career:', error); 
      return { success: false, error }; 
    }
    await fetchCareers();
    return { success: true, data };
  }

  async function updateCareer(id, updates) {
    const { error } = await supabase
      .from('careers')
      .update(careerToDb(updates))
      .eq('id', id);
    if (error) { 
      console.error('Error updating career:', error); 
      return { success: false, error }; 
    }
    await fetchCareers();
    return { success: true };
  }

  async function deleteCareer(id) {
    const { error } = await supabase.from('careers').delete().eq('id', id);
    if (error) { console.error('Error deleting career:', error); return; }
    await fetchCareers();
    await fetchCareerResources();
  }

  // ======== ROADMAP STEP CRUD ========
  async function addRoadmapStep(careerId, step) {
    // Find the current max step_order
    const career = careers.find(c => c.id === careerId);
    const maxOrder = career ? Math.max(0, ...career.roadmap.map(s => s.step)) : 0;

    const { error } = await supabase.from('roadmaps').insert({
      career_id: careerId,
      step_title: step.title,
      description: step.description,
      step_order: maxOrder + 1,
    });
    if (error) { 
      console.error('Error adding step:', error); 
      return { success: false, error }; 
    }
    await fetchCareers();
    return { success: true };
  }

  async function updateRoadmapStep(careerId, stepId, updates) {
    const dbUpdates = {};
    if (updates.title !== undefined) dbUpdates.step_title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;

    const { error } = await supabase.from('roadmaps').update(dbUpdates).eq('id', stepId);
    if (error) { 
      console.error('Error updating step:', error); 
      return { success: false, error }; 
    }
    await fetchCareers();
    return { success: true };
  }

  async function deleteRoadmapStep(careerId, stepId) {
    const { error } = await supabase.from('roadmaps').delete().eq('id', stepId);
    if (error) { console.error('Error deleting step:', error); return; }

    // Re-order remaining steps
    const career = careers.find(c => c.id === careerId);
    if (career) {
      const remaining = career.roadmap.filter(s => s.id !== stepId).sort((a, b) => a.step - b.step);
      for (let i = 0; i < remaining.length; i++) {
        await supabase.from('roadmaps').update({ step_order: i + 1 }).eq('id', remaining[i].id);
      }
    }
    await fetchCareers();
  }

  async function reorderRoadmapSteps(careerId, fromIndex, toIndex) {
    const career = careers.find(c => c.id === careerId);
    if (!career) return;

    const newRoadmap = [...career.roadmap];
    const [moved] = newRoadmap.splice(fromIndex, 1);
    newRoadmap.splice(toIndex, 0, moved);

    // Update all step_orders in DB
    for (let i = 0; i < newRoadmap.length; i++) {
      await supabase.from('roadmaps').update({ step_order: i + 1 }).eq('id', newRoadmap[i].id);
    }
    await fetchCareers();
  }

  // ======== STEP RESOURCE CRUD ========
  async function addResource(careerId, stepId, resource) {
    const { error } = await supabase.from('step_resources').insert({
      step_id: stepId,
      title: resource.title,
      type: resource.type,
      url: resource.url,
      platform: resource.platform,
      recommended: resource.recommended || false,
    });
    if (error) { 
      console.error('Error adding resource:', error); 
      return { success: false, error }; 
    }
    await fetchCareers();
    return { success: true };
  }

  async function updateResource(careerId, stepId, resourceIndex, updates) {
    // Find the actual resource by index
    const career = careers.find(c => c.id === careerId);
    const step = career?.roadmap.find(s => s.id === stepId);
    const resource = step?.resources[resourceIndex];
    if (!resource) return { success: false, error: new Error('Resource not found') };

    const dbUpdates = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.url !== undefined) dbUpdates.url = updates.url;
    if (updates.platform !== undefined) dbUpdates.platform = updates.platform;
    if (updates.recommended !== undefined) dbUpdates.recommended = updates.recommended;

    const { error } = await supabase.from('step_resources').update(dbUpdates).eq('id', resource.id);
    if (error) { 
      console.error('Error updating resource:', error); 
      return { success: false, error }; 
    }
    await fetchCareers();
    return { success: true };
  }

  async function deleteResource(careerId, stepId, resourceIndex) {
    const career = careers.find(c => c.id === careerId);
    const step = career?.roadmap.find(s => s.id === stepId);
    const resource = step?.resources[resourceIndex];
    if (!resource) return;

    const { error } = await supabase.from('step_resources').delete().eq('id', resource.id);
    if (error) { console.error('Error deleting resource:', error); return; }
    await fetchCareers();
  }

  // ======== CAREER RESOURCES CRUD (independent, for affiliate) ========
  function getCareerResources(careerId) {
    return careerResources[careerId] || [];
  }

  async function addCareerResource(careerId, resource) {
    const { error } = await supabase.from('career_resources').insert({
      career_id: careerId,
      title: resource.title,
      description: resource.description,
      type: resource.type,
      url: resource.url,
      platform: resource.platform,
      recommended: resource.recommended || false,
    });
    if (error) { 
      console.error('Error adding career resource:', error); 
      return { success: false, error }; 
    }
    await fetchCareerResources();
    return { success: true };
  }

  async function updateCareerResource(careerId, resourceIndex, updates) {
    const resources = careerResources[careerId] || [];
    const resource = resources[resourceIndex];
    if (!resource) return { success: false, error: new Error('Resource not found') };

    const dbUpdates = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.url !== undefined) dbUpdates.url = updates.url;
    if (updates.platform !== undefined) dbUpdates.platform = updates.platform;
    if (updates.recommended !== undefined) dbUpdates.recommended = updates.recommended;

    const { error } = await supabase.from('career_resources').update(dbUpdates).eq('id', resource.id);
    if (error) { 
      console.error('Error updating career resource:', error); 
      return { success: false, error }; 
    }
    await fetchCareerResources();
    return { success: true };
  }

  async function deleteCareerResource(careerId, resourceIndex) {
    const resources = careerResources[careerId] || [];
    const resource = resources[resourceIndex];
    if (!resource) return;

    const { error } = await supabase.from('career_resources').delete().eq('id', resource.id);
    if (error) { console.error('Error deleting career resource:', error); return; }
    await fetchCareerResources();
  }

  // ======== SKILLS ========
  const addSkill = async (skillData) => {
    try {
      const { data, error } = await supabase
        .from('skills')
        .insert([skillData])
        .select();
      if (error) throw error;
      await fetchAllSkills();
      return { success: true, data: data?.[0] };
    } catch (error) {
      console.error('Error adding skill:', error);
      return { success: false, error: error.message };
    }
  };

  const updateSkill = async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('skills')
        .update(updates)
        .eq('id', id)
        .select();
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("No rows updated. Skill may not exist.");
      await fetchAllSkills();
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('Error updating skill:', error);
      return { success: false, error: error.message };
    }
  };

  const deleteSkill = async (id) => {
    try {
      const { error } = await supabase
        .from('skills')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await fetchAllSkills();
      return { success: true };
    } catch (error) {
      console.error('Error deleting skill:', error);
      return { success: false, error: error.message };
    }
  };

  // ======== SKILL ROADMAPS ========
  const addSkillPhase = async (phaseData) => {
    try {
      const { data, error } = await supabase
        .from('skill_roadmaps')
        .insert([phaseData])
        .select();
      if (error) throw error;
      await fetchAllSkills();
      return { success: true, data: data?.[0] };
    } catch (error) {
      console.error('Error adding skill phase:', error);
      return { success: false, error: error.message };
    }
  };

  const updateSkillPhase = async (id, updates) => {
    try {
      console.log("Updating Skill Phase. ID:", id, "Payload:", updates);
      if (!id) {
        throw new Error("Missing ID for update!");
      }
      const { data, error } = await supabase
        .from('skill_roadmaps')
        .update(updates)
        .eq('id', id)
        .select();
      
      console.log("Supabase response:", { data, error });
      
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("No rows updated. Topic may have been deleted.");
      await fetchAllSkills();
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('Error updating skill phase:', error);
      return { success: false, error: error.message };
    }
  };

  const deleteSkillPhase = async (id) => {
    try {
      const { error } = await supabase
        .from('skill_roadmaps')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await fetchAllSkills();
      return { success: true };
    } catch (error) {
      console.error('Error deleting skill phase:', error);
      return { success: false, error: error.message };
    }
  };

  // ======== COMMENTS CRUD ========
  const fetchComments = async (pageType, pageId) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('page_type', pageType)
        .eq('page_id', pageId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching comments:', error);
      return { success: false, error: error.message };
    }
  };

  const addComment = async (pageType, pageId, content, userEmail, parentId = null) => {
    if (!currentUser) return { success: false, error: 'Not authenticated' };
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          page_type: pageType,
          page_id: pageId,
          user_id: currentUser.id,
          user_email: userEmail,
          content: content,
          parent_id: parentId,
        })
        .select();
      
      if (error) throw error;
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('Error adding comment:', error);
      return { success: false, error: error.message };
    }
  };

  const editComment = async (commentId, content) => {
    if (!currentUser) return { success: false, error: 'Not authenticated' };
    try {
      const { data, error } = await supabase
        .from('comments')
        .update({
          content: content,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .eq('user_id', currentUser.id) // Extra safety check
        .select();
        
      if (error) throw error;
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('Error editing comment:', error);
      return { success: false, error: error.message };
    }
  };

  const deleteComment = async (commentId) => {
    if (!currentUser) return { success: false, error: 'Not authenticated' };
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', currentUser.id); // Extra safety check
        
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting comment:', error);
      return { success: false, error: error.message };
    }
  };

  // ======== STATS ========
  function getStats() {
    const totalCareers = careers.length;
    const totalSteps = careers.reduce((sum, c) => sum + c.roadmap.length, 0);
    const totalRoadmapResources = careers.reduce((sum, c) => sum + c.roadmap.reduce((s2, step) => s2 + step.resources.length, 0), 0);
    const totalCareerResources = Object.values(careerResources).reduce((sum, list) => sum + list.length, 0);
    const categories = [...new Set(careers.map(c => c.category))];
    return {
      totalCareers, totalSteps,
      totalRoadmapResources, totalCareerResources,
      totalResources: totalRoadmapResources + totalCareerResources,
      totalCategories: categories.length, categories
    };
  }

  const value = {
    careers, loading,
    careerResources,
    savedCareers, completedSteps, completionsList,
    skillsList, fetchAllSkills,
    toggleSaveCareer, toggleStepCompletion,
    addCareer, updateCareer, deleteCareer,
    addRoadmapStep, updateRoadmapStep, deleteRoadmapStep, reorderRoadmapSteps,
    addResource, updateResource, deleteResource,
    getCareerResources, addCareerResource, updateCareerResource, deleteCareerResource,
    addSkill, updateSkill, deleteSkill,
    addSkillPhase, updateSkillPhase, deleteSkillPhase,
    fetchComments, addComment, editComment, deleteComment,
    getStats, fetchCareers, fetchCareerResources,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
