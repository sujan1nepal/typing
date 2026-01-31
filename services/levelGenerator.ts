
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
  if (level <= 320) return 'Paragraph Stamina';
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

  const handleRowPattern = (keys: string[], relativeLvl: number) => {
    // 1-20: Repetitions
    if (relativeLvl <= 20) {
      if (relativeLvl <= 10) {
        const pairIdx = ((relativeLvl - 1) % 5) * 2;
        return generateRepetitionDrill([keys[pairIdx], keys[pairIdx + 1]], 4);
      }
      return generateRepetitionDrill(keys, 1);
    }
    // 21-40: Random letters with increasing complexity
    const complexity = Math.min(keys.length, Math.floor((relativeLvl - 21) / 2) + 3);
    return generateRandomDrill(keys.slice(0, complexity));
  };

  if (level <= 40) return handleRowPattern(home, level);
  if (level <= 80) return handleRowPattern(top, level - 40);
  if (level <= 120) return handleRowPattern(bottom, level - 80);

  // Mastery Mix: 121-160
  if (level <= 160) {
    const all = [...home, ...top, ...bottom];
    return generateRandomDrill(all, 160);
  }

  const banks = language === 'en' ? DATA_BANKS.EN : DATA_BANKS.NE;
  const category = getLevelCategory(level);

  if (category === 'Word Mastery') {
    return Array.from({ length: 15 }, () => banks.WORDS[Math.floor(Math.random() * banks.WORDS.length)]).join(' ');
  }

  if (category === 'Sentence Flow') {
    return Array.from({ length: 2 }, () => banks.SENTENCES[Math.floor(Math.random() * banks.SENTENCES.length)]).join(' ');
  }

  const paraSize = level <= 320 ? 3 : 5;
  return Array.from({ length: paraSize }, () => banks.SENTENCES[Math.floor(Math.random() * banks.SENTENCES.length)]).join(' ');
};

const DATA_BANKS = {
  EN: {
    WORDS: ['the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog', 'typing', 'speed', 'focus', 'talent', 'effort', 'skill', 'hand', 'logic', 'mind', 'power', 'keyboard', 'mastery', 'practice', 'rhythm', 'growth'],
    SENTENCES: [
      "Success is the sum of small efforts repeated day in and day out.",
      "The quick brown fox jumps over the lazy dog.",
      "Practice makes a man perfect in every aspect of life.",
      "Always keep your eyes on the screen and not on the keys.",
      "Consistency and accuracy lead to high performance typing.",
      "Your speed will increase as your muscle memory becomes stronger."
    ]
  },
  NE: {
    WORDS: ['कमल', 'वन', 'घर', 'आमा', 'नाम', 'काम', 'नेपाल', 'सुन्दर', 'मिहिनेत', 'सफलता', 'शिक्षा', 'कलम', 'किताब', 'समय', 'शान्ति', 'विकास', 'यात्रा'],
    SENTENCES: [
      "नेपाल एक सुन्दर र शान्त देश हो।",
      "मिहिनेत नै सफलताको कडी हो।",
      "समय निकै बलवान हुन्छ, यसको सदुपयोग गर्नुहोस्।",
      "टाइपिङ अभ्यासले हाम्रो सीप र क्षमता बढाउँछ।",
      "सधैं सकारात्मक सोच राख्नुहोस् र अगाडि बढ्नुहोस्।"
    ]
  }
};
