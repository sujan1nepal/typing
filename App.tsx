
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { NEPALI_MAP, NEPALI_SHIFT_MAP } from './constants.tsx';
import Keyboard from './components/Keyboard.tsx';
import TypingArea from './components/TypingArea.tsx';
import Hands from './components/Hands.tsx';
import AuthModal from './components/AuthModal.tsx';
import ProfileModal from './components/ProfileModal.tsx';
import { getLessonText, getLevelCategory } from './services/levelGenerator.ts';
import { LevelCategory } from './types.ts';
import { supabase, signOut, getLeaderboard, resetUserProgress } from './services/supabase.ts';

type AppMode = 'training' | 'leaderboard';
type Theme = 'light' | 'dark';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [appMode, setAppMode] = useState<AppMode>('training');
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'dark');
  
  // Educational State
  const [level, setLevel] = useState(1);
  const [maxReachedLevel, setMaxReachedLevel] = useState(1);
  const [targetWpm, setTargetWpm] = useState(15);
  const [targetAccuracy, setTargetAccuracy] = useState(95);
  
  // Engine State
  const [userInput, setUserInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false); // Guard for level jumping
  const [correctKeypresses, setCorrectKeypresses] = useState(0);
  const [incorrectKeypresses, setIncorrectKeypresses] = useState(0);
  const [activeKeyCode, setActiveKeyCode] = useState<string | null>(null);
  
  // Leaderboard State
  const [globalScores, setGlobalScores] = useState<any[]>([]);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);
  
  // Modals
  const [showLevelSelector, setShowLevelSelector] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  const [now, setNow] = useState(Date.now());

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
  };

  const fetchLeaderboardData = useCallback(async () => {
    setIsLeaderboardLoading(true);
    const data = await getLeaderboard();
    setGlobalScores(data || []);
    setIsLeaderboardLoading(false);
  }, []);

  const syncUserData = useCallback(async (userId: string, userEmail: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setLevel(data.current_level || 1);
        setMaxReachedLevel(data.current_level || 1);
        setTargetWpm(data.target_wpm || 15);
        setTargetAccuracy(data.target_accuracy || 95);
      } else {
        await supabase.from('profiles').upsert({
          id: userId,
          email: userEmail,
          current_level: 1, 
          max_wpm: 0,
          max_accuracy: 0,
          target_wpm: 15,
          target_accuracy: 95
        });
      }
      fetchLeaderboardData();
    } catch (e) {
      console.warn("User sync warning:", e);
    }
  }, [fetchLeaderboardData]);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) await syncUserData(currentUser.id, currentUser.email!);
      setLoading(false);
      fetchLeaderboardData();
    };
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      if (newUser) await syncUserData(newUser.id, newUser.email!);
      else {
        // Handle logout cleanup locally
        setLevel(1);
        setMaxReachedLevel(1);
        handleRestart();
      }
      fetchLeaderboardData();
    });
    return () => subscription.unsubscribe();
  }, [syncUserData, fetchLeaderboardData]);

  useEffect(() => {
    if (appMode === 'leaderboard') fetchLeaderboardData();
  }, [appMode, fetchLeaderboardData]);

  const saveProgress = async (newLvl: number, wpm: number = 0, acc: number = 0) => {
    if (!user) return;
    try {
      const { data: profile } = await supabase.from('profiles').select('max_wpm, max_accuracy').eq('id', user.id).maybeSingle();
      await supabase.from('profiles').upsert({ 
        id: user.id,
        email: user.email,
        current_level: newLvl, 
        max_wpm: Math.max(profile?.max_wpm || 0, wpm),
        max_accuracy: Math.max(profile?.max_accuracy || 0, acc),
        target_wpm: targetWpm,
        target_accuracy: targetAccuracy,
        updated_at: new Date() 
      });
      fetchLeaderboardData();
    } catch (e) {
      console.error("Save progress error:", e);
    }
  };

  const handleRestart = useCallback(() => {
    setUserInput('');
    setStartTime(null);
    setEndTime(null);
    setIsTransitioning(false);
    setCorrectKeypresses(0);
    setIncorrectKeypresses(0);
  }, []);

  const language = useMemo(() => (level > 400 ? 'ne' : 'en'), [level]);
  const lessonContent = useMemo(() => getLessonText(level, 'en'), [level]);
  const targetChar = lessonContent[userInput.length] || '';

  useEffect(() => {
    let interval: number;
    if (startTime && !endTime) {
      interval = window.setInterval(() => setNow(Date.now()), 1000);
    }
    return () => clearInterval(interval);
  }, [startTime, endTime]);

  const stats = useMemo(() => {
    if (!startTime) return { wpm: 0, accuracy: 100 };
    const end = endTime || now;
    const sec = Math.max((end - startTime) / 1000, 0.001);
    const wpm = Math.round((userInput.length / 5) / (sec / 60));
    const total = correctKeypresses + incorrectKeypresses;
    const acc = total > 0 ? Math.round((correctKeypresses / total) * 100) : 100;
    return { wpm, accuracy: acc };
  }, [startTime, endTime, now, userInput.length, correctKeypresses, incorrectKeypresses]);

  useEffect(() => {
    if (userInput.length > 0 && userInput.length === lessonContent.length && !endTime && !isTransitioning) {
      const finishTime = Date.now();
      setEndTime(finishTime);
      setIsTransitioning(true);
      
      const passed = stats.wpm >= targetWpm && stats.accuracy >= targetAccuracy;
      if (passed) {
        const next = level + 1;
        setLevel(next);
        setMaxReachedLevel(prev => Math.max(prev, next));
        if (user) saveProgress(next, stats.wpm, stats.accuracy);
      } else if (user) {
        saveProgress(level, stats.wpm, stats.accuracy);
      }
      
      setTimeout(() => {
        handleRestart();
        setIsFocused(true);
      }, 800);
    }
  }, [userInput.length, lessonContent.length, level, targetWpm, targetAccuracy, user, stats.wpm, stats.accuracy, endTime, isTransitioning]);

  const handleReset = async () => {
    if (!user) { setLevel(1); setMaxReachedLevel(1); handleRestart(); return; }
    if (confirm("Reset progress to Level 1?")) {
      await resetUserProgress(user.id);
      setLevel(1);
      setMaxReachedLevel(1);
      handleRestart();
      setShowSettings(false);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isFocused || showAuthModal || showLevelSelector || showSettings || showProfileModal || appMode === 'leaderboard' || endTime || isTransitioning) return;
      if (e.ctrlKey || e.altKey || e.metaKey || e.repeat) return;
      const ignore = ['Shift', 'CapsLock', 'Tab', 'Control', 'Alt', 'Meta', 'Escape', 'Backspace', 'Enter'];
      if (ignore.includes(e.key)) return;
      
      setActiveKeyCode(e.code);
      setTimeout(() => setActiveKeyCode(null), 100);
      
      if (!startTime) setStartTime(Date.now());
      
      if (e.key === targetChar) {
        setCorrectKeypresses(p => p + 1);
        setUserInput(p => p + e.key);
      } else if (e.key.length === 1) {
        setIncorrectKeypresses(p => p + 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isFocused, userInput, startTime, targetChar, showAuthModal, showLevelSelector, showSettings, showProfileModal, appMode, endTime, isTransitioning]);

  const colors = theme === 'dark' ? {
    bg: 'bg-[#020617]',
    nav: 'bg-[#020617]/80 border-slate-900',
    text: 'text-slate-200',
    card: 'bg-slate-900/50 border-slate-800',
    sub: 'text-slate-500'
  } : {
    bg: 'bg-slate-50',
    nav: 'bg-white/80 border-slate-200',
    text: 'text-slate-900',
    card: 'bg-white border-slate-200 shadow-sm',
    sub: 'text-slate-400'
  };

  if (loading) return (
    <div className={`h-screen w-screen flex items-center justify-center ${colors.bg} text-blue-500`}>
      <div className="text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">Initializing...</div>
    </div>
  );

  return (
    <div className={`h-screen w-screen overflow-hidden flex flex-col ${colors.bg} ${colors.text} transition-colors duration-300`}>
      <nav className={`flex-none px-6 py-4 flex justify-between items-center z-[100] border-b ${colors.nav} backdrop-blur-md`}>
        <div className="flex items-center gap-6">
          <div className="text-xl font-black italic text-blue-500 tracking-tighter cursor-pointer" onClick={() => setAppMode('training')}>T-PRO</div>
          <div className={`flex ${theme === 'dark' ? 'bg-slate-900/40 border-slate-800/50' : 'bg-slate-200/50 border-slate-300/50'} p-1 rounded-xl border`}>
            <button onClick={() => { setAppMode('training'); handleRestart(); }} className={`px-4 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${appMode === 'training' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>Training</button>
            <button onClick={() => setAppMode('leaderboard')} className={`px-4 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${appMode === 'leaderboard' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>Masters</button>
          </div>
        </div>

        {appMode === 'training' && startTime && !endTime && (
          <div className="flex gap-8 animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className={`text-[8px] font-black uppercase tracking-widest ${colors.sub}`}>WPM</span>
              <span className="text-sm font-black text-blue-500 tabular-nums">{stats.wpm}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[8px] font-black uppercase tracking-widest ${colors.sub}`}>ACC</span>
              <span className="text-sm font-black text-emerald-500 tabular-nums">{stats.accuracy}%</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className={`p-1.5 rounded-lg border ${theme === 'dark' ? 'border-slate-800 bg-slate-900 text-amber-400' : 'border-slate-200 bg-white text-indigo-600'} transition-all`}>
            {theme === 'dark' ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"/></svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg>
            )}
          </button>
          {appMode === 'training' && (
            <>
              <button onClick={() => setShowLevelSelector(true)} className={`px-3 py-1 rounded-lg border ${theme === 'dark' ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white shadow-sm'} text-[9px] font-black uppercase tracking-widest hover:border-blue-500 transition-all`}>Level {level}</button>
              <button onClick={() => setShowSettings(true)} className={`p-1.5 rounded-lg border ${theme === 'dark' ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white shadow-sm'} ${colors.sub} hover:text-blue-500 transition-all`}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              </button>
            </>
          )}
          {user ? (
            <div onClick={() => setShowProfileModal(true)} title="My Profile" className="w-7 h-7 rounded-full bg-blue-600 border border-blue-400 flex items-center justify-center font-bold text-white text-[10px] cursor-pointer hover:bg-blue-500 hover:scale-110 transition-all">
              {user.email ? user.email[0].toUpperCase() : '?'}
            </div>
          ) : (
            <button onClick={() => setShowAuthModal(true)} className="px-3 py-1 bg-blue-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all">Sign In</button>
          )}
        </div>
      </nav>

      <main className="flex-grow relative flex items-center justify-center p-4">
        {appMode === 'leaderboard' ? (
          <div className={`w-full max-w-2xl ${colors.card} rounded-[2rem] p-8 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 flex flex-col h-full max-h-[70vh]`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-blue-500 tracking-tighter uppercase">Global Masters</h2>
              <button onClick={fetchLeaderboardData} className={`text-[8px] font-black uppercase tracking-widest ${colors.sub} hover:text-blue-500 transition-all`}>Refresh</button>
            </div>
            <div className="flex-grow overflow-y-auto no-scrollbar space-y-2 pr-2">
              <div className={`grid grid-cols-4 px-4 text-[8px] font-black uppercase ${colors.sub} tracking-widest mb-2 border-b ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'} pb-2`}>
                <div className="col-span-1">Name</div>
                <div className="text-center">Level</div>
                <div className="text-center">WPM</div>
                <div className="text-center">Accuracy</div>
              </div>
              {isLeaderboardLoading ? (
                <div className="flex flex-col gap-2 opacity-50">
                  {[1,2,3,4,5].map(i => <div key={i} className={`h-12 ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-200/50'} rounded-xl animate-pulse`}></div>)}
                </div>
              ) : globalScores.length > 0 ? globalScores.map((s, i) => (
                <div key={i} className={`grid grid-cols-4 items-center p-4 rounded-xl border transition-all ${user?.id === s.id ? 'bg-blue-600/10 border-blue-500 shadow-sm' : theme === 'dark' ? 'bg-slate-950/50 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                   <span className="text-xs font-bold truncate pr-2">
                     {s.first_name ? `${s.first_name} ${s.last_name}` : (s.email ? s.email.split('@')[0] : 'Anonymous')}
                   </span>
                   <div className="text-center font-black text-blue-500">{s.current_level}</div>
                   <div className={`text-center font-black ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{s.max_wpm}</div>
                   <div className="text-center font-black text-emerald-500">{s.max_accuracy}%</div>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center py-24 opacity-40">
                  <div className={`text-[10px] font-black uppercase tracking-widest ${colors.sub}`}>Awaiting Masters</div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full max-w-6xl flex items-center justify-center gap-4 relative">
            <div className="hidden lg:block absolute left-[-40px] xl:left-0 opacity-100 transition-opacity duration-500">
               <Hands targetChar={targetChar} theme={theme} side="left" />
            </div>
            <div className="flex-grow flex flex-col items-center max-w-4xl">
               <TypingArea content={lessonContent} userInput={userInput} isFocused={isFocused} language={'en'} theme={theme} onFocus={() => setIsFocused(true)} />
            </div>
            <div className="hidden lg:block absolute right-[-40px] xl:right-0 opacity-100 transition-opacity duration-500">
               <Hands targetChar={targetChar} theme={theme} side="right" />
            </div>
          </div>
        )}
      </main>

      <footer className="flex-none w-full pb-8">
        <div className="flex justify-center mb-6 lg:hidden">
           <Hands targetChar={targetChar} theme={theme} side="both" />
        </div>
        <Keyboard targetChar={targetChar} activeCode={activeKeyCode} language={'en'} />
      </footer>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      {showProfileModal && user && <ProfileModal user={user} onClose={() => setShowProfileModal(false)} onUpdate={fetchLeaderboardData} />}
      
      {showLevelSelector && (
        <div className={`fixed inset-0 ${theme === 'dark' ? 'bg-[#020617]/98' : 'bg-white/98'} z-[200] flex items-center justify-center p-4 backdrop-blur-xl animate-in fade-in`}>
          <div className={`w-full max-w-[98vw] h-[92vh] ${theme === 'dark' ? 'bg-slate-900/50 border-slate-800 shadow-2xl' : 'bg-white border-slate-200 shadow-xl'} border rounded-[3rem] p-8 flex flex-col relative overflow-hidden`}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-transparent to-blue-500"></div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-4xl font-black italic tracking-tighter text-blue-500 uppercase">Training Roadmap</h2>
              <button onClick={() => setShowLevelSelector(false)} className={`p-4 ${theme === 'dark' ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-900'} rounded-full transition-all`}>✕</button>
            </div>
            <div className="flex-grow overflow-y-auto no-scrollbar grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-8">
              {(['Home Row', 'Top Row', 'Bottom Row', 'Mastery Mix', 'Word Mastery', 'Sentence Flow', 'Paragraph Stamina', 'Extreme Mastery'] as LevelCategory[]).map(cat => (
                <div key={cat} className="flex flex-col">
                  <h3 className={`${colors.sub} text-[10px] font-black uppercase tracking-[0.4em] mb-4 border-l-4 border-blue-600 pl-4`}>{cat}</h3>
                  <div className="grid grid-cols-5 gap-2">
                    {Array.from({length:400},(_,i)=>i+1).filter(l=>getLevelCategory(l)===cat).map(l => {
                      const isLocked = l > maxReachedLevel;
                      return (
                        <button 
                          key={l} 
                          disabled={isLocked}
                          onClick={()=>{setLevel(l); setShowLevelSelector(false); handleRestart();}} 
                          className={`aspect-square rounded-xl flex flex-col items-center justify-center text-[10px] font-black transition-all 
                            ${l===level ? 'bg-blue-600 text-white shadow-lg scale-110 z-10' : 
                              isLocked ? 'bg-slate-900/20 text-slate-700 cursor-not-allowed opacity-50' : 
                              theme === 'dark' ? 'bg-slate-800/60 text-slate-500 hover:text-white hover:bg-slate-700' : 'bg-slate-100 text-slate-400 hover:text-slate-900 hover:bg-slate-200'}`}
                        >
                          {isLocked ? (
                            <svg className="w-3 h-3 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                          ) : l}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className={`fixed inset-0 ${theme === 'dark' ? 'bg-slate-950/95' : 'bg-white/95'} z-[200] flex items-center justify-center backdrop-blur-xl`}>
          <div className={`w-full max-sm:w-[90%] max-w-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-800 shadow-2xl' : 'bg-white border-slate-200 shadow-lg'} border rounded-[2rem] p-8 flex flex-col`}>
            <h2 className="text-lg font-black mb-8 uppercase tracking-widest text-blue-500 text-center">Practice Targets</h2>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-[8px] font-black uppercase mb-3"><label>Minimum WPM</label><span className="text-blue-500">{targetWpm}</span></div>
                <input type="range" min="5" max="100" step="5" value={targetWpm} onChange={e=>setTargetWpm(Number(e.target.value))} className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-300 rounded-lg appearance-none" />
              </div>
              <div>
                <div className="flex justify-between text-[8px] font-black uppercase mb-3"><label>Accuracy</label><span className="text-emerald-500">{targetAccuracy}%</span></div>
                <input type="range" min="70" max="100" step="1" value={targetAccuracy} onChange={e=>setTargetAccuracy(Number(e.target.value))} className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-300 rounded-lg appearance-none" />
              </div>
              <button onClick={handleReset} className="w-full py-4 bg-rose-600/10 border border-rose-500/20 text-rose-500 text-[8px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-600 hover:text-white transition-all">Clear Progress</button>
            </div>
            <button onClick={()=>{setShowSettings(false);}} className="w-full mt-8 py-3 bg-blue-600 text-white font-black rounded-xl text-[9px] uppercase tracking-widest hover:bg-blue-500 transition-all">Done</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
