
import React, { useState, useEffect } from 'react';
import { supabase, signOut, resetUserProgress } from '../services/supabase.ts';

interface ProfileModalProps {
  user: any;
  theme: 'light' | 'dark';
  onClose: () => void;
  onUpdate: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ user, theme, onClose, onUpdate }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [stats, setStats] = useState<any>({
    max_wpm: 0,
    max_accuracy: 0,
    avg_wpm: 0,
    avg_accuracy: 0,
    levels_completed: 0,
    total_mistakes: 0
  });
  const [levelHistory, setLevelHistory] = useState<any[]>([]);
  const [resetLoading, setResetLoading] = useState(false);
  const isDark = theme === 'dark';

  useEffect(() => {
    const fetchAllData = async () => {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (profile) {
        setFirstName(profile.first_name || '');
        setLastName(profile.last_name || '');
        setStats(profile);
      }

      const { data: history } = await supabase
        .from('level_progress')
        .select('*')
        .eq('profile_id', user.id)
        .order('level_number', { ascending: false });
      
      if (history) setLevelHistory(history);
    };
    fetchAllData();
  }, [user.id]);

  const handleNuclearReset = async () => {
    const confirmed = window.confirm("☢️ NUCLEAR RESET: Clear all performance logs and return to Level 1? This cannot be undone.");
    if (!confirmed) return;

    setResetLoading(true);
    try {
      await resetUserProgress(user.id);
      onUpdate(); // Triggers handleResetUI in App
      onClose();
    } catch (err: any) {
      alert(`Reset Protocol Failed: ${err.message}`);
    } finally {
      setResetLoading(false);
    }
  };

  const formatErrors = (mistakeMap: any) => {
    if (!mistakeMap || Object.keys(mistakeMap).length === 0) return "Clean Run";
    const parts: string[] = [];
    Object.entries(mistakeMap).forEach(([expected, typedMap]: [string, any]) => {
      Object.entries(typedMap).forEach(([typed, count]) => {
        const expLabel = expected === ' ' ? 'Space' : expected;
        const typedLabel = typed === ' ' ? 'Space' : typed;
        parts.push(`'${typedLabel}' vs '${expLabel}' (${count}x)`);
      });
    });
    return parts.slice(0, 3).join(', ') + (parts.length > 3 ? '...' : '');
  };

  return (
    <div className={`fixed inset-0 z-[500] flex items-center justify-center p-4 backdrop-blur-xl overflow-hidden animate-in fade-in ${isDark ? 'bg-slate-950/95' : 'bg-slate-50/90'}`}>
      <div className={`w-full max-w-6xl border rounded-[2.5rem] p-10 flex flex-col shadow-2xl h-[90vh] relative ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <button onClick={onClose} className={`absolute top-8 right-8 p-3 rounded-full transition-all ${isDark ? 'text-slate-500 hover:text-white bg-slate-800' : 'text-slate-400 hover:text-slate-900 bg-slate-100'}`}>✕</button>
        
        <div className="flex flex-col h-full overflow-hidden">
          <div className={`flex-none flex items-end justify-between mb-8 border-b pb-8 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <div>
              <h2 className="text-4xl font-black italic tracking-tighter text-blue-500 uppercase leading-none mb-2">Performance Log</h2>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest truncate">Subject: {firstName} {lastName} ({user.email})</p>
            </div>
            
            <div className="flex gap-6">
              <div className="text-right">
                <div className="text-[8px] font-black text-slate-500 uppercase mb-1">Mean Speed</div>
                <div className="text-2xl font-black text-blue-500 tabular-nums">{stats.avg_wpm} <span className="text-[10px] text-slate-500">WPM</span></div>
              </div>
              <div className={`text-right border-l pl-6 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <div className="text-[8px] font-black text-slate-500 uppercase mb-1">Mistake Debt</div>
                <div className="text-2xl font-black text-rose-500 tabular-nums">{stats.total_mistakes} <span className="text-[10px] text-slate-500">ERR</span></div>
              </div>
            </div>
          </div>

          <div className="flex-grow flex flex-col overflow-hidden">
            <h3 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-[0.3em]">Historical Analysis</h3>
            
            <div className={`flex-grow overflow-y-auto no-scrollbar border rounded-3xl ${isDark ? 'bg-slate-950/20 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
              <table className="w-full text-left border-collapse">
                <thead className={`sticky top-0 z-10 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
                  <tr className="text-[7px] font-black uppercase text-slate-500 border-b border-slate-800/20">
                    <th className="px-6 py-4">Session</th>
                    <th className="px-4 py-4 text-center">Lvl</th>
                    <th className="px-4 py-4 text-center">WPM</th>
                    <th className="px-4 py-4 text-center">Acc</th>
                    <th className="px-6 py-4">Pattern Errors</th>
                    <th className="px-6 py-4">Weakness</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-800/50' : 'divide-slate-200'}`}>
                  {levelHistory.map((row) => (
                    <tr key={row.id} className={`${isDark ? 'hover:bg-blue-500/5' : 'hover:bg-blue-50'}`}>
                      <td className="px-6 py-4">
                        <div className={`text-[10px] font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{firstName} {lastName}</div>
                      </td>
                      <td className="px-4 py-4 text-center font-black text-blue-500">#{row.level_number}</td>
                      <td className={`px-4 py-4 text-center font-black tabular-nums ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{row.wpm}</td>
                      <td className="px-4 py-4 text-center font-black text-emerald-500">{row.accuracy}%</td>
                      <td className="px-6 py-4 text-[9px] font-medium text-rose-500 italic">{formatErrors(row.mistake_map)}</td>
                      <td className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase">{row.finger_weakness || "None"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex-none mt-8 flex justify-between items-center">
            <button 
              onClick={handleNuclearReset}
              disabled={resetLoading}
              className={`px-6 py-3 border border-rose-500/20 text-rose-500 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-500 hover:text-white transition-all ${resetLoading ? 'opacity-50' : ''}`}
            >
              {resetLoading ? 'Purging...' : 'Flush All Progress Data'}
            </button>
            <button 
              onClick={async () => { await signOut(); onClose(); }}
              className={`px-6 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
