
import React from 'react';
import { getLevelCategory } from '../services/levelGenerator.ts';
import { LevelCategory } from '../types.ts';

interface LevelSelectorProps {
  isDark: boolean;
  currentLevel: number;
  onSelect: (level: number) => void;
  onClose: () => void;
}

const CATEGORIES: LevelCategory[] = [
  'Home Row', 'Top Row', 'Bottom Row', 'Mastery Mix', 
  'Word Mastery', 'Sentence Flow', 'Paragraph Stamina', 'Extreme Mastery'
];

const LevelSelector: React.FC<LevelSelectorProps> = ({ isDark, currentLevel, onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-950/95 flex items-center justify-center z-[200] backdrop-blur-md p-4">
      <div className={`w-full max-w-5xl h-[85vh] border rounded-3xl p-8 flex flex-col shadow-2xl ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Curriculum Roadmap</h2>
          <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-grow overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pr-4 custom-scrollbar">
          {CATEGORIES.map(cat => (
            <div key={cat}>
              <h3 className="text-blue-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <span className="w-3 h-px bg-blue-500/30"></span> {cat}
              </h3>
              <div className="grid grid-cols-5 gap-1.5">
                {Array.from({ length: 300 }, (_, i) => i + 1)
                  .filter(l => getLevelCategory(l) === cat)
                  .map(l => (
                    <button
                      key={l}
                      onClick={() => onSelect(l)}
                      className={`aspect-square rounded-lg flex items-center justify-center font-bold text-[10px] transition-all
                        ${l === currentLevel ? 'bg-blue-600 text-white ring-2 ring-blue-400' : (isDark ? 'bg-slate-800/50 text-slate-500 border border-slate-700/30' : 'bg-slate-100 text-slate-400 border border-slate-200')} hover:scale-105`}
                    >
                      {l}
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LevelSelector;
