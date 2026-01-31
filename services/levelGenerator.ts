
import { NEPALI_MAP } from '../constants.tsx';
import { LevelCategory } from '../types.ts';

const ROW_KEYS = {
  HOME: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'],
  TOP: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  BOTTOM: ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.'],
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

export const getLessonText = (level: number, language: 'en' | 'ne'): string => {
  const category = getLevelCategory(level);
  const banks = language === 'en' ? DATA_BANKS.EN : DATA_BANKS.NE;
  
  if (level <= 100) {
    let charPool: string[] = [];
    const relativeLevel = (level - 1) % 25;
    const poolSize = Math.min(10, 4 + Math.floor(relativeLevel / 2.5));
    
    if (category === 'Home Row') charPool = ROW_KEYS.HOME.slice(0, poolSize);
    else if (category === 'Top Row') charPool = ROW_KEYS.TOP.slice(0, poolSize);
    else if (category === 'Bottom Row') charPool = ROW_KEYS.BOTTOM.slice(0, poolSize);
    else charPool = [...ROW_KEYS.HOME, ...ROW_KEYS.TOP, ...ROW_KEYS.BOTTOM];

    let finalPool = language === 'en' ? charPool : charPool.map(key => NEPALI_MAP[key] || key);
    const length = 40 + Math.floor(level / 2);
    let result = "";
    for (let i = 0; i < length; i++) {
      if (i > 0 && i % 5 === 0) result += " ";
      else result += finalPool[Math.floor(Math.random() * finalPool.length)];
    }
    return result.trim();
  }

  if (category === 'Word Mastery') {
    const wordCount = 10 + Math.floor((level - 100) / 2);
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
