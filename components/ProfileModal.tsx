
import React, { useState, useEffect } from 'react';
import { supabase, signOut, updateUserProfile } from '../services/supabase.ts';

interface ProfileModalProps {
  user: any;
  onClose: () => void;
  onUpdate: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onUpdate }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (data) {
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
      }
    };
    fetchProfile();
  }, [user.id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await updateUserProfile(user.id, { first_name: firstName, last_name: lastName });
      setMessage({ type: 'success', text: 'Profile updated successfully' });
      onUpdate();
      setTimeout(onClose, 1500);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/95 z-[500] flex items-center justify-center p-4 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 flex flex-col shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 right-6 p-3 text-slate-500 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-all">✕</button>
        
        <h2 className="text-2xl font-black italic tracking-tighter text-blue-500 uppercase mb-2">My Profile</h2>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-8">{user.email}</p>

        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[8px] font-black uppercase text-slate-500 mb-1 tracking-widest ml-1">First Name</label>
              <input 
                type="text" 
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                placeholder="First Name"
              />
            </div>
            <div>
              <label className="block text-[8px] font-black uppercase text-slate-500 mb-1 tracking-widest ml-1">Last Name</label>
              <input 
                type="text" 
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                placeholder="Last Name"
              />
            </div>
          </div>

          {message && (
            <div className={`p-3 border rounded-lg text-[9px] font-bold uppercase text-center ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
              {message.text}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button 
              type="button"
              onClick={async () => { await signOut(); onClose(); }}
              className="w-full py-4 bg-rose-600/10 border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-600 hover:text-white transition-all"
            >
              Sign Out
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;
