import { GoogleGenAI, Type } from "@google/genai";
import type { QuizQuestion } from '../types';
import { QUESTIONS_PER_QUIZ, LEARNING_LEVELS_DESCRIPTION } from '../constants';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const model = "gemini-2.5-flash";

// In-memory cache for the current session to reduce API calls
const translationCache = new Map<string, string>();
const quizCache = new Map<number, QuizQuestion[]>();

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

const handleApiError = (error: any, defaultMessage: string): Error => {
  console.error("Gemini API Error:", error);
  // Check if the error response from the API is available
  if (error?.message) {
    const message = error.message.toLowerCase();
    if (message.includes('429') || message.includes('resource_exhausted') || message.includes('quota')) {
      return new RateLimitError("API quota exceeded. Please wait a moment before trying again.");
    }
  }
  return new Error(defaultMessage);
};

export const translateText = async (text: string): Promise<string> => {
  const trimmedText = text.trim();
  if (translationCache.has(trimmedText)) {
    return translationCache.get(trimmedText)!;
  }

  const prompt = `Translate the following English text into formal, professional French suitable for a report or academic paper. Ensure the tone is polished and erudite. The output should only be the French translation. Text to translate: "${trimmedText}"`;
  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    const translation = response.text.trim();
    translationCache.set(trimmedText, translation);
    return translation;
  } catch (error) {
    throw handleApiError(error, "Failed to translate text.");
  }
};


export const generateQuizQuestions = async (level: number): Promise<QuizQuestion[]> => {
  if (quizCache.has(level)) {
    return quizCache.get(level)!;
  }

  const levelDescription = LEARNING_LEVELS_DESCRIPTION[level] || `level ${level} concepts`;
  const prompt = `
    Create a French learning quiz with ${QUESTIONS_PER_QUIZ} questions for an English speaker at level ${level}.
    The learning objective for this level is: "${levelDescription}".
    For each question, provide:
    1. A unique 'id' string (e.g., "noun_cat_1").
    2. The 'english' word or phrase.
    3. The correct 'french' translation. This will be the answer.
    4. An 'imagePrompt' that is a simple, descriptive phrase for a text-to-image AI (like 'a small black cat sitting').
    5. A list of three incorrect but plausible french 'options' for a multiple-choice quiz.
  `;
  
  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        english: { type: Type.STRING },
        french: { type: Type.STRING },
        imagePrompt: { type: Type.STRING },
        options: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
      required: ["id", "english", "french", "imagePrompt", "options"],
    },
  };

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
      }
    });

    const quizData = JSON.parse(response.text);

    const questions: QuizQuestion[] = quizData.map((item: any) => {
        // This is a simple text-input flashcard, so we just need the answer.
        // The options are generated for potential future multiple-choice use.
        return {
            id: item.id,
            english: item.english,
            french: item.french,
            imagePrompt: item.imagePrompt,
            options: item.options,
            answer: item.french, // The correct answer is the direct translation
        } as QuizQuestion;
    });

    quizCache.set(level, questions);
    return questions;

  } catch (error) {
    throw handleApiError(error, "Could not generate quiz questions from API.");
  }
};