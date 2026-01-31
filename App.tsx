
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { NEPALI_MAP, NEPALI_SHIFT_MAP } from './constants.tsx';
import Keyboard from './components/Keyboard.tsx';
import TypingArea from './components/TypingArea.tsx';
import Hands from './components/Hands.tsx';
import AuthModal from './components/AuthModal.tsx';
import ProfileModal from './components/ProfileModal.tsx';
import SettingsModal from './components/SettingsModal.tsx';
import { getLessonText } from './services/levelGenerator.ts';
import { supabase, getLeaderboard, recordLevelPerformance } from './services/supabase.ts';

type AppMode = 'training' | 'leaderboard';
type Theme = 'light' | 'dark';

const getFingerName = (char: string): string => {
  if (!char) return "Unknown";
  const c = char.toLowerCase();
  if (['1', 'q', 'a', 'z', '!', '`', '~'].includes(c)) return "Left Pinky Finger";
  if (['2', 'w', 's', 'x', '@'].includes(c)) return "Left Ring Finger";
  if (['3', 'e', 'd', 'c', '#'].includes(c)) return "Left Middle Finger";
  if (['4', '5', 'r', 't', 'f', 'g', 'v', 'b', '$', '%'].includes(c)) return "Left Index Finger";
  if (c === ' ') return "Thumb";
  if (['6', '7', 'y', 'u', 'h', 'j', 'n', 'm', '^', '&'].includes(c)) return "Right Index Finger";
  if (['8', 'i', 'k', ',', '*', '<'].includes(c)) return "Right Middle Finger";
  if (['9', 'o', 'l', '.', '(', '>'].includes(c)) return "Right Ring Finger";
  if (['0', '-', '=', 'p', '[', ']', '\\', ';', "'", '/', ')', '_', '+', '{', '}', '|', ':', '"', '?'].includes(c)) return "Right Pinky Finger";
  return "Unknown";
};

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [appMode, setAppMode] = useState<AppMode>('training');
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'dark');
  
  const [level, setLevel] = useState(() => Number(localStorage.getItem('guest_level')) || 1);
  const [maxReachedLevel, setMaxReachedLevel] = useState(() => Number(localStorage.getItem('guest_max_level')) || 1);
  const [targetWpm, setTargetWpm] = useState(15);
  const [targetAccuracy, setTargetAccuracy] = useState(95);
  
  const [language, setLanguage] = useState<'en' | 'ne'>(() => (localStorage.getItem('language') as 'en' | 'ne') || 'en');
  const [userInput, setUserInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const [correctKeypresses, setCorrectKeypresses] = useState(0);
  const [incorrectKeypresses, setIncorrectKeypresses] = useState(0);
  const [mistakeDetails, setMistakeDetails] = useState<Record<string, Record<string, number>>>({});
  const [activeKeyCode, setActiveKeyCode] = useState<string | null>(null);
  
  const [globalScores, setGlobalScores] = useState<any[]>([]);
  const [showLevelSelector, setShowLevelSelector] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [now, setNow] = useState(Date.now());

  const isDark = theme === 'dark';

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
  };

  const toggleLanguage = () => {
    const next = language === 'en' ? 'ne' : 'en';
    setLanguage(next);
    localStorage.setItem('language', next);
    handleRestart();
  };

  const fetchLeaderboardData = useCallback(async () => {
    const data = await getLeaderboard();
    setGlobalScores(data || []);
  }, []);

  const syncUserData = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (data) {
        setLevel(data.current_level || 1);
        setMaxReachedLevel(data.current_level || 1);
        setTargetWpm(data.target_wpm || 15);
        setTargetAccuracy(data.target_accuracy || 95);
      }
      fetchLeaderboardData();
    } catch (e) {
      console.warn("User sync warning:", e);
    }
  }, [fetchLeaderboardData]);

  const handleRestart = useCallback(() => {
    setUserInput('');
    setStartTime(null);
    setEndTime(null);
    setIsTransitioning(false);
    setCorrectKeypresses(0);
    setIncorrectKeypresses(0);
    setMistakeDetails({});
  }, []);

  const handleGlobalUpdate = useCallback(() => {
    if (user) syncUserData(user.id);
    fetchLeaderboardData();
  }, [user, syncUserData, fetchLeaderboardData]);

  const handleResetUI = useCallback(() => {
    localStorage.removeItem('guest_level');
    localStorage.removeItem('guest_max_level');
    setLevel(1);
    setMaxReachedLevel(1);
    setTargetWpm(15);
    setTargetAccuracy(95);
    handleRestart();
    fetchLeaderboardData();
  }, [handleRestart, fetchLeaderboardData]);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) await syncUserData(currentUser.id);
      setLoading(false);
      fetchLeaderboardData();
    };
    initAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      if (newUser) await syncUserData(newUser.id);
      fetchLeaderboardData();
    });
    return () => subscription.unsubscribe();
  }, [syncUserData, fetchLeaderboardData]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(timer);
  }, []);

  const lessonContent = useMemo(() => getLessonText(level, language) || "", [level, language]);
  const targetChar = lessonContent[userInput.length] || '';

  const analyzePerformance = (wpm: number, accuracy: number, details: Record<string, Record<string, number>>) => {
    const fingerMistakes: Record<string, number> = {};
    Object.entries(details).forEach(([expected, typedMap]) => {
      const finger = getFingerName(expected);
      const totalForChar = Object.values(typedMap).reduce((a, b) => a + b, 0);
      fingerMistakes[finger] = (fingerMistakes[finger] || 0) + totalForChar;
    });
    const worstFinger = Object.entries(fingerMistakes).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";
    let suggestion = "Focus on the target!";
    if (accuracy < targetAccuracy) suggestion = "Slow down for accuracy.";
    else if (wpm < targetWpm) suggestion = "Maintain consistent rhythm.";
    return { worstFinger, suggestion };
  };

  useEffect(() => {
    if (userInput.length > 0 && userInput.length === lessonContent.length && !endTime && !isTransitioning) {
      const finishTime = Date.now();
      setEndTime(finishTime);
      setIsTransitioning(true);

      const sec = Math.max((finishTime - startTime!) / 1000, 0.001);
      const currentWpm = Math.round((userInput.length / 5) / (sec / 60));
      const total = correctKeypresses + incorrectKeypresses;
      const currentAcc = total > 0 ? Math.round((correctKeypresses / total) * 100) : 100;
      const { worstFinger, suggestion } = analyzePerformance(currentWpm, currentAcc, mistakeDetails);

      // Core Advancement Logic - Runs for everyone immediately
      const isPassed = currentWpm >= targetWpm && currentAcc >= targetAccuracy;
      if (isPassed) {
        const next = level + 1;
        setLevel(next);
        const newMax = Math.max(maxReachedLevel, next);
        setMaxReachedLevel(newMax);
        localStorage.setItem('guest_level', next.toString());
        localStorage.setItem('guest_max_level', newMax.toString());
      }

      // Remote Persistence
      if (user) {
        recordLevelPerformance(user.id, level, currentWpm, currentAcc, incorrectKeypresses, mistakeDetails, worstFinger, suggestion)
          .then(() => {
            if (isPassed) {
              supabase.from('profiles').update({ current_level: level + 1 }).eq('id', user.id).then(() => fetchLeaderboardData());
            } else {
              fetchLeaderboardData();
            }
          });
      }

      setTimeout(() => {
        handleRestart();
        setIsFocused(true);
      }, 1000);
    }
  }, [userInput.length, lessonContent.length, user, startTime, level, targetWpm, targetAccuracy, correctKeypresses, incorrectKeypresses, mistakeDetails, maxReachedLevel, handleRestart, fetchLeaderboardData]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isFocused || showAuthModal || showLevelSelector || showProfileModal || showSettings || appMode === 'leaderboard' || endTime || isTransitioning) return;
      if (e.ctrlKey || e.altKey || e.metaKey || e.repeat) return;
      const ignore = ['Shift', 'CapsLock', 'Tab', 'Control', 'Alt', 'Meta', 'Escape', 'Backspace', 'Enter'];
      if (ignore.includes(e.key)) return;
      
      setActiveKeyCode(e.code);
      setTimeout(() => setActiveKeyCode(null), 100);
      if (!startTime) setStartTime(Date.now());
      
      let char = e.key;
      if (language === 'ne') {
        const k = e.key.toLowerCase();
        char = e.shiftKey ? (NEPALI_SHIFT_MAP[e.key] || NEPALI_SHIFT_MAP[k] || e.key) : (NEPALI_MAP[k] || e.key);
      }
      if (char === targetChar) {
        setCorrectKeypresses(p => p + 1);
        setUserInput(p => p + char);
      } else if (e.key.length === 1) {
        setIncorrectKeypresses(p => p + 1);
        setMistakeDetails(prev => {
          const next = { ...prev };
          if (!next[targetChar]) next[targetChar] = {};
          next[targetChar][char] = (next[targetChar][char] || 0) + 1;
          return next;
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isFocused, userInput, startTime, targetChar, language, showAuthModal, showLevelSelector, showProfileModal, showSettings, appMode, endTime, isTransitioning]);

  const CATEGORIES = [
    { name: 'Home Row', range: [1, 40] },
    { name: 'Top Row', range: [41, 80] },
    { name: 'Bottom Row', range: [81, 120] },
    { name: 'Mastery Mix', range: [121, 160] },
    { name: 'Word Mastery', range: [161, 200] },
    { name: 'Sentence Flow', range: [201, 250] },
    { name: 'Paragraphs', range: [251, 320] },
    { name: 'Extreme', range: [321, 400] },
  ];

  if (loading) return (
    <div className={`h-screen w-screen flex items-center justify-center font-black uppercase tracking-widest ${isDark ? 'bg-[#020617] text-blue-500' : 'bg-slate-50 text-blue-600'}`}>
      Initialising...
    </div>
  );

  return (
    <div className={`h-screen w-screen overflow-hidden flex flex-col transition-colors duration-300 ${isDark ? 'bg-[#020617] text-slate-200' : 'bg-slate-50 text-slate-900'}`}>
      <nav className={`flex-none px-6 py-4 flex justify-between items-center z-[100] border-b transition-colors ${isDark ? 'bg-[#020617]/80 border-slate-900/50' : 'bg-white border-slate-200 shadow-sm'} backdrop-blur-md`}>
        <div className="flex items-center gap-6">
          <div className="text-xl font-black italic text-blue-500 tracking-tighter cursor-pointer" onClick={() => setAppMode('training')}>T-PRO</div>
          <div className={`flex p-1 rounded-xl border transition-colors ${isDark ? 'bg-slate-900/40 border-slate-800/50' : 'bg-slate-100 border-slate-200'}`}>
            <button onClick={() => { setAppMode('training'); handleRestart(); }} className={`px-4 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${appMode === 'training' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-400'}`}>Training</button>
            <button onClick={() => setAppMode('leaderboard')} className={`px-4 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${appMode === 'leaderboard' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-400'}`}>Masters</button>
          </div>
        </div>

        {appMode === 'training' && startTime && !endTime && (
          <div className="flex gap-8 animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">WPM</span>
              <span className="text-sm font-black text-blue-500 tabular-nums">{Math.round((userInput.length / 5) / (Math.max((now - startTime) / 1000, 0.001) / 60))}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">ACC</span>
              <span className="text-sm font-black text-emerald-500 tabular-nums">{correctKeypresses + incorrectKeypresses > 0 ? Math.round((correctKeypresses / (correctKeypresses + incorrectKeypresses)) * 100) : 100}%</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button onClick={toggleLanguage} className={`px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all ${isDark ? 'border-slate-800 bg-slate-900 text-blue-400' : 'border-slate-200 bg-slate-100 text-blue-600 hover:bg-slate-200'}`}>
            {language === 'en' ? 'English' : 'नेपाली'}
          </button>
          <button onClick={toggleTheme} className={`p-1.5 rounded-lg border transition-all ${isDark ? 'border-slate-800 bg-slate-900 text-amber-400' : 'border-slate-200 bg-slate-100 text-slate-400 hover:text-amber-500'}`}>
             <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"/></svg>
          </button>
          <button onClick={() => setShowSettings(true)} className={`p-1.5 rounded-lg border transition-all ${isDark ? 'border-slate-800 bg-slate-900 text-slate-400' : 'border-slate-200 bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </button>
          <button onClick={() => setShowLevelSelector(true)} className={`px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all ${isDark ? 'border-slate-800 bg-slate-900 text-slate-400 hover:border-blue-500' : 'border-slate-200 bg-slate-100 text-slate-600 hover:border-blue-400'}`}>
            Level {level}
          </button>
          {user ? (
            <div onClick={() => setShowProfileModal(true)} className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-[10px] cursor-pointer hover:scale-110 transition-all">
              {user.email?.[0]?.toUpperCase() || 'U'}
            </div>
          ) : (
            <button onClick={() => setShowAuthModal(true)} className="px-3 py-1 bg-blue-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest">Sign In</button>
          )}
        </div>
      </nav>

      <main className="flex-grow flex items-center justify-center relative p-4">
        {appMode === 'leaderboard' ? (
          <div className={`w-full max-w-5xl border rounded-[2rem] p-8 backdrop-blur-md flex flex-col h-[70vh] ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
            <h2 className="text-2xl font-black text-blue-500 uppercase mb-6 tracking-tighter">Masters Arena</h2>
            <div className="flex-grow overflow-y-auto pr-2 space-y-2 no-scrollbar">
               <div className="grid grid-cols-12 px-4 text-[8px] font-black uppercase text-slate-500 mb-3 border-b border-slate-800 pb-3">
                 <div className="col-span-1">Rank</div>
                 <div className="col-span-4">User</div>
                 <div className="col-span-1 text-center">Lvl</div>
                 <div className="col-span-2 text-center text-blue-400">Avg WPM</div>
                 <div className="col-span-2 text-center text-emerald-400">Avg Acc</div>
                 <div className="col-span-2 text-center">Mistakes</div>
               </div>
               {globalScores.map((s, i) => (
                 <div key={s.id} className={`grid grid-cols-12 items-center p-4 rounded-2xl border ${isDark ? (user?.id === s.id ? 'bg-blue-600/10 border-blue-500' : 'bg-slate-950/50 border-slate-800') : (user?.id === s.id ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-100 shadow-sm')}`}>
                   <div className="col-span-1 text-xs font-black text-slate-500">#{i + 1}</div>
                   <div className="col-span-4 text-xs font-bold truncate">
                     {s.first_name ? `${s.first_name} ${s.last_name}` : (s.email?.split('@')[0] || 'Subject')}
                   </div>
                   <div className="col-span-1 text-center font-black text-blue-500">{s.current_level}</div>
                   <div className="col-span-2 text-center font-black text-slate-600 dark:text-slate-300">{s.avg_wpm}</div>
                   <div className="col-span-2 text-center font-black text-emerald-500">{s.avg_accuracy}%</div>
                   <div className="col-span-2 text-center font-black text-rose-500">{s.total_mistakes}</div>
                 </div>
               ))}
            </div>
          </div>
        ) : (
          <div className="w-full max-w-6xl flex items-center justify-center gap-4 relative">
            <div className="hidden lg:block absolute left-[-40px] xl:left-0">
               <Hands targetChar={targetChar} theme={theme} side="left" />
            </div>
            <TypingArea content={lessonContent} userInput={userInput} isFocused={isFocused} language={language} theme={theme} onFocus={() => setIsFocused(true)} />
            <div className="hidden lg:block absolute right-[-40px] xl:right-0">
               <Hands targetChar={targetChar} theme={theme} side="right" />
            </div>
          </div>
        )}
      </main>

      <footer className="flex-none w-full pb-8">
        <Keyboard targetChar={targetChar} activeCode={activeKeyCode} language={language} theme={theme} />
      </footer>

      {showAuthModal && <AuthModal theme={theme} onClose={() => setShowAuthModal(false)} />}
      {showSettings && <SettingsModal theme={theme} user={user} currentWpm={targetWpm} currentAcc={targetAccuracy} onClose={() => setShowSettings(false)} onUpdate={handleGlobalUpdate} />}
      {showProfileModal && user && <ProfileModal theme={theme} user={user} onClose={() => setShowProfileModal(false)} onUpdate={handleResetUI} />}
      
      {showLevelSelector && (
        <div className={`fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-xl ${isDark ? 'bg-slate-950/98' : 'bg-slate-50/90'}`}>
           <div className={`w-full max-w-5xl max-h-[85vh] border rounded-[3rem] p-10 flex flex-col overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-2xl'}`}>
             <div className="flex justify-between items-center mb-8">
               <div>
                <h2 className="text-3xl font-black italic tracking-tighter text-blue-500 uppercase">Training Roadmap</h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Master each row before moving to word flow</p>
               </div>
               <button onClick={() => setShowLevelSelector(false)} className={`p-4 rounded-full transition-all ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>✕</button>
             </div>
             
             <div className="flex-grow overflow-y-auto pr-2 no-scrollbar space-y-8">
                {CATEGORIES.map((cat, idx) => (
                  <div key={idx} className="space-y-4">
                    <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] border-b pb-2 ${isDark ? 'text-blue-500/50 border-slate-800/50' : 'text-blue-600/50 border-slate-200'}`}>{cat.name}</h3>
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                      {Array.from({ length: cat.range[1] - cat.range[0] + 1 }, (_, i) => cat.range[0] + i).map(l => (
                        <button 
                          key={l} 
                          disabled={l > maxReachedLevel}
                          onClick={() => { setLevel(l); setShowLevelSelector(false); handleRestart(); }}
                          className={`aspect-square rounded-xl flex items-center justify-center text-[10px] font-black transition-all ${l === level ? 'bg-blue-600 text-white scale-110 shadow-lg' : l > maxReachedLevel ? (isDark ? 'bg-slate-950/50 text-slate-800' : 'bg-slate-50 text-slate-200') : (isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200')}`}
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
