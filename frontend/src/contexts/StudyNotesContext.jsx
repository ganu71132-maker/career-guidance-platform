import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const StudyNotesContext = createContext();

export const useStudyNotes = () => {
  return useContext(StudyNotesContext);
};

export const StudyNotesProvider = ({ children }) => {
  const { user } = useAuth();
  
  // State for data
  const [branches, setBranches] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [units, setUnits] = useState([]);
  const [chapters, setChapters] = useState([]);
  
  // State for loading and error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // User features
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('study_notes_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const [recentlyViewed, setRecentlyViewed] = useState(() => {
    try {
      const saved = localStorage.getItem('study_notes_recent');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Fetch initial data
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const [
          { data: branchesData, error: branchesError },
          { data: semestersData, error: semestersError },
          { data: subjectsData, error: subjectsError },
          { data: unitsData, error: unitsError },
          { data: chaptersData, error: chaptersError }
        ] = await Promise.all([
          supabase.from('branches').select('*'),
          supabase.from('semesters').select('*'),
          supabase.from('subjects').select('*'),
          supabase.from('units').select('*'),
          supabase.from('chapters').select('*')
        ]);

        if (branchesError) throw branchesError;
        if (semestersError) throw semestersError;
        if (subjectsError) throw subjectsError;
        if (unitsError) throw unitsError;
        if (chaptersError) throw chaptersError;

        setBranches(branchesData || []);
        setSemesters(semestersData || []);
        setSubjects(subjectsData || []);
        setUnits(unitsData || []);
        setChapters(chaptersData || []);
      } catch (err) {
        console.error('Error fetching study notes data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // Fetch user specific data if logged in
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      try {
        const { data: favData, error: favError } = await supabase
          .from('student_favorites')
          .select('resource_id')
          .eq('user_id', user.id);
          
        if (!favError && favData) {
          const favIds = favData.map(f => f.resource_id);
          setFavorites(favIds);
        }

        const { data: recentData, error: recentError } = await supabase
          .from('student_recent')
          .select('chapter_id')
          .eq('user_id', user.id)
          .order('viewed_at', { ascending: false })
          .limit(10);
          
        if (!recentError && recentData && chapters.length > 0) {
          // Map to chapter objects
          const recentChapters = recentData
            .map(r => chapters.find(c => c.id === r.chapter_id))
            .filter(Boolean);
          
          if (recentChapters.length > 0) {
            setRecentlyViewed(recentChapters);
          }
        }
      } catch (err) {
        console.error('Error fetching user preferences:', err);
      }
    };
    
    fetchUserData();
  }, [user, chapters]);

  // Sync favorites and recently viewed to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('study_notes_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('study_notes_recent', JSON.stringify(recentlyViewed));
  }, [recentlyViewed]);

  // Computed getters
  const filteredSemesters = useMemo(() => {
    if (!selectedBranch) return semesters;
    return semesters.filter(s => s.branch_id === selectedBranch);
  }, [semesters, selectedBranch]);

  const filteredSubjects = useMemo(() => {
    if (!selectedSemester) return subjects;
    return subjects.filter(s => s.semester_id === selectedSemester);
  }, [subjects, selectedSemester]);

  const filteredUnits = useMemo(() => {
    if (!selectedSubject) return units;
    return units.filter(u => u.subject_id === selectedSubject);
  }, [units, selectedSubject]);

  const filteredChapters = useMemo(() => {
    let result = chapters;
    if (selectedUnit) {
      result = result.filter(c => c.unit_id === selectedUnit);
    }
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.title?.toLowerCase().includes(lowerQuery) || 
        c.description?.toLowerCase().includes(lowerQuery)
      );
    }
    return result;
  }, [chapters, selectedUnit, searchQuery]);

  // Actions
  const setFilter = useCallback((filterName, value) => {
    switch (filterName) {
      case 'branch':
        setSelectedBranch(value);
        setSelectedSemester(null);
        setSelectedSubject(null);
        setSelectedUnit(null);
        break;
      case 'semester':
        setSelectedSemester(value);
        setSelectedSubject(null);
        setSelectedUnit(null);
        break;
      case 'subject':
        setSelectedSubject(value);
        setSelectedUnit(null);
        break;
      case 'unit':
        setSelectedUnit(value);
        break;
      case 'search':
        setSearchQuery(value);
        break;
      default:
        break;
    }
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedBranch(null);
    setSelectedSemester(null);
    setSelectedSubject(null);
    setSelectedUnit(null);
    setSearchQuery('');
  }, []);

  const toggleFavorite = useCallback(async (resourceId) => {
    const isFavorite = favorites.includes(resourceId);
    let newFavorites;
    
    if (isFavorite) {
      newFavorites = favorites.filter(id => id !== resourceId);
    } else {
      newFavorites = [...favorites, resourceId];
    }
    
    setFavorites(newFavorites);

    if (user) {
      try {
        if (isFavorite) {
          await supabase
            .from('student_favorites')
            .delete()
            .eq('user_id', user.id)
            .eq('resource_id', resourceId);
        } else {
          await supabase
            .from('student_favorites')
            .insert({ user_id: user.id, resource_id: resourceId });
        }
      } catch (err) {
        console.error('Error toggling favorite:', err);
      }
    }
  }, [favorites, user]);

  const addRecentView = useCallback(async (chapterId) => {
    const chapter = chapters.find(c => c.id === chapterId);
    if (!chapter) return;

    setRecentlyViewed(prev => {
      const filtered = prev.filter(c => c.id !== chapterId);
      return [chapter, ...filtered].slice(0, 10);
    });

    if (user) {
      try {
        await supabase
          .from('student_recent')
          .upsert({ 
            user_id: user.id, 
            chapter_id: chapterId,
            viewed_at: new Date().toISOString()
          }, {
            onConflict: 'user_id, chapter_id'
          });
      } catch (err) {
        console.error('Error adding recent view:', err);
      }
    }
  }, [chapters, user]);

  const value = {
    branches,
    semesters,
    subjects,
    units,
    chapters,
    loading,
    error,
    
    selectedBranch,
    selectedSemester,
    selectedSubject,
    selectedUnit,
    searchQuery,
    
    favorites,
    recentlyViewed,
    
    filteredSemesters,
    filteredSubjects,
    filteredUnits,
    filteredChapters,
    
    setFilter,
    clearFilters,
    toggleFavorite,
    addRecentView
  };

  return (
    <StudyNotesContext.Provider value={value}>
      {children}
    </StudyNotesContext.Provider>
  );
};
