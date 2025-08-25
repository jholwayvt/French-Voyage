import React, { useState, useEffect } from 'react';
import { FRENCH_LEARNING_TIPS } from '../constants';
import { InfoIcon } from './icons/Icons';

const TipOfTheDay: React.FC = () => {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    // Cycle to the next tip every 30 seconds without making an API call
    const intervalId = setInterval(() => {
      setTipIndex(prevIndex => (prevIndex + 1) % FRENCH_LEARNING_TIPS.length);
    }, 30000); 

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="p-4 bg-amber-100 dark:bg-slate-700/50 border-l-4 border-amber-500 dark:border-amber-400 rounded-r-lg shadow-md">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
           <InfoIcon />
        </div>
        <div className="flex-grow">
          <h4 className="font-bold text-amber-800 dark:text-amber-300">French Learning Tip</h4>
          <p className="mt-1 text-slate-700 dark:text-slate-300">{FRENCH_LEARNING_TIPS[tipIndex]}</p>
        </div>
      </div>
    </div>
  );
};

export default TipOfTheDay;
