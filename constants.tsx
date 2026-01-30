
import { Lesson, KeyboardRow } from './types';

export const ENGLISH_LESSONS: Lesson[] = [
  {
    id: 1,
    title: "Home Row Basics",
    description: "Start with the foundation: asdf jkl;",
    content: "asdf jkl; asdf jkl; a s d f j k l ; asdf jkl; asdf jkl; aa ss dd ff jj kk ll ;; asdf jkl;",
    category: 'Home Row'
  },
  {
    id: 2,
    title: "Home Row Reach",
    description: "Expanding to G and H",
    content: "asdfg hjkl; asdfg hjkl; fgh jkl asdf gh jkl; fg hj kl asdf gh jkl; asdfg hjkl;",
    category: 'Home Row'
  }
];

export const NEPALI_LESSONS: Lesson[] = [
  {
    id: 101,
    title: "नेपाली होम रो (Home Row)",
    description: "अभ्यास: ब क म ा न ज व प ि स",
    // Lesson text as requested: "ब क म ा न ज व प ि स"
    content: "ब क म ा न ज व प ि स ब क म ा न ज व प ि स ब क म ा न ज व प ि स",
    category: 'Home Row'
  },
  {
    id: 102,
    title: "आधारभूत शब्दहरू (Basic Words)",
    description: "अभ्यास: कमल, वन, वस, नाम",
    content: "कमल वन वस नाम कमल वन वस नाम कमल वन वस नाम कमल वन वस नाम",
    category: 'Words'
  },
  {
    id: 103,
    title: "होम रो संयोजन",
    description: "मिश्रित अभ्यास",
    content: "बक मान जव पिस बक मान जव पिस बक मान जव पिस बक मान जव पिस",
    category: 'Words'
  }
];

// EXACT KEY MAPPING FROM USER PROMPT
export const NEPALI_MAP: Record<string, string> = {
  // Home Row: [a=ब], [s=क], [d=म], [f=ा], [g=न], [h=ज], [j=व], [k=प], [l=ि], [;=स]
  'a': 'ब', 's': 'क', 'd': 'म', 'f': 'ा', 'g': 'न', 'h': 'ज', 'j': 'व', 'k': 'प', 'l': 'ि', ';': 'स',
  // Top Row: [q=त्र], [w=ध], [e=भ], [r=च], [t=त], [y=थ], [u=ग], [i=ष], [o=य], [p=उ]
  'q': 'त्र', 'w': 'ध', 'e': 'भ', 'r': 'च', 't': 'त', 'y': 'थ', 'u': 'ग', 'i': 'ष', 'o': 'य', 'p': 'उ',
  // Bottom Row: [z=श], [x=ह], [c=अ], [v=ख], [b=द], [n=ल], [m=ङ]
  'z': 'श', 'x': 'ह', 'c': 'अ', 'v': 'ख', 'b': 'द', 'n': 'ल', 'm': 'ङ',
  // Symbols and Numbers
  '1': '१', '2': '२', '3': '३', '4': '४', '5': '५', '6': '६', '7': '७', '8': '८', '9': '९', '0': '०',
  '/': 'ः', "'": 'य्', ' ': ' ', '[': 'ृ', ']': 'े', ',': 'ो', '.': 'ौ', '\\': '्र'
};

export const NEPALI_SHIFT_MAP: Record<string, string> = {
  // Shift Mapping based on User Prompt and Traditional Rules
  // Prompt: [Shift+s=ख्], [Shift+d=ष्], [Shift+f=ा], [Shift+k=फ्]
  'A': 'ब्', 'S': 'ख्', 'D': 'ष्', 'F': 'ा', 'G': 'न्', 'H': 'ज्', 'J': 'व्', 'K': 'फ्', 'L': 'ी', ':': 'स्',
  'Q': 'त्त', 'W': 'ध्र', 'E': 'भ्र', 'R': 'च्र', 'T': 'त्र', 'Y': 'थ्र', 'U': 'गि', 'I': 'षि', 'O': 'यि', 'P': 'उि',
  'Z': 'श्', 'X': 'ह्', 'C': 'अ्र', 'V': 'ख्', 'B': 'द्', 'N': 'ल्', 'M': 'ङ्र',
  '!': '!', '@': '@', '#': '#', '$': '$', '%': '%', '^': '^', '&': '&', '*': '*', '(': '(', ')': ')',
  '_': '_', '+': '+', '"': 'य्', '<': 'ो', '>': 'ौ', '?': 'रु', '{': 'ै', '}': 'ो', '|': '्र'
};

