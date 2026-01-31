
import React, { useState, useEffect } from 'react';
import { KEYBOARD_LAYOUT, NEPALI_MAP, NEPALI_SHIFT_MAP } from '../constants.tsx';

interface KeyboardProps {
  targetChar: string;
  activeCode: string | null;
  language: 'en' | 'ne';
  errorHeatmap?: Set<string>;
}

const Keyboard: React.FC<KeyboardProps> = ({ targetChar, activeCode, language, errorHeatmap = new Set() }) => {
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
    
    const k = key.toLowerCase();
    if (language === 'ne') {
      const primary = NEPALI_MAP[k];
      const shifted = NEPALI_SHIFT_MAP[k] || NEPALI_SHIFT_MAP[key];
      return primary === targetChar || shifted === targetChar;
    }
    return key === targetChar || shiftKey === targetChar;
  };

  const hasError = (key: string) => {
    const k = key.toLowerCase();
    if (language === 'ne') {
      const primary = NEPALI_MAP[k];
      const shifted = NEPALI_SHIFT_MAP[k];
      return (primary && errorHeatmap.has(primary)) || (shifted && errorHeatmap.has(shifted));
    }
    return errorHeatmap.has(key) || errorHeatmap.has(key.toUpperCase());
  };

  const getShiftHighlight = (code: string) => {
    return isShiftNeeded() && (code === 'ShiftLeft' || code === 'ShiftRight');
  };

  const getLabels = (keyObj: any) => {
    const isSpecial = ['Backspace', 'Bksp', 'Tab', 'Caps', 'Enter', 'Ent', 'Shift', 'Ctrl', 'Alt', 'Space'].includes(keyObj.key);
    
    if (language === 'en' || isSpecial) {
      return { 
        primary: isShiftDown && keyObj.shiftKey ? keyObj.shiftKey : keyObj.key,
        secondary: !isShiftDown ? keyObj.shiftKey : null
      };
    }
    
    const k = keyObj.key.toLowerCase();
    const primary = NEPALI_MAP[k] || keyObj.key;
    const shifted = NEPALI_SHIFT_MAP[k] || NEPALI_SHIFT_MAP[keyObj.key] || keyObj.shiftKey;
    
    return {
      primary: isShiftDown ? (shifted || primary) : primary,
      secondary: !isShiftDown ? (shifted !== primary ? shifted : null) : null
    };
  };

  return (
    <div className="w-[90vw] mx-auto pb-2 px-2 select-none">
      <div className="flex flex-col gap-[0.2vw] p-[0.6vw] bg-slate-900/60 rounded-xl border border-slate-800 shadow-2xl backdrop-blur-md">
        {KEYBOARD_LAYOUT.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-[0.2vw] h-[clamp(1.8rem,4.5vh,3rem)]">
            {row.keys.map((keyObj, keyIndex) => {
              const isTarget = isKeyHighlighted(keyObj.key, keyObj.shiftKey) || getShiftHighlight(keyObj.code);
              const isActive = activeCode === keyObj.code;
              const isError = hasError(keyObj.key);
              const { primary, secondary } = getLabels(keyObj);
              
              const isNepaliChar = language === 'ne' && !['Backspace', 'Bksp', 'Tab', 'Caps', 'Enter', 'Ent', 'Shift', 'Ctrl', 'Alt', 'Space'].includes(keyObj.key);

              return (
                <div
                  key={keyIndex}
                  className={`
                    relative flex flex-col items-center justify-center rounded-[0.4vw] font-bold transition-all duration-75
                    ${keyObj.width || 'w-full'} h-full border border-transparent
                    ${isActive 
                      ? 'bg-blue-500 text-white scale-[0.96] shadow-inner' 
                      : isTarget 
                        ? 'bg-amber-500 text-white shadow-[0_0_1vw_rgba(245,158,11,0.5)] ring-2 ring-amber-400' 
                        : isError
                          ? 'bg-rose-900/40 text-rose-400 border-rose-500/50'
                          : 'bg-slate-800 text-slate-400 border-slate-700/50 hover:border-slate-500'}
                  `}
                  style={{ fontSize: 'clamp(0.6rem, 1vw, 1.1rem)' }}
                >
                  {secondary && (
                    <span className="absolute top-[5%] opacity-30 leading-none" style={{ fontSize: '0.65em' }}>{secondary}</span>
                  )}
                  <span className={`${isNepaliChar ? 'nepali text-[1.2em]' : 'uppercase'} ${keyObj.key === 'Space' ? 'invisible' : ''}`}>
                    {primary}
                  </span>
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
