import React, { useEffect, useState } from 'react';
import { useAuth } from '../components/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { Cpu, Terminal, Key, ShieldAlert, Sparkles, ShoppingBag, Radio, User, Lock, ArrowRight, Shield } from 'lucide-react';
import Logo from '../components/Logo';

export default function Gateway() {
  const { user, loginWithEmail, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // If already logged in, redirect to home dashboard immediately
  useEffect(() => {
    if (user) {
      navigate('/home', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please fill in your username/email and password.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await loginWithEmail(email, password);
      const roles = res?.user?.roles || [];
      if (roles.includes('creator')) {
        navigate(`/home/portfolio/${res.user.uid}/analytics`, { replace: true });
      } else if (roles.includes('admin')) {
        navigate('/developer/admin', { replace: true });
      } else {
        navigate('/home/client', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || "Authorization failed. Please verify your credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col justify-center items-center relative overflow-hidden font-sans selection:bg-[#ef3836] selection:text-white">
      {/* Cyber Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0" />
      
      {/* Active Grid Scanning Line */}
      <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-red-500/30 to-transparent animate-[scan_6s_linear_infinite] pointer-events-none z-10" />

      {/* Background Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[radial-gradient(circle_at_center,rgba(239,56,54,0.05)_0%,transparent_75%)] pointer-events-none z-0" />
      <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle_at_center,rgba(252,175,62,0.03)_0%,transparent_75%)] pointer-events-none z-0" />

      {/* Scanline CRT simulation */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[size:100%_4px] pointer-events-none z-10 opacity-40" />

      <style>{`
        @keyframes scan {
          0% { top: -10%; }
          100% { top: 110%; }
        }
      `}</style>

      {/* Central Login Container */}
      <div className="w-[90%] max-w-[460px] border border-white/10 bg-zinc-950/60 backdrop-blur-xl rounded-2xl p-8 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-20 flex flex-col relative group overflow-hidden">
        {/* Top Highlight line */}
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#ef3836]/60 to-transparent" />

        {/* Logo Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-20 w-full flex items-center justify-center mb-2">
            <Logo className="text-[20px]" />
          </div>
          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.35em] border-t border-white/10 pt-4 w-full text-center">
            CREATIVE SYNDICATE
          </span>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="border border-red-500/50 bg-red-500/10 p-3.5 text-xs text-red-400 flex items-start gap-2.5 rounded-lg">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono font-medium tracking-wider text-zinc-500 uppercase block">Mail ID or Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input 
                type="text"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder="e.g. aryan or derick@network.com"
                className="w-full pl-10 pr-4 h-12 bg-white/5 border border-white/10 focus:border-red-500/50 focus:bg-white/10 text-white rounded-xl text-sm tracking-wide focus:outline-none transition-all duration-300 font-mono animate-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono font-medium tracking-wider text-zinc-500 uppercase block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input 
                id="operator-password"
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 h-12 bg-white/5 border border-white/10 focus:border-red-500/50 focus:bg-white/10 text-white rounded-xl text-sm tracking-wide focus:outline-none transition-all duration-300 font-mono"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={submitting}
            className="w-full h-12 mt-6 bg-red-500 text-white font-mono uppercase tracking-widest text-xs rounded-xl shadow-[0_4px_20px_rgba(239,56,54,0.3)] hover:bg-red-600 hover:shadow-[0_0_25px_rgba(239,56,54,0.5)] transition-all active:scale-[0.98] duration-300 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer z-30"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                AUTHENTICATING...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                SIGN IN
              </>
            )}
          </button>

          <div className="relative my-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
            <span className="relative px-3 bg-[#0a0a0a] text-[8px] font-mono text-zinc-500 uppercase tracking-widest">OR SECURE ROUTE</span>
          </div>

          <button 
            type="button"
            onClick={async () => {
              setError(null);
              try {
                await loginWithGoogle({});
              } catch (err: any) {
                setError(err.message || "Google authentication failed.");
              }
            }}
            className="w-full h-12 bg-white/5 hover:bg-white/10 text-white font-mono uppercase tracking-widest text-[10px] rounded-xl border border-white/10 hover:border-white/20 transition-all active:scale-[0.98] duration-300 flex items-center justify-center gap-2.5 cursor-pointer z-30"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.13-5.136 4.13A5.57 5.57 0 0 1 8.4 12.965a5.57 5.57 0 0 1 5.59-5.57c1.47 0 2.808.57 3.81 1.503l3.07-3.07a9.9 9.9 0 0 0-6.88-2.61c-5.524 0-10 4.477-10 10s4.476 10 10 10c5.77 0 9.6-4.06 9.6-9.79 0-.66-.06-1.29-.17-1.89H12.24Z" />
            </svg>
            Sign in with Google
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-8 flex justify-between items-center text-[8px] text-zinc-600 font-mono uppercase tracking-widest border-t border-white/5 pt-4">
          <span>SECURE_CONNECTION</span>
          <span>BUILD_V3.1.2</span>
        </div>
      </div>
      
      {/* Decorative Outer Stats Panel (Bottom) */}
      <div className="mt-8 z-20 flex gap-6 text-[9px] font-mono text-zinc-600 uppercase tracking-widest pointer-events-none">
        <span className="flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5" /> SYSTEM_ONLINE</span>
        <span className="flex items-center gap-1.5"><ShoppingBag className="w-3.5 h-3.5" /> SECURE_VAULT</span>
        <span className="flex items-center gap-1.5"><Radio className="w-3.5 h-3.5 animate-pulse text-red-500" /> LIVE_DATABOUND</span>
      </div>
    </div>
  );
}
