import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../components/AuthProvider';
import { Send, Shield, Terminal as TerminalIcon, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import DOMPurify from 'dompurify';

export default function CommsArray() {
  const { user, activeMode, creatorId, userData } = useAuth();
  const [chats, setChats] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeId = activeMode === 'creator' ? creatorId : user?.uid;

  // Fetch user's chats
  useEffect(() => {
    if (!activeId) return;
    
    const fetchChats = async () => {
      if (!activeId) return;
      try {
        const res = await fetch(`/api/chats/${activeId}`, {
          credentials: 'include'
        });
        if (res.ok) setChats(await res.json());
      } catch (err) {
        console.error(err);
      }
    };
    fetchChats();
    const interval = setInterval(fetchChats, 5000);
    return () => clearInterval(interval);
  }, [activeId]);

  // Fetch messages for active chat
  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }
    
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/chats/messages/${activeChatId}`);
        if (res.ok) {
          const msgs = await res.json();
          // Sort messages by createdAt
          msgs.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          setMessages(msgs);
        }
      } catch (err) {
        console.error(err);
      }
    };
    
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    const scrollTimer = setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 500);
    return () => {
      clearInterval(interval);
      clearTimeout(scrollTimer);
    };
  }, [activeChatId]);

  const [sendError, setSendError] = useState<string | null>(null);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatId || !activeId) return;
    const msg = newMessage.trim();
    setSendError(null);
    try {
      const res = await fetch(`/api/chats/messages/${activeChatId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          senderId: activeId,
          senderName: userData?.displayName || 'Unknown Agent',
          content: msg
        })
      });
      if (!res.ok) {
        throw new Error('Failed to send message');
      }
      setNewMessage('');
      // Optimistic fetch or let interval catch it
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err: any) {
      setSendError(`Transmission failed: ${err.message}`);
    }
  };

  const activeChat = chats.find(c => c.id === activeChatId);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pt-28 pb-8 px-4 font-sans">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row h-[80vh] border border-white/10 bg-black">
        
        {/* Sidebar */}
        <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-white/10 flex flex-col">
          <div className="p-4 bg-zinc-900 border-b border-white/10 flex items-center gap-2">
            <TerminalIcon className="w-5 h-5 text-[#ef3836]" />
            <h2 className="font-black uppercase tracking-widest text-[#ef3836]">Comms Array</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {chats.length > 0 ? (
              <div className="divide-y divide-zinc-800">
                {chats.map(chat => (
                  <button
                    key={chat.id}
                    onClick={() => setActiveChatId(chat.id)}
                    className={`w-full text-left p-4 transition-all duration-300 ease-in-out ${activeChatId === chat.id ? 'bg-[#ef3836]/10 border-l-2 border-[#ef3836]' : 'hover:bg-zinc-900/50 border-l-2 border-transparent'}`}
                  >
                    <div className="font-bold uppercase text-white truncate">{chat.bountyTitle || 'Secure Channel'}</div>
                    <div className="text-[10px] uppercase text-zinc-500 tracking-widest truncate mt-1">
                      Target: {chat.participantsNames?.find((n: string) => n !== userData?.displayName) || 'Unknown'}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-zinc-600 text-[10px] uppercase tracking-widest">
                No active secure channels.
              </div>
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col relative">
          {activeChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 bg-zinc-900 border-b border-white/10 flex justify-between items-center">
                <div>
                  <h3 className="font-black uppercase text-white tracking-widest">{activeChat.bountyTitle || 'Secure Channel'}</h3>
                  <div className="flex items-center gap-2 text-[10px] text-[#3dbca1] uppercase mt-1">
                    <Shield className="w-3 h-3" /> Encrypted E2E
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length > 0 ? (
                  messages.map(msg => {
                    const isMine = msg.senderId === activeId;
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                        <span className="text-[9px] uppercase text-zinc-500 mb-1">{DOMPurify.sanitize((msg.senderName || '').normalize('NFKC'))}</span>
                        <div className={`max-w-[80%] p-3 text-xs leading-relaxed ${isMine ? 'bg-[#ef3836] text-white rounded-l-none' : 'bg-zinc-800 text-zinc-200 rounded-r-none'}`}>
                          {DOMPurify.sanitize((msg.content || '').normalize('NFKC'))}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-2">
                    <AlertCircle className="w-8 h-8" />
                    <p className="text-[10px] uppercase tracking-widest">Channel initialized. Awaiting transmission.</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-zinc-900 border-t border-white/10">
                {sendError && (
                  <div className="text-[#ef3836] text-[10px] mb-2 uppercase tracking-widest font-bold">
                    {sendError}
                  </div>
                )}
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type message..."
                    className="flex-1 bg-black border-white/10 rounded-2xl text-xs focus-visible:ring-[#ef3836]"
                  />
                  <Button type="submit" className="bg-[#ef3836] hover:bg-[#d32f2f] text-white rounded-2xl px-6">
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-600 bg-black/50">
              <TerminalIcon className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-[10px] uppercase tracking-widest">Select a channel to decrypt</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
