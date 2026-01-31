
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { NEPALI_MAP, NEPALI_SHIFT_MAP } from './constants.tsx';
import Keyboard from './components/Keyboard.tsx';
import TypingArea from './components/TypingArea.tsx';
import Hands from './components/Hands.tsx';
import AuthModal from './components/AuthModal.tsx';
import { getLessonText, getLevelCategory } from './services/levelGenerator.ts';
import { LevelCategory } from './types.ts';
import { supabase, signOut, getLeaderboard, resetUserProgress } from './services/supabase.ts';

type AppMode = 'training' | 'leaderboard';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [appMode, setAppMode] = useState<AppMode>('training');
  
  // Educational State
  const [level, setLevel] = useState(1);
  const [targetWpm, setTargetWpm] = useState(15);
  const [targetAccuracy, setTargetAccuracy] = useState(95);
  
  // Engine State
  const [language, setLanguage] = useState<'en' | 'ne'>('en');
  const [userInput, setUserInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
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
  
  const [now, setNow] = useState(Date.now());

  const syncUserData = useCallback(async (userId: string, userEmail: string) => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (data) {
        setLevel(data.current_level || 1);
        setTargetWpm(data.target_wpm || 15);
        setTargetAccuracy(data.target_accuracy || 95);
      } else {
        // Create initial profile for new registered users so they show up in leaderboard
        await supabase.from('profiles').insert({
          id: userId,
          email: userEmail,
          current_level: 1,
          max_wpm: 0,
          max_accuracy: 0,
          target_wpm: 15,
          target_accuracy: 95
        });
      }
    } catch (e) {
      console.warn("Profile sync error.");
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) syncUserData(session.user.id, session.user.email!);
      setLoading(false);
    };
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      if (newUser) syncUserData(newUser.id, newUser.email!);
    });
    return () => subscription.unsubscribe();
  }, [syncUserData]);

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
      if (appMode === 'leaderboard') fetchLeaderboardData();
    } catch (e) {
      console.error("Save error:", e);
    }
  };

  const handleRestart = useCallback(() => {
    setUserInput('');
    setStartTime(null);
    setEndTime(null);
    setCorrectKeypresses(0);
    setIncorrectKeypresses(0);
  }, []);

  const fetchLeaderboardData = useCallback(async () => {
    setIsLeaderboardLoading(true);
    try {
      const data = await getLeaderboard();
      setGlobalScores(data || []);
    } catch (err) {
      console.error("Leaderboard error:", err);
    } finally {
      setIsLeaderboardLoading(false);
    }
  }, []);

  useEffect(() => {
    if (appMode === 'leaderboard') fetchLeaderboardData();
  }, [appMode, fetchLeaderboardData]);

  const lessonContent = useMemo(() => getLessonText(level, language), [level, language]);
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

  // SEAMLESS PROGRESSION LOGIC
  useEffect(() => {
    if (userInput.length > 0 && userInput.length === lessonContent.length) {
      const finishTime = Date.now();
      setEndTime(finishTime);
      
      const sec = Math.max((finishTime - (startTime || finishTime)) / 1000, 0.001);
      const finalWpm = Math.round((userInput.length / 5) / (sec / 60));
      const total = correctKeypresses + incorrectKeypresses;
      const finalAcc = total > 0 ? Math.round((correctKeypresses / total) * 100) : 100;

      const passed = finalWpm >= targetWpm && finalAcc >= targetAccuracy;

      if (passed) {
        const next = level + 1;
        setLevel(next);
        if (user) saveProgress(next, finalWpm, finalAcc);
      } else {
        if (user) saveProgress(level, finalWpm, finalAcc);
      }
      
      setTimeout(() => {
        handleRestart();
        setIsFocused(true);
      }, 600);
    }
  }, [userInput.length, lessonContent.length, level, targetWpm, targetAccuracy, user]);

  const handleReset = async () => {
    if (!user) { setLevel(1); handleRestart(); return; }
    if (confirm("Reset everything to Level 1?")) {
      await resetUserProgress(user.id);
      setLevel(1);
      handleRestart();
      setShowSettings(false);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isFocused || showAuthModal || showLevelSelector || showSettings || appMode === 'leaderboard') return;
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
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isFocused, userInput, startTime, targetChar, language, showAuthModal, showLevelSelector, showSettings, appMode]);

  if (loading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#020617] text-blue-500">
      <div className="text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">Establishing Connection...</div>
    </div>
  );

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#020617] text-slate-200">
      <nav className="flex-none px-6 py-4 flex justify-between items-center z-[100] border-b border-slate-900 bg-[#020617]/80 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <div className="text-xl font-black italic text-blue-500 tracking-tighter cursor-pointer" onClick={() => setAppMode('training')}>T-PRO</div>
          <div className="flex bg-slate-900/40 p-1 rounded-xl border border-slate-800/50">
            <button onClick={() => { setAppMode('training'); handleRestart(); }} className={`px-4 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${appMode === 'training' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Training</button>
            <button onClick={() => setAppMode('leaderboard')} className={`px-4 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${appMode === 'leaderboard' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Masters</button>
          </div>
        </div>

        {appMode === 'training' && startTime && !endTime && (
          <div className="flex gap-8 animate-in fade-in duration-300">
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">WPM</span>
              <span className="text-sm font-black text-blue-500 tabular-nums">{stats.wpm}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">ACC</span>
              <span className="text-sm font-black text-emerald-500 tabular-nums">{stats.accuracy}%</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          {appMode === 'training' && (
            <div className="flex items-center gap-2">
              <button onClick={() => setShowLevelSelector(true)} className="px-3 py-1 rounded-lg border border-slate-800 bg-slate-900 text-[9px] font-black uppercase tracking-widest hover:border-blue-500 transition-all">Level {level}</button>
              <button onClick={() => setShowSettings(true)} className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-500 hover:text-white transition-all">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </button>
            </div>
          )}
          <div className="flex p-1 bg-slate-900/40 rounded-lg border border-slate-800/50">
            {(['en', 'ne'] as const).map(l => (
              <button key={l} onClick={() => { setLanguage(l); handleRestart(); }} className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${language === l ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500'}`}>{l}</button>
            ))}
          </div>
          {user ? (
            <div onClick={() => signOut()} title="Sign Out" className="w-7 h-7 rounded-full bg-blue-600 border border-blue-400 flex items-center justify-center font-bold text-white text-[10px] cursor-pointer hover:bg-rose-600 hover:border-rose-400 transition-all">{user.email[0].toUpperCase()}</div>
          ) : (
            <button onClick={() => setShowAuthModal(true)} className="px-3 py-1 bg-blue-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all">Sign In</button>
          )}
        </div>
      </nav>

      <main className="flex-grow relative flex items-center justify-center p-4">
        {appMode === 'leaderboard' ? (
          <div className="w-full max-w-2xl bg-slate-900/50 border border-slate-800 rounded-[2rem] p-8 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-full max-h-[70vh]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-blue-500 tracking-tighter uppercase">Global Masters</h2>
              <button onClick={fetchLeaderboardData} className="text-[8px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-all">Refresh</button>
            </div>
            <div className="flex-grow overflow-y-auto no-scrollbar space-y-2">
              <div className="grid grid-cols-4 px-4 text-[8px] font-black uppercase text-slate-600 tracking-widest mb-2 border-b border-slate-800 pb-2">
                <div className="col-span-1">User</div>
                <div className="text-center">Lv</div>
                <div className="text-center">WPM</div>
                <div className="text-center">Acc</div>
              </div>
              {isLeaderboardLoading ? (
                <div className="flex flex-col gap-2 opacity-50">
                  {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-slate-800/50 rounded-xl animate-pulse"></div>)}
                </div>
              ) : globalScores.length > 0 ? globalScores.map((s, i) => (
                <div key={i} className={`grid grid-cols-4 items-center p-4 rounded-xl border transition-all ${user?.email === s.email ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'}`}>
                   <span className="text-xs font-bold truncate pr-2">{s.email.split('@')[0]}</span>
                   <div className="text-center font-black text-blue-500">{s.current_level}</div>
                   <div className="text-center font-black text-slate-300">{s.max_wpm}</div>
                   <div className="text-center font-black text-emerald-500">{s.max_accuracy}%</div>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center py-24 opacity-40">
                  <div className="text-[10px] font-black uppercase tracking-widest">Awaiting Candidates</div>
                  <div className="text-[8px] font-bold mt-2 text-center px-12">Registered users appear here.</div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full max-w-6xl flex items-center justify-center gap-4 relative">
            <div className="hidden lg:block absolute left-[-40px] xl:left-0 transition-all duration-700 opacity-20">
               <Hands targetChar={targetChar} theme="dark" side="left" />
            </div>
            <div className="flex-grow flex flex-col items-center max-w-4xl">
               <TypingArea content={lessonContent} userInput={userInput} isFocused={isFocused} language={language} theme="dark" onFocus={() => setIsFocused(true)} />
            </div>
            <div className="hidden lg:block absolute right-[-40px] xl:right-0 transition-all duration-700 opacity-20">
               <Hands targetChar={targetChar} theme="dark" side="right" />
            </div>
          </div>
        )}
      </main>

      <footer className="flex-none w-full pb-8">
        <div className="flex justify-center mb-6 lg:hidden">
           <Hands targetChar={targetChar} theme="dark" side="both" />
        </div>
        <Keyboard targetChar={targetChar} activeCode={activeKeyCode} language={language} />
      </footer>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      
      {showLevelSelector && (
        <div className="fixed inset-0 bg-[#020617]/98 z-[200] flex items-center justify-center p-4 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-6xl h-[85vh] bg-slate-900/50 border border-slate-800 rounded-[3rem] p-12 flex flex-col shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-transparent to-blue-500"></div>
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-4xl font-black italic tracking-tighter text-blue-500 uppercase">Training Roadmap</h2>
              <button onClick={() => setShowLevelSelector(false)} className="p-4 bg-slate-800 hover:bg-slate-700 rounded-full transition-all text-slate-400 hover:text-white shadow-lg">✕</button>
            </div>
            <div className="flex-grow overflow-y-auto no-scrollbar grid grid-cols-1 md:grid-cols-4 gap-10">
              {(['Home Row', 'Top Row', 'Bottom Row', 'Mastery Mix', 'Word Mastery', 'Sentence Flow', 'Paragraph Stamina', 'Extreme Mastery'] as LevelCategory[]).map(cat => (
                <div key={cat} className="flex flex-col">
                  <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mb-6 border-l-4 border-blue-600 pl-4">{cat}</h3>
                  <div className="grid grid-cols-5 gap-2">
                    {Array.from({length:350},(_,i)=>i+1).filter(l=>getLevelCategory(l)===cat).map(l => (
                      <button 
                        key={l} 
                        onClick={()=>{setLevel(l); setShowLevelSelector(false); handleRestart(); if(user) saveProgress(l);}} 
                        className={`aspect-square rounded-xl flex items-center justify-center text-[10px] font-black transition-all ${l===level ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.6)] scale-110 z-10' : 'bg-slate-800/60 text-slate-500 hover:text-white hover:bg-slate-700 border border-slate-700/50'}`}
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

      {showSettings && (
        <div className="fixed inset-0 bg-slate-950/95 z-[200] flex items-center justify-center backdrop-blur-xl">
          <div className="w-full max-sm:w-[90%] max-w-sm bg-slate-900 border border-slate-800 rounded-[2rem] p-8 flex flex-col shadow-2xl">
            <h2 className="text-lg font-black mb-8 uppercase tracking-widest text-blue-500 text-center">Practice Targets</h2>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-[8px] font-black uppercase mb-3"><label>Minimum WPM</label><span className="text-blue-500">{targetWpm}</span></div>
                <input type="range" min="5" max="100" step="5" value={targetWpm} onChange={e=>setTargetWpm(Number(e.target.value))} className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none" />
              </div>
              <div>
                <div className="flex justify-between text-[8px] font-black uppercase mb-3"><label>Required Accuracy</label><span className="text-emerald-500">{targetAccuracy}%</span></div>
                <input type="range" min="70" max="100" step="1" value={targetAccuracy} onChange={e=>setTargetAccuracy(Number(e.target.value))} className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none" />
              </div>
              <button onClick={handleReset} className="w-full py-4 bg-rose-600/10 border border-rose-500/20 text-rose-500 text-[8px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-600 hover:text-white transition-all">Clear Progress</button>
            </div>
            <button onClick={()=>{setShowSettings(false);}} className="w-full mt-8 py-3 bg-blue-600 text-white font-black rounded-xl text-[9px] uppercase tracking-widest hover:bg-blue-500 transition-all">Save Changes</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
