
import { NEPALI_MAP } from '../constants.tsx';
import { LevelCategory } from '../types.ts';

const ROW_KEYS = {
  HOME: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';', 'g', 'h'],
  TOP: ['q', 'w', 'e', 'r', 'p', 'o', 'i', 'u', 't', 'y'],
  BOTTOM: ['z', 'x', 'c', 'v', '.', ',', 'm', 'n', 'b'],
};

const DATA_BANKS = {
  EN: {
    WORDS: ['the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog', 'and', 'with', 'from', 'this', 'that', 'typing', 'speed', 'practice', 'mastery', 'keyboard', 'focus', 'level'],
    SENTENCES: [
      "The quick brown fox jumps over the lazy dog.",
      "Consistency is the key to mastering high speed typing.",
      "Focus on accuracy first, and the speed will follow naturally.",
      "Your fingers should rest lightly on the home row keys.",
      "Keep your eyes on the screen, not on your keyboard."
    ],
    PARAGRAPHS: [
      "Typing is a physical skill developed through muscle memory. By repeating the same movements over and over, your brain learns to find the keys without conscious thought. This allows you to focus entirely on the ideas you want to express rather than the act of typing itself.",
      "Effective typing requires good posture and regular breaks. Sit up straight, keep your wrists level with the keyboard, and ensure your feet are flat on the floor. Over time, these habits will prevent fatigue and allow for much longer practice sessions without discomfort."
    ]
  },
  NE: {
    WORDS: ['कमल', 'वन', 'घर', 'आमा', 'नाम', 'काम', 'बस', 'नयन', 'मलम', 'कलम', 'समय', 'नेपाल', 'सगरमाथा', 'हाम्रो', 'राम्रो', 'मिहिनेत', 'सफलता'],
    SENTENCES: [
      "नेपाल एक सुन्दर देश हो।",
      "म सधैं समयमा विद्यालय जान्छु।",
      "हाम्रो देशमा धेरै हिमालहरू छन्।",
      "मिहिनेत नै सफलताको कडी हो।",
      "नयाँ कुरा सिक्न सधैं तयार हुनुपर्छ।"
    ],
    PARAGRAPHS: [
      "टाइपिङ एक कला हो जसलाई अभ्यासले निखार्न सकिन्छ। नियमित रूपमा टाइपिङ अभ्यास गर्नाले तपाईँको गति र शुद्धता दुवैमा सुधार आउँछ। यसले तपाईँको उत्पादकत्व बढाउन मद्दत गर्दछ।",
      "आजको डिजिटल युगमा कम्प्युटर सीप अनिवार्य भएको छ। यसका लागि टाइपिङको राम्रो ज्ञान हुनु जरुरी छ। होम रो बाट सुरु गरेर बिस्तारै माथिल्लो र तल्लो पंक्तिमा जाँदा राम्रो हुन्छ।"
    ]
  }
};

export const getLevelCategory = (level: number): LevelCategory => {
  if (level <= 25) return 'Home Row';
  if (level <= 50) return 'Top Row';
  if (level <= 75) return 'Bottom Row';
  if (level <= 100) return 'Mastery Mix';
  if (level <= 150) return 'Word Mastery';
  if (level <= 200) return 'Sentence Flow';
  if (level <= 250) return 'Paragraph Stamina';
  return 'Extreme Mastery';
};

const getRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

// Helper to generate repetitive beginner patterns
const generateBeginnerPattern = (keys: string[], length: number, language: 'en' | 'ne'): string => {
  const finalKeys = language === 'en' ? keys : keys.map(k => NEPALI_MAP[k] || k);
  let result = "";
  for (let i = 0; i < length / (finalKeys.length * 2); i++) {
    finalKeys.forEach(k => {
      result += k + k + " ";
    });
  }
  return result.trim();
};

export const getLessonText = (level: number, language: 'en' | 'ne'): string => {
  const category = getLevelCategory(level);
  const banks = language === 'en' ? DATA_BANKS.EN : DATA_BANKS.NE;
  
  // Row Drills (1-100)
  if (level <= 100) {
    const relativeLevel = (level - 1) % 25; // 0 to 24
    let charPool: string[] = [];
    const length = 50 + Math.floor(level / 2);

    // Beginner Intensive Repetition (First 15 levels of each row category)
    if (relativeLevel < 15 && (category === 'Home Row' || category === 'Top Row' || category === 'Bottom Row')) {
      const rowKeys = category === 'Home Row' ? ROW_KEYS.HOME : 
                      category === 'Top Row' ? ROW_KEYS.TOP : ROW_KEYS.BOTTOM;
      
      // Every 5 levels, we focus on a specific sub-set of keys
      if (relativeLevel < 5) {
        // Levels 1-5, 26-30, 51-55: Primary outer keys
        charPool = [rowKeys[0], rowKeys[1], rowKeys[6], rowKeys[7]];
      } else if (relativeLevel < 10) {
        // Levels 6-10, 31-35, 56-60: Primary inner keys
        charPool = [rowKeys[2], rowKeys[3], rowKeys[4], rowKeys[5]];
      } else {
        // Levels 11-15, 36-40, 61-65: Full row intro
        charPool = rowKeys;
      }
      return generateBeginnerPattern(charPool, length, language);
    }

    // Standard Random Mix for levels 16-25 of a category or Mastery Mix
    const poolSize = Math.min(10, 4 + Math.floor(relativeLevel / 2.5));
    if (category === 'Home Row') charPool = ROW_KEYS.HOME.slice(0, poolSize);
    else if (category === 'Top Row') charPool = ROW_KEYS.TOP.slice(0, poolSize);
    else if (category === 'Bottom Row') charPool = ROW_KEYS.BOTTOM.slice(0, poolSize);
    else charPool = [...ROW_KEYS.HOME, ...ROW_KEYS.TOP, ...ROW_KEYS.BOTTOM];

    let finalPool = language === 'en' ? charPool : charPool.map(key => NEPALI_MAP[key] || key);
    let result = "";
    for (let i = 0; i < length; i++) {
      if (i > 0 && i % 5 === 0) result += " ";
      else result += finalPool[Math.floor(Math.random() * finalPool.length)];
    }
    return result.trim();
  }

  if (category === 'Word Mastery') {
    const wordCount = 12 + Math.floor((level - 100) / 2);
    return Array.from({ length: wordCount }, () => getRandom(banks.WORDS)).join(' ');
  }

  if (category === 'Sentence Flow') {
    const sentenceCount = 2 + Math.floor((level - 150) / 15);
    return Array.from({ length: sentenceCount }, () => getRandom(banks.SENTENCES)).join(' ');
  }

  if (category === 'Paragraph Stamina') {
    const pIndex = (level - 201) % banks.PARAGRAPHS.length;
    return banks.PARAGRAPHS[pIndex];
  }

  const mixParagraph = banks.PARAGRAPHS[0] + " " + banks.SENTENCES[0] + " " + banks.WORDS.slice(0, 5).join(' ');
  return mixParagraph.slice(0, 300 + (level - 250) * 10);
};
