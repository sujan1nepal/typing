
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { NEPALI_MAP, NEPALI_SHIFT_MAP } from './constants.tsx';
import Keyboard from './components/Keyboard.tsx';
import TypingArea from './components/TypingArea.tsx';
import Hands from './components/Hands.tsx';
import AuthModal from './components/AuthModal.tsx';
import LevelSelector from './components/LevelSelector.tsx';
import SettingsModal from './components/SettingsModal.tsx';
import { getLessonText } from './services/levelGenerator.ts';
import { supabase, signOut, getGuestProfile, saveLocalProfile, getLocalProfile } from './services/supabase.ts';
import { getAIFeedback } from './services/gemini.ts';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [language, setLanguage] = useState<'en' | 'ne'>('en');
  const [level, setLevel] = useState(1);
  const [userInput, setUserInput] = useState('');
  const [isFocused, setIsFocused] = useState(true);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  
  const [correctKeypresses, setCorrectKeypresses] = useState(0);
  const [incorrectKeypresses, setIncorrectKeypresses] = useState(0);
  const [activeKeyCode, setActiveKeyCode] = useState<string | null>(null);
  const [aiFeedback, setAiFeedback] = useState<string>('Ready to flow? Start typing!');
  const [mistakenChars, setMistakenChars] = useState<Set<string>>(new Set());
  const [lastHeatmap, setLastHeatmap] = useState<Set<string>>(new Set());
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLevelSelector, setShowLevelSelector] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const [targetWpm, setTargetWpm] = useState<number>(40);
  const [targetAccuracy, setTargetAccuracy] = useState<number>(100);
  const [now, setNow] = useState(Date.now());

  const syncUserData = useCallback(async (userId: string) => {
    try {
      const local = getLocalProfile(userId);
      if (local) {
        if (local.current_level) setLevel(local.current_level);
        if (local.target_wpm) setTargetWpm(local.target_wpm);
        if (local.target_accuracy) setTargetAccuracy(local.target_accuracy);
      }
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (!error && data) {
        if (data.current_level) setLevel(data.current_level);
        if (data.target_wpm) setTargetWpm(data.target_wpm);
        if (data.target_accuracy) setTargetAccuracy(data.target_accuracy);
      }
    } catch (e) {
      console.warn('syncUserData error', e);
    }
  }, []);

  useEffect(() => {
    // Load local guest preferences immediately
    try {
      const guest = getGuestProfile();
      if (guest) {
        if (guest.current_level) setLevel(guest.current_level);
        if (guest.target_wpm) setTargetWpm(guest.target_wpm);
        if (guest.target_accuracy) setTargetAccuracy(guest.target_accuracy);
      }
    } catch (e) {
      console.warn('Could not read local profile', e);
    }

    supabase.auth.getSession()
      .then(({ data }) => {
        const sessionUser = data?.session?.user ?? null;
        setUser(sessionUser);
        if (sessionUser?.id) {
          syncUserData(sessionUser.id);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Auth session retrieval error:', err);
        setLoading(false);
      });

    const { data: authData } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      if (sessionUser?.id) {
        syncUserData(sessionUser.id);
      }
    });

    return () => {
      if (authData?.subscription && typeof authData.subscription.unsubscribe === 'function') {
        authData.subscription.unsubscribe();
      }
    };
  }, [syncUserData]);

  const saveProgress = useCallback(async (newLevel: number) => {
    const profile = {
      id: user?.id || 'guest',
      current_level: newLevel,
      target_wpm: targetWpm,
      target_accuracy: targetAccuracy,
      updated_at: new Date().toISOString()
    };
    saveLocalProfile(profile);

    if (user?.id) {
      try {
        await supabase.from('profiles').update(profile).eq('id', user.id);
      } catch (e) {
        console.warn('saveProgress remote error', e);
      }
    }
  }, [user, targetWpm, targetAccuracy]);

  const lessonContent = useMemo(() => getLessonText(level, language), [level, language]);
  const targetChar = lessonContent[userInput.length] || '';

  useEffect(() => {
    let interval: number;
    if (startTime && !endTime) interval = window.setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(interval);
  }, [startTime, endTime]);

  const stats = useMemo(() => {
    if (!startTime) return { wpm: 0, accuracy: 100, elapsedTime: 0, errors: incorrectKeypresses };
    const currentEnd = endTime || now;
    const elapsedSeconds = Math.max((currentEnd - startTime) / 1000, 0.001);
    const wpm = Math.round((userInput.length / 5) / (elapsedSeconds / 60));
    const totalPresses = correctKeypresses + incorrectKeypresses;
    const accuracy = totalPresses > 0 ? Math.round((correctKeypresses / totalPresses) * 100) : 100;
    return { wpm, accuracy, elapsedTime: Math.round(elapsedSeconds), errors: incorrectKeypresses };
  }, [startTime, endTime, now, userInput.length, correctKeypresses, incorrectKeypresses]);

  const handleRestart = useCallback(() => {
    setUserInput('');
    setStartTime(null);
    setEndTime(null);
    setCorrectKeypresses(0);
    setIncorrectKeypresses(0);
    setMistakenChars(new Set());
    setNow(Date.now());
  }, []);

  const handleNextLevel = useCallback(async (isPassed: boolean) => {
    setLastHeatmap(new Set(mistakenChars));
    if (isPassed && level < 300) {
      const nextLvl = level + 1;
      setLevel(nextLvl);
      saveProgress(nextLvl);
      
      const feedback = await getAIFeedback(stats.wpm, stats.accuracy);
      setAiFeedback(`Level ${level} Cleared! ${feedback}`);
    } else if (!isPassed) {
      setAiFeedback(`Keep practicing! Target: ${targetWpm} WPM / ${targetAccuracy}% Acc (Achieved: ${stats.wpm} WPM / ${stats.accuracy}%)`);
    }
    handleRestart();
  }, [level, mistakenChars, handleRestart, targetWpm, targetAccuracy, saveProgress, stats.wpm, stats.accuracy]);

  useEffect(() => {
    if (userInput.length > 0 && userInput.length === lessonContent.length) {
      const isPassed = stats.wpm >= targetWpm && stats.accuracy >= targetAccuracy;
      const timeout = setTimeout(() => handleNextLevel(isPassed), 400); 
      return () => clearTimeout(timeout);
    }
  }, [userInput.length, lessonContent.length, stats.wpm, stats.accuracy, handleNextLevel, targetWpm, targetAccuracy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || !isFocused || showLevelSelector || showSettings || showAuthModal) return;
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      const functionalKeys = ['Shift', 'CapsLock', 'Tab', 'Control', 'Alt', 'Meta', 'Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Backspace', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'];
      if (functionalKeys.includes(e.key)) { if (e.key === 'Tab') e.preventDefault(); return; }

      setActiveKeyCode(e.code);
      setTimeout(() => setActiveKeyCode(null), 100);

      const expected = lessonContent[userInput.length];
      let pressedChar = e.key;
      if (language === 'ne') {
        const key = e.key.toLowerCase();
        pressedChar = e.shiftKey ? (NEPALI_SHIFT_MAP[e.key] || NEPALI_SHIFT_MAP[key] || e.key) : (NEPALI_MAP[key] || e.key);
      }

      if (!startTime && e.key.length === 1) { setStartTime(Date.now()); setNow(Date.now()); }

      if (pressedChar === expected) {
        setCorrectKeypresses(prev => prev + 1);
        setUserInput(prev => prev + pressedChar);
      } else if (e.key.length === 1) {
        setIncorrectKeypresses(prev => prev + 1);
        setMistakenChars(prev => new Set(prev).add(expected));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocused, userInput, startTime, lessonContent, language, showLevelSelector, showSettings, showAuthModal]);

  const isDark = theme === 'dark';

  if (loading) return (
    <div className={`h-screen w-screen flex flex-col items-center justify-center gap-4 ${isDark ? 'bg-slate-950 text-blue-500' : 'bg-slate-50 text-blue-600'}`}>
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <span className="font-bold tracking-widest text-xs uppercase">Initializing Session</span>
    </div>
  );

  return (
    <div className={`h-screen w-screen overflow-hidden flex flex-col justify-between transition-colors duration-500 ${isDark ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-900'}`}>
      <div className="flex-none">
        <header className={`p-2 md:p-3 flex justify-between items-center border-b ${isDark ? 'bg-slate-950 border-slate-900' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg"><span className="text-lg font-bold italic text-white">T</span></div>
            <button onClick={() => setShowLevelSelector(true)} className={`flex flex-col items-start px-3 py-1 rounded-lg border transition-all ${isDark ? 'bg-slate-900/50 border-slate-800 hover:border-blue-500' : 'bg-slate-100 border-slate-200 hover:border-blue-400'}`}>
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Roadmap</span>
              <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>LVL {level}</span>
            </button>
            <div className={`flex p-0.5 rounded-lg border ml-2 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
              {(['en', 'ne'] as const).map(lang => (
                <button key={lang} onClick={() => { setLanguage(lang); handleRestart(); }} className={`px-3 py-0.5 rounded-md text-[9px] font-bold transition-all ${language === lang ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>{lang.toUpperCase()}</button>
              ))}
            </div>
          </div>
          <div className={`flex gap-4 items-center px-4 py-1 rounded-full border transition-colors ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
             <div className="text-center"><div className="flex gap-4 items-baseline">
                <div className="flex items-baseline gap-1"><span className={`text-xs md:text-sm font-bold mono ${stats.wpm >= targetWpm ? 'text-blue-500' : 'text-slate-400'}`}>{stats.wpm}</span><span className="text-[7px] text-slate-500 uppercase font-black">WPM</span></div>
                <div className="flex items-baseline gap-1"><span className={`text-xs md:text-sm font-bold mono ${stats.accuracy >= targetAccuracy ? 'text-emerald-500' : 'text-slate-400'}`}>{stats.accuracy}%</span><span className="text-[7px] text-slate-500 uppercase font-black">ACC</span></div>
             </div></div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setTheme(isDark ? 'light' : 'dark')} className={`p-1.5 rounded-full ${isDark ? 'hover:bg-slate-800 text-amber-400' : 'hover:bg-slate-200 text-slate-500'}`}>
              {isDark ? <span>☀️</span> : <span>🌙</span>}
            </button>
            {user ? (
              <div className="flex items-center gap-2 group relative">
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-[10px] font-bold cursor-pointer ${isDark ? 'bg-slate-800 border-slate-700 text-blue-400' : 'bg-slate-200 border-slate-300 text-blue-700'}`}>{user.email?.[0].toUpperCase()}</div>
                <div className={`hidden group-hover:block absolute top-full right-0 mt-2 p-2 border rounded-lg shadow-xl z-[400] min-w-[160px] ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <p className="text-[10px] text-slate-400 mb-2 truncate px-2">{user.email}</p>
                  <button onClick={signOut} className="w-full text-left text-rose-500 text-xs font-bold hover:bg-slate-800 p-2 rounded">Sign Out</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowAuthModal(true)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-500 transition-colors shadow-lg">Sign In</button>
            )}
            <button onClick={() => setShowSettings(true)} className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400">⚙️</button>
            <button onClick={handleRestart} className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400">🔄</button>
          </div>
        </header>
        <div className={`text-center py-1 ${isDark ? 'bg-slate-900/30' : 'bg-slate-100'}`}><p className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">{aiFeedback}</p></div>
      </div>

      <div className="flex-grow flex flex-col items-center justify-center px-4 overflow-hidden gap-6" onClick={() => setIsFocused(true)}>
        <TypingArea content={lessonContent} userInput={userInput} isFocused={isFocused} language={language} theme={theme} onFocus={() => setIsFocused(true)} />
        <Hands targetChar={targetChar} theme={theme} />
      </div>

      <div className="flex-none w-full">
        <Keyboard targetChar={targetChar} activeCode={activeKeyCode} language={language} errorHeatmap={lastHeatmap} />
      </div>

      {showAuthModal && <AuthModal isDark={isDark} onClose={() => setShowAuthModal(false)} onSuccess={(msg) => setAiFeedback(msg)} />}
      {showSettings && <SettingsModal isDark={isDark} targetWpm={targetWpm} targetAccuracy={targetAccuracy} setTargetWpm={setTargetWpm} setTargetAccuracy={setTargetAccuracy} onClose={() => setShowSettings(false)} onSave={() => saveProgress(level)} />}
      {showLevelSelector && <LevelSelector isDark={isDark} currentLevel={level} onClose={() => setShowLevelSelector(false)} onSelect={(l) => { setLevel(l); setShowLevelSelector(false); handleRestart(); saveProgress(l); }} />}
    </div>
  );
};

export default App;

