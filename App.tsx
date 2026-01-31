
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { TypingStats, LevelCategory } from './types';
import { NEPALI_MAP, NEPALI_SHIFT_MAP } from './constants';
import Keyboard from './components/Keyboard';
import TypingArea from './components/TypingArea';
import { getAIFeedback } from './services/gemini';
import { getLessonText, getLevelCategory } from './services/levelGenerator';

const App: React.FC = () => {
  const [language, setLanguage] = useState<'en' | 'ne'>('en');
  const [level, setLevel] = useState(1);
  const [userInput, setUserInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [errors, setErrors] = useState(0);
  const [activeKeyCode, setActiveKeyCode] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string>('');
  const [mistakenChars, setMistakenChars] = useState<Set<string>>(new Set());
  const [lastHeatmap, setLastHeatmap] = useState<Set<string>>(new Set());
  const [showLevelSelector, setShowLevelSelector] = useState(false);
  
  const [now, setNow] = useState(Date.now());

  // Procedurally generate lesson content based on current level and language
  const lessonContent = useMemo(() => getLessonText(level, language), [level, language]);
  const targetChar = lessonContent[userInput.length] || '';
  const currentCategory = getLevelCategory(level);

  useEffect(() => {
    let interval: number;
    if (startTime && !endTime && !showResults) {
      interval = window.setInterval(() => {
        setNow(Date.now());
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [startTime, endTime, showResults]);

  const stats = useMemo(() => {
    if (!startTime) {
      return { wpm: 0, accuracy: 100, elapsedTime: 0, errors };
    }
    const currentEnd = endTime || now;
    const elapsedSeconds = Math.max((currentEnd - startTime) / 1000, 0.001);
    const elapsedMinutes = elapsedSeconds / 60;
    const wpm = Math.round((userInput.length / 5) / elapsedMinutes);
    const totalAttempted = userInput.length + errors;
    const accuracy = totalAttempted > 0 
      ? Math.round(((totalAttempted - errors) / totalAttempted) * 100) 
      : 100;

    return { wpm, accuracy, elapsedTime: Math.round(elapsedSeconds), errors };
  }, [startTime, endTime, now, userInput.length, errors]);

  // Strict Level Requirement: WPM > 40 and 100% Accuracy
  const isLevelPassed = useMemo(() => {
    return stats.wpm > 40 && stats.accuracy === 100;
  }, [stats.wpm, stats.accuracy]);

  const finishLesson = useCallback(async (finalWpm: number, finalAccuracy: number) => {
    setShowResults(true);
    setAiFeedback("Analyzing your performance...");
    setLastHeatmap(new Set(mistakenChars)); // Capture heatmap
    try {
      const feedback = await getAIFeedback(finalWpm, finalAccuracy);
      setAiFeedback(feedback);
    } catch (e) {
      setAiFeedback("Great effort! Muscle memory is built through repetition.");
    }
  }, [mistakenChars]);

  useEffect(() => {
    if (userInput.length > 0 && userInput.length === lessonContent.length && !showResults) {
      const finalEndTime = Date.now();
      setEndTime(finalEndTime);
      finishLesson(stats.wpm, stats.accuracy);
    }
  }, [userInput.length, lessonContent.length, showResults, stats.wpm, stats.accuracy, finishLesson]);

  const handleRestart = () => {
    setUserInput('');
    setStartTime(null);
    setEndTime(null);
    setErrors(0);
    setMistakenChars(new Set());
    setShowResults(false);
    setNow(Date.now());
  };

  const handleNextLevel = () => {
    if (level < 100 && isLevelPassed) {
      setLevel(prev => prev + 1);
      handleRestart();
    }
  };

  const handleLanguageToggle = (lang: 'en' | 'ne') => {
    setLanguage(lang);
    handleRestart();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFocused || showResults || showLevelSelector) return;
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
  }, [isFocused, userInput, startTime, lessonContent, showResults, language, showLevelSelector]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 text-slate-200 flex flex-col justify-between">
      {/* Header Container */}
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
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Select Level</span>
              <span className="text-xs font-bold text-slate-200">LVL {level} • {currentCategory}</span>
            </button>
            
            <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800 ml-2">
              <button 
                onClick={() => handleLanguageToggle('en')}
                className={`px-3 py-0.5 rounded-md text-[9px] font-bold transition-all ${language === 'en' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}
              >
                EN
              </button>
              <button 
                onClick={() => handleLanguageToggle('ne')}
                className={`px-3 py-0.5 rounded-md text-[9px] font-bold transition-all ${language === 'ne' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}
              >
                NE
              </button>
            </div>
          </div>

          <div className="flex gap-4 items-center bg-slate-900/50 px-3 py-1 rounded-full border border-slate-800">
            <div className="text-center min-w-[2rem]">
              <p className="text-[7px] uppercase text-slate-500 font-bold">WPM</p>
              <p className="text-xs md:text-sm font-bold mono text-blue-400">{stats.wpm}</p>
            </div>
            <div className="w-px h-5 bg-slate-800"></div>
            <div className="text-center min-w-[2rem]">
              <p className="text-[7px] uppercase text-slate-500 font-bold">ACC</p>
              <p className="text-xs md:text-sm font-bold mono text-emerald-400">{stats.accuracy}%</p>
            </div>
            <div className="w-px h-5 bg-slate-800"></div>
            <div className="text-center min-w-[2rem]">
              <p className="text-[7px] uppercase text-slate-500 font-bold">TIME</p>
              <p className="text-xs md:text-sm font-bold mono text-slate-400">{stats.elapsedTime}s</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleRestart}
              className="p-1.5 hover:bg-slate-800 rounded-full transition-colors text-slate-400"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </header>
      </div>

      {/* Typing Area - Flexibly fills middle space */}
      <div className="flex-grow flex flex-col items-center justify-center px-4 overflow-hidden" onClick={() => setIsFocused(true)}>
        <TypingArea 
          content={lessonContent} 
          userInput={userInput} 
          isFocused={isFocused} 
          language={language}
        />
      </div>

      {/* Keyboard - Fixed at bottom */}
      <div className="flex-none w-full">
        <Keyboard 
          targetChar={targetChar} 
          activeCode={activeKeyCode} 
          language={language}
          errorHeatmap={showResults ? lastHeatmap : new Set()} 
        />
      </div>

      {/* Level Selector Modal */}
      {showLevelSelector && (
        <div className="fixed inset-0 bg-slate-950/95 flex items-center justify-center z-[200] backdrop-blur-md">
          <div className="w-full max-w-4xl h-[80vh] bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold">Curriculum Roadmap</h2>
                <p className="text-slate-400 text-sm">Select a level to begin your training</p>
              </div>
              <button 
                onClick={() => setShowLevelSelector(false)}
                className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
              {(['Home Row', 'Top Row', 'Bottom Row', 'Mastery Mix'] as const).map(cat => (
                <div key={cat} className="mb-8">
                  <h3 className="text-blue-400 text-xs font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <span className="w-8 h-px bg-blue-500/30"></span> {cat}
                  </h3>
                  <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                    {Array.from({ length: 100 }, (_, i) => i + 1)
                      .filter(l => getLevelCategory(l) === cat)
                      .map(l => (
                        <button
                          key={l}
                          onClick={() => {
                            setLevel(l);
                            setShowLevelSelector(false);
                            handleRestart();
                          }}
                          className={`
                            aspect-square rounded-xl flex items-center justify-center font-bold text-sm transition-all
                            ${l === level 
                              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 ring-2 ring-blue-400' 
                              : 'bg-slate-800/50 text-slate-500 hover:bg-slate-800 hover:text-slate-200 border border-slate-700/30'}
                          `}
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

      {/* Results Overlay */}
      {showResults && (
        <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center z-[100] backdrop-blur-sm">
          <div className="bg-slate-900 w-full max-w-sm p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-4 mx-4">
            <div className="text-center space-y-1">
              <h3 className="text-xl font-bold">Level {level} Result</h3>
              <p className="text-slate-400 italic text-xs px-2">"{aiFeedback}"</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className={`p-3 rounded-xl text-center border transition-colors ${stats.wpm > 40 ? 'bg-blue-900/20 border-blue-500/50' : 'bg-slate-800/50 border-slate-700'}`}>
                <p className="text-[8px] text-slate-500 uppercase font-bold">WPM</p>
                <p className={`text-2xl font-black mono ${stats.wpm > 40 ? 'text-blue-400' : 'text-slate-500'}`}>{stats.wpm}</p>
                <p className="text-[7px] text-slate-500">Target: > 40</p>
              </div>
              <div className={`p-3 rounded-xl text-center border transition-colors ${stats.accuracy === 100 ? 'bg-emerald-900/20 border-emerald-500/50' : 'bg-slate-800/50 border-slate-700'}`}>
                <p className="text-[8px] text-slate-500 uppercase font-bold">Accuracy</p>
                <p className={`text-2xl font-black mono ${stats.accuracy === 100 ? 'text-emerald-400' : 'text-slate-500'}`}>{stats.accuracy}%</p>
                <p className="text-[7px] text-slate-500">Target: 100%</p>
              </div>
            </div>
            
            {lastHeatmap.size > 0 && (
              <div className="text-center py-1">
                <p className="text-[8px] text-rose-500 uppercase font-bold mb-1">Errors to fix</p>
                <div className="flex flex-wrap justify-center gap-1">
                  {Array.from(lastHeatmap).map(char => (
                    <span key={char} className="px-1.5 py-0.5 bg-rose-500/10 text-rose-500 rounded text-[10px] font-bold border border-rose-500/20">
                      {char}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {!isLevelPassed && (
              <div className="bg-amber-900/20 border border-amber-500/30 p-2 rounded-lg">
                <p className="text-[9px] text-amber-500 text-center font-bold">
                  ⚠️ LEVEL REPEAT REQUIRED: REACH 40+ WPM AND 100% ACCURACY TO PROGRESS.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <button 
                onClick={handleNextLevel}
                disabled={!isLevelPassed}
                className={`w-full py-2.5 rounded-lg font-bold text-sm transition-all
                  ${isLevelPassed ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
                `}
              >
                {isLevelPassed ? 'NEXT LEVEL' : 'LOCKED: REQUIREMENTS NOT MET'}
              </button>
              <button onClick={handleRestart} className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-xs">
                RETRY LEVEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
