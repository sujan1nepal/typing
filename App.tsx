
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { NEPALI_MAP, NEPALI_SHIFT_MAP } from './constants';
import Keyboard from './components/Keyboard';
import TypingArea from './components/TypingArea';
import { getLessonText, getLevelCategory } from './services/levelGenerator';
import { LevelCategory } from './types';

const App: React.FC = () => {
  const getSaved = (key: string, def: any) => {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : def;
  };

  const [language, setLanguage] = useState<'en' | 'ne'>('en');
  const [level, setLevel] = useState(1);
  const [userInput, setUserInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [errors, setErrors] = useState(0);
  const [activeKeyCode, setActiveKeyCode] = useState<string | null>(null);
  const [aiFeedback, setAiFeedback] = useState<string>('Ready to flow? Start typing!');
  const [mistakenChars, setMistakenChars] = useState<Set<string>>(new Set());
  const [lastHeatmap, setLastHeatmap] = useState<Set<string>>(new Set());
  const [showLevelSelector, setShowLevelSelector] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const [targetWpm, setTargetWpm] = useState<number>(() => getSaved('targetWpm', 40));
  const [targetAccuracy, setTargetAccuracy] = useState<number>(() => getSaved('targetAccuracy', 100));
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    localStorage.setItem('targetWpm', JSON.stringify(targetWpm));
    localStorage.setItem('targetAccuracy', JSON.stringify(targetAccuracy));
  }, [targetWpm, targetAccuracy]);

  const lessonContent = useMemo(() => getLessonText(level, language), [level, language]);
  const targetChar = lessonContent[userInput.length] || '';
  const currentCategory = getLevelCategory(level);

  useEffect(() => {
    let interval: number;
    if (startTime && !endTime) {
      interval = window.setInterval(() => {
        setNow(Date.now());
      }, 500);
    }
    return () => clearInterval(interval);
  }, [startTime, endTime]);

  const stats = useMemo(() => {
    if (!startTime) return { wpm: 0, accuracy: 100, elapsedTime: 0, errors };
    const currentEnd = endTime || now;
    const elapsedSeconds = Math.max((currentEnd - startTime) / 1000, 0.001);
    const elapsedMinutes = elapsedSeconds / 60;
    const wpm = Math.round((userInput.length / 5) / elapsedMinutes);
    const totalAttempted = userInput.length + errors;
    const accuracy = totalAttempted > 0 ? Math.round((userInput.length / totalAttempted) * 100) : 100;
    return { wpm, accuracy, elapsedTime: Math.round(elapsedSeconds), errors };
  }, [startTime, endTime, now, userInput.length, errors]);

  const handleRestart = useCallback(() => {
    setUserInput('');
    setStartTime(null);
    setEndTime(null);
    setErrors(0);
    setMistakenChars(new Set());
    setNow(Date.now());
  }, []);

  const handleNextLevel = useCallback((isPassed: boolean) => {
    setLastHeatmap(new Set(mistakenChars));
    if (isPassed && level < 300) {
      setLevel(prev => prev + 1);
      setAiFeedback(`Level ${level} Cleared!`);
    } else if (!isPassed) {
      setAiFeedback(`Repeating: Target ${targetWpm} WPM / ${targetAccuracy}% Acc`);
    } else {
      setAiFeedback("Final Mastery Achieved!");
    }
    handleRestart();
  }, [level, mistakenChars, handleRestart, targetWpm, targetAccuracy]);

  useEffect(() => {
    if (userInput.length > 0 && userInput.length === lessonContent.length) {
      const isPassed = stats.wpm >= targetWpm && stats.accuracy >= targetAccuracy;
      const timeout = setTimeout(() => handleNextLevel(isPassed), 400); 
      return () => clearTimeout(timeout);
    }
  }, [userInput.length, lessonContent.length, stats.wpm, stats.accuracy, handleNextLevel, targetWpm, targetAccuracy]);

  const handleLanguageToggle = (lang: 'en' | 'ne') => {
    setLanguage(lang);
    setLastHeatmap(new Set());
    handleRestart();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (!isFocused || showLevelSelector || showSettings) return;
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (['Tab', 'Backspace', 'Escape', 'F5', 'F12'].includes(e.key)) {
         if (e.key === 'Tab') e.preventDefault();
         return;
      }

      setActiveKeyCode(e.code);
      setTimeout(() => setActiveKeyCode(null), 100);

      if (!startTime && e.key.length === 1) {
        setStartTime(Date.now());
        setNow(Date.now());
      }

      const expected = lessonContent[userInput.length];
      let pressedChar = e.key;

      if (language === 'ne') {
        const key = e.key.toLowerCase();
        if (e.shiftKey) {
          pressedChar = NEPALI_SHIFT_MAP[e.key] || NEPALI_SHIFT_MAP[key] || e.key;
        } else {
          pressedChar = NEPALI_MAP[key] || e.key;
        }
      }

      if (pressedChar === expected) {
        setUserInput(prev => prev + pressedChar);
      } else if (e.key.length === 1) {
        setErrors(prev => prev + 1);
        setMistakenChars(prev => new Set(prev).add(expected));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocused, userInput, startTime, lessonContent, language, showLevelSelector, showSettings]);

  const CATEGORIES: LevelCategory[] = [
    'Home Row', 'Top Row', 'Bottom Row', 'Mastery Mix', 
    'Word Mastery', 'Sentence Flow', 'Paragraph Stamina', 'Extreme Mastery'
  ];

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 text-slate-200 flex flex-col justify-between">
      <div className="flex-none">
        <header className="p-2 md:p-3 flex justify-between items-center bg-slate-950 border-b border-slate-900 z-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-lg font-bold italic">T</span>
            </div>
            <button 
              onClick={() => setShowLevelSelector(true)}
              className="flex flex-col items-start px-3 py-1 bg-slate-900/50 rounded-lg border border-slate-800 hover:border-blue-500 transition-colors"
            >
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Roadmap</span>
              <span className="text-xs font-bold text-slate-200">LVL {level}: {currentCategory}</span>
            </button>
            <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800 ml-2">
              {(['en', 'ne'] as const).map(lang => (
                <button 
                  key={lang}
                  onClick={() => handleLanguageToggle(lang)}
                  className={`px-3 py-0.5 rounded-md text-[9px] font-bold transition-all ${language === lang ? 'bg-blue-600 text-white' : 'text-slate-500'}`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4 items-center bg-slate-900/50 px-4 py-1 rounded-full border border-slate-800">
             <div className="text-center">
              <p className="text-[7px] uppercase text-slate-500 font-bold mb-0.5">Live Feed</p>
              <div className="flex gap-4 items-baseline">
                <div className="flex items-baseline gap-1">
                  <span className={`text-xs md:text-sm font-bold mono ${stats.wpm >= targetWpm ? 'text-blue-400' : 'text-slate-500'}`}>{stats.wpm}</span>
                  <span className="text-[7px] text-slate-600 uppercase font-black">WPM</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-xs md:text-sm font-bold mono ${stats.accuracy >= targetAccuracy ? 'text-emerald-400' : 'text-slate-500'}`}>{stats.accuracy}%</span>
                  <span className="text-[7px] text-slate-600 uppercase font-black">ACC</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setShowSettings(true)} className="p-1.5 hover:bg-slate-800 rounded-full text-slate-400">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button onClick={handleRestart} className="p-1.5 hover:bg-slate-800 rounded-full text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </header>
        <div className="text-center py-1 bg-slate-900/30">
          <p className="text-[9px] font-bold text-blue-500/80 uppercase tracking-widest">{aiFeedback}</p>
        </div>
      </div>

      <div className="flex-grow flex flex-col items-center justify-center px-4 overflow-hidden" onClick={() => setIsFocused(true)}>
        <TypingArea content={lessonContent} userInput={userInput} isFocused={isFocused} language={language} />
      </div>

      <div className="flex-none w-full">
        <Keyboard targetChar={targetChar} activeCode={activeKeyCode} language={language} errorHeatmap={lastHeatmap} />
      </div>

      {showSettings && (
        <div className="fixed inset-0 bg-slate-950/95 flex items-center justify-center z-[300] backdrop-blur-md">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-6">Progression Settings</h2>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Target WPM</label>
                  <span className="text-sm font-bold text-blue-400">{targetWpm}</span>
                </div>
                <input type="range" min="10" max="120" step="5" value={targetWpm} onChange={(e) => setTargetWpm(Number(e.target.value))} className="w-full accent-blue-500" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Target Accuracy</label>
                  <span className="text-sm font-bold text-emerald-400">{targetAccuracy}%</span>
                </div>
                <input type="range" min="80" max="100" step="1" value={targetAccuracy} onChange={(e) => setTargetAccuracy(Number(e.target.value))} className="w-full accent-emerald-500" />
              </div>
            </div>
            <button onClick={() => setShowSettings(false)} className="w-full mt-8 py-3 bg-blue-600 text-white font-bold rounded-xl">Apply Settings</button>
          </div>
        </div>
      )}

      {showLevelSelector && (
        <div className="fixed inset-0 bg-slate-950/95 flex items-center justify-center z-[200] backdrop-blur-md">
          <div className="w-full max-w-5xl h-[85vh] bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-bold">Curriculum Roadmap</h2>
                <p className="text-slate-400">Complete all 300 levels to master the keyboard</p>
              </div>
              <button onClick={() => setShowLevelSelector(false)} className="p-3 hover:bg-slate-800 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-grow overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pr-4 custom-scrollbar">
              {CATEGORIES.map(cat => (
                <div key={cat}>
                  <h3 className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <span className="w-4 h-px bg-blue-500/30"></span> {cat}
                  </h3>
                  <div className="grid grid-cols-5 gap-1.5">
                    {Array.from({ length: 300 }, (_, i) => i + 1)
                      .filter(l => getLevelCategory(l) === cat)
                      .map(l => (
                        <button
                          key={l}
                          onClick={() => { setLevel(l); setShowLevelSelector(false); handleRestart(); }}
                          className={`aspect-square rounded-lg flex items-center justify-center font-bold text-[10px] transition-all
                            ${l === level ? 'bg-blue-600 text-white ring-2 ring-blue-400' : 'bg-slate-800/50 text-slate-500 hover:text-slate-200 border border-slate-700/30'}`}
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
      )}
    </div>
  );
};

export default App;
