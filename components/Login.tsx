
import React, { useState } from 'react';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
  users: User[];
}

const Login: React.FC<LoginProps> = ({ onLogin, users }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      onLogin(user);
    } else {
      setError('Ungültiger Benutzername oder Passwort.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#010409] p-4 transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-[#0d1117] rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-slate-200 dark:border-blue-900/20 relative overflow-hidden group">
        {/* Animated Glow Effect */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl group-hover:bg-blue-600/20 transition-all duration-700"></div>
        
        <div className="flex flex-col items-center mb-10 relative z-10">
          <div className="w-20 h-20 bg-[#000510] rounded-3xl flex flex-col items-center justify-center shadow-[0_0_30px_rgba(0,145,255,0.25)] border border-blue-500/10 mb-6 scale-110">
             <span className="font-black text-3xl italic tracking-tighter leading-none text-[#0091FF]">FLX</span>
             <span className="text-[7px] font-bold text-[#0091FF] tracking-[0.2em] mt-1 uppercase">Software</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-none">
            FLX-<span className="text-blue-600">ASSETS</span>
          </h1>
          <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-3">Inventory OS</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          {error && (
            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 p-4 rounded-2xl animate-in shake duration-300">
              <p className="text-rose-600 dark:text-rose-400 text-xs font-bold text-center italic">{error}</p>
            </div>
          )}
          
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Benutzername</label>
            <input 
              type="text" 
              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-bold dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700"
              placeholder="Z.B. admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Passwort</label>
            <input 
              type="password" 
              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-bold dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-600/20 transition-all active:scale-95 uppercase italic tracking-tighter text-lg border-2 border-white/10"
          >
            Anmelden
          </button>
        </form>

        <div className="mt-12 text-center relative z-10">
          <p className="text-slate-400 dark:text-slate-600 text-[9px] font-bold uppercase tracking-[0.2em]">
            &copy; {new Date().getFullYear()} FLX Software Enterprise
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
