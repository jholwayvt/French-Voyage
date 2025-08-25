
import React, { useState, useCallback } from 'react';
import Translator from './components/Translator';
import Learn from './components/Learn';
import { TranslateIcon, LearnIcon } from './components/icons/Icons';

enum AppMode {
  Translator,
  Learn,
}

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.Translator);

  const renderMode = useCallback(() => {
    switch (mode) {
      case AppMode.Translator:
        return <Translator />;
      case AppMode.Learn:
        return <Learn />;
      default:
        return <Translator />;
    }
  }, [mode]);

  const getButtonClasses = (buttonMode: AppMode) => {
    return `flex items-center justify-center gap-2 px-6 py-3 rounded-full text-lg font-semibold transition-all duration-300 ease-in-out transform hover:scale-105 ${
      mode === buttonMode
        ? 'bg-blue-600 text-white shadow-lg'
        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-blue-100 dark:hover:bg-slate-600'
    }`;
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-800 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-blue-600 dark:text-blue-400 drop-shadow-md">
            French Verb Voyage
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
            Your personal guide to mastering French.
          </p>
        </header>

        <div className="flex justify-center items-center gap-4 mb-8">
          <button
            onClick={() => setMode(AppMode.Translator)}
            className={getButtonClasses(AppMode.Translator)}
          >
            <TranslateIcon />
            Translator
          </button>
          <button
            onClick={() => setMode(AppMode.Learn)}
            className={getButtonClasses(AppMode.Learn)}
          >
            <LearnIcon />
            Learn
          </button>
        </div>

        <main className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl shadow-xl min-h-[500px]">
          {renderMode()}
        </main>
        
        <footer className="text-center mt-8 text-slate-400 dark:text-slate-500 text-sm">
          <p>Powered by React, Tailwind, and Gemini API</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
