import React, { useState } from 'react';
import { useAuth } from './AuthProvider';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Sparkles, User, RefreshCw } from 'lucide-react';

const godEmails = ['derickharshal285@gmail.com', 'club.615.chill@gmail.com', 'sthavishtapotti@gmail.com'];

export default function OperatorSwitcher() {
  const { user, swapIdentity } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [swapping, setSwapping] = useState<string | null>(null);

  // Determine visibility:
  // 1. Always visible on the login/gateway page (`/connect`)
  // 2. Visible on other pages ONLY if the logged-in user is one of the god operators
  const isGateway = location.pathname === '/connect';
  const isGodUser = user && user.email && godEmails.includes(user.email.toLowerCase());
  
  if (!isGateway && !isGodUser) return null;

  const operators = [
    {
      name: 'Derick',
      uid: 'user-derickharshal285',
      color: 'hover:border-[#3dbca1] hover:text-[#3dbca1] hover:shadow-[0_0_15px_rgba(61,188,161,0.4)]',
      dotColor: 'bg-[#3dbca1]',
      letter: 'D'
    },
    {
      name: 'Aryan',
      uid: 'user-club.615.chill',
      color: 'hover:border-[#ef3836] hover:text-[#ef3836] hover:shadow-[0_0_15px_rgba(239,56,54,0.4)]',
      dotColor: 'bg-[#ef3836]',
      letter: 'A'
    },
    {
      name: 'Sthavishta',
      uid: 'user-sthavishta',
      color: 'hover:border-[#fcaf3e] hover:text-[#fcaf3e] hover:shadow-[0_0_15px_rgba(252,175,62,0.4)]',
      dotColor: 'bg-[#fcaf3e]',
      letter: 'S'
    }
  ];

  const handleSwap = async (uid: string, name: string) => {
    if (swapping) return;
    setSwapping(uid);
    try {
      await swapIdentity(uid);
      // Determine redirection page based on roles/sync parameters
      // Wait for a short duration to let state synchronize
      setTimeout(() => {
        navigate('/home');
        window.location.reload();
      }, 300);
    } catch (err) {
      console.error("Bypass failed:", err);
      setSwapping(null);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-[9999] pointer-events-auto font-mono selection:bg-[#ef3836] selection:text-white">
      <div className="bg-zinc-950/90 border border-white/10 hover:border-white/20 p-2.5 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-md flex items-center gap-3 transition-all duration-300">
        
        {/* Header Badge */}
        <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-lg border border-white/5">
          <Shield className="w-3.5 h-3.5 text-[#ef3836] animate-pulse" />
          <span className="text-[9px] font-semibold text-zinc-400 tracking-wider">DEV_BYPASS</span>
        </div>

        {/* Buttons List */}
        <div className="flex items-center gap-2">
          {operators.map((op) => {
            const isActive = user && user.uid === op.uid;
            return (
              <button
                key={op.uid}
                onClick={() => handleSwap(op.uid, op.name)}
                disabled={swapping !== null}
                className={`relative w-8 h-8 rounded-lg border text-xs font-bold transition-all duration-300 flex items-center justify-center cursor-pointer ${
                  isActive 
                    ? 'bg-white/10 border-white text-white shadow-[0_0_12px_rgba(255,255,255,0.2)]' 
                    : `bg-white/5 border-white/5 text-zinc-400 ${op.color}`
                } disabled:opacity-50`}
                title={`Swap identity to ${op.name}`}
              >
                {swapping === op.uid ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <span>{op.letter}</span>
                    <span className={`absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full ${op.dotColor}`} />
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
