
import React, { useEffect, useRef } from 'react';

interface TypingAreaProps {
  content: string;
  userInput: string;
  isFocused: boolean;
  language: 'en' | 'ne';
  theme: 'light' | 'dark';
  onFocus?: () => void;
}

const TypingArea: React.FC<TypingAreaProps> = ({ content, userInput, isFocused, language, theme, onFocus }) => {
  const isDark = theme === 'dark';
  const containerRef = useRef<HTMLDivElement>(null);
  const activeCharRef = useRef<HTMLSpanElement>(null);

  // Synchronize scroll with active character
  useEffect(() => {
    if (isFocused && activeCharRef.current && containerRef.current) {
      const container = containerRef.current;
      const activeChar = activeCharRef.current;

      const containerHeight = container.offsetHeight;
      const charTop = activeChar.offsetTop;
      const charHeight = activeChar.offsetHeight;

      // Scroll so the active character is roughly in the middle of the view
      const targetScrollTop = charTop - containerHeight / 2 + charHeight / 2;
      
      container.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      });
    }
  }, [userInput.length, isFocused]);

  return (
    <div 
      onClick={onFocus}
      className={`
      relative w-full max-w-4xl h-[320px] rounded-xl border shadow-lg transition-all duration-300 flex flex-col cursor-text
      ${isDark 
        ? 'bg-slate-900/90 border-slate-800 backdrop-blur-sm' 
        : 'bg-white border-slate-200 shadow-slate-200/50'}
      ${isFocused ? (isDark ? 'ring-2 ring-blue-500/40 border-blue-500/50' : 'ring-2 ring-blue-500/30 border-blue-400') : ''}
    `}>
      {/* Scrollable Content Area */}
      <div 
        ref={containerRef}
        className="relative z-10 flex-grow overflow-y-auto p-8 md:p-10 scroll-smooth no-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className={`
          text-[22px] leading-[1.9] tracking-wide text-left flex flex-wrap justify-start content-start w-full font-normal
          ${language === 'ne' ? 'nepali' : 'mono'}
          ${isDark ? 'text-slate-500' : 'text-slate-400'}
        `}>
          {content.split('').map((char, index) => {
            const isTyped = index < userInput.length;
            const isCurrent = index === userInput.length;
            const isCorrect = isTyped && userInput[index] === char;

            let charColor = isDark ? 'text-slate-600' : 'text-slate-300';
            if (isTyped) {
              charColor = isCorrect 
                ? (isDark ? 'text-emerald-400 font-medium' : 'text-emerald-600 font-medium') 
                : 'text-rose-500 bg-rose-500/10 rounded-sm underline decoration-rose-500/50 decoration-2 underline-offset-4';
            } else if (isCurrent) {
              charColor = isDark ? 'text-blue-400 font-semibold' : 'text-blue-600 font-semibold';
            }

            return (
              <span
                key={index}
                ref={isCurrent ? activeCharRef : null}
                className={`
                  relative transition-colors duration-75 inline-block px-[1px]
                  ${charColor}
                  ${isCurrent && isFocused ? (isDark ? 'bg-blue-500/20 rounded' : 'bg-blue-100 rounded') : ''}
                `}
              >
                {/* Cursor rendering */}
                {isCurrent && isFocused && (
                  <span className={`absolute -left-[1px] top-1 bottom-1 w-[2.5px] ${isDark ? 'bg-blue-400' : 'bg-blue-600'} animate-pulse rounded-full`} />
                )}
                {char === ' ' ? '\u00A0' : char}
              </span>
            );
          })}
        </div>
      </div>
      
      {!isFocused && (
        <div 
          className={`absolute inset-0 flex items-center justify-center cursor-pointer z-20 rounded-xl ${isDark ? 'bg-slate-950/60' : 'bg-white/60'} backdrop-blur-sm`} 
          onClick={onFocus}
        >
          <div className={`px-5 py-2.5 rounded-lg border text-xs font-bold tracking-widest uppercase shadow-md transition-transform hover:scale-105 ${isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-700'}`}>
            Click to activate typing
          </div>
        </div>
      )}
      
      {/* Footer hint */}
      <div className={`flex-none px-8 pb-3 w-full flex justify-between text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
        <span>{language === 'ne' ? 'नेपाली टाइपिङ अभ्यास (Preeti/Standard Layout)' : 'English Touch Typing Drills'}</span>
        <span>Progress: {Math.round((userInput.length / content.length) * 100)}%</span>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default TypingArea;
