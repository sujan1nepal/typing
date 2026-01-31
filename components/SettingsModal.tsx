
import React, { useState } from 'react';
import { supabase } from '../services/supabase.ts';

interface SettingsModalProps {
  user: any;
  currentWpm: number;
  currentAcc: number;
  theme: 'light' | 'dark';
  onClose: () => void;
  onUpdate: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ user, currentWpm, currentAcc, theme, onClose, onUpdate }) => {
  const [wpm, setWpm] = useState(currentWpm);
  const [acc, setAcc] = useState(currentAcc);
  const [loading, setLoading] = useState(false);
  const isDark = theme === 'dark';

  const handleSave = async () => {
    if (!user) {
      alert("Please sign in to save your personal goals.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          target_wpm: wpm, 
          target_accuracy: acc,
          updated_at: new Date()
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Notify parent to sync
      onUpdate();
      onClose();
    } catch (err: any) {
      console.error("Settings Update Failed:", err);
      alert(`Save Protocol Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-[500] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in ${isDark ? 'bg-slate-950/90' : 'bg-slate-50/80'}`}>
      <div className={`w-full max-w-sm border rounded-[2.5rem] p-10 flex flex-col shadow-2xl relative ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <button onClick={onClose} className={`absolute top-6 right-6 p-3 rounded-full transition-all ${isDark ? 'text-slate-500 hover:text-white bg-slate-800' : 'text-slate-400 hover:text-slate-900 bg-slate-100'}`}>✕</button>
        
        <h2 className="text-2xl font-black italic tracking-tighter text-blue-500 uppercase mb-2">Training Goals</h2>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-8">Define your passing thresholds</p>

        <div className="space-y-6">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Target Speed</label>
              <span className="text-blue-500 font-black text-xs">{wpm} WPM</span>
            </div>
            <input 
              type="range" min="10" max="120" step="5" value={wpm} 
              onChange={(e) => setWpm(parseInt(e.target.value))}
              className={`w-full h-1 rounded-lg appearance-none cursor-pointer accent-blue-600 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Target Accuracy</label>
              <span className="text-emerald-500 font-black text-xs">{acc}%</span>
            </div>
            <input 
              type="range" min="80" max="100" step="1" value={acc} 
              onChange={(e) => setAcc(parseInt(e.target.value))}
              className={`w-full h-1 rounded-lg appearance-none cursor-pointer accent-emerald-500 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}
            />
          </div>

          <button 
            onClick={handleSave}
            disabled={loading}
            className="w-full py-4 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'Saving Protocols...' : 'Commit Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
