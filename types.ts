
export interface Lesson {
  id: number;
  title: string;
  description: string;
  content: string;
  category: 'Home Row' | 'Top Row' | 'Bottom Row' | 'Numbers' | 'Symbols' | 'Words' | 'Custom';
}

export interface TypingStats {
  wpm: number;
  accuracy: number;
  errors: number;
  elapsedTime: number;
  isFinished: boolean;
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
