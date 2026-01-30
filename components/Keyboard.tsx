
import React, { useState, useEffect } from 'react';
import { KEYBOARD_LAYOUT, NEPALI_MAP, NEPALI_SHIFT_MAP } from '../constants';

interface KeyboardProps {
  targetChar: string;
  activeCode: string | null;
  language: 'en' | 'ne';
}

const Keyboard: React.FC<KeyboardProps> = ({ targetChar, activeCode, language }) => {
  const [isShiftDown, setIsShiftDown] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftDown(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftDown(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const isShiftNeeded = () => {
    if (!targetChar) return false;
    if (language === 'ne') {
      return Object.values(NEPALI_SHIFT_MAP).includes(targetChar);
    }
    return /^[A-Z~!@#$%^&*()_+{}|:"<>?]$/.test(targetChar);
  };

  const isKeyHighlighted = (key: string, shiftKey?: string) => {
    if (!targetChar) return false;
    if (targetChar === ' ' && key === 'Space') return true;
    
    if (language === 'ne') {
      const primary = NEPALI_MAP[key.toLowerCase()];
      const shifted = NEPALI_SHIFT_MAP[key.toLowerCase()] || NEPALI_SHIFT_MAP[key];
      return primary === targetChar || shifted === targetChar;
    }
    return key === targetChar || shiftKey === targetChar;
  };

  const getShiftHighlight = (code: string) => {
    return isShiftNeeded() && (code === 'ShiftLeft' || code === 'ShiftRight');
  };

  const getLabel = (keyObj: any) => {
    const isSpecial = ['Backspace', 'Bksp', 'Tab', 'Caps', 'Enter', 'Ent', 'Shift', 'Ctrl', 'Alt', 'Space'].includes(keyObj.key);
    
    if (language === 'en' || isSpecial) {
      return { 
        primary: isShiftDown && keyObj.shiftKey ? keyObj.shiftKey : keyObj.key,
        secondary: !isShiftDown ? keyObj.shiftKey : null
      };
    }
    
    // Nepali Labels - Update dynamically based on language and Shift
    const primary = NEPALI_MAP[keyObj.key.toLowerCase()] || keyObj.key;
    const shifted = NEPALI_SHIFT_MAP[keyObj.key.toLowerCase()] || NEPALI_SHIFT_MAP[keyObj.key] || keyObj.shiftKey;
    
    return {
      primary: isShiftDown ? (shifted || primary) : primary,
      secondary: !isShiftDown ? shifted : null
    };
  };

  return (
    <div className="w-[90vw] mx-auto pb-4 px-2 select-none">
      <div className="flex flex-col gap-[0.3vw] p-[0.8vw] bg-slate-900/50 rounded-xl border border-slate-800 shadow-2xl backdrop-blur-sm">
        {KEYBOARD_LAYOUT.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-[0.3vw] h-[clamp(2rem,5vh,3.5rem)]">
            {row.keys.map((keyObj, keyIndex) => {
              const isHighlighted = isKeyHighlighted(keyObj.key, keyObj.shiftKey) || getShiftHighlight(keyObj.code);
              const isActive = activeCode === keyObj.code;
              const labels = getLabel(keyObj);
              
              return (
                <div
                  key={keyIndex}
                  className={`
                    relative flex items-center justify-center rounded-[0.4vw] font-bold transition-all duration-75
                    ${keyObj.width || 'w-full'} h-full
                    ${isActive 
                      ? 'bg-blue-500 text-white scale-[0.96] shadow-inner' 
                      : isHighlighted 
                        ? 'bg-amber-500 text-white shadow-[0_0_1vw_rgba(245,158,11,0.5)] ring-2 ring-amber-400' 
                        : 'bg-slate-800 text-slate-400 border border-slate-700/50 hover:border-slate-500'}
                  `}
                  style={{ fontSize: 'clamp(0.6rem, 1vw, 1.1rem)' }}
                >
                  <div className={`flex flex-col items-center ${language === 'ne' && !labels.primary.match(/[a-zA-Z]/) ? 'nepali' : ''}`}>
                    {labels.secondary && !isShiftDown && (
                      <span className="opacity-40 leading-none mb-[0.1vw]" style={{ fontSize: '0.75em' }}>{labels.secondary}</span>
                    )}
                    <span className={keyObj.key === 'Space' ? '' : 'uppercase'}>
                      {keyObj.key === 'Space' ? '' : labels.primary}
                    </span>
                  </div>
                  {isActive && <div className="absolute inset-0 bg-blue-400/20 animate-ping rounded-[0.4vw] pointer-events-none"></div>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Keyboard;
