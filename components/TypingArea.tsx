
import React, { useEffect, useRef, useState } from 'react';

interface TypingAreaProps {
  content: string;
  userInput: string;
  isFocused: boolean;
  language: 'en' | 'ne';
  theme: 'light' | 'dark';
  onFocus?: () => void;
}

const TypingArea: React.FC<TypingAreaProps> = ({ content, userInput, isFocused, language, theme, onFocus }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeCharRef = useRef<HTMLSpanElement>(null);
  const [caretPos, setCaretPos] = useState({ left: 0, top: 0, height: 0 });
  const isDark = theme === 'dark';

  useEffect(() => {
    if (activeCharRef.current) {
      const char = activeCharRef.current;
      setCaretPos({
        left: char.offsetLeft,
        top: char.offsetTop,
        height: char.offsetHeight
      });
      if (scrollRef.current) {
        const scroll = scrollRef.current;
        const targetScroll = char.offsetTop - (scroll.offsetHeight / 2) + (char.offsetHeight / 2);
        scroll.scrollTo({ top: targetScroll, behavior: 'smooth' });
      }
    }
  }, [userInput.length, isFocused]);

  return (
    <div className="relative w-full max-w-4xl h-[280px] flex flex-col group select-none" ref={containerRef}>
      <div 
        ref={scrollRef}
        className="flex-grow overflow-hidden no-scrollbar py-20 px-4 relative h-full"
      >
        <div className={`
          relative text-5xl leading-[2.2] tracking-tight text-left flex flex-wrap gap-x-[0.25em] transition-all duration-300
          ${language === 'ne' ? 'nepali' : 'mono font-medium'}
          ${!isFocused ? 'blur-[12px] opacity-10 scale-[0.98]' : 'opacity-100 scale-100'}
        `}>
          {isFocused && (
            <div 
              className="absolute w-[4px] bg-blue-500 rounded-full caret-smooth z-10"
              style={{ 
                left: caretPos.left, 
                top: caretPos.top + 14, 
                height: caretPos.height - 28,
                boxShadow: '0 0 20px rgba(59, 130, 246, 0.8)',
                opacity: userInput.length === (content?.length || 0) ? 0 : 1
              }}
            />
          )}

          {(content || "").split('').map((char, index) => {
            const isTyped = index < userInput.length;
            const isCurrent = index === userInput.length;
            const isCorrect = isTyped && userInput[index] === char;

            let charColor = isDark ? 'text-slate-800' : 'text-slate-300'; 
            if (isTyped) {
              charColor = isCorrect 
                ? (isDark ? 'text-slate-100' : 'text-slate-900') 
                : 'text-rose-500 underline decoration-[3px] underline-offset-[12px]';
            }

            return (
              <span
                key={index}
                ref={isCurrent ? activeCharRef : null}
                className={`transition-all duration-150 relative ${charColor}`}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            );
          })}
        </div>
      </div>

      {!isFocused && (
        <div className="absolute inset-0 flex items-center justify-center z-50 cursor-pointer backdrop-blur-[2px]" onClick={onFocus}>
           <div className="bg-blue-600 text-white px-14 py-6 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.5em] shadow-2xl shadow-blue-500/40 hover:scale-105 active:scale-95 transition-all">
             Initialize practice
           </div>
        </div>
      )}
    </div>
  );
};

export default TypingArea;
