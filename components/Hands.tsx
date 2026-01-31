
import React from 'react';

interface HandsProps {
  targetChar: string;
  theme: 'light' | 'dark';
  side?: 'left' | 'right' | 'both';
}

const Hands: React.FC<HandsProps> = ({ targetChar, theme, side = 'both' }) => {
  const getFinger = (char: string): string => {
    if (!char) return "";
    const c = char.toLowerCase();
    
    // Left Hand
    if (['1', 'q', 'a', 'z', '!', '`', '~'].includes(c)) return "L-Pinky";
    if (['2', 'w', 's', 'x', '@'].includes(c)) return "L-Ring";
    if (['3', 'e', 'd', 'c', '#'].includes(c)) return "L-Middle";
    if (['4', '5', 'r', 't', 'f', 'g', 'v', 'b', '$', '%'].includes(c)) return "L-Index";
    
    // Thumbs
    if (c === ' ') return "Thumb";
    
    // Right Hand
    if (['6', '7', 'y', 'u', 'h', 'j', 'n', 'm', '^', '&'].includes(c)) return "R-Index";
    if (['8', 'i', 'k', ',', '*', '<'].includes(c)) return "R-Middle";
    if (['9', 'o', 'l', '.', '(', '>'].includes(c)) return "R-Ring";
    if (['0', '-', '=', 'p', '[', ']', '\\', ';', "'", '/', ')', '_', '+', '{', '}', '|', ':', '"', '?'].includes(c)) return "R-Pinky";
    
    return "";
  };

  const activeFinger = getFinger(targetChar);
  const isDark = theme === 'dark';
  const highlightColor = isDark ? '#f59e0b' : '#3b82f6'; // Orange for dark, Blue for light
  const defaultFingerColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  const LeftHand = () => (
    <div className="relative flex flex-col items-center">
      <svg width="140" height="120" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={isDark ? "text-slate-700" : "text-slate-300"}>
        <path d="M10 90C10 90 5 60 15 40C25 20 40 10 50 10C60 10 70 20 75 45L80 70L100 80C110 85 110 95 100 100H10V90Z" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1"/>
        <circle cx="15" cy="45" r="7" fill={activeFinger === 'L-Pinky' ? highlightColor : defaultFingerColor} stroke={activeFinger === 'L-Pinky' ? 'white' : 'transparent'} strokeWidth="1" className="transition-all duration-150" />
        <circle cx="30" cy="25" r="8" fill={activeFinger === 'L-Ring' ? highlightColor : defaultFingerColor} stroke={activeFinger === 'L-Ring' ? 'white' : 'transparent'} strokeWidth="1" className="transition-all duration-150" />
        <circle cx="50" cy="15" r="9" fill={activeFinger === 'L-Middle' ? highlightColor : defaultFingerColor} stroke={activeFinger === 'L-Middle' ? 'white' : 'transparent'} strokeWidth="1" className="transition-all duration-150" />
        <circle cx="75" cy="25" r="9" fill={activeFinger === 'L-Index' ? highlightColor : defaultFingerColor} stroke={activeFinger === 'L-Index' ? 'white' : 'transparent'} strokeWidth="1" className="transition-all duration-150" />
        <circle cx="105" cy="75" r="10" fill={activeFinger === 'Thumb' ? highlightColor : defaultFingerColor} stroke={activeFinger === 'Thumb' ? 'white' : 'transparent'} strokeWidth="1" className="transition-all duration-150" />
      </svg>
      <span className="text-[7px] font-black uppercase tracking-widest text-slate-600 mt-2">Left Hand</span>
    </div>
  );

  const RightHand = () => (
    <div className="relative flex flex-col items-center">
      <svg width="140" height="120" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={isDark ? "text-slate-700" : "text-slate-300"}>
        <path d="M110 90C110 90 115 60 105 40C95 20 80 10 70 10C60 10 50 20 45 45L40 70L20 80C10 85 10 95 20 100H110V90Z" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1"/>
        <circle cx="105" cy="45" r="7" fill={activeFinger === 'R-Pinky' ? highlightColor : defaultFingerColor} stroke={activeFinger === 'R-Pinky' ? 'white' : 'transparent'} strokeWidth="1" className="transition-all duration-150" />
        <circle cx="90" cy="25" r="8" fill={activeFinger === 'R-Ring' ? highlightColor : defaultFingerColor} stroke={activeFinger === 'R-Ring' ? 'white' : 'transparent'} strokeWidth="1" className="transition-all duration-150" />
        <circle cx="70" cy="15" r="9" fill={activeFinger === 'R-Middle' ? highlightColor : defaultFingerColor} stroke={activeFinger === 'R-Middle' ? 'white' : 'transparent'} strokeWidth="1" className="transition-all duration-150" />
        <circle cx="45" cy="25" r="9" fill={activeFinger === 'R-Index' ? highlightColor : defaultFingerColor} stroke={activeFinger === 'R-Index' ? 'white' : 'transparent'} strokeWidth="1" className="transition-all duration-150" />
        <circle cx="15" cy="75" r="10" fill={activeFinger === 'Thumb' ? highlightColor : defaultFingerColor} stroke={activeFinger === 'Thumb' ? 'white' : 'transparent'} strokeWidth="1" className="transition-all duration-150" />
      </svg>
      <span className="text-[7px] font-black uppercase tracking-widest text-slate-600 mt-2">Right Hand</span>
    </div>
  );

  return (
    <div className="flex gap-16 select-none pointer-events-none">
      {(side === 'left' || side === 'both') && <LeftHand />}
      {(side === 'right' || side === 'both') && <RightHand />}
    </div>
  );
};

export default Hands;
