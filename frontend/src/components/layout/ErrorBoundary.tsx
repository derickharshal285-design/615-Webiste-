import React, { Component, ErrorInfo } from 'react';
import { Terminal, ShieldAlert, RefreshCw, HardDrive } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('System Watchdog Caught Exception:', error, errorInfo);
    
    // Fire and forget log to the backend
    try {
      fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          url: window.location.href,
          userAgent: navigator.userAgent
        })
      }).catch(err => console.error('Failed to transmit error log', err));
    } catch (e) {
      // Ignore
    }
  }

  private runSelfHealingProtocol = () => {
    // Purge local cache and hard reload to clear corrupted state
    console.warn('INITIATING SELF-HEALING PROTOCOL');
    try {
      localStorage.clear();
      sessionStorage.clear();
      
      // CRITICAL: Unregister all service workers so the browser fetches the new fixed code!
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
          for(let registration of registrations) {
            registration.unregister();
          }
        });
      }
    } catch (e) {
      console.error('Failed to clear storage during heal protocol', e);
    }
    
    // Force reload bypassing cache after a tiny delay to let SW unregister
    setTimeout(() => {
      window.location.href = window.location.origin + '/?reloaded=true';
    }, 500);
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
          {/* Background Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(239,68,68,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(239,68,68,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
          
          <div className="border border-red-500/50 bg-black/90 w-full max-w-2xl shadow-[0_0_80px_rgba(239,68,68,0.2)] relative z-10 backdrop-blur-md">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-red-500/50 bg-red-950/40 p-4">
              <div className="flex items-center gap-2 text-red-500">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
                <span className="text-sm uppercase tracking-[0.3em] font-black">CRITICAL FAILURE</span>
              </div>
              <div className="flex gap-2">
                <div className="w-2.5 h-2.5 rounded-sm bg-red-500 animate-ping" />
              </div>
            </div>

            {/* Body */}
            <div className="p-4 md:p-12 text-center space-y-6 md:space-y-8">
              <div className="space-y-4">
                <h1 className="text-2xl md:text-5xl font-black tracking-widest text-red-500">
                  SYSTEM MALFUNCTION
                </h1>
                <p className="text-xs md:text-base text-zinc-400 tracking-wider">
                  The watchdog protocol has intercepted a fatal rendering exception.
                </p>
              </div>

              {/* Error Output block */}
              <div className="bg-red-950/20 border border-red-500/20 p-3 md:p-4 text-left rounded-sm overflow-x-auto w-full">
                <div className="flex items-center gap-2 text-red-400/80 mb-2 border-b border-red-500/20 pb-2">
                  <Terminal className="w-4 h-4" />
                  <span className="text-[10px] md:text-xs uppercase tracking-widest font-bold">Stack Trace / Diagnostics</span>
                </div>
                <pre className="text-[10px] md:text-xs text-red-300/80 break-words whitespace-pre-wrap font-sans mt-2">
                  {this.state.error?.toString() || 'Unknown corruption detected in memory allocation.'}
                </pre>
              </div>

              {/* Healing Protocol Action */}
              <div className="pt-4 md:pt-6 border-t border-red-500/20">
                <button 
                  onClick={this.runSelfHealingProtocol}
                  className="group relative w-full flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 px-4 md:px-8 py-4 md:py-5 bg-red-500/10 hover:bg-red-500 border border-red-500 text-red-500 hover:text-black font-black uppercase tracking-widest md:tracking-[0.2em] text-[10px] md:text-sm transition-all duration-300"
                >
                  <div className="flex gap-2">
                    <RefreshCw className="w-4 h-4 md:w-5 md:h-5 group-hover:animate-spin" />
                    <span>Initiate Self-Healing</span>
                  </div>
                  <HardDrive className="hidden md:block w-5 h-5 opacity-50 group-hover:opacity-100" />
                </button>
                <p className="text-[8px] md:text-[10px] text-red-500/60 uppercase tracking-widest mt-4">
                  WARNING: Purges local cache and forcefully restarts the mainframe.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
