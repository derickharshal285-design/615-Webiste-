import React from 'react';
import { Link } from 'react-router-dom';
import { Terminal, ShieldAlert, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background Grid & Scanlines */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,204,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,204,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute inset-0 bg-scanlines opacity-20 pointer-events-none" />

      {/* Main Terminal Window */}
      <div className="border border-red-500/30 bg-black/80 w-full max-w-2xl shadow-[0_0_50px_rgba(239,68,68,0.15)] relative z-10 backdrop-blur-sm">
        
        {/* Terminal Header */}
        <div className="flex items-center justify-between border-b border-red-500/30 bg-red-950/20 p-3">
          <div className="flex items-center gap-2 text-red-500">
            <Terminal className="w-4 h-4" />
            <span className="text-xs uppercase tracking-[0.2em] font-bold">System Directive</span>
          </div>
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500/50 animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-red-500/30" />
          </div>
        </div>

        {/* Terminal Body */}
        <div className="p-8 md:p-12 text-center space-y-6">
          <ShieldAlert className="w-20 h-20 text-red-500 mx-auto opacity-80" />
          
          <h1 className="text-4xl md:text-5xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-300">
            ERROR 404
          </h1>
          
          <div className="space-y-2">
            <h2 className="text-xl md:text-2xl text-zinc-300 uppercase tracking-widest">
              Sector Not Found
            </h2>
            <p className="text-sm text-zinc-500 tracking-wider">
              The neural pathway you requested does not exist in the mainframe.
            </p>
          </div>

          <div className="pt-8">
            <Link 
              to="/home"
              className="inline-flex items-center gap-3 px-8 py-4 bg-red-500 hover:bg-red-400 text-black font-black uppercase tracking-[0.3em] text-sm transition-all duration-300 hover:shadow-[0_0_30px_rgba(239,68,68,0.4)] hover:scale-105"
            >
              <ArrowLeft className="w-5 h-5" />
              Return to Hub
            </Link>
          </div>
        </div>
        
        {/* Footer Data */}
        <div className="border-t border-red-500/20 p-2 bg-red-950/10 text-[10px] text-red-500/50 uppercase tracking-widest text-center flex justify-between px-4">
          <span>PORT: 615</span>
          <span>STATUS: LOST</span>
        </div>
      </div>
    </div>
  );
}
