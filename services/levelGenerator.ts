
import { NEPALI_MAP } from '../constants.tsx';
import { LevelCategory } from '../types.ts';

const ROW_KEYS = {
  HOME: ['a', ';', 's', 'l', 'd', 'k', 'f', 'j', 'g', 'h'],
  TOP: ['q', 'p', 'w', 'o', 'e', 'i', 'r', 'u', 't', 'y'],
  BOTTOM: ['z', '/', 'x', '.', 'c', ',', 'v', 'm', 'b', 'n'],
};

const NEPALI_FOUNDATION = ['ब', 'स', 'क', 'म', 'ा', 'न', 'ज', 'व', 'प', 'ि'];

export const getLevelCategory = (level: number): LevelCategory => {
  if (level <= 40) return 'Home Row';
  if (level <= 80) return 'Top Row';
  if (level <= 120) return 'Bottom Row';
  if (level <= 160) return 'Mastery Mix';
  if (level <= 200) return 'Word Mastery';
  if (level <= 250) return 'Sentence Flow';
  if (level <= 300) return 'Paragraph Stamina';
  return 'Extreme Mastery';
};

const generateRepetitionDrill = (keys: string[], blockSize: number, lengthGoal: number = 140): string => {
  let result = "";
  while (result.length < lengthGoal) {
    for (const key of keys) {
      result += key.repeat(blockSize) + " ";
    }
  }
  return result.trim().substring(0, lengthGoal);
};

const generateRandomDrill = (keys: string[], lengthGoal: number = 140): string => {
  let result = "";
  while (result.length < lengthGoal) {
    const chunkLength = Math.floor(Math.random() * 3) + 2; 
    for (let i = 0; i < chunkLength; i++) {
      result += keys[Math.floor(Math.random() * keys.length)];
    }
    result += " ";
  }
  return result.trim().substring(0, lengthGoal);
};

export const getLessonText = (level: number, language: 'en' | 'ne'): string => {
  const isNepali = language === 'ne';
  const home = isNepali ? NEPALI_FOUNDATION : ROW_KEYS.HOME;
  const top = isNepali ? ROW_KEYS.TOP.map(k => NEPALI_MAP[k] || k) : ROW_KEYS.TOP;
  const bottom = isNepali ? ROW_KEYS.BOTTOM.map(k => NEPALI_MAP[k] || k) : ROW_KEYS.BOTTOM;

  // Home Row: 1-40
  if (level <= 40) {
    if (level <= 20) {
      if (level <= 10) return generateRepetitionDrill([home[(level-1)%5*2], home[(level-1)%5*2+1]], 4);
      return generateRepetitionDrill(home, 1);
    }
    return generateRandomDrill(home.slice(0, Math.min(home.length, Math.floor((level-21)/2)+3)));
  }

  // Top Row: 41-80
  if (level <= 80) {
    const offset = level - 40;
    if (offset <= 20) {
      if (offset <= 10) return generateRepetitionDrill([top[(offset-1)%5*2], top[(offset-1)%5*2+1]], 4);
      return generateRepetitionDrill(top, 1);
    }
    return generateRandomDrill(top.slice(0, Math.min(top.length, Math.floor((offset-21)/2)+3)));
  }

  // Bottom Row: 81-120
  if (level <= 120) {
    const offset = level - 80;
    if (offset <= 20) {
      if (offset <= 10) return generateRepetitionDrill([bottom[(offset-1)%5*2], bottom[(offset-1)%5*2+1]], 4);
      return generateRepetitionDrill(bottom, 1);
    }
    return generateRandomDrill(bottom.slice(0, Math.min(bottom.length, Math.floor((offset-21)/2)+3)));
  }

  // Mastery Mix: 121-160
  if (level <= 160) {
    const all = [...home, ...top, ...bottom];
    return generateRandomDrill(all);
  }

  const banks = language === 'en' ? DATA_BANKS.EN : DATA_BANKS.NE;
  const category = getLevelCategory(level);

  if (category === 'Word Mastery') {
    return Array.from({ length: 15 }, () => banks.WORDS[Math.floor(Math.random() * banks.WORDS.length)]).join(' ');
  }

  if (category === 'Sentence Flow') {
    return Array.from({ length: 2 }, () => banks.SENTENCES[Math.floor(Math.random() * banks.SENTENCES.length)]).join(' ');
  }

  const paraSize = level <= 300 ? 3 : 5;
  return Array.from({ length: paraSize }, () => banks.SENTENCES[Math.floor(Math.random() * banks.SENTENCES.length)]).join(' ');
};

const DATA_BANKS = {
  EN: {
    WORDS: ['the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog', 'typing', 'speed', 'focus', 'talent', 'effort', 'skill', 'hand', 'logic', 'mind', 'power'],
    SENTENCES: ["Success is the sum of small efforts repeated day in and day out.", "The quick brown fox jumps over the lazy dog.", "Practice makes a man perfect in every aspect of life.", "Keep your eyes on the screen, not the keys."]
  },
  NE: {
    WORDS: ['कमल', 'वन', 'घर', 'आमा', 'नाम', 'काम', 'नेपाल', 'सुन्दर', 'मिहिनेत', 'सफलता', 'शिक्षा', 'कलम', 'किताब', 'समय'],
    SENTENCES: ["नेपाल एक सुन्दर र शान्त देश हो।", "मिहिनेत नै सफलताको कडी हो।", "समय निकै बलवान हुन्छ, यसको सदुपयोग गर्नुहोस्।", "टाइपिङ अभ्यासले हाम्रो सीप बढाउँछ।"]
  }
};
