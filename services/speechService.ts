
export const speak = (text: string, lang: string) => {
  if (!window.speechSynthesis) {
    console.error("Browser does not support speech synthesis.");
    alert("Sorry, your browser doesn't support text-to-speech.");
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  
  // Find a French voice
  const voices = window.speechSynthesis.getVoices();
  const frenchVoice = voices.find(voice => voice.lang.startsWith(lang));
  
  if (frenchVoice) {
    utterance.voice = frenchVoice;
  } else {
    // Fallback if no specific French voice is found
    utterance.lang = lang;
  }
  
  utterance.pitch = 1;
  utterance.rate = 0.9;
  
  window.speechSynthesis.cancel(); // Cancel any previous speech
  window.speechSynthesis.speak(utterance);
};

// Pre-load voices on some browsers
if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
}
