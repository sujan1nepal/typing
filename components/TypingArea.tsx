
import React from 'react';

interface TypingAreaProps {
  content: string;
  userInput: string;
  isFocused: boolean;
  language: 'en' | 'ne';
  theme: 'light' | 'dark';
}

const TypingArea: React.FC<TypingAreaProps> = ({ content, userInput, isFocused, language, theme }) => {
  const isDark = theme === 'dark';
  
  return (
    <div className={`
      relative w-[80vw] max-w-4xl md:min-h-[180px] p-6 md:p-8 rounded-2xl border transition-all duration-300 backdrop-blur-md overflow-hidden flex items-start justify-center
      ${isFocused 
        ? (isDark ? 'bg-slate-900/40 border-blue-500/30 shadow-xl' : 'bg-white border-blue-300 shadow-md') 
        : (isDark ? 'bg-slate-900/20 border-slate-800' : 'bg-slate-100/50 border-slate-200')}
    `}>
      <div className={`
        text-[20px] leading-[1.6] tracking-normal text-left h-full flex flex-wrap justify-start content-start max-w-full font-normal
        ${language === 'ne' ? 'nepali' : 'mono'}
        ${isDark ? 'text-slate-400' : 'text-slate-500'}
      `}>
        {content.split('').map((char, index) => {
          let colorClass = isDark ? 'text-slate-600' : 'text-slate-300';
          const isCurrent = index === userInput.length;

          if (index < userInput.length) {
            colorClass = userInput[index] === char 
              ? (isDark ? 'text-emerald-400' : 'text-emerald-600') 
              : 'text-rose-500 bg-rose-500/10 font-bold';
          } else if (isCurrent) {
            colorClass = isDark ? 'text-slate-100' : 'text-slate-900';
          }

          return (
            <span
              key={index}
              className={`
                relative px-[0.05em] transition-all duration-75
                ${colorClass}
                ${isCurrent && isFocused ? (isDark ? 'bg-blue-500/20 border-b-2 border-blue-500' : 'bg-blue-100 border-b-2 border-blue-600') : ''}
              `}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          );
        })}
      </div>
      
      {!isFocused && (
        <div className={`absolute inset-0 flex items-center justify-center rounded-2xl cursor-pointer ${isDark ? 'bg-slate-950/60' : 'bg-white/40'} backdrop-blur-[2px]`} 
             onClick={() => {}}>
          <div className="px-6 py-2.5 bg-blue-600 text-white text-sm font-bold tracking-wider rounded-lg shadow-lg hover:bg-blue-500 transition-colors uppercase">
            Click to start typing
          </div>
        </div>
      )}
    </div>
  );
};

export default TypingArea;
