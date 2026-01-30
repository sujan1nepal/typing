
import React from 'react';

interface TypingAreaProps {
  content: string;
  userInput: string;
  isFocused: boolean;
  language: 'en' | 'ne';
}

const TypingArea: React.FC<TypingAreaProps> = ({ content, userInput, isFocused, language }) => {
  return (
    <div className={`
      relative w-full max-w-3xl flex-grow md:flex-none md:min-h-[110px] p-4 md:p-5 rounded-xl border transition-all duration-300 backdrop-blur-md overflow-hidden
      ${isFocused ? 'bg-slate-900/40 border-blue-500/50 shadow-lg' : 'bg-slate-900/20 border-slate-800'}
    `}>
      <div className={`text-base md:text-xl leading-relaxed tracking-wider break-all h-full flex flex-wrap content-start gap-y-1 ${language === 'ne' ? 'nepali font-semibold' : 'mono'}`}>
        {content.split('').map((char, index) => {
          let colorClass = 'text-slate-600';
          let bgColorClass = '';
          const isCurrent = index === userInput.length;

          if (index < userInput.length) {
            colorClass = userInput[index] === char ? 'text-emerald-400' : 'text-rose-500 bg-rose-500/10';
          }

          return (
            <span
              key={index}
              className={`
                relative px-[0.25px] rounded transition-colors duration-150
                ${colorClass} ${bgColorClass}
                ${isCurrent && isFocused ? 'animate-pulse border-b-2 border-blue-500' : ''}
              `}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          );
        })}
      </div>
      
      {!isFocused && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 rounded-xl cursor-pointer" 
             onClick={() => {}}>
          <div className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded shadow-xl hover:scale-105 transition-transform">
            CLICK TO START
          </div>
        </div>
      )}
    </div>
  );
};

export default TypingArea;
