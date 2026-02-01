
import React from 'react';

interface HandsProps {
  targetChar: string;
  theme: 'light' | 'dark';
}

const Hands: React.FC<HandsProps> = ({ targetChar, theme }) => {
  const getFinger = (char: string): string => {
    if (!char) return "";
    const c = char.toLowerCase();
    
    // Left Hand
    if (['1', 'q', 'a', 'z', '!', 'q', 'a', 'z', '`', '~'].includes(c)) return "L-Pinky";
    if (['2', 'w', 's', 'x', '@', 'w', 's', 'x'].includes(c)) return "L-Ring";
    if (['3', 'e', 'd', 'c', '#', 'e', 'd', 'c'].includes(c)) return "L-Middle";
    if (['4', '5', 'r', 't', 'f', 'g', 'v', 'b', '$', '%', 'r', 't', 'f', 'g', 'v', 'b'].includes(c)) return "L-Index";
    
    // Thumbs
    if (c === ' ') return "Thumb";
    
    // Right Hand
    if (['6', '7', 'y', 'u', 'h', 'j', 'n', 'm', '^', '&', 'y', 'u', 'h', 'j', 'n', 'm'].includes(c)) return "R-Index";
    if (['8', 'i', 'k', ',', '*', 'i', 'k', '<'].includes(c)) return "R-Middle";
    if (['9', 'o', 'l', '.', '(', 'o', 'l', '>'].includes(c)) return "R-Ring";
    if (['0', '-', '=', 'p', '[', ']', '\\', ';', "'", '/', ')', '_', '+', 'p', '{', '}', '|', ':', '"', '?'].includes(c)) return "R-Pinky";
    
    return "";
  };

  const activeFinger = getFinger(targetChar);
  const isDark = theme === 'dark';

  const FingerGlow = ({ id, active }: { id: string; active: boolean }) => (
    <div className={`
      absolute transition-all duration-200 rounded-full
      ${active ? 'opacity-100 scale-110' : 'opacity-0 scale-90'}
      ${active ? 'bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.8)]' : ''}
    `} style={{ width: '12px', height: '12px', zIndex: 10 }}></div>
  );

  return (
    <div className="flex justify-center gap-24 items-end opacity-60 pointer-events-none select-none h-24 mb-2">
      {/* Left Hand Container */}
      <div className="relative flex items-end">
        <svg width="120" height="100" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={isDark ? "text-slate-700" : "text-slate-300"}>
          {/* Hand Outline */}
          <path d="M10 90C10 90 5 60 15 40C25 20 40 10 50 10C60 10 70 20 75 45L80 70L100 80C110 85 110 95 100 100H10V90Z" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1"/>
          {/* Fingers */}
          <circle cx="15" cy="45" r="5" fill={activeFinger === 'L-Pinky' ? '#fbbf24' : 'currentColor'} />
          <circle cx="30" cy="25" r="6" fill={activeFinger === 'L-Ring' ? '#fbbf24' : 'currentColor'} />
          <circle cx="50" cy="15" r="7" fill={activeFinger === 'L-Middle' ? '#fbbf24' : 'currentColor'} />
          <circle cx="75" cy="25" r="7" fill={activeFinger === 'L-Index' ? '#fbbf24' : 'currentColor'} />
          <circle cx="105" cy="75" r="8" fill={activeFinger === 'Thumb' ? '#fbbf24' : 'currentColor'} />
        </svg>
        <div className="absolute -bottom-4 w-full text-center text-[8px] font-bold uppercase tracking-widest text-slate-500">Left Hand</div>
      </div>

      {/* Right Hand Container */}
      <div className="relative flex items-end">
        <svg width="120" height="100" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={isDark ? "text-slate-700" : "text-slate-300"}>
          {/* Hand Outline Inverse */}
          <path d="M110 90C110 90 115 60 105 40C95 20 80 10 70 10C60 10 50 20 45 45L40 70L20 80C10 85 10 95 20 100H110V90Z" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1"/>
          {/* Fingers */}
          <circle cx="105" cy="45" r="5" fill={activeFinger === 'R-Pinky' ? '#fbbf24' : 'currentColor'} />
          <circle cx="90" cy="25" r="6" fill={activeFinger === 'R-Ring' ? '#fbbf24' : 'currentColor'} />
          <circle cx="70" cy="15" r="7" fill={activeFinger === 'R-Middle' ? '#fbbf24' : 'currentColor'} />
          <circle cx="45" cy="25" r="7" fill={activeFinger === 'R-Index' ? '#fbbf24' : 'currentColor'} />
          <circle cx="15" cy="75" r="8" fill={activeFinger === 'Thumb' ? '#fbbf24' : 'currentColor'} />
        </svg>
        <div className="absolute -bottom-4 w-full text-center text-[8px] font-bold uppercase tracking-widest text-slate-500">Right Hand</div>
      </div>
    </div>
  );
};

export default Hands;
