
import React, { useState, useEffect, useCallback } from 'react';
import type { QuizQuestion } from '../types';
import { speak } from '../services/speechService';
import { AudioIcon } from './icons/Icons';

interface FlashcardProps {
  question: QuizQuestion;
  onAnswer: (isCorrect: boolean, question: QuizQuestion) => void;
}

const Flashcard: React.FC<FlashcardProps> = ({ question, onAnswer }) => {
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setUserAnswer('');
    setFeedback(null);
    setSubmitted(false);
  }, [question]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitted) return;

    setSubmitted(true);
    const isCorrect = userAnswer.trim().toLowerCase() === question.answer.toLowerCase();
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    onAnswer(isCorrect, question);
  };
  
  const getFeedbackClasses = () => {
      if (!feedback) return 'border-slate-300 dark:border-slate-600';
      if (feedback === 'correct') return 'border-green-500 bg-green-50 dark:bg-green-900/50';
      if (feedback === 'incorrect') return 'border-red-500 bg-red-50 dark:bg-red-900/50';
      return '';
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4 rounded-lg">
      <div className="w-full max-w-sm h-52 bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden shadow-md flex items-center justify-center">
        <img 
          src={`https://picsum.photos/seed/${question.id}/400/300`} 
          alt={question.english} 
          className="w-full h-full object-cover"
        />
      </div>
      
      <p className="text-2xl font-semibold text-center mt-2 text-slate-800 dark:text-slate-200">{question.english}</p>
      <p className="text-slate-500">What is the translation in French?</p>

      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col items-center gap-3">
        <input
          type="text"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          placeholder="Type your answer here"
          disabled={submitted}
          className={`w-full p-3 text-center text-lg border-2 rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 ${getFeedbackClasses()}`}
        />
        <button type="submit" disabled={submitted || !userAnswer.trim()} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed">
          Submit
        </button>
      </form>
      
      {feedback && (
        <div className={`mt-4 text-center p-3 rounded-lg w-full max-w-sm ${feedback === 'correct' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
          <p className="font-bold">{feedback === 'correct' ? 'Correct!' : 'Not quite.'}</p>
          <p>The correct answer is: <strong className="font-semibold">{question.answer}</strong></p>
           <button 
              onClick={() => speak(question.answer, 'fr-FR')}
              className="mt-2 inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              <AudioIcon className="w-4 h-4" /> Listen
            </button>
        </div>
      )}
    </div>
  );
};

export default Flashcard;
