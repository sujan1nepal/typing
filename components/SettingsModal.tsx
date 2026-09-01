
import React from 'react';

interface SettingsModalProps {
  isDark: boolean;
  targetWpm: number;
  targetAccuracy: number;
  setTargetWpm: (v: number) => void;
  setTargetAccuracy: (v: number) => void;
  onClose: () => void;
  onSave: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isDark, targetWpm, targetAccuracy, setTargetWpm, setTargetAccuracy, onClose, onSave }) => {
  return (
    <div className="fixed inset-0 bg-slate-950/95 flex items-center justify-center z-[300] backdrop-blur-md p-4">
      <div className={`w-full max-w-sm border rounded-2xl p-6 shadow-2xl ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
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
        <button onClick={() => { onSave(); onClose(); }} className="w-full mt-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-500 transition-colors">Apply & Exit</button>
      </div>
    </div>
  );
};

export default SettingsModal;
