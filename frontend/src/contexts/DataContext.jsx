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
      })),
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
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ======== FETCH ALL DATA ========
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
      await Promise.all([fetchCareers(), fetchCareerResources()]);
      setLoading(false);
    }
    init();

    // Listen to user auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
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
    try {
      if (isSaved) {
        const { error } = await supabase
          .from('saved_careers')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('career_id', careerId);
        if (error) throw error;
        setSavedCareers(prev => prev.filter(id => id !== careerId));
      } else {
        const { error } = await supabase
          .from('saved_careers')
          .insert({
            user_id: currentUser.id,
            career_id: careerId
          });
        if (error) throw error;
        setSavedCareers(prev => [...prev, careerId]);
      }
    } catch (err) {
      console.error('Error toggling save career:', err);
    }
  }

  async function toggleStepCompletion(stepId) {
    if (!currentUser) return;
    const isCompleted = completedSteps.includes(stepId);
    try {
      if (isCompleted) {
        const { error } = await supabase
          .from('user_progress')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('roadmap_step_id', stepId);
        if (error) throw error;
        setCompletedSteps(prev => prev.filter(id => id !== stepId));
        setCompletionsList(prev => prev.filter(item => item.stepId !== stepId));
      } else {
        const completedAt = new Date().toISOString();
        const { error } = await supabase
          .from('user_progress')
          .upsert({
            user_id: currentUser.id,
            roadmap_step_id: stepId,
            completed: true,
            completed_at: completedAt
          });
        if (error) throw error;
        setCompletedSteps(prev => [...prev, stepId]);
        setCompletionsList(prev => [...prev, { stepId, completedAt }]);
      }
    } catch (err) {
      console.error('Error toggling step completion:', err);
    }
  }

  // ======== CAREER CRUD ========
  async function addCareer(career) {
    const { data, error } = await supabase
      .from('careers')
      .insert(careerToDb(career))
      .select()
      .single();
    if (error) { console.error('Error adding career:', error); return null; }
    await fetchCareers();
    return data;
  }

  async function updateCareer(id, updates) {
    const { error } = await supabase
      .from('careers')
      .update(careerToDb(updates))
      .eq('id', id);
    if (error) { console.error('Error updating career:', error); return; }
    await fetchCareers();
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
    if (error) { console.error('Error adding step:', error); return; }
    await fetchCareers();
  }

  async function updateRoadmapStep(careerId, stepId, updates) {
    const dbUpdates = {};
    if (updates.title !== undefined) dbUpdates.step_title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;

    const { error } = await supabase.from('roadmaps').update(dbUpdates).eq('id', stepId);
    if (error) { console.error('Error updating step:', error); return; }
    await fetchCareers();
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
    if (error) { console.error('Error adding resource:', error); return; }
    await fetchCareers();
  }

  async function updateResource(careerId, stepId, resourceIndex, updates) {
    // Find the actual resource by index
    const career = careers.find(c => c.id === careerId);
    const step = career?.roadmap.find(s => s.id === stepId);
    const resource = step?.resources[resourceIndex];
    if (!resource) return;

    const dbUpdates = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.url !== undefined) dbUpdates.url = updates.url;
    if (updates.platform !== undefined) dbUpdates.platform = updates.platform;
    if (updates.recommended !== undefined) dbUpdates.recommended = updates.recommended;

    const { error } = await supabase.from('step_resources').update(dbUpdates).eq('id', resource.id);
    if (error) { console.error('Error updating resource:', error); return; }
    await fetchCareers();
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
    if (error) { console.error('Error adding career resource:', error); return; }
    await fetchCareerResources();
  }

  async function updateCareerResource(careerId, resourceIndex, updates) {
    const resources = careerResources[careerId] || [];
    const resource = resources[resourceIndex];
    if (!resource) return;

    const dbUpdates = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.url !== undefined) dbUpdates.url = updates.url;
    if (updates.platform !== undefined) dbUpdates.platform = updates.platform;
    if (updates.recommended !== undefined) dbUpdates.recommended = updates.recommended;

    const { error } = await supabase.from('career_resources').update(dbUpdates).eq('id', resource.id);
    if (error) { console.error('Error updating career resource:', error); return; }
    await fetchCareerResources();
  }

  async function deleteCareerResource(careerId, resourceIndex) {
    const resources = careerResources[careerId] || [];
    const resource = resources[resourceIndex];
    if (!resource) return;

    const { error } = await supabase.from('career_resources').delete().eq('id', resource.id);
    if (error) { console.error('Error deleting career resource:', error); return; }
    await fetchCareerResources();
  }

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
    toggleSaveCareer, toggleStepCompletion,
    addCareer, updateCareer, deleteCareer,
    addRoadmapStep, updateRoadmapStep, deleteRoadmapStep, reorderRoadmapSteps,
    addResource, updateResource, deleteResource,
    getCareerResources, addCareerResource, updateCareerResource, deleteCareerResource,
    getStats, fetchCareers, fetchCareerResources,
  };

  return (
    <DataContext.Provider value={value}>
      {!loading && children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
