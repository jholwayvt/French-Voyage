import React, { useState, useEffect, useCallback } from 'react';
import type { QuizQuestion } from '../types';
import { generateQuizQuestions, RateLimitError } from '../services/geminiService';
import useUserProgress from '../hooks/useUserProgress';
import Flashcard from './Flashcard';
import OfflineStudy from './OfflineStudy';
import { LoadingIcon, ResetIcon, LearnIcon, BookOpenIcon } from './icons/Icons';
import { QUESTIONS_PER_QUIZ, MAX_LEVEL, LEARNING_LEVELS_DESCRIPTION } from '../constants';
import { getCooldownRemaining, setCooldownTimestamp } from '../services/storageService';

type LearnMode = 'hub' | 'quiz' | 'study';

const Learn: React.FC = () => {
  const { progress, updateScore, completeFlashcard, resetProgress } = useUserProgress();
  const [learnMode, setLearnMode] = useState<LearnMode>('hub');
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);
  const [sessionScore, setSessionScore] = useState<number>(0);
  const [cooldown, setCooldown] = useState<number>(() => getCooldownRemaining());

  useEffect(() => {
    const timer = setInterval(() => {
      setCooldown(getCooldownRemaining());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const startNewQuiz = useCallback(async () => {
    if (getCooldownRemaining() > 0) return;
    setIsLoading(true);
    setError(null);
    setQuizFinished(false);
    setSessionScore(0);
    setCurrentQuestionIndex(0);
    try {
      const questions = await generateQuizQuestions(progress.level);
      setQuiz(questions);
      setLearnMode('quiz');
      setCooldownTimestamp(10);
    } catch (err: any) {
      if (err instanceof RateLimitError) {
        setCooldownTimestamp(60);
        setError(`${err.message} Cooldown activated across the app.`);
      } else {
        setError(err.message || 'Failed to generate a new quiz. Please try again.');
      }
      setLearnMode('hub'); // Go back to hub on error
      console.error(err);
    } finally {
      setIsLoading(false);
      setCooldown(getCooldownRemaining());
    }
  }, [progress.level]);

  const handleAnswer = (isCorrect: boolean, question: QuizQuestion) => {
    if (isCorrect) {
      updateScore(10);
      setSessionScore(prev => prev + 10);
      completeFlashcard(question.id);
    }
    
    setTimeout(() => {
        if (currentQuestionIndex < quiz.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            setQuizFinished(true);
            setLearnMode('hub');
        }
    }, 1500);
  };

  const renderHub = () => (
    <div className="text-center flex flex-col items-center justify-center h-full">
      {quizFinished && (
          <div className="mb-6 p-6 bg-green-100 dark:bg-green-900/50 rounded-lg w-full max-w-md">
              <h3 className="text-2xl font-bold text-green-700 dark:text-green-300">Quiz Complete!</h3>
              <p className="text-lg mt-2 text-slate-600 dark:text-slate-400">You scored {sessionScore} points in this session.</p>
          </div>
      )}
      <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300">Your Learning Progress</h2>
      <p className="text-lg mt-2 text-slate-500 dark:text-slate-400">Level: <span className="font-semibold text-blue-600 dark:text-blue-400">{progress.level} / {MAX_LEVEL}</span></p>
      <p className="text-lg text-slate-500 dark:text-slate-400">Total Score: <span className="font-semibold text-blue-600 dark:text-blue-400">{progress.score}</span></p>
      <p className="mt-4 text-slate-600 dark:text-slate-300 font-medium">Current Focus: {LEARNING_LEVELS_DESCRIPTION[progress.level]}</p>
      
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
        <button 
          onClick={startNewQuiz} 
          disabled={cooldown > 0}
          className="flex flex-col items-center justify-center gap-2 p-6 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
        >
          <LearnIcon />
          {cooldown > 0 ? `On cooldown (${cooldown}s)` : 'Start AI Quiz'}
        </button>
        <button 
          onClick={() => setLearnMode('study')}
          className="flex flex-col items-center justify-center gap-2 p-6 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-all transform hover:scale-105"
        >
          <BookOpenIcon />
          Offline Study
        </button>
      </div>
      {error && <p className="mt-4 text-red-500 text-center">{error}</p>}
       <button onClick={resetProgress} className="mt-6 flex items-center gap-2 text-sm text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors">
          <ResetIcon /> Reset Progress
      </button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <LoadingIcon className="w-12 h-12" />
        <p className="text-slate-500 dark:text-slate-400 text-xl">Generating your AI quiz...</p>
      </div>
    );
  }

  if (learnMode === 'study') {
    return <OfflineStudy onExit={() => setLearnMode('hub')} />;
  }

  if (learnMode === 'quiz' && quiz.length > 0) {
    return (
      <div>
          <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-slate-500">AI Quiz Level {progress.level}</p>
              <p className="text-sm text-slate-500">Question {currentQuestionIndex + 1} of {QUESTIONS_PER_QUIZ}</p>
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">Score: {progress.score}</p>
          </div>
        <Flashcard question={quiz[currentQuestionIndex]} onAnswer={handleAnswer} />
      </div>
    );
  }

  return renderHub();
};

export default Learn;
