
import { useState, useCallback, useEffect } from 'react';
import type { UserProgress } from '../types';
import { getItem, setItem } from '../services/storageService';
import { MAX_LEVEL } from '../constants';

const USER_PROGRESS_KEY = 'french-verb-voyage-progress';

const defaultProgress: UserProgress = {
  level: 1,
  score: 0,
  completedFlashcardIds: [],
};

const useUserProgress = () => {
  const [progress, setProgress] = useState<UserProgress>(defaultProgress);

  useEffect(() => {
    const savedProgress = getItem<UserProgress>(USER_PROGRESS_KEY);
    if (savedProgress) {
      setProgress(savedProgress);
    }
  }, []);

  const updateProgress = useCallback((newProgress: Partial<UserProgress>) => {
    setProgress(prev => {
      const updatedProgress = { ...prev, ...newProgress };
      setItem(USER_PROGRESS_KEY, updatedProgress);
      return updatedProgress;
    });
  }, []);

  const updateScore = useCallback((points: number) => {
    setProgress(prev => {
      const newScore = prev.score + points;
      // Level up every 100 points
      const newLevel = Math.min(Math.floor(newScore / 100) + 1, MAX_LEVEL);
      const updatedProgress = { ...prev, score: newScore, level: newLevel };
      setItem(USER_PROGRESS_KEY, updatedProgress);
      return updatedProgress;
    });
  }, []);

  const completeFlashcard = useCallback((flashcardId: string) => {
    setProgress(prev => {
      if (prev.completedFlashcardIds.includes(flashcardId)) {
        return prev;
      }
      const updatedProgress = { 
        ...prev, 
        completedFlashcardIds: [...prev.completedFlashcardIds, flashcardId] 
      };
      setItem(USER_PROGRESS_KEY, updatedProgress);
      return updatedProgress;
    });
  }, []);
  
  const resetProgress = useCallback(() => {
    if(window.confirm("Are you sure you want to reset all your progress? This cannot be undone.")) {
        setProgress(defaultProgress);
        setItem(USER_PROGRESS_KEY, defaultProgress);
        window.location.reload(); // Reload to reflect changes everywhere
    }
  }, []);

  return { progress, updateProgress, updateScore, completeFlashcard, resetProgress };
};

export default useUserProgress;
