
import { NEPALI_MAP } from '../constants';
import { LevelCategory } from '../types';

const ROW_KEYS = {
  HOME: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'],
  TOP: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  BOTTOM: ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.'],
};

const SHIFT_CHARS = {
  EN: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()_+{}|:"<>?',
  // Simplified shift pool for general mix
  NE: 'ब्ख्ष्ा्न्ज्ा्फ्ी्स्त्तध्रभ्रच्रत्रथ्रगिषिुिश्ट्' 
};

export const getLevelCategory = (level: number): LevelCategory => {
  if (level <= 25) return 'Home Row';
  if (level <= 50) return 'Top Row';
  if (level <= 75) return 'Bottom Row';
  return 'Mastery Mix';
};

export const getLessonText = (level: number, language: 'en' | 'ne'): string => {
  const category = getLevelCategory(level);
  let charPool: string[] = [];
  
  // Calculate character pool size based on progress within the row (step of 5 levels)
  const relativeLevel = (level - 1) % 25;
  const poolSize = Math.min(10, 4 + Math.floor(relativeLevel / 2.5));
  
  if (category === 'Home Row') {
    charPool = ROW_KEYS.HOME.slice(0, poolSize);
  } else if (category === 'Top Row') {
    charPool = ROW_KEYS.TOP.slice(0, poolSize);
  } else if (category === 'Bottom Row') {
    charPool = ROW_KEYS.BOTTOM.slice(0, poolSize);
  } else {
    // Mastery Mix: All rows
    charPool = [...ROW_KEYS.HOME, ...ROW_KEYS.TOP, ...ROW_KEYS.BOTTOM];
  }

  // Map to Nepali if needed
  let finalPool = language === 'en' 
    ? charPool 
    : charPool.map(key => NEPALI_MAP[key] || key);

  // Add shift characters for high levels
  if (level > 75) {
    const shiftPool = language === 'en' ? SHIFT_CHARS.EN : SHIFT_CHARS.NE;
    const shiftSubset = shiftPool.split('').slice(0, Math.floor((level - 75) / 2));
    finalPool = [...finalPool, ...shiftSubset];
  }

  // Generate string
  const length = Math.min(100, 20 + (level - 1) * 0.8);
  let result = "";
  for (let i = 0; i < length; i++) {
    // Add spaces every 3-6 characters
    if (i > 0 && i % Math.floor(Math.random() * 4 + 3) === 0) {
      result += " ";
    } else {
      result += finalPool[Math.floor(Math.random() * finalPool.length)];
    }
  }
  
  return result.trim();
};
