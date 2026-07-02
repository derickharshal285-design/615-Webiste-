import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, ShieldAlert, Sparkles, Package, Check, Trash2 } from 'lucide-react';
import { useNotifications } from '../NotificationProvider';
import { Link } from 'react-router-dom';

export default function NotificationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const panelRef = useRef<HTMLDivElement>(null);
  
  // Close on outside click for desktop dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleNotificationClick = (id: string, actionUrl?: string) => {
    markAsRead(id);
    if (!actionUrl) setIsOpen(false);
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications" 
        className="relative hover:text-[#fcaf3e] transition-all hover:scale-110 hover:drop-shadow-[0_0_8px_rgba(252,175,62,0.5)] duration-300 p-2 sm:px-3 sm:py-2 rounded-lg"
      >
        <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-[#ef3836] text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(239,56,54,0.8)] border border-zinc-950">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Desktop Dropdown & Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] sm:hidden"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95, x: '100%' }}
              animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
              exit={{ opacity: 0, y: 10, scale: 0.95, x: '100%' }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 right-0 w-80 max-w-[85vw] sm:max-w-none sm:w-96 bg-zinc-950 sm:absolute sm:inset-auto sm:right-0 sm:top-12 sm:rounded-xl border-l sm:border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.9)] z-[100] flex flex-col overflow-hidden"
            >
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-zinc-900/50">
                <h3 className="text-white font-sans font-bold tracking-widest text-sm flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#fcaf3e]" />
                  NOTIFICATIONS
                </h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllAsRead}
                      className="text-zinc-400 hover:text-[#3dbca1] transition-all duration-300 ease-in-out p-1"
                      title="Mark all as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button 
                      onClick={clearAll}
                      className="text-zinc-400 hover:text-[#ef3836] transition-all duration-300 ease-in-out p-1"
                      title="Clear all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => setIsOpen(false)} className="sm:hidden text-zinc-400 hover:text-white p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[calc(100vh-60px)] sm:max-h-[60vh] p-2 space-y-2 custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="h-40 flex flex-col items-center justify-center text-zinc-600">
                    <Bell className="w-8 h-8 mb-2 opacity-20" />
                    <p className="font-sans text-xs">The Council is silent...</p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const Content = (
                      <div className="flex gap-3">
                        <div className={`mt-1 p-2 rounded-lg bg-black border ${
                          notif.type === 'forge' ? 'border-[#ef3836]/30 text-[#ef3836]' : 
                          notif.type === 'vault' ? 'border-[#fcaf3e]/30 text-[#fcaf3e]' : 
                          notif.type === 'social' ? 'border-[#3dbca1]/30 text-[#3dbca1]' : 'border-zinc-700 text-white'
                        }`}>
                          {notif.type === 'forge' ? <ShieldAlert className="w-4 h-4" /> :
                           notif.type === 'vault' ? <Package className="w-4 h-4" /> :
                           notif.type === 'social' ? <Sparkles className="w-4 h-4" /> :
                           <Bell className="w-4 h-4" />}
                        </div>
                        <div>
                          <h4 className={`font-bold text-sm ${notif.isRead ? 'text-zinc-400' : 'text-white'}`}>
                            {notif.title}
                          </h4>
                          <p className={`text-xs mt-1 leading-relaxed ${notif.isRead ? 'text-zinc-600' : 'text-zinc-300'}`}>
                            {notif.message}
                          </p>
                          <p className="text-[10px] text-zinc-600 mt-2 font-sans">
                            {notif.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );

                    return (
                      <div 
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif.id, notif.actionUrl)}
                        className={`relative p-3 rounded-lg border transition-all cursor-pointer group ${
                          notif.isRead 
                            ? 'bg-zinc-900/30 border-transparent hover:bg-zinc-900/80' 
                            : 'bg-zinc-900 border-zinc-700 hover:border-[#fcaf3e]/50 hover:bg-zinc-800'
                        }`}
                      >
                        {!notif.isRead && (
                          <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#ef3836] shadow-[0_0_8px_rgba(239,56,54,0.8)]" />
                        )}
                        {notif.actionUrl ? (
                          <Link to={notif.actionUrl} onClick={() => setIsOpen(false)}>
                            {Content}
                          </Link>
                        ) : Content}
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