export const KEYBOARD_LAYOUT: KeyboardRow[] = [
  {
    keys: [
      { key: '`', shiftKey: '~', code: 'Backquote' },
      { key: '1', shiftKey: '!', code: 'Digit1' },
      { key: '2', shiftKey: '@', code: 'Digit2' },
      { key: '3', shiftKey: '#', code: 'Digit3' },
      { key: '4', shiftKey: '$', code: 'Digit4' },
      { key: '5', shiftKey: '%', code: 'Digit5' },
      { key: '6', shiftKey: '^', code: 'Digit6' },
      { key: '7', shiftKey: '&', code: 'Digit7' },
      { key: '8', shiftKey: '*', code: 'Digit8' },
      { key: '9', shiftKey: '(', code: 'Digit9' },
      { key: '0', shiftKey: ')', code: 'Digit0' },
      { key: '-', shiftKey: '_', code: 'Minus' },
      { key: '=', shiftKey: '+', code: 'Equal' },
      { key: 'Bksp', width: 'flex-grow', code: 'Backspace' },
    ]
  },
  {
    keys: [
      { key: 'Tab', width: 'w-[clamp(1.5rem,4vw,3rem)]', code: 'Tab' },
      { key: 'q', shiftKey: 'Q', code: 'KeyQ' },
      { key: 'w', shiftKey: 'W', code: 'KeyW' },
      { key: 'e', shiftKey: 'E', code: 'KeyE' },
      { key: 'r', shiftKey: 'R', code: 'KeyR' },
      { key: 't', shiftKey: 'T', code: 'KeyT' },
      { key: 'y', shiftKey: 'Y', code: 'KeyY' },
      { key: 'u', shiftKey: 'U', code: 'KeyU' },
      { key: 'i', shiftKey: 'I', code: 'KeyI' },
      { key: 'o', shiftKey: 'O', code: 'KeyO' },
      { key: 'p', shiftKey: 'P', code: 'KeyP' },
      { key: '[', shiftKey: '{', code: 'BracketLeft' },
      { key: ']', shiftKey: '}', code: 'BracketRight' },
      { key: '\\', shiftKey: '|', code: 'Backslash' },
    ]
  },
  {
    keys: [
      { key: 'Caps', width: 'w-[clamp(2rem,5vw,4rem)]', code: 'CapsLock' },
      { key: 'a', shiftKey: 'A', code: 'KeyA' },
      { key: 's', shiftKey: 'S', code: 'KeyS' },
      { key: 'd', shiftKey: 'D', code: 'KeyD' },
      { key: 'f', shiftKey: 'F', code: 'KeyF' },
      { key: 'g', shiftKey: 'G', code: 'KeyG' },
      { key: 'h', shiftKey: 'H', code: 'KeyH' },
      { key: 'j', shiftKey: 'J', code: 'KeyJ' },
      { key: 'k', shiftKey: 'K', code: 'KeyK' },
      { key: 'l', shiftKey: 'L', code: 'KeyL' },
      { key: ';', shiftKey: ':', code: 'Semicolon' },
      { key: "'", shiftKey: '"', code: 'Quote' },
      { key: 'Ent', width: 'flex-grow', code: 'Enter' },
    ]
  },
  {
    keys: [
      { key: 'Shift', width: 'w-[clamp(2.5rem,7vw,5rem)]', code: 'ShiftLeft' },
      { key: 'z', shiftKey: 'Z', code: 'KeyZ' },
      { key: 'x', shiftKey: 'X', code: 'KeyX' },
      { key: 'c', shiftKey: 'C', code: 'KeyC' },
      { key: 'v', shiftKey: 'V', code: 'KeyV' },
      { key: 'b', shiftKey: 'B', code: 'KeyB' },
      { key: 'n', shiftKey: 'N', code: 'KeyN' },
      { key: 'm', shiftKey: 'M', code: 'KeyM' },
      { key: ',', shiftKey: '<', code: 'Comma' },
      { key: '.', shiftKey: '>', code: 'Period' },
      { key: '/', shiftKey: '?', code: 'Slash' },
      { key: 'Shift', width: 'flex-grow', code: 'ShiftRight' },
    ]
  },
  {
    keys: [
      { key: 'Ctrl', width: 'w-[clamp(1.5rem,4vw,3rem)]', code: 'ControlLeft' },
      { key: 'Alt', width: 'w-[clamp(1.5rem,4vw,3rem)]', code: 'AltLeft' },
      { key: 'Space', width: 'w-[clamp(8rem,30vw,20rem)] flex-grow', code: 'Space' },
      { key: 'Alt', width: 'w-[clamp(1.5rem,4vw,3rem)]', code: 'AltRight' },
      { key: 'Ctrl', width: 'w-[clamp(1.5rem,4vw,3rem)]', code: 'ControlRight' },
    ]
  }
];
