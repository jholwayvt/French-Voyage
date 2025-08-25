// A global promise that resolves with the voices list.
// This ensures we only try to load the voices once per session.
let voicesPromise: Promise<SpeechSynthesisVoice[]> | null = null;

// This function robustly loads voices, waiting for them if necessary.
const loadVoices = (): Promise<SpeechSynthesisVoice[]> => {
    return new Promise((resolve, reject) => {
        // Check if voices are already loaded and available.
        let voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            return resolve(voices);
        }

        // If not, wait for the 'voiceschanged' event to fire.
        window.speechSynthesis.onvoiceschanged = () => {
            voices = window.speechSynthesis.getVoices();
            resolve(voices);
        };

        // Also set a fallback timeout to poll for voices, as 'onvoiceschanged' can be unreliable.
        setTimeout(() => {
             voices = window.speechSynthesis.getVoices();
             if (voices.length > 0) {
                resolve(voices);
             } else {
                reject(new Error("Speech synthesis voices could not be loaded in time."));
             }
        }, 1000); // 1-second timeout.
    });
};

// This function ensures we only try to load voices once.
const getVoices = (): Promise<SpeechSynthesisVoice[]> => {
    if (!voicesPromise) {
        voicesPromise = loadVoices();
    }
    return voicesPromise;
};

// Pre-warm the voices list when the module is loaded for better performance.
if (typeof window !== 'undefined' && window.speechSynthesis) {
    getVoices().catch(err => console.error(err));
}

export const speak = async (text: string, lang: string): Promise<void> => {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.error("Browser does not support speech synthesis.");
    return;
  }

  // Stop any ongoing speech to prevent overlap.
  window.speechSynthesis.cancel();

  // Create the utterance object which contains the text and settings.
  const utterance = new SpeechSynthesisUtterance(text);
  
  try {
    const availableVoices = await getVoices();
    
    // Find the best available voice for the desired language.
    // First, try for an exact match (e.g., 'fr-FR').
    let desiredVoice = availableVoices.find(voice => voice.lang === lang);
    // If not found, try for a partial match (e.g., 'fr').
    if (!desiredVoice) {
      desiredVoice = availableVoices.find(voice => voice.lang.startsWith(lang));
    }
    
    if (desiredVoice) {
      utterance.voice = desiredVoice;
    } else {
      // If no specific voice is found, we must set the lang property on the utterance.
      // The browser will then use its default voice for that language. This is a critical fallback.
      utterance.lang = lang;
      console.warn(`No specific voice for lang '${lang}' found. Using browser default.`);
    }
  } catch (error) {
     console.error("Error getting speech synthesis voices:", error);
     // Fallback to lang attribute is critical if getting voices fails.
     utterance.lang = lang;
  }
  
  utterance.pitch = 1;
  utterance.rate = 0.9;
  
  window.speechSynthesis.speak(utterance);
};
