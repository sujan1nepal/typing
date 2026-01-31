
export type LevelCategory = 'Home Row' | 'Top Row' | 'Bottom Row' | 'Mastery Mix' | 'Custom';

export interface Lesson {
  id: number;
  level: number;
  title: string;
  description: string;
  content: string;
  category: LevelCategory;
}

export interface TypingStats {
  wpm: number;
  accuracy: number;
  errors: number;
  elapsedTime: number;
}

export interface KeyMapItem {
  key: string;
  shiftKey?: string;
  width?: string;
  code: string;
}

export interface KeyboardRow {
  keys: KeyMapItem[];
}
