
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { NEPALI_MAP, NEPALI_SHIFT_MAP } from './constants';
import Keyboard from './components/Keyboard';
import TypingArea from './components/TypingArea';
import Hands from './components/Hands';
import { getLessonText, getLevelCategory } from './services/levelGenerator';
import { LevelCategory } from './types';
import { supabase, signInWithEmail, signUpWithEmail, signOut } from './services/supabase';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // App State
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
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
  
  const [targetWpm, setTargetWpm] = useState<number>(40);
  const [targetAccuracy, setTargetAccuracy] = useState<number>(100);
  const [now, setNow] = useState(Date.now());

  // Auth & Data Sync Logic
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) syncUserData(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) syncUserData(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const syncUserData = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([{ 
          id: userId, 
          current_level: level, 
          target_wpm: targetWpm, 
          target_accuracy: targetAccuracy 
        }]);
      if (insertError) console.error('Insert error:', insertError);
    } else if (data) {
      setLevel(data.current_level);
      setTargetWpm(data.target_wpm);
      setTargetAccuracy(data.target_accuracy);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const { data, error } = authMode === 'login' 
      ? await signInWithEmail(email, password)
      : await signUpWithEmail(email, password);

    if (error) {
      setAuthError(error.message);
    } else {
      setShowAuthModal(false);
      setEmail('');
      setPassword('');
      if (authMode === 'signup') {
        setAiFeedback("Account created! Verify your email to complete sync.");
      }
    }
  };

  const saveProgress = async (newLevel: number) => {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({ 
        current_level: newLevel,
        target_wpm: targetWpm,
        target_accuracy: targetAccuracy,
        updated_at: new Date()
      })
      .eq('id', user.id);
    if (error) console.error('Save error:', error);
  };

  const lessonContent = useMemo(() => getLessonText(level, language), [level, language]);
  const targetChar = lessonContent[userInput.length] || '';

  useEffect(() => {
    let interval: number;
    if (startTime && !endTime) {
      interval = window.setInterval(() => setNow(Date.now()), 500);
    }
    return () => clearInterval(interval);
  }, [startTime, endTime]);

  const stats = useMemo(() => {
    if (!startTime) return { wpm: 0, accuracy: 100, elapsedTime: 0, errors };
    const currentEnd = endTime || now;
    const elapsedSeconds = Math.max((currentEnd - startTime) / 1000, 0.001);
    const wpm = Math.round((userInput.length / 5) / (elapsedSeconds / 60));
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
      const nextLvl = level + 1;
      setLevel(nextLvl);
      saveProgress(nextLvl);
      setAiFeedback(`Level ${level} Cleared! Progress Saved.`);
    } else if (!isPassed) {
      setAiFeedback(`Repeating: Target ${targetWpm} WPM / ${targetAccuracy}% Acc`);
    }
    handleRestart();
  }, [level, user, mistakenChars, handleRestart, targetWpm, targetAccuracy]);

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
        pressedChar = e.shiftKey ? (NEPALI_SHIFT_MAP[e.key] || NEPALI_SHIFT_MAP[key] || e.key) : (NEPALI_MAP[key] || e.key);
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
  }, [isFocused, userInput, startTime, lessonContent, language, showLevelSelector, showSettings, showAuthModal]);

  const CATEGORIES: LevelCategory[] = [
    'Home Row', 'Top Row', 'Bottom Row', 'Mastery Mix', 
    'Word Mastery', 'Sentence Flow', 'Paragraph Stamina', 'Extreme Mastery'
  ];

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
        <header className={`p-2 md:p-3 flex justify-between items-center border-b transition-colors duration-500 ${isDark ? 'bg-slate-950 border-slate-900' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-lg font-bold italic text-white">T</span>
            </div>
            
            <button 
              onClick={() => setShowLevelSelector(true)}
              className={`flex flex-col items-start px-3 py-1 rounded-lg border transition-all ${isDark ? 'bg-slate-900/50 border-slate-800 hover:border-blue-500' : 'bg-slate-100 border-slate-200 hover:border-blue-400'}`}
            >
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Roadmap</span>
              <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>LVL {level}</span>
            </button>

            <div className={`flex p-0.5 rounded-lg border ml-2 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
              {(['en', 'ne'] as const).map(lang => (
                <button 
                  key={lang}
                  onClick={() => { setLanguage(lang); handleRestart(); }}
                  className={`px-3 py-0.5 rounded-md text-[9px] font-bold transition-all ${language === lang ? 'bg-blue-600 text-white' : 'text-slate-500'}`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className={`flex gap-4 items-center px-4 py-1 rounded-full border transition-colors ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
             <div className="text-center">
              <div className="flex gap-4 items-baseline">
                <div className="flex items-baseline gap-1">
                  <span className={`text-xs md:text-sm font-bold mono ${stats.wpm >= targetWpm ? 'text-blue-500' : 'text-slate-400'}`}>{stats.wpm}</span>
                  <span className="text-[7px] text-slate-500 uppercase font-black">WPM</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-xs md:text-sm font-bold mono ${stats.accuracy >= targetAccuracy ? 'text-emerald-500' : 'text-slate-400'}`}>{stats.accuracy}%</span>
                  <span className="text-[7px] text-slate-500 uppercase font-black">ACC</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button 
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className={`p-1.5 rounded-full transition-colors ${isDark ? 'hover:bg-slate-800 text-amber-400' : 'hover:bg-slate-200 text-slate-500'}`}
              title="Toggle Theme"
            >
              {isDark ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
            </button>

            {user ? (
              <div className="flex items-center gap-2 group relative">
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-[10px] font-bold cursor-pointer transition-colors ${isDark ? 'bg-slate-800 border-slate-700 text-blue-400' : 'bg-slate-200 border-slate-300 text-blue-700'}`}>
                  {user.email?.[0].toUpperCase()}
                </div>
                <div className={`hidden group-hover:block absolute top-full right-0 mt-2 p-2 border rounded-lg shadow-xl z-[400] min-w-[160px] ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <p className="text-[10px] text-slate-400 mb-2 truncate px-2">{user.email}</p>
                  <button onClick={signOut} className="w-full text-left text-rose-500 text-xs font-bold hover:bg-slate-800 p-2 rounded transition-colors">Sign Out</button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setShowAuthModal(true)} 
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-500 transition-colors shadow-lg"
              >
                Sign In
              </button>
            )}
            
            <button onClick={() => setShowSettings(true)} className={`p-1.5 rounded-full transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}>
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button onClick={handleRestart} className={`p-1.5 rounded-full transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </header>
        <div className={`text-center py-1 transition-colors ${isDark ? 'bg-slate-900/30' : 'bg-slate-100'}`}>
          <p className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">{aiFeedback}</p>
        </div>
      </div>

      <div className="flex-grow flex flex-col items-center justify-center px-4 overflow-hidden gap-12" onClick={() => setIsFocused(true)}>
        <TypingArea content={lessonContent} userInput={userInput} isFocused={isFocused} language={language} theme={theme} />
        <Hands targetChar={targetChar} theme={theme} />
      </div>

      <div className="flex-none w-full">
        <Keyboard targetChar={targetChar} activeCode={activeKeyCode} language={language} errorHeatmap={lastHeatmap} />
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-950/95 flex items-center justify-center z-[500] backdrop-blur-md">
          <div className={`w-full max-w-sm border rounded-2xl p-6 shadow-2xl relative ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h2 className="text-xl font-bold mb-2">{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
            <p className="text-xs text-slate-400 mb-6">Sync your progress across all devices.</p>
            
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 text-sm outline-none transition-colors ${isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'}`}
                  placeholder="name@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 text-sm outline-none transition-colors ${isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'}`}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              
              {authError && (
                <div className="p-2 bg-rose-500/10 border border-rose-500/50 rounded-lg">
                  <p className="text-[10px] text-rose-400 font-bold">{authError}</p>
                </div>
              )}

              <button 
                type="submit"
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-500 transition-colors"
              >
                {authMode === 'login' ? 'Sign In' : 'Join Now'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-800 text-center">
              <button 
                onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                className="text-xs text-slate-400 hover:text-blue-400 transition-colors"
              >
                {authMode === 'login' ? "New here? Create account" : "Have account? Login"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 bg-slate-950/95 flex items-center justify-center z-[300] backdrop-blur-md">
          <div className={`w-full max-w-sm border rounded-2xl p-6 shadow-2xl ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <h2 className="text-xl font-bold mb-6">Mastery Targets</h2>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Target WPM</label>
                  <span className="text-sm font-bold text-blue-500">{targetWpm}</span>
                </div>
                <input type="range" min="10" max="120" step="5" value={targetWpm} onChange={(e) => setTargetWpm(Number(e.target.value))} className="w-full accent-blue-500 cursor-pointer" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Target Accuracy</label>
                  <span className="text-sm font-bold text-emerald-500">{targetAccuracy}%</span>
                </div>
                <input type="range" min="80" max="100" step="1" value={targetAccuracy} onChange={(e) => setTargetAccuracy(Number(e.target.value))} className="w-full accent-emerald-500 cursor-pointer" />
              </div>
            </div>
            <button onClick={() => { setShowSettings(false); saveProgress(level); }} className="w-full mt-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-500 transition-colors">Apply & Exit</button>
          </div>
        </div>
      )}

      {showLevelSelector && (
        <div className="fixed inset-0 bg-slate-950/95 flex items-center justify-center z-[200] backdrop-blur-md">
          <div className={`w-full max-w-5xl h-[85vh] border rounded-3xl p-8 flex flex-col shadow-2xl ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold">Curriculum Roadmap</h2>
              <button onClick={() => setShowLevelSelector(false)} className="p-3 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-colors">
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
                          onClick={() => { setLevel(l); setShowLevelSelector(false); handleRestart(); saveProgress(l); }}
                          className={`aspect-square rounded-lg flex items-center justify-center font-bold text-[10px] transition-all
                            ${l === level ? 'bg-blue-600 text-white ring-2 ring-blue-400' : (isDark ? 'bg-slate-800/50 text-slate-500 border border-slate-700/30' : 'bg-slate-100 text-slate-400 border border-slate-200')} hover:scale-105`}
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
