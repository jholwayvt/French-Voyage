export interface Flashcard {
  id: string;
  english: string;
  french: string;
  imagePrompt: string;
}

export interface QuizQuestion extends Flashcard {
  options: string[];
  answer: string;
}

export interface UserProgress {
  level: number;
  score: number;
  completedFlashcardIds: string[];
}

// Types for the new Offline Study Mode
export interface OfflineCard {
  english: string;
  french: string;
}

export interface OfflineLevel {
  level: number;
  title: string;
  description: string;
  cards: OfflineCard[];
}