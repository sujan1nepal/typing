
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { TypingStats, Lesson } from './types';
import { ENGLISH_LESSONS, NEPALI_LESSONS, NEPALI_MAP, NEPALI_SHIFT_MAP } from './constants';
import Keyboard from './components/Keyboard';
import TypingArea from './components/TypingArea';
import { getAIFeedback, generateDrillFromMistakes } from './services/gemini';

const App: React.FC = () => {
  const [language, setLanguage] = useState<'en' | 'ne'>('en');
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [errors, setErrors] = useState(0);
  const [activeKeyCode, setActiveKeyCode] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string>('');
  const [isGeneratingDrill, setIsGeneratingDrill] = useState(false);
  const [mistakenChars, setMistakenChars] = useState<Set<string>>(new Set());
  
  const [now, setNow] = useState(Date.now());

  const lessons = language === 'en' ? ENGLISH_LESSONS : NEPALI_LESSONS;
  const lesson = lessons[currentLessonIndex] || lessons[0];
  const targetChar = lesson.content[userInput.length] || '';

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

    return {
      wpm,
      accuracy,
      elapsedTime: Math.round(elapsedSeconds),
      errors
    };
  }, [startTime, endTime, now, userInput.length, errors]);

  const finishLesson = useCallback(async (finalWpm: number, finalAccuracy: number) => {
    setShowResults(true);
    setAiFeedback("Analyzing your performance...");
    try {
      const feedback = await getAIFeedback(finalWpm, finalAccuracy);
      setAiFeedback(feedback);
    } catch (e) {
      setAiFeedback("Great job! You've mastered this lesson.");
    }
  }, []);

  useEffect(() => {
    if (userInput.length > 0 && userInput.length === lesson.content.length && !showResults) {
      const finalEndTime = Date.now();
      setEndTime(finalEndTime);
      finishLesson(stats.wpm, stats.accuracy);
    }
  }, [userInput.length, lesson.content.length, showResults, stats.wpm, stats.accuracy, finishLesson]);

  const handleRestart = () => {
    setUserInput('');
    setStartTime(null);
    setEndTime(null);
    setErrors(0);
    setMistakenChars(new Set());
    setShowResults(false);
    setNow(Date.now());
  };

  const handleNextLesson = () => {
    if (currentLessonIndex < lessons.length - 1) {
      setCurrentLessonIndex(prev => prev + 1);
      handleRestart();
    }
  };

  const handleLanguageToggle = (lang: 'en' | 'ne') => {
    setLanguage(lang);
    setCurrentLessonIndex(0);
    handleRestart();
  };

  const handleAIJump = async () => {
    setIsGeneratingDrill(true);
    const chars = Array.from(mistakenChars) as string[];
    const customDrill = await generateDrillFromMistakes(chars);
    if (customDrill) {
      const customLesson: Lesson = {
        id: Date.now(),
        title: "AI Power Drill",
        description: `Custom practice focusing on: ${chars.join(' ')}`,
        content: customDrill,
        category: 'Custom'
      };
      lessons.push(customLesson);
      setCurrentLessonIndex(lessons.length - 1);
      handleRestart();
    }
    setIsGeneratingDrill(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFocused || showResults) return;
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

      const expected = lesson.content[userInput.length];
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
  }, [isFocused, userInput, startTime, lesson.content, showResults, language]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 text-slate-200 flex flex-col justify-between">
      {/* Header Container */}
      <div className="flex-none">
        <header className="p-2 md:p-3 flex justify-between items-center bg-slate-950 border-b border-slate-900 z-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-lg font-bold italic">T</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold tracking-tight">TypingPro</h1>
            </div>
            
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
            <div className="px-1.5 py-0.5 bg-slate-800 rounded-md text-[8px] font-semibold text-slate-300">
              LVL {currentLessonIndex + 1}
            </div>
          </div>
        </header>

        <div className="text-center py-1 space-y-0">
          <h2 className={`text-lg font-bold text-slate-100 ${language === 'ne' ? 'nepali' : ''}`}>{lesson.title}</h2>
          <p className={`text-[10px] text-slate-400 ${language === 'ne' ? 'nepali' : ''}`}>{lesson.description}</p>
        </div>
      </div>

      {/* Typing Area - Flexibly fills middle space */}
      <div className="flex-grow flex flex-col items-center justify-center px-4 overflow-hidden" onClick={() => setIsFocused(true)}>
        <TypingArea 
          content={lesson.content} 
          userInput={userInput} 
          isFocused={isFocused} 
          language={language}
        />
      </div>

      {/* Keyboard - Fixed at bottom */}
      <div className="flex-none w-full">
        <Keyboard targetChar={targetChar} activeCode={activeKeyCode} language={language} />
      </div>

      {/* Results Overlay */}
      {showResults && (
        <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center z-[100] backdrop-blur-sm">
          <div className="bg-slate-900 w-full max-w-sm p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-4 mx-4">
            <div className="text-center space-y-1">
              <h3 className="text-xl font-bold">Lesson Complete!</h3>
              <p className="text-slate-400 italic text-xs px-2">"{aiFeedback}"</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/50 p-3 rounded-xl text-center">
                <p className="text-[8px] text-slate-500 uppercase font-bold">WPM</p>
                <p className="text-2xl font-black text-blue-400 mono">{stats.wpm}</p>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-xl text-center">
                <p className="text-[8px] text-slate-500 uppercase font-bold">Accuracy</p>
                <p className="text-2xl font-black text-emerald-400 mono">{stats.accuracy}%</p>
              </div>
            </div>
            <div className="space-y-2">
              <button 
                onClick={handleNextLesson}
                disabled={stats.accuracy < 90}
                className={`w-full py-2.5 rounded-lg font-bold text-sm transition-all
                  ${stats.accuracy >= 90 ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
                `}
              >
                {stats.accuracy >= 90 ? 'CONTINUE' : '90% ACCURACY REQUIRED'}
              </button>
              <div className="flex gap-2">
                <button onClick={handleRestart} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-xs">
                  RETRY
                </button>
                {mistakenChars.size > 0 && (
                  <button onClick={handleAIJump} disabled={isGeneratingDrill} className="flex-1 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 font-semibold rounded-lg border border-amber-600/30 text-xs">
                    {isGeneratingDrill ? 'DRILLING...' : 'AI DRILL'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
