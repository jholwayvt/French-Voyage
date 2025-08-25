import React, { useState, useCallback, useEffect } from 'react';
import { translateText, RateLimitError } from '../services/geminiService';
import { speak } from '../services/speechService';
import { getCooldownRemaining, setCooldownTimestamp } from '../services/storageService';
import { AudioIcon, LoadingIcon } from './icons/Icons';
import TipOfTheDay from './TipOfTheDay';

const Translator: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<number>(() => getCooldownRemaining());

  useEffect(() => {
    // Poll to keep UI in sync with global cooldown (works across tabs)
    const timer = setInterval(() => {
      setCooldown(getCooldownRemaining());
    }, 1000);
    return () => clearInterval(timer);
  }, []);


  const handleTranslate = useCallback(async () => {
    if (!inputText.trim() || getCooldownRemaining() > 0) {
      if (!inputText.trim()) setError('Please enter some text to translate.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setTranslatedText('');

    try {
      const translation = await translateText(inputText);
      setTranslatedText(translation);
      setCooldownTimestamp(5); // 5-second gentle cooldown on success
    } catch (err: any) {
       if (err instanceof RateLimitError) {
        setCooldownTimestamp(60); // 60-second cooldown on rate limit error
        setError(`${err.message} Cooldown activated across the app.`);
      } else {
        setError(err.message || 'Failed to get translation. Please try again.');
      }
      console.error(err);
    } finally {
      setIsLoading(false);
      setCooldown(getCooldownRemaining()); // Ensure UI state is synced immediately after action
    }
  }, [inputText]);

  return (
    <div className="flex flex-col gap-6 h-full">
      <TipOfTheDay />
      <h2 className="text-2xl font-bold text-center text-slate-700 dark:text-slate-300">Translate to Professional French</h2>
      
      <div className="flex-grow flex flex-col gap-4">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Enter English text here to translate..."
          className="w-full flex-grow p-4 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          rows={6}
          disabled={isLoading || cooldown > 0}
        />
        <button
          onClick={handleTranslate}
          disabled={isLoading || !inputText.trim() || cooldown > 0}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-all duration-300 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <LoadingIcon />
              Translating...
            </>
          ) : cooldown > 0 ? `On cooldown (${cooldown}s)` : 'Translate' }
        </button>
      </div>

      {error && <p className="text-red-500 text-center">{error}</p>}
      
      {translatedText && (
        <div className="p-4 bg-blue-50 dark:bg-slate-800 rounded-lg border border-blue-200 dark:border-slate-700">
          <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200">Formal French Translation:</h3>
          <div className="flex items-start justify-between mt-2 gap-4">
            <p className="text-slate-700 dark:text-slate-300 text-base flex-grow whitespace-pre-wrap leading-relaxed">{translatedText}</p>
            <div className="flex items-center gap-2 flex-shrink-0">
                <button
                    onClick={() => speak(translatedText, 'fr-FR')}
                    className="p-2 rounded-full hover:bg-blue-200 dark:hover:bg-slate-700 transition-colors"
                    title="Listen to translation"
                >
                    <AudioIcon />
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Translator;