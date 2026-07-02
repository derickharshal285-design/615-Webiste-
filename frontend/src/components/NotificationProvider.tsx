import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bell, ShieldAlert, Sparkles, Package } from 'lucide-react';

export type NotificationType = 'system' | 'forge' | 'vault' | 'social';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  timestamp: Date;
  actionUrl?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (title: string, message: string, type?: NotificationType, actionUrl?: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toastQueue, setToastQueue] = useState<Notification[]>([]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const addNotification = (title: string, message: string, type: NotificationType = 'system', actionUrl?: string) => {
    const newNotif: Notification = {
      id: Math.random().toString(36).substring(2, 9),
      title,
      message,
      type,
      isRead: false,
      timestamp: new Date(),
      actionUrl
    };
    
    setNotifications(prev => [newNotif, ...prev]);
    
    // Add to toast queue
    setToastQueue(prev => [...prev, newNotif]);
    
    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      setToastQueue(prev => prev.filter(t => t.id !== newNotif.id));
    }, 5000);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const dismissToast = (id: string) => {
    setToastQueue(prev => prev.filter(t => t.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAsRead, markAllAsRead, clearAll }}>
      {children}
      
      {/* Global Toast Container */}
      <div className="fixed bottom-4 right-4 z-[999] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toastQueue.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, x: 20 }}
              className="pointer-events-auto w-80 bg-zinc-950 border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.8)] rounded-xl overflow-hidden"
            >
              <div className={`h-1 w-full ${
                toast.type === 'forge' ? 'bg-[#ef3836]' : 
                toast.type === 'vault' ? 'bg-[#fcaf3e]' : 
                toast.type === 'social' ? 'bg-[#3dbca1]' : 'bg-white'
              }`} />
              <div className="p-4 flex gap-3">
                <div className={`mt-1 p-2 rounded-lg bg-zinc-900 border ${
                  toast.type === 'forge' ? 'border-[#ef3836]/30 text-[#ef3836]' : 
                  toast.type === 'vault' ? 'border-[#fcaf3e]/30 text-[#fcaf3e]' : 
                  toast.type === 'social' ? 'border-[#3dbca1]/30 text-[#3dbca1]' : 'border-zinc-700 text-white'
                }`}>
                  {toast.type === 'forge' ? <ShieldAlert className="w-5 h-5" /> :
                   toast.type === 'vault' ? <Package className="w-5 h-5" /> :
                   toast.type === 'social' ? <Sparkles className="w-5 h-5" /> :
                   <Bell className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-bold text-sm">{toast.title}</h4>
                  <p className="text-zinc-400 text-xs mt-1 leading-relaxed">{toast.message}</p>
                </div>
                <button 
                  onClick={() => dismissToast(toast.id)}
                  className="text-zinc-500 hover:text-white transition-all duration-300 ease-in-out h-fit p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}
