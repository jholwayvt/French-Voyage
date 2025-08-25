import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { OFFLINE_LEARNING_DATA } from '../data/offlineLearnData';
import type { OfflineLevel, OfflineCard } from '../types';
import { speak } from '../services/speechService';
import { BookOpenIcon, ChevronLeftIcon, ChevronRightIcon, ReplayIcon, AudioIcon } from './icons/Icons';

type StudyPhase = 'english' | 'french' | 'review' | 'paused';

interface OfflineStudyProps {
  onExit: () => void;
}

const OfflineStudy: React.FC<OfflineStudyProps> = ({ onExit }) => {
  const [selectedLevel, setSelectedLevel] = useState<OfflineLevel | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [phase, setPhase] = useState<StudyPhase>('paused');
  const [key, setKey] = useState(0); // Used to reset animations

  const currentCard = useMemo(() => {
    return selectedLevel ? selectedLevel.cards[currentCardIndex] : null;
  }, [selectedLevel, currentCardIndex]);

  const startCardCycle = useCallback(() => {
    if (!currentCard) return;
    setPhase('english');
    const t1 = setTimeout(() => setPhase('french'), 1500);
    const t2 = setTimeout(() => setPhase('review'), 4500);
    const t3 = setTimeout(() => {
        if (currentCardIndex < selectedLevel!.cards.length - 1) {
            setCurrentCardIndex(i => i + 1);
        } else {
            setPhase('paused'); // End of level
        }
    }, 7000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [currentCard, currentCardIndex, selectedLevel]);

  useEffect(() => {
    let clearCycle: (() => void) | undefined;
    if (phase !== 'paused') {
        clearCycle = startCardCycle();
    }
    return clearCycle;
  }, [key, currentCardIndex, phase, startCardCycle]);

  const handleNext = () => {
    if (!selectedLevel) return;
    if (currentCardIndex < selectedLevel.cards.length - 1) {
        setPhase('paused');
        setCurrentCardIndex(i => i + 1);
    }
  };

  const handlePrev = () => {
    if (currentCardIndex > 0) {
        setPhase('paused');
        setCurrentCardIndex(i => i - 1);
    }
  };

  const handleReplay = () => {
    setPhase('paused');
    setTimeout(() => {
        setKey(k => k + 1); // remounts the animation effect
        setPhase('english');
    }, 100);
  };
  
  const handlePlay = () => {
    if (phase === 'paused') {
      setPhase('english');
    }
  }

  if (!selectedLevel) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300">Offline Study Levels</h2>
            <button onClick={onExit} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">Back to Hub</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-2">
            {OFFLINE_LEARNING_DATA.map(level => (
                <button
                    key={level.level}
                    onClick={() => setSelectedLevel(level)}
                    className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-xl hover:bg-purple-50 dark:hover:bg-slate-700/50 transition-all text-left flex flex-col justify-between"
                >
                    <div>
                        <p className="font-bold text-lg text-purple-600 dark:text-purple-400">Level {level.level}: {level.title}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{level.description}</p>
                    </div>
                    <p className="text-xs text-slate-400 mt-4">{level.cards.length} cards</p>
                </button>
            ))}
        </div>
      </div>
    );
  }

  const renderCardContent = () => {
      const isFlipped = phase === 'french' || phase === 'review';
      return (
        <div className={`relative w-full h-64 [transform-style:preserve-3d] transition-transform duration-700 ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
            {/* Front of Card */}
            <div className="absolute w-full h-full bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center p-4 [backface-visibility:hidden]">
                 <p className="text-4xl font-bold text-center text-slate-800 dark:text-slate-200">{currentCard?.english}</p>
            </div>
            {/* Back of Card */}
            <div className="absolute w-full h-full bg-blue-200 dark:bg-blue-900/60 rounded-lg flex items-center justify-center p-4 [transform:rotateY(180deg)] [backface-visibility:hidden]">
                 <p className="text-4xl font-bold text-center text-blue-800 dark:text-blue-200">{currentCard?.french}</p>
            </div>
        </div>
      );
  }

  return (
    <div className="flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
            <div>
                 <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Level {selectedLevel.level}: {selectedLevel.title}</h2>
                 <p className="text-sm text-slate-500">Card {currentCardIndex + 1} of {selectedLevel.cards.length}</p>
            </div>
            <button onClick={() => setSelectedLevel(null)} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">Change Level</button>
        </div>
        
        <div className="flex-grow flex flex-col items-center justify-center gap-4">
            <div className="w-full max-w-md [perspective:1000px]">
                {renderCardContent()}
            </div>
            {phase === 'review' && (
                 <div className="w-full max-w-md p-4 bg-green-100 dark:bg-green-900/50 rounded-lg text-center animate-fade-in">
                    <p className="text-lg text-slate-600 dark:text-slate-300"><strong className="text-slate-800 dark:text-slate-100">{currentCard?.english}</strong> = <strong className="text-blue-800 dark:text-blue-300">{currentCard?.french}</strong></p>
                 </div>
            )}
        </div>

        <div className="mt-4 flex flex-col items-center gap-4">
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full">
                <div 
                    className="h-2 bg-purple-500 rounded-full transition-all duration-300" 
                    style={{ width: `${((currentCardIndex + 1) / selectedLevel.cards.length) * 100}%` }}
                ></div>
            </div>
            <div className="flex items-center justify-center gap-4">
                <button onClick={handlePrev} disabled={currentCardIndex === 0} className="p-3 rounded-full bg-slate-200 dark:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronLeftIcon /></button>
                <button onClick={handleReplay} className="p-3 rounded-full bg-slate-200 dark:bg-slate-700"><ReplayIcon /></button>
                {currentCard && <button onClick={() => speak(currentCard.french, 'fr-FR')} className="p-3 rounded-full bg-slate-200 dark:bg-slate-700"><AudioIcon /></button>}
                <button onClick={handleNext} disabled={currentCardIndex === selectedLevel.cards.length - 1} className="p-3 rounded-full bg-slate-200 dark:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronRightIcon /></button>
            </div>
             {phase === 'paused' && currentCardIndex < selectedLevel.cards.length -1 && (
                <button onClick={handlePlay} className="w-full max-w-xs mt-2 bg-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors">
                    {currentCardIndex === 0 ? "Start Studying" : "Continue"}
                </button>
            )}
            {phase === 'paused' && currentCardIndex === selectedLevel.cards.length -1 && (
                <p className="text-green-600 dark:text-green-400 font-semibold mt-2">Level Complete!</p>
            )}
        </div>
    </div>
  )
};

export default OfflineStudy;
