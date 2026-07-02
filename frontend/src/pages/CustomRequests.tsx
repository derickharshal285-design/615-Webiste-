import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cart';
import { logSystemError } from '../lib/logger';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Hammer, 
  Upload, 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  Settings,
  ArrowRight,
  Info,
  Target,
  Coins,
  Shield,
  Award
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { dbService } from '../lib/db';
import { useAuth } from '../components/AuthProvider';
import { useNotifications } from '../components/NotificationProvider';
import DOMPurify from 'dompurify';
// Firebase Database dependencies removed in favor of ApiAdapter layer


export default function CustomRequests() {
  const navigate = useNavigate();
  const { addItem } = useCartStore();
  const [searchParams] = useSearchParams();
  const creatorId = searchParams.get('creator');
  const { user, userData, loading, activeMode } = useAuth();
  const { addNotification } = useNotifications();
  const [targetCreator, setTargetCreator] = useState<any>(null);
  
  // Viewer Mode State
  const [viewerRequests, setViewerRequests] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [requestForm, setRequestForm] = useState({
    title: '',
    notes: '',
    specs: {
      size: 'A3',
      theme: 'Retro/Cyberpunk'
    }
  });

  // Request Classifications & Budget States
  const [requestClass, setRequestClass] = useState('UI/UX Design');
  const [requestBudget, setRequestBudget] = useState('');
  const [deliveryDays, setDeliveryDays] = useState('7');
  const [deliveryDate, setDeliveryDate] = useState('');

  // Creator Mode State
  const [uploads, setUploads] = useState<any[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newPoster, setNewPoster] = useState({
    title: '',
    price: '',
    imageUrl: '',
    entityType: 'Poster' as 'Poster' | 'BazaarItem',
    description: ''
  });

  
  // --- BOUNTY BOARD STATES ---
  const [bounties, setBounties] = useState<any[]>([]);
  const [myBounties, setMyBounties] = useState<any[]>([]);
  const [bountyForm, setBountyForm] = useState({ title: '', notes: '', budget: '', deadline: '14' });
  const [activeBountyId, setActiveBountyId] = useState<string | null>(null);
  const [bidForm, setBidForm] = useState({ quote: '', notes: '' });
  
  const [viewerSubTab, setViewerSubTab] = useState<'direct' | 'posters' | 'bounties'>('direct');
  const [creatorSubTab, setCreatorSubTab] = useState<'direct' | 'board'>('direct');

  // Handle URL subtab parameter
  useEffect(() => {
    const sub = searchParams.get('subtab');
    if (sub === 'posters' || sub === 'bounties' || sub === 'direct') {
      setViewerSubTab(sub as 'direct' | 'posters' | 'bounties');
    }
  }, [searchParams]);

  // Global Posters Fetch
  const [allPosters, setAllPosters] = useState<any[]>([]);
  useEffect(() => {
    const fetchPosters = async () => {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setAllPosters(data.filter((p: any) => p.entityType === 'Poster'));
          } else {
            setAllPosters([]);
          }
        }
      } catch (err) {}
    };
    fetchPosters();
  }, []);

  // Fetch target creator details
  useEffect(() => {
    if (!creatorId) return;
    const fetchTarget = async () => {
      try {
        const res = await fetch(`/api/users/${creatorId}`);
        if (res.ok) {
          const data = await res.json();
          setTargetCreator(data);
        }
      } catch (err) {}
    };
    fetchTarget();
  }, [creatorId]);

  // Fetch requests made BY viewer
  useEffect(() => {
    if (!user) return;

    const fetchViewerRequests = async () => {
      try {
        const res = await fetch(`/api/requests?viewerId=${user.uid}`);
        if (res.ok) {
          const data = await res.json();
          setViewerRequests(data);
        }
      } catch (err) {
        console.error("Failed to fetch viewer requests:", err);
      }
    };

    fetchViewerRequests();
    const interval = setInterval(fetchViewerRequests, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Fetch creator's uploads & incoming requests
  useEffect(() => {
    if (!user || !userData?.roles?.includes('creator')) return;

    const fetchCreatorData = async () => {
      try {
        // Fetch creator's uploads
        const prodRes = await fetch('/api/products');
        if (prodRes.ok) {
          const allProds = await prodRes.json();
          setUploads(allProds.filter((p: any) => p.creatorId === user.uid));
        }

        // Fetch incoming requests
        const reqRes = await fetch(`/api/requests?creatorId=${user.uid}`);
        if (reqRes.ok) {
          const reqData = await reqRes.json();
          setIncomingRequests(reqData);
        }
      } catch (err) {
        console.error("Failed to fetch creator data:", err);
      }
    };

    fetchCreatorData();
    const interval = setInterval(fetchCreatorData, 30000);
    return () => clearInterval(interval);
  }, [user, userData]);

  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleAiForge = async () => {
    if (!aiPrompt) return alert('Enter a design concept prompt first.');
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai/generate-specs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt })
      });
      const data = await res.json();
      if (res.ok) {
        setRequestForm({
          title: data.title ? data.title.toUpperCase().replace(/\s+/g, '_') : aiPrompt.toUpperCase().replace(/\s+/g, '_'),
          notes: `THEME: ${data.theme || 'Retro'}\nDIMENSIONS: ${data.dimensions || 'A3'}\nPALETTE: ${data.colorPalette?.join(', ') || 'Neon'}\nCONCEPT: ${data.description || ''}`,
          specs: { size: data.dimensions || 'A3', theme: data.theme || 'Retro' }
        });
      } else {
        await logSystemError("handleAiForge", data.error);
        alert("AI Forge error. Admins have been notified.");
      }
    } catch (err: any) {
      await logSystemError("handleAiForge network", err);
      alert("AI Forge failed. Admins have been notified.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const targetCreatorId = creatorId || 'sys-admin';
    setIsSubmitting(true);
    
    try {
      const finalNotes = `[SERVICE REQUEST - ${requestClass.toUpperCase()}]\nSCOPE NOTES:\n${requestForm.notes}\nDELIVERY: ${deliveryDays} Days${deliveryDate ? ` (Target: ${deliveryDate})` : ''}`;
      const finalPrice = parseFloat(requestBudget) || 0;
      const finalTheme = 'Digital Service';

      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          viewerId: user.uid,
          viewerName: userData?.displayName || 'Anonymous',
          creatorId: targetCreatorId,
          creatorName: targetCreator?.displayName || 'Club 615',
          title: requestForm.title,
          notes: finalNotes,
          specs: {
            size: 'N/A',
            scope: requestClass,
            theme: finalTheme,
            price: finalPrice,
            isPrintOnly: false,
            category: 'Digital Service'
          }
        })
      });
      const data = await res.json();
      if (res.ok) {
        setNotification({ type: 'success', message: 'Brief transmitted to the Forge successfully.' });
        setTimeout(() => setNotification(null), 4000);
        setRequestForm({ title: '', notes: '', specs: { size: 'A3', theme: 'Retro' } });
      } else {
        setNotification({ type: 'error', message: `Transmission failed: ${data.error}` });
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (err: any) {
      console.error(err);
      await logSystemError("handleSubmitRequest", err);
      alert("Brief transmission failed. Admins have been notified.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRequestStatus = async (requestId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/requests/${requestId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (res.ok) {
        setNotification({ type: 'success', message: `Request status updated to: ${newStatus}` });
        setTimeout(() => setNotification(null), 3000);
        // Refresh incoming requests
        const reqRes = await fetch(`/api/requests?creatorId=${user?.uid}`);
        if (reqRes.ok) setIncomingRequests(await reqRes.json());
      } else {
        setNotification({ type: 'error', message: `Update failed: ${data.error}` });
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePoster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...newPoster,
          price: parseFloat(newPoster.price),
          creatorId: user.uid,
          creatorName: userData?.displayName || 'Anonymous',
          entityType: newPoster.entityType || 'Service',
          status: 'Active',
          createdAt: new Date().toISOString()
        })
      });
      const data = await res.json();
      if (res.ok) {
        setNotification({ type: 'success', message: 'Service uploaded to the sync grid.' });
        setTimeout(() => setNotification(null), 4000);
        setIsUploadModalOpen(false);
        setNewPoster({ title: '', price: '', imageUrl: '', entityType: 'Poster', description: '' });
        // Refresh uploads list
        const prodRes = await fetch('/api/products');
        if (prodRes.ok) {
          const allProds = await prodRes.json();
          setUploads(allProds.filter((p: any) => p.creatorId === user.uid));
        }
      } else {
        setNotification({ type: 'error', message: `Upload failed: ${data.error}` });
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (err: any) {
      console.error(err);
      setNotification({ type: 'error', message: `Upload failed: ${err.message}` });
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };


  // --- BOUNTY EFFECTS ---
  useEffect(() => {
    if (!user) return;
    
    // Listen to all open bounties for creators
    if (userData?.roles?.includes('creator')) {
      setBounties([]);
    }
  }, [user, userData]);

  useEffect(() => {
    if (!user) return;
    setMyBounties([]);
  }, [user]);

  // --- BOUNTY HANDLERS ---
  const handlePostBounty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          viewerId: user.uid,
          viewerName: userData?.displayName || 'Anonymous',
          creatorId: 'open',
          title: bountyForm.title,
          notes: bountyForm.notes,
          isBounty: true,
          specs: {
            budget: bountyForm.budget,
            deadline: bountyForm.deadline,
            price: parseFloat(bountyForm.budget) || 0
          }
        })
      });
      if (res.ok) {
        setNotification({ type: 'success', message: 'Bounty posted to the board.' });
        setTimeout(() => setNotification(null), 4000);
        setBountyForm({ title: '', notes: '', budget: '', deadline: '14' });
        // Refresh
        const myRes = await fetch(`/api/requests?viewerId=${user.uid}`);
        if (myRes.ok) setMyBounties((await myRes.json()).filter((r: any) => r.isBounty));
      } else {
        const d = await res.json();
        setNotification({ type: 'error', message: d.error || 'Failed to post bounty.' });
        setTimeout(() => setNotification(null), 4000);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitBid = async (e: React.FormEvent, bountyId: string) => {
    e.preventDefault();
    if (!user || !bountyId) return;
    setIsSubmitting(true);
    try {
      // POST a bid as a sub-entry on the request
      const res = await fetch(`/api/requests/${bountyId}/bid`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          creatorId: user.uid,
          creatorName: userData?.displayName || 'Anonymous',
          quote: bidForm.quote,
          notes: bidForm.notes
        })
      });
      if (res.ok) {
        setNotification({ type: 'success', message: 'Bid submitted successfully.' });
        addNotification("Council Acknowledged", "Your bid has been recorded in the Walled Garden.", "forge");
        setTimeout(() => setNotification(null), 4000);
        setBidForm({ quote: '', notes: '' });
        setActiveBountyId(null);
      } else {
        const d = await res.json();
        setNotification({ type: 'error', message: d.error || 'Failed to submit bid.' });
        setTimeout(() => setNotification(null), 4000);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptBid = async (bountyId: string, bidId: string, creatorId: string, creatorName: string, bountyTitle: string) => {
    if (!user) return;
    try {
      // Create a direct chat channel between buyer and creator
      await fetch('/api/chats', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          participants: [user.uid, creatorId],
          participantsNames: [userData?.displayName || 'Buyer', creatorName],
          bountyTitle,
          bountyId,
          bidId
        })
      });
      // Mark the request as accepted
      await fetch(`/api/requests/${bountyId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: 'accepted', acceptedCreatorId: creatorId })
      });
      setNotification({ type: 'success', message: `Bid accepted. Chat channel opened with ${creatorName}.` });
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      setNotification({ type: 'error', message: `Failed to accept bid: ${err.message}` });
      setTimeout(() => setNotification(null), 4000);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center font-mono text-[#3dbca1] gap-4">
      <div className="relative w-16 h-16 border-2 border-t-transparent border-[#3dbca1] rounded-full animate-spin flex items-center justify-center shadow-[0_0_20px_rgba(61,188,161,0.2)]">
        <div className="w-8 h-8 border-2 border-b-transparent border-[#fcaf3e] rounded-full animate-spin" />
      </div>
      <span className="text-xs font-bold uppercase tracking-[0.3em] animate-pulse">HEATING_THE_FORGE...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 px-4 md:px-8 pt-28 pb-12 font-sans relative overflow-hidden">
      {/* Custom Embedded Styling for Cyberpunk layouts */}
      <style>{`
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes subtle-glow {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.35; }
        }
        .cyber-grid {
          background-image: 
            linear-gradient(rgba(163,116,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(163,116,255,0.02) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        .cyber-scanline {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 4px;
          background: linear-gradient(to bottom, rgba(61,188,161,0), rgba(61,188,161,0.15), rgba(61,188,161,0));
          animation: scanline 6s linear infinite;
          pointer-events: none;
        }
        .cyber-corners::before, .cyber-corners::after {
          content: '';
          position: absolute;
          width: 8px;
          height: 8px;
          border-color: rgba(255, 255, 255, 0.15);
          border-style: solid;
          pointer-events: none;
          transition: all 0.3s ease;
        }
        .cyber-corners::before {
          top: -1px;
          left: -1px;
          border-width: 1px 0 0 1px;
        }
        .cyber-corners::after {
          bottom: -1px;
          right: -1px;
          border-width: 0 1px 1px 0;
        }
        .group:hover .cyber-corners::before {
          border-color: #3dbca1;
          width: 14px;
          height: 14px;
        }
        .group:hover .cyber-corners::after {
          border-color: #3dbca1;
          width: 14px;
          height: 14px;
        }
        .cyber-input {
          background-color: rgba(9, 9, 11, 0.6);
          border: 1px border-white/10;
          color: white;
          transition: all 0.3s ease;
        }
        .cyber-input:focus {
          border-color: #3dbca1;
          box-shadow: 0 0 12px rgba(61,188,161,0.15);
          outline: none;
        }
        /* Custom scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.2);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(61,188,161,0.4);
        }
      `}</style>

      {/* Background Matrix/Grid Overlay */}
      <div className="absolute inset-0 cyber-grid pointer-events-none" />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(163,116,255,0.04)_0%,transparent_60%)] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(61,188,161,0.03)_0%,transparent_60%)] pointer-events-none mix-blend-screen" />

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed bottom-8 right-8 z-50 px-6 py-4 font-mono font-bold uppercase tracking-widest text-xs border shadow-2xl ${
          notification.type === 'success' 
            ? 'bg-[#3dbca1]/10 border-[#3dbca1] text-[#3dbca1] shadow-[0_0_30px_rgba(61,188,161,0.2)]' 
            : 'bg-[#ef3836]/10 border-[#ef3836] text-[#ef3836] shadow-[0_0_30px_rgba(239,56,54,0.2)]'
        }`}>
          <span className="mr-2">{notification.type === 'success' ? '● ONLINE // BRIEF_STAGED' : '▲ OFFLINE // SYNC_ERR'}</span>
          <p className="mt-1 text-[10px] text-zinc-300 font-sans tracking-wide lowercase italic">{notification.message}</p>
        </div>
      )}

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Futuristic Main Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16 border-b border-white/5 pb-8 relative group">
          <div className="absolute bottom-0 left-0 w-32 h-[1px] bg-gradient-to-r from-[#3dbca1] to-transparent" />
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="relative p-2.5 bg-[#3dbca1]/5 border border-[#3dbca1]/20 rounded-lg shadow-[0_0_15px_rgba(61,188,161,0.1)]">
                <Hammer className="text-[#3dbca1] w-8 h-8 animate-pulse" />
                <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-[#3dbca1] rounded-full animate-ping" />
              </div>
              <div>
                <h1 className="text-4xl lg:text-5xl font-black uppercase text-white tracking-widest font-sans flex items-center">
                  THE FORGE
                  <span className="text-[10px] font-mono text-[#3dbca1] ml-4 border border-[#3dbca1]/30 px-2 py-0.5 rounded bg-[#3dbca1]/5 tracking-widest">
                    V3.12
                  </span>
                </h1>
              </div>
            </div>
            <p className="text-zinc-500 uppercase tracking-[0.25em] text-[10px] font-mono">
              {activeMode === 'creator' ? "OPERATIONAL_NODE // SYSTEM_CREATOR" : "PUBLIC_PORTAL // REQUISITION_MATRIX"}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <span className={`text-[9px] font-mono border px-3.5 py-1.5 rounded-lg uppercase tracking-widest font-bold flex items-center gap-2 ${
              activeMode === 'creator' 
                ? 'text-[#3dbca1] border-[#3dbca1]/30 bg-[#3dbca1]/5 shadow-[0_0_12px_rgba(61,188,161,0.1)]' 
                : 'text-[#fcaf3e] border-[#fcaf3e]/30 bg-[#fcaf3e]/5 shadow-[0_0_12px_rgba(252,175,62,0.1)]'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${activeMode === 'creator' ? 'bg-[#3dbca1] animate-ping' : 'bg-[#fcaf3e] animate-ping'}`} />
              {activeMode === 'creator' ? "CREATOR MODE ACTIVE" : "PATRON MODE ACTIVE"}
            </span>
          </div>
        </div>

        {activeMode === 'buyer' && (
          <div className="w-full mt-0">
            
            {/* Cyberpunk Glowing Tabs Bar */}
            <div className="flex flex-wrap gap-3 mb-10">
              <button 
                onClick={() => setViewerSubTab('direct')}
                className={`relative px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] border transition-all duration-300 rounded-lg overflow-hidden group ${
                  viewerSubTab === 'direct' 
                    ? 'bg-[#3dbca1]/10 border-[#3dbca1] text-[#3dbca1] shadow-[0_0_15px_rgba(61,188,161,0.2)]' 
                    : 'bg-zinc-950/40 border-white/10 text-zinc-500 hover:text-white hover:border-white/20'
                }`}
              >
                <div className="absolute top-0 left-0 w-1 h-1 bg-[#3dbca1]" />
                Direct Requisition
              </button>
              
              <button 
                onClick={() => setViewerSubTab('posters')}
                className={`relative px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] border transition-all duration-300 rounded-lg overflow-hidden group ${
                  viewerSubTab === 'posters' 
                    ? 'bg-[#fcaf3e]/10 border-[#fcaf3e] text-[#fcaf3e] shadow-[0_0_15px_rgba(252,175,62,0.2)]' 
                    : 'bg-zinc-950/40 border-white/10 text-zinc-500 hover:text-white hover:border-white/20'
                }`}
              >
                <div className="absolute top-0 left-0 w-1 h-1 bg-[#fcaf3e]" />
                Custom Services
              </button>
              
              <button 
                onClick={() => setViewerSubTab('bounties')}
                className={`relative px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] border transition-all duration-300 rounded-lg overflow-hidden group ${
                  viewerSubTab === 'bounties' 
                    ? 'bg-[#a374ff]/10 border-[#a374ff] text-[#a374ff] shadow-[0_0_15px_rgba(163,116,255,0.2)]' 
                    : 'bg-zinc-950/40 border-white/10 text-zinc-500 hover:text-white hover:border-white/20'
                }`}
              >
                <div className="absolute top-0 left-0 w-1 h-1 bg-[#a374ff]" />
                Public Bounties (Bazaar Board)
              </button>
            </div>

            {/* TAB CONTENT 1: DIRECT REQUEST */}
            {viewerSubTab === "direct" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Form Box */}
              <div className="lg:col-span-7">
                <Card className="relative overflow-hidden group border border-[#3dbca1]/20">
                  <div className="cyber-scanline" />
                  <div className="cyber-corners" />
                  
                  <div className="relative z-10">
                    <h3 className="text-lg font-black text-white uppercase tracking-wider mb-8 flex items-center gap-3">
                      <FileText className="w-5 h-5 text-[#3dbca1]" />
                      DESIGN_BRIEF_TRANSMITTER
                    </h3>
                    
                    <form onSubmit={handleSubmitRequest} className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-[9px] uppercase tracking-widest text-zinc-400 font-mono">TARGET_CREATOR_NODE</Label>
                        <div className="p-4 bg-black/60 border border-white/5 hover:border-white/10 rounded-lg flex items-center justify-between shadow-inner transition-all duration-300">
                          {targetCreator ? (
                            <div className="flex items-center gap-3">
                              <img src={targetCreator.photoURL} alt="" className="w-8 h-8 rounded-full border border-[#3dbca1]" />
                              <div>
                                <span className="text-white font-bold text-xs uppercase tracking-wider">{targetCreator.displayName}</span>
                                <span className="block text-[8px] text-[#3dbca1] font-mono mt-0.5">READY_FOR_SYNC</span>
                              </div>
                            </div>
                          ) : (
                            <Link to="/home/freelancers" className="text-zinc-400 hover:text-[#3dbca1] transition-all duration-300 ease-in-out flex items-center gap-2 text-xs uppercase tracking-widest font-mono">
                              LOCATE_CREATOR_NODE <ArrowRight className="w-3.5 h-3.5 animate-bounce" />
                            </Link>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label className="text-[9px] uppercase tracking-widest text-zinc-400 font-mono block">REQUEST_CLASSIFICATION</Label>
                          <select
                            value={requestClass}
                            onChange={(e) => setRequestClass(e.target.value)}
                            className="w-full h-11 bg-zinc-950 border border-white/10 text-white rounded-lg p-3 text-xs uppercase focus:outline-none focus:border-[#3dbca1] transition-all cursor-pointer font-mono"
                          >
                            <option value="UI/UX Design">UI/UX Design</option>
                            <option value="3D Modeling">3D Modeling</option>
                            <option value="Illustration">Illustration</option>
                            <option value="Branding & Identity">Branding & Identity</option>
                            <option value="Animation/Motion Graphics">Animation/Motion</option>
                            <option value="Web Development">Web Development</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-[9px] uppercase tracking-widest text-zinc-400 font-mono block">PROJECT_BUDGET (₹)</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-3 text-[10px] text-zinc-500 font-mono">₹</span>
                            <input 
                              type="number"
                              value={requestBudget}
                              onChange={(e) => setRequestBudget(e.target.value)}
                              placeholder="E.G. 5000"
                              className="w-full h-11 bg-zinc-950 border border-white/10 text-white rounded-lg pl-6 pr-3 py-3 text-xs uppercase focus:outline-none focus:border-[#3dbca1] transition-all font-mono"
                              min="100"
                            />
                          </div>
                          {requestBudget && !isNaN(Number(requestBudget)) && Number(requestBudget) > 0 && (
                            <div className="flex justify-between text-[8px] text-zinc-500 font-mono mt-1 px-1">
                              <span>CREATOR: ₹{(Number(requestBudget) * 0.95).toFixed(0)}</span>
                              <span className="text-[#fcaf3e] font-bold">GRID FEE 5%: ₹{(Number(requestBudget) * 0.05).toFixed(0)}</span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[9px] uppercase tracking-widest text-zinc-400 font-mono block">DELIVERY_TARGET (DAYS)</Label>
                          <input 
                            type="number"
                            value={deliveryDays}
                            onChange={(e) => setDeliveryDays(e.target.value)}
                            className="w-full h-11 bg-zinc-950 border border-white/10 text-white rounded-lg p-3 text-xs uppercase focus:outline-none focus:border-[#3dbca1] transition-all font-mono"
                            min="1"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[9px] uppercase tracking-widest text-zinc-400 font-mono block">SPECIFIC_DATE (OPTIONAL)</Label>
                          <input 
                            type="date"
                            value={deliveryDate}
                            onChange={(e) => setDeliveryDate(e.target.value)}
                            className="w-full h-11 bg-zinc-950 border border-white/10 text-white rounded-lg p-3 text-xs uppercase focus:outline-none focus:border-[#3dbca1] transition-all [color-scheme:dark] font-mono"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[9px] uppercase tracking-widest text-zinc-400 font-mono block">SPECIFICATION BRIEF</Label>
                        <textarea 
                          value={requestForm.notes}
                          onChange={(e) => setRequestForm({...requestForm, notes: e.target.value})}
                          className="w-full h-32 bg-zinc-950 border border-white/10 rounded-lg p-4 text-xs font-sans focus:border-[#3dbca1] outline-none text-white transition-all"
                          placeholder="Submit design concepts, specifications, and scope..."
                          required
                        />
                      </div>

                      <Button 
                        type="submit" 
                        disabled={!creatorId || isSubmitting}
                        className="w-full h-14 bg-[#3dbca1] hover:bg-[#3dbca1]/90 text-black rounded-xl font-bold uppercase tracking-[0.2em] transition-all duration-300 shadow-[0_0_20px_rgba(61,188,161,0.2)] border-none text-[10px]"
                      >
                        {isSubmitting ? 'TRANSMITTING SYNC_SIGNAL...' : 'INITIATE PRODUCTION'}
                      </Button>
                    </form>
                  </div>
                </Card>
              </div>

              {/* Sidebar Active Queue */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Forge Info Info */}
                <div className="p-6 bg-zinc-900/40 border border-white/5 rounded-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[radial-gradient(circle_at_center,rgba(61,188,161,0.05)_0%,transparent_60%)] pointer-events-none" />
                  <h3 className="text-xs font-bold uppercase text-[#3dbca1] tracking-[0.2em] mb-4 flex items-center gap-2">
                    <Info className="w-4 h-4" /> FORGE_INTEL_INDEX
                  </h3>
                  <div className="space-y-3.5 text-zinc-400 text-[11px] leading-relaxed uppercase tracking-wider font-mono">
                    <div className="flex gap-2">
                      <span className="text-[#3dbca1]">01 //</span>
                      <p>CONCEPT briefed & sync signal sent.</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-[#3dbca1]">02 //</span>
                      <p>CREATOR node registers & accepts request.</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-[#3dbca1]">03 //</span>
                      <p>FABRICATION phase begins with direct coms.</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-[#3dbca1]">04 //</span>
                      <p>FULFILLMENT secured on client workspace.</p>
                    </div>
                  </div>
                </div>
                
                {/* Active Requests List */}
                <Card className="border border-white/5">
                  <div className="p-5 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                    <h3 className="text-[11px] font-bold uppercase text-white tracking-[0.25em]">ACTIVE_TRANS_QUEUE</h3>
                    <span className="text-[9px] font-mono text-zinc-500">{viewerRequests.length} LOGS</span>
                  </div>
                  <div className="max-h-[350px] overflow-y-auto custom-scrollbar divide-y divide-white/5">
                    {viewerRequests.length > 0 ? (
                      viewerRequests.map((req) => (
                         <div key={req.id} className="p-5 hover:bg-white/[0.01] transition-all duration-300 ease-in-out border-l-2 border-transparent hover:border-[#3dbca1]">
                            <div className="flex justify-between items-start gap-4">
                              <h4 className="font-bold text-white text-xs uppercase tracking-wide truncate max-w-[180px]">{req.title || 'UNTITLED_BRIEF'}</h4>
                              <span className={`text-[7px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-widest ${
                                req.status === 'Pending' ? 'bg-[#fcaf3e]/5 border-[#fcaf3e]/30 text-[#fcaf3e]' :
                                req.status === 'Accepted' ? 'bg-[#3dbca1]/5 border-[#3dbca1]/30 text-[#3dbca1]' :
                                req.status === 'In_Progress' ? 'bg-[#00ffcc]/5 border-[#00ffcc]/30 text-[#00ffcc]' :
                                req.status === 'Declined' ? 'bg-zinc-950 border-zinc-800 text-zinc-500' :
                                'bg-[#a374ff]/5 border-[#a374ff]/30 text-[#a374ff]'
                              }`}>{req.status.replace('_', ' ')}</span>
                            </div>
                            <p className="text-[8px] text-zinc-500 font-mono mt-1 mb-2">
                              STAMP: {new Date(req.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-zinc-400 text-[10px] line-clamp-1 italic">{DOMPurify.sanitize((req.notes || '').replace(/\[SERVICE REQUEST.*\]\nSCOPE NOTES:\n/, '').normalize('NFKC'))}</p>
                         </div>
                      ))
                    ) : (
                      <div className="p-8 text-center flex flex-col items-center">
                        <Clock className="w-6 h-6 text-zinc-700 mb-3 animate-pulse" />
                        <p className="text-zinc-500 uppercase tracking-widest text-[9px] font-mono">NO ACTIVE LOG PACKETS DETECTED</p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
            )}

            {/* TAB CONTENT 2: CUSTOM SERVICES */}
            {viewerSubTab === 'posters' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Form Requisition Card */}
                <div className="lg:col-span-6">
                  <Card className="relative overflow-hidden group border border-[#fcaf3e]/20">
                    <div className="cyber-scanline" />
                    <div className="cyber-corners" />
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[radial-gradient(circle_at_center,rgba(252,175,62,0.03)_0%,transparent_60%)] pointer-events-none" />
                    
                    <div className="relative z-10">
                      <h3 className="text-lg font-black text-white uppercase tracking-wider mb-8 flex items-center gap-3">
                        <FileText className="w-5 h-5 text-[#fcaf3e]" />
                        CUSTOM_SERVICE_ACQUISITION
                      </h3>
                      
                      <form onSubmit={handleSubmitRequest} className="space-y-6">
                        <div className="space-y-2">
                          <Label className="text-[9px] uppercase tracking-widest text-zinc-400 font-mono">SERVICE_TITLE_INDEX</Label>
                          <Input 
                            value={requestForm.title}
                            onChange={e => setRequestForm({...requestForm, title: e.target.value})}
                            className="bg-zinc-950 border-white/10 rounded-lg h-11 uppercase text-xs tracking-wider focus-visible:ring-[#fcaf3e] text-white" 
                            placeholder="E.G. KEYART DESIGN OR LOGO FORGE"
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-[9px] uppercase tracking-widest text-zinc-400 font-mono">REQUISITION_SPECIFICATIONS</Label>
                          <textarea 
                            value={requestForm.notes}
                            onChange={e => setRequestForm({...requestForm, notes: e.target.value})}
                            className="w-full h-40 bg-zinc-950 border border-white/10 rounded-lg p-4 text-xs font-sans focus:border-[#fcaf3e] outline-none text-white transition-all"
                            placeholder="Describe custom specs, theme palette, dimensions..."
                            required
                          />
                        </div>

                        <Button 
                          type="submit" 
                          disabled={isSubmitting} 
                          className="w-full h-14 bg-[#fcaf3e] text-black hover:bg-[#fcaf3e]/90 rounded-xl font-bold uppercase tracking-[0.2em] transition-all text-[10px] shadow-[0_0_20px_rgba(252,175,62,0.15)] border-none"
                        >
                          {isSubmitting ? 'TRANSMITTING BRIEF...' : 'INITIATE SERVICE PRODUCTION'}
                        </Button>
                      </form>
                    </div>
                  </Card>
                </div>

                {/* AI Forge & Gallery Right Column */}
                <div className="lg:col-span-6 space-y-6">
                    
                    {/* AI terminal Forge Box */}
                    <div className="bg-zinc-950/60 border border-[#a374ff]/20 rounded-2xl p-6 relative overflow-hidden group">
                      <div className="cyber-scanline" style={{ background: 'linear-gradient(to bottom, rgba(163,116,255,0), rgba(163,116,255,0.15), rgba(163,116,255,0))' }} />
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_center,rgba(163,116,255,0.05)_0%,transparent_60%)] pointer-events-none" />
                      
                      <div className="flex items-center justify-between mb-4 border-b border-[#a374ff]/10 pb-3">
                        <h3 className="text-xs font-black uppercase text-[#a374ff] tracking-[0.2em] flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-[#a374ff] rounded-full animate-ping" />
                          CYBERNETIC_AI_FORGE
                        </h3>
                      </div>
                      
                      <div className="flex gap-2">
                        <Input 
                          value={aiPrompt}
                          onChange={e => setAiPrompt(e.target.value)}
                          placeholder="Prompt AI (e.g. Cyberpunk grid with neon signs)"
                          className="bg-black/60 border-white/5 rounded-lg h-11 text-xs focus-visible:ring-[#a374ff] placeholder-zinc-600 text-white font-mono"
                        />
                        <Button 
                          onClick={handleAiForge} 
                          disabled={isAiLoading} 
                          className="h-11 bg-[#a374ff] hover:bg-[#a374ff]/90 text-black rounded-lg px-5 uppercase font-bold tracking-widest text-[9px] border-none shadow-[0_0_15px_rgba(163,116,255,0.2)]"
                        >
                          {isAiLoading ? 'FORGING...' : 'GENERATE'}
                        </Button>
                      </div>
                    </div>

                    {/* Gallery Box */}
                    <Card className="border border-white/5 p-6">
                      <h3 className="text-xs font-bold uppercase text-[#3dbca1] tracking-[0.2em] mb-4 border-b border-white/5 pb-2">ACTIVE_CREATIONS_VAULT</h3>
                      
                      {allPosters.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                          {allPosters.map(poster => (
                            <div key={poster.id} className="relative group overflow-hidden border border-white/10 rounded-xl bg-zinc-950/60 shadow-lg">
                              <img src={poster.imageUrl} alt={poster.title} className="w-full h-32 object-cover opacity-50 group-hover:opacity-90 transition-all duration-500 group-hover:scale-105" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none" />
                              <div className="absolute bottom-0 left-0 right-0 p-3.5 flex flex-col justify-end">
                                <h4 className="text-[10px] font-black text-white uppercase tracking-wider truncate mb-0.5">{poster.title}</h4>
                                <span className="text-[#3dbca1] text-[10px] font-mono font-bold">₹{poster.price}</span>
                                <Button 
                                  onClick={() => addItem({ id: poster.id, title: poster.title, price: poster.price, imageUrl: poster.imageUrl })} 
                                  className="mt-2.5 w-full h-7 bg-white text-black hover:bg-[#3dbca1] hover:text-black text-[8px] uppercase tracking-widest font-black rounded-md transition-all duration-300 border-none"
                                >
                                  ADD TO CART
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 border border-dashed border-white/5 rounded-xl text-center text-zinc-600 uppercase tracking-widest text-[9px] font-mono">
                          NO ACTIVE SERVICES FOUND IN SYNDICATE
                        </div>
                      )}
                    </Card>
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: PUBLIC BOUNTIES */}
            {viewerSubTab === 'bounties' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Form Box */}
                <div className="lg:col-span-6">
                  <Card className="relative overflow-hidden group border border-[#a374ff]/20">
                    <div className="cyber-scanline" style={{ background: 'linear-gradient(to bottom, rgba(163,116,255,0), rgba(163,116,255,0.15), rgba(163,116,255,0))' }} />
                    <div className="cyber-corners" />
                    
                    <div className="relative z-10">
                      {/* AI Generator Helper */}
                      <div className="mb-6">
                        <Label className="text-[9px] uppercase tracking-widest text-zinc-400 font-mono block mb-2">AUTOFILL_CONCEPT_GENERATOR</Label>
                        <div className="flex gap-2">
                          <Input 
                            value={aiPrompt}
                            onChange={e => setAiPrompt(e.target.value)}
                            placeholder="Enter idea specs (e.g. 3D cyber corridor, budget 8k)..."
                            className="bg-zinc-950 border-white/10 rounded-lg h-11 text-xs focus-visible:ring-[#a374ff] text-white"
                          />
                          <Button 
                            onClick={handleAiForge} 
                            disabled={isAiLoading} 
                            className="h-11 bg-white text-black hover:bg-zinc-200 rounded-lg px-4 uppercase font-bold tracking-widest text-[9px] border-none"
                          >
                            {isAiLoading ? 'GENERATING...' : 'AI ASSIST'}
                          </Button>
                        </div>
                      </div>

                      <div className="w-full h-[1px] bg-white/5 mb-6" />

                      <h3 className="text-base font-black text-white uppercase tracking-wider mb-6 flex items-center gap-3">
                        <Target className="w-5 h-5 text-[#a374ff]" />
                        DISPATCH_PUBLIC_BOUNTY
                      </h3>
                      
                      <form onSubmit={handlePostBounty} className="space-y-6">
                        <div className="space-y-2">
                          <Label className="text-[9px] uppercase tracking-widest text-zinc-400 font-mono">BOUNTY_IDENT_TITLE</Label>
                          <Input 
                            required
                            value={bountyForm.title}
                            onChange={(e) => setBountyForm({...bountyForm, title: e.target.value})}
                            className="bg-zinc-950 border-white/10 rounded-lg h-11 uppercase text-xs tracking-wider focus-visible:ring-[#a374ff] text-white" 
                            placeholder="E.G. WEB GL MODEL PROJECT"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-[9px] uppercase tracking-widest text-zinc-400 font-mono">BOUNTY_SPECIFICATIONS</Label>
                          <textarea 
                            required
                            value={bountyForm.notes}
                            onChange={(e) => setBountyForm({...bountyForm, notes: e.target.value})}
                            className="w-full h-32 bg-zinc-950 border border-white/10 rounded-lg p-4 text-xs font-sans focus:border-[#a374ff] outline-none text-white transition-all"
                            placeholder="Outline requirements, dimensions, target technologies..."
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[9px] uppercase tracking-widest text-zinc-400 font-mono">BUDGET_ALLOCATION (₹)</Label>
                            <div className="relative">
                              <span className="absolute left-3 top-3 text-[10px] text-zinc-500 font-mono">₹</span>
                              <Input 
                                required
                                type="number"
                                value={bountyForm.budget}
                                onChange={(e) => setBountyForm({...bountyForm, budget: e.target.value})}
                                className="bg-zinc-950 border-white/10 rounded-lg h-11 pl-6 text-xs focus-visible:ring-[#a374ff] text-white" 
                                placeholder="5000"
                              />
                            </div>
                            {bountyForm.budget && !isNaN(Number(bountyForm.budget)) && Number(bountyForm.budget) > 0 && (
                              <div className="flex justify-between text-[8px] text-zinc-500 font-mono mt-1 px-1">
                                <span>CREATOR PAYOUT: ₹{(Number(bountyForm.budget) * 0.95).toFixed(0)}</span>
                                <span className="text-[#fcaf3e] font-bold">GRID 5%: ₹{(Number(bountyForm.budget) * 0.05).toFixed(0)}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-[9px] uppercase tracking-widest text-zinc-400 font-mono">DEADLINE (DAYS)</Label>
                            <Input 
                              required
                              type="number"
                              value={bountyForm.deadline}
                              onChange={(e) => setBountyForm({...bountyForm, deadline: e.target.value})}
                              className="bg-zinc-950 border-white/10 rounded-lg h-11 text-xs focus-visible:ring-[#a374ff] text-white" 
                            />
                          </div>
                        </div>
                        
                        <Button 
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full h-14 bg-[#a374ff] text-black hover:bg-[#a374ff]/90 rounded-xl font-bold uppercase tracking-[0.2em] transition-all text-[10px] shadow-[0_0_20px_rgba(163,116,255,0.15)] border-none"
                        >
                          {isSubmitting ? 'TRANSMITTING PACKETS...' : 'POST BOUNTY TO NETWORK'}
                        </Button>
                      </form>
                    </div>
                  </Card>
                </div>

                {/* active Bounties Queue List */}
                <div className="lg:col-span-6">
                  <Card className="border border-white/5">
                    <div className="p-5 border-b border-white/5 bg-white/[0.02]">
                      <h3 className="text-[11px] font-bold uppercase text-white tracking-[0.25em]">MY_POSTED_BOUNTIES</h3>
                    </div>
                    <div className="max-h-[500px] overflow-y-auto custom-scrollbar divide-y divide-white/5">
                      {myBounties.length > 0 ? (
                        myBounties.map((b) => (
                           <div key={b.id} className="p-6">
                              <div className="flex justify-between items-start gap-4 mb-2">
                                <h4 className="font-bold text-white uppercase text-xs tracking-wider truncate">{b.title}</h4>
                                <span className="text-xs font-mono font-bold text-[#3dbca1]">₹{b.budget}</span>
                              </div>
                              <span className={`text-[7px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-widest ${
                                b.status === 'Open' ? 'bg-[#3dbca1]/5 border-[#3dbca1]/30 text-[#3dbca1]' :
                                b.status === 'Awarded' ? 'bg-[#fcaf3e]/5 border-[#fcaf3e]/30 text-[#fcaf3e]' : 'bg-zinc-950 border-zinc-800 text-zinc-500'
                              }`}>{b.status}</span>
                              
                              {b.bids && b.bids.length > 0 && (
                                <div className="mt-4 border-t border-white/5 pt-4 space-y-3">
                                  <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono font-bold">TRANSMITTED CREATOR PROPOSALS // {b.bids.length}</p>
                                  {b.bids.map((bid: any) => (
                                    <div key={bid.id} className="bg-black/40 border border-white/5 p-3.5 flex justify-between items-center rounded-lg hover:border-white/10 transition-all duration-300">
                                      <div>
                                        <p className="text-xs text-white font-bold tracking-wide">{DOMPurify.sanitize((bid.creatorName || '').normalize('NFKC'))}</p>
                                        <p className="text-[10px] text-zinc-400 mt-1 lowercase italic font-sans">{DOMPurify.sanitize((bid.notes || '').normalize('NFKC'))}</p>
                                      </div>
                                      <div className="text-right flex flex-col items-end">
                                        <span className="text-[#3dbca1] font-mono font-bold text-xs">₹{bid.quote}</span>
                                        {b.status === 'Open' && (
                                          <Button 
                                            onClick={() => handleAcceptBid(b.id, bid.id, bid.creatorId, bid.creatorName, b.title)}
                                            className="h-7 mt-2 bg-[#3dbca1] text-black text-[9px] uppercase px-3.5 hover:bg-white rounded-md border-none font-bold tracking-wide"
                                          >
                                            Accept
                                          </Button>
                                        )}
                                        {bid.status === 'Accepted' && <span className="text-[8px] border border-[#fcaf3e]/30 bg-[#fcaf3e]/5 text-[#fcaf3e] font-mono uppercase tracking-widest px-2 py-0.5 rounded mt-2">AWARDED</span>}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                           </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-zinc-600 uppercase text-[9px] font-mono">NO ACTIVE BOUNTY LOGS FOUND</div>
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CREATOR VIEW SYSTEM */}
        {activeMode === 'creator' && (
          <div className="w-full mt-0">

            <div className="flex gap-4 mb-8">
              <button 
                onClick={() => setCreatorSubTab('direct')}
                className={`relative px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] border transition-all duration-300 rounded-lg overflow-hidden ${
                  creatorSubTab === 'direct' 
                    ? 'bg-[#3dbca1]/10 border-[#3dbca1] text-[#3dbca1] shadow-[0_0_15px_rgba(61,188,161,0.2)]' 
                    : 'bg-zinc-950/40 border-white/10 text-zinc-500 hover:text-white hover:border-white/20'
                }`}
              >
                <div className="absolute top-0 left-0 w-1 h-1 bg-[#3dbca1]" />
                Direct Requisitions
              </button>
              
              <button 
                onClick={() => setCreatorSubTab('board')}
                className={`relative px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] border transition-all duration-300 rounded-lg overflow-hidden ${
                  creatorSubTab === 'board' 
                    ? 'bg-[#a374ff]/10 border-[#a374ff] text-[#a374ff] shadow-[0_0_15px_rgba(163,116,255,0.2)]' 
                    : 'bg-zinc-950/40 border-white/10 text-zinc-500 hover:text-white hover:border-white/20'
                }`}
              >
                <div className="absolute top-0 left-0 w-1 h-1 bg-[#a374ff]" />
                Bounty Board
              </button>
            </div>

            {/* CREATOR TAB 1: DIRECT OPS */}
            {creatorSubTab === "direct" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Creator Controls */}
              <div className="lg:col-span-4 space-y-6">
                <Card className="relative overflow-hidden border border-white/5">
                  <div className="cyber-corners" />
                  <h4 className="text-white font-bold uppercase text-xs tracking-wider mb-6 font-mono border-b border-white/5 pb-2">FORGE_CONTROLS</h4>
                  <div className="space-y-3">
                    <Button 
                      onClick={() => setIsUploadModalOpen(true)}
                      className="w-full h-12 bg-white/5 border border-white/10 hover:border-[#3dbca1] hover:bg-[#3dbca1]/10 text-white hover:text-white rounded-xl uppercase text-[10px] font-bold tracking-widest transition-all duration-300"
                    >
                      <Plus className="w-4 h-4 mr-2" /> Upload new product
                    </Button>
                    <Link to="/home/marketplace" className="block w-full">
                      <Button className="w-full h-12 bg-white/5 border border-white/10 hover:border-[#3dbca1] hover:bg-[#3dbca1]/10 text-white hover:text-white rounded-xl uppercase text-[10px] font-bold tracking-widest transition-all duration-300">
                        <Eye className="w-4 h-4 mr-2" /> View Vault List
                      </Button>
                    </Link>
                  </div>
                </Card>

                {/* Upload Modal (Modernized overlay) */}
                <AnimatePresence>
                  {isUploadModalOpen && (
                    <motion.div 
                      className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.div 
                        className="bg-zinc-950 border border-white/10 p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto relative rounded-2xl shadow-2xl"
                        initial={{ scale: 0.95, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                      >
                        <div className="cyber-scanline" />
                        <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-3">
                          <h3 className="text-xl font-black uppercase text-white flex items-center gap-3">
                            <Upload className="w-5 h-5 text-[#3dbca1]" />
                            INITIALIZE_VAULT_DROP
                          </h3>
                          <button onClick={() => setIsUploadModalOpen(false)} className="text-zinc-500 hover:text-white transition-all">
                            <Plus className="w-6 h-6 rotate-45" />
                          </button>
                        </div>

                        <form onSubmit={handleCreatePoster} className="space-y-6">
                          <div className="space-y-2">
                            <Label className="text-[9px] uppercase tracking-widest text-zinc-400 font-mono">Product Name (Identity)</Label>
                            <Input 
                              required
                              value={newPoster.title}
                              onChange={(e) => setNewPoster({...newPoster, title: e.target.value})}
                              className="bg-zinc-900 border-white/10 rounded-lg h-11 uppercase text-xs text-white" 
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-[9px] uppercase tracking-widest text-zinc-400 font-mono">Valuation (₹)</Label>
                              <Input 
                                required
                                type="number"
                                value={newPoster.price}
                                onChange={(e) => setNewPoster({...newPoster, price: e.target.value})}
                                className="bg-zinc-900 border-white/10 rounded-lg h-11 text-xs text-white" 
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[9px] uppercase tracking-widest text-zinc-400 font-mono">Classification</Label>
                              <select 
                                value={newPoster.entityType}
                                onChange={(e) => setNewPoster({...newPoster, entityType: e.target.value as any})}
                                className="w-full h-11 bg-zinc-900 border border-white/10 rounded-lg text-xs uppercase text-white px-3 font-mono"
                              >
                                <option value="Poster">Poster / Artwork</option>
                                <option value="Server">Server / Infrastructure</option>
                                <option value="Service">Digital Service</option>
                                <option value="BazaarItem">The Bazaar (Merch)</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-[9px] uppercase tracking-widest text-zinc-400 font-mono">Asset URL (Image/Visual Link)</Label>
                            <Input 
                              required
                              value={newPoster.imageUrl}
                              onChange={(e) => setNewPoster({...newPoster, imageUrl: e.target.value})}
                              placeholder="Direct image URL..." 
                              className="bg-zinc-900 border-white/10 rounded-lg h-11 text-xs text-white" 
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-[9px] uppercase tracking-widest text-zinc-400 font-mono">Brief Description</Label>
                            <textarea 
                              value={newPoster.description}
                              onChange={(e) => setNewPoster({...newPoster, description: e.target.value})}
                              className="w-full h-24 bg-zinc-900 border border-white/10 rounded-lg p-3 text-xs outline-none focus:ring-1 focus:ring-[#3dbca1] text-white"
                              placeholder="Detail product features or design spec limitations..."
                            />
                          </div>

                          <Button type="submit" disabled={isSubmitting} className="w-full h-11 bg-[#3dbca1] text-black font-black uppercase text-xs tracking-widest hover:bg-white hover:text-black">
                            {isSubmitting ? 'TRANSMITTING...' : 'Confirm Upload'}
                          </Button>
                        </form>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Creator incoming requisitions */}
              <div className="lg:col-span-8">
                <Card className="border border-white/5">
                  <div className="p-5 border-b border-white/5 bg-white/[0.02]">
                    <h3 className="text-[11px] font-bold uppercase text-white tracking-[0.25em]">INCOMING_REQUISITIONS</h3>
                  </div>
                  <div className="max-h-[800px] overflow-y-auto custom-scrollbar divide-y divide-white/5">
                    {incomingRequests.length > 0 ? (
                      incomingRequests.map((req) => (
                        <div key={req.id} className="p-6">
                          <div className="flex justify-between items-start gap-4 mb-2">
                            <h4 className="font-bold text-white uppercase text-sm tracking-wider">{req.title}</h4>
                            <span className="text-xs font-mono font-bold text-[#3dbca1]">₹{req.budget || 0}</span>
                          </div>
                          <p className="text-[9px] text-zinc-500 uppercase font-mono font-bold mb-4">CLIENT: {req.clientName || 'anonymous'} // DEADLINE: {req.deadline || 'N/A'} DAYS</p>
                          <p className="text-zinc-300 text-xs mb-4 leading-relaxed">{req.notes}</p>
                          {req.specs?.description && (
                            <p className="text-zinc-400 text-xs mb-4 italic">"{DOMPurify.sanitize(req.specs.description.normalize('NFKC'))}"</p>
                          )}
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => handleUpdateBriefStatus(req.id, 'Approved')} 
                              className="h-8 bg-[#3dbca1] text-black text-[9px] uppercase px-4 hover:bg-white rounded-lg font-bold border-none"
                            >
                              Accept
                            </Button>
                            <Button 
                              onClick={() => handleUpdateBriefStatus(req.id, 'Rejected')} 
                              className="h-8 bg-zinc-900 text-red-500 hover:text-red-400 text-[9px] uppercase px-4 hover:bg-zinc-850 rounded-lg border-none"
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-zinc-600 uppercase text-[9px] font-mono">NO DIRECT REQUISITIONS FOUND</div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
            )}

            {/* CREATOR TAB 2: BOUNTY BOARD */}
            {creatorSubTab === "board" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-12">
                  <Card className="border border-white/5">
                    <div className="p-5 border-b border-white/5 bg-white/[0.02]">
                      <h3 className="text-[11px] font-bold uppercase text-white tracking-[0.25em]">SYNDICATE_BOUNTY_BOARD</h3>
                    </div>
                    <div className="max-h-[800px] overflow-y-auto custom-scrollbar divide-y divide-white/5">
                      {bounties.length > 0 ? (
                        bounties.map((b) => (
                          <div key={b.id} className="p-6">
                            <div className="flex justify-between items-start gap-4 mb-2">
                              <h4 className="font-bold text-white uppercase text-sm tracking-wider">{b.title}</h4>
                              <span className="text-xs font-mono font-bold text-[#3dbca1]">₹{b.budget}</span>
                            </div>
                            <p className="text-[9px] text-zinc-500 uppercase font-mono font-bold mb-4">CLIENT: {b.clientName || 'anonymous'} // DEADLINE: {b.deadline} DAYS</p>
                            <p className="text-zinc-300 text-xs mb-5 leading-relaxed">{b.notes}</p>
                            
                            {activeBountyId === b.id ? (
                              <form onSubmit={(e) => handleSubmitBid(e, b.id)} className="space-y-4 bg-zinc-950/60 p-4 border border-white/5 rounded-xl">
                                <h5 className="text-[10px] uppercase text-[#3dbca1] font-mono font-bold">SUBMIT_BID_PROPOSAL</h5>
                                
                                <div className="space-y-2">
                                  <Label className="text-[9px] uppercase text-zinc-400 font-mono">YOUR_QUOTE (₹)</Label>
                                  <Input 
                                    required type="number" 
                                    value={bidForm.quote} 
                                    onChange={e => setBidForm({...bidForm, quote: e.target.value})}
                                    className="bg-black border-white/10 rounded-lg h-10 text-xs focus-visible:ring-[#3dbca1] text-white" 
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-[9px] uppercase text-zinc-400 font-mono">PROPOSAL_NOTES</Label>
                                  <textarea 
                                    required 
                                    value={bidForm.notes} 
                                    onChange={e => setBidForm({...bidForm, notes: e.target.value})}
                                    className="w-full bg-black border border-white/10 rounded-lg text-xs p-3 text-zinc-300 h-20 focus:border-[#3dbca1] outline-none transition-all" 
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button type="submit" disabled={isSubmitting} className="h-9 bg-[#3dbca1] text-black text-[9px] uppercase px-4 hover:bg-white rounded-lg font-bold border-none">
                                    {isSubmitting ? 'SUBMITTING...' : 'Confirm Bid'}
                                  </Button>
                                  <Button type="button" onClick={() => setActiveBountyId(null)} className="h-9 bg-zinc-900 text-zinc-400 hover:text-white text-[9px] uppercase px-4 hover:bg-zinc-850 rounded-lg border-none">
                                    Cancel
                                  </Button>
                                </div>
                              </form>
                            ) : (
                              <Button 
                                onClick={() => setActiveBountyId(b.id)}
                                className="h-8 bg-[#3dbca1]/10 text-[#3dbca1] hover:bg-[#3dbca1] hover:text-black uppercase text-[9px] font-bold transition-all duration-300 rounded-lg px-4 border border-[#3dbca1]/20 hover:border-transparent"
                              >
                                Submit Bid
                              </Button>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-zinc-600 uppercase text-[9px] font-mono">NO ACTIVE BOUNTIES LISTED ON THE BOARD</div>
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`relative bg-zinc-950/60 backdrop-blur-xl border border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-2xl p-6 lg:p-8 overflow-hidden group hover:border-[#3dbca1]/20 transition-all duration-500 ${className}`}>
      <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-zinc-800 group-hover:border-[#3dbca1] transition-all duration-300" />
      <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-zinc-800 group-hover:border-[#3dbca1] transition-all duration-300" />
      <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-zinc-800 group-hover:border-[#3dbca1] transition-all duration-300" />
      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-zinc-800 group-hover:border-[#3dbca1] transition-all duration-300" />
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.01] to-transparent opacity-100 pointer-events-none" />
      {children}
    </div>
  );
}
