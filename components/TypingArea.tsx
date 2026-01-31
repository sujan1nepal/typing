
import React, { useEffect, useRef } from 'react';

interface TypingAreaProps {
  content: string;
  userInput: string;
  isFocused: boolean;
  language: 'en' | 'ne';
  theme: 'light' | 'dark';
}

const TypingArea: React.FC<TypingAreaProps> = ({ content, userInput, isFocused, language, theme }) => {
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
    <div className={`
      relative w-full max-w-4xl h-[320px] rounded-sm border shadow-sm transition-all duration-300 flex flex-col
      ${isDark 
        ? 'bg-slate-900 border-slate-800' 
        : 'bg-white border-slate-200'}
      ${isFocused && (isDark ? 'ring-1 ring-blue-900' : 'ring-1 ring-blue-100')}
    `}>
      {/* Paper texture/line effect */}
      <div className={`absolute inset-0 opacity-[0.03] pointer-events-none z-0 ${isDark ? 'bg-[url("https://www.transparenttextures.com/patterns/carbon-fibre.png")]' : 'bg-[url("https://www.transparenttextures.com/patterns/lined-paper.png")]'}`}></div>

      {/* Scrollable Content Area */}
      <div 
        ref={containerRef}
        className="relative z-10 flex-grow overflow-y-auto p-10 md:p-12 scroll-smooth no-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className={`
          text-[20px] leading-[1.8] tracking-normal text-left flex flex-wrap justify-start content-start w-full font-normal
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
                ? (isDark ? 'text-slate-200' : 'text-slate-900') 
                : 'text-rose-500 underline decoration-rose-500/50 decoration-2 underline-offset-4';
            } else if (isCurrent) {
              charColor = isDark ? 'text-blue-400' : 'text-blue-600';
            }

            return (
              <span
                key={index}
                ref={isCurrent ? activeCharRef : null}
                className={`
                  relative transition-colors duration-75 inline-block
                  ${charColor}
                  ${isCurrent && isFocused ? 'bg-blue-500/10' : ''}
                `}
              >
                {/* Cursor rendering */}
                {isCurrent && isFocused && (
                  <span className={`absolute left-0 top-0 bottom-0 w-[2px] ${isDark ? 'bg-blue-400' : 'bg-blue-600'} animate-pulse`} />
                )}
                {char === ' ' ? '\u00A0' : char}
              </span>
            );
          })}
        </div>
      </div>
      
      {!isFocused && (
        <div className={`absolute inset-0 flex items-center justify-center cursor-pointer z-20 ${isDark ? 'bg-slate-950/40' : 'bg-white/40'} backdrop-blur-[1px]`} 
             onClick={() => {}}>
          <div className={`px-5 py-2 rounded border text-xs font-bold tracking-widest uppercase shadow-sm transition-transform hover:scale-105 ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}>
            Click to activate cursor
          </div>
        </div>
      )}
      
      {/* Footer hint */}
      <div className={`flex-none px-10 pb-4 w-full flex justify-between text-[10px] font-medium uppercase tracking-tighter opacity-40 z-10 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
        <span>Section: {language.toUpperCase()} Drills</span>
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
