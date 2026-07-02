import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Sparkles, User, ShoppingBag, Package, Loader, ArrowUpRight } from 'lucide-react';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { authFetch } from '../lib/authFetch';

interface BlabberSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  sender: 'user' | 'blabber';
  text: string;
  data?: {
    creators?: any[];
    products?: any[];
    bounties?: any[];
  };
}

export default function BlabberSearch({ isOpen, onClose }: BlabberSearchProps) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'blabber',
      text: 'SYSTEM CONNECTED. Welcome to the Blabber AI search node. Scan the design syndicate database using human phrasing. Tell me what you are looking for, and I will match creators, custom forge bounties, or marketplace items.'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userText = query.trim();
    setQuery('');

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userText
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await authFetch('/api/search/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userText })
      });

      if (!res.ok) {
        throw new Error('AI search failed');
      }

      const result = await res.json();

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'blabber',
        text: result.response,
        data: result.matches
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'blabber',
          text: 'CONNECTION ERROR: AI Matchmaking Node was disconnected by the firewall. Retry transmission.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-50 pointer-events-auto"
          />

          {/* Chat Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-zinc-950/90 backdrop-blur-xl border-l border-white/10/50 z-50 flex flex-col shadow-[inset_10px_0_30px_rgba(0,0,0,0.85),-20px_0_40px_rgba(0,0,0,0.7)] font-sans text-zinc-100"
          >
            {/* Header */}
            <div className="h-20 border-b border-white/10 bg-black flex items-center justify-between px-6 shrink-0 relative overflow-hidden">
              <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[#3dbca1] to-transparent animate-pulse" />
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-[#3dbca1] animate-pulse" />
                <div>
                  <h3 className="text-white text-sm font-black uppercase tracking-widest">BLABBER SEARCH NODE</h3>
                  <span className="text-[8px] text-zinc-500 uppercase tracking-[0.2em]">GEMINI MATCHMAKER V1.0</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-zinc-500 hover:text-white p-2 border border-white/10 hover:border-zinc-700 transition-all duration-300 ease-in-out"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Message Area */}
            <div
              ref={scrollRef}
              className="flex-grow p-6 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent"
            >
              {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  {/* Sender tag */}
                  <span className="text-[8px] uppercase tracking-[0.15em] text-zinc-500 mb-1 font-semibold">
                    {msg.sender === 'user' ? 'Buyer Terminal' : 'Blabber AI'}
                  </span>

                  {/* Bubble */}
                  <div
                    className={`max-w-[90%] p-3.5 text-[11px] leading-relaxed border ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-br from-[#3dbca1]/25 to-[#3dbca1]/5 border-[#3dbca1]/30 text-white shadow-[0_0_20px_rgba(61,188,161,0.06)] rounded-2xl rounded-tr-none'
                        : 'bg-zinc-900/60 backdrop-blur-sm border-white/10/80 text-zinc-200 shadow-[inset_0_4px_15px_rgba(0,0,0,0.6)] rounded-2xl rounded-tl-none'
                    }`}
                  >
                    <span className="font-sans whitespace-pre-line">{DOMPurify.sanitize((msg.text || '').normalize('NFKC'), { ALLOWED_TAGS: [] })}</span>

                    {/* Renders data matches if present */}
                    {msg.data && (
                      <div className="mt-4 space-y-4 pt-4 border-t border-white/10/80">
                        {/* Creators Match */}
                        {msg.data.creators && msg.data.creators.length > 0 && (
                          <div>
                            <div className="text-[9px] text-[#fcaf3e] font-black uppercase tracking-widest flex items-center gap-1.5 mb-2">
                              <User className="w-3 h-3" /> MATCHING ARTISANS
                            </div>
                            <div className="space-y-2">
                              {msg.data.creators.map((c) => (
                                <Link
                                  key={c.uid || c.id}
                                  to={`/home/portfolio/${c.uid || c.id}`}
                                  onClick={onClose}
                                  className="flex items-center justify-between p-2.5 bg-zinc-900/40 border border-white/10/60 hover:border-[#fcaf3e] transition-all duration-300 ease-in-out group"
                                >
                                  <div>
                                    <div className="text-[10px] font-bold text-white uppercase">{c.displayName}</div>
                                    <div className="text-[8px] text-zinc-500 uppercase truncate max-w-[260px]">{c.tagline || 'Syndicate Operator'}</div>
                                  </div>
                                  <ArrowUpRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-[#fcaf3e] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Products Match */}
                        {msg.data.products && msg.data.products.length > 0 && (
                          <div>
                            <div className="text-[9px] text-[#3dbca1] font-black uppercase tracking-widest flex items-center gap-1.5 mb-2">
                              <ShoppingBag className="w-3 h-3" /> RETRIEVED PRODUCTS
                            </div>
                            <div className="space-y-2">
                              {msg.data.products.map((p) => (
                                <Link
                                  key={p.id}
                                  to="/home/marketplace"
                                  onClick={onClose}
                                  className="flex items-center justify-between p-2.5 bg-zinc-900/40 border border-white/10/60 hover:border-[#3dbca1] transition-all duration-300 ease-in-out group"
                                >
                                  <div className="flex gap-3 items-center">
                                    {p.imageUrl && (
                                      <img src={p.imageUrl} alt={p.title} className="w-8 h-8 object-cover border border-white/10" />
                                    )}
                                    <div>
                                      <div className="text-[10px] font-bold text-white uppercase">{p.title}</div>
                                      <div className="text-[8px] text-zinc-500 uppercase">₹ {p.price} · BY {p.creatorName}</div>
                                    </div>
                                  </div>
                                  <ArrowUpRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-[#3dbca1] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Bounties Match */}
                        {msg.data.bounties && msg.data.bounties.length > 0 && (
                          <div>
                            <div className="text-[9px] text-amber-500 font-black uppercase tracking-widest flex items-center gap-1.5 mb-2">
                              <Package className="w-3 h-3" /> MATCHED FORGES
                            </div>
                            <div className="space-y-2">
                              {msg.data.bounties.map((b) => (
                                <Link
                                  key={b.id}
                                  to="/home/custom-requests"
                                  onClick={onClose}
                                  className="flex items-center justify-between p-2.5 bg-zinc-900/40 border border-white/10/60 hover:border-amber-500 transition-all duration-300 ease-in-out group"
                                >
                                  <div>
                                    <div className="text-[10px] font-bold text-white uppercase">{b.title}</div>
                                    <div className="text-[8px] text-zinc-500 uppercase">Status: {b.status}</div>
                                  </div>
                                  <ArrowUpRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-amber-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex flex-col items-start">
                  <span className="text-[8px] uppercase tracking-widest text-zinc-600 mb-1.5">Blabber AI</span>
                  <div className="bg-black border border-zinc-855 p-4 text-xs flex items-center gap-2 text-zinc-500">
                    <Loader className="w-3.5 h-3.5 animate-spin text-[#3dbca1]" />
                    Scanning data grid layers...
                  </div>
                </div>
              )}
            </div>

            {/* Quick Suggestions */}
            <div className="px-6 py-2.5 bg-black/40 border-t border-white/10/60 overflow-x-auto flex gap-2 scrollbar-none shrink-0">
              {[
                "Why does this exist?",
                "What is the goal?",
                "Find 3D Creators",
                "Starbucks Template",
                "Active Bounties"
              ].map(pill => (
                <button
                  key={pill}
                  type="button"
                  onClick={() => setQuery(pill)}
                  className="px-3 py-1 bg-zinc-900/80 hover:bg-zinc-800 border border-white/10/60 hover:border-zinc-700 rounded-full text-[9px] font-sans text-zinc-400 hover:text-white transition-all whitespace-nowrap"
                >
                  {pill}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-6 bg-black border-t border-white/10 shrink-0 flex gap-2 w-full">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask blabber: 'a retro hacker poster'..."
                className="flex-grow bg-zinc-950 border border-white/10 hover:border-zinc-700 focus:border-[#3dbca1] focus:shadow-[0_0_15px_rgba(61,188,161,0.1)] outline-none text-xs text-white px-4 h-11 rounded-2xl uppercase tracking-widest placeholder:text-zinc-600 transition-all"
              />
              <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="w-12 h-11 bg-[#3dbca1] disabled:bg-zinc-900 text-black disabled:text-zinc-500 flex items-center justify-center transition-all shadow-[0_0_15px_rgba(61,188,161,0.15)] disabled:shadow-none"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
