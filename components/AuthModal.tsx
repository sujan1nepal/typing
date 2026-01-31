
import React, { useState } from 'react';
import { signInWithEmail, signUpWithEmail } from '../services/supabase.ts';

interface AuthModalProps {
  onClose: () => void;
  theme: 'light' | 'dark';
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose, theme }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isDark = theme === 'dark';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: authError } = isSignUp 
        ? await signUpWithEmail(email, password, firstName, lastName)
        : await signInWithEmail(email, password);
      
      if (authError) {
        setError(authError.message);
      } else {
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "An unexpected security error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-[500] flex items-center justify-center p-4 backdrop-blur-xl animate-in fade-in ${isDark ? 'bg-slate-950/95' : 'bg-slate-50/80'}`}>
      <div className={`w-full max-w-md border rounded-[2.5rem] p-10 flex flex-col shadow-2xl relative ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <button onClick={onClose} className={`absolute top-6 right-6 p-3 rounded-full transition-all ${isDark ? 'text-slate-500 hover:text-white bg-slate-800' : 'text-slate-400 hover:text-slate-900 bg-slate-100'}`}>✕</button>
        
        <h2 className="text-2xl font-black italic tracking-tighter text-blue-500 uppercase mb-2">{isSignUp ? 'Join T-PRO' : 'Access Log'}</h2>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-6">Secure encryption enabled</p>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed animate-pulse">
            Error: {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="grid grid-cols-2 gap-4">
              <input 
                type="text" required placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all ${isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-400'}`}
              />
              <input 
                type="text" required placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)}
                className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all ${isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-400'}`}
              />
            </div>
          )}
          <input 
            type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
            className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all ${isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-400'}`}
          />
          <input 
            type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
            className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all ${isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-400'}`}
          />
          <button type="submit" disabled={loading} className="w-full py-4 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all">
            {loading ? 'Validating...' : (isSignUp ? 'Initialise Account' : 'Resume Session')}
          </button>
        </form>
        <button onClick={() => { setIsSignUp(!isSignUp); setError(null); }} className="mt-6 text-[9px] font-black uppercase text-slate-500 hover:text-blue-500 tracking-widest text-center">{isSignUp ? 'Existing user? Login' : 'New subject? Create Profile'}</button>
      </div>
    </div>
  );
};

export default AuthModal;
