import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, 
  Heart, 
  Bookmark, 
  Settings, 
  LogOut, 
  Package, 
  Users,
  ChevronRight,
  Clock,
  FileText,
  Cpu,
  Box
} from 'lucide-react';
import { useAuth } from '../components/AuthProvider';
import { authFetch } from '../lib/authFetch';
import { logSystemError } from '../lib/logger';
import DOMPurify from 'dompurify';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
export default function Terminal() {
  const { user, userData, loading, login, logout, updateUserProfile, activeMode, setActiveMode } = useAuth();
  const [savedPosters, setSavedPosters] = useState<any[]>([]);
  
  // Boot Sequence States
  const [booting, setBooting] = useState(true);
  useEffect(() => {
    if (loading) return;
  }, [loading, user, userData]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [isWishlistPublic, setIsWishlistPublic] = useState(false);
  const [orders, setOrders] = useState<any[]>([]); // buyer's placed orders
  const [creatorOrders, setCreatorOrders] = useState<any[]>([]); // orders for creator's products
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  // Profile Editor Form State
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editNickname, setEditNickname] = useState("");
  const [editTagline, setEditTagline] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editLinks, setEditLinks] = useState("");
  const [editKeywords, setEditKeywords] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Sync profile data when userData is loaded
  useEffect(() => {
    if (userData) {
      setEditDisplayName(userData.displayName || user?.displayName || "");
      setEditNickname(userData.nickname || "");
      setEditTagline(userData.tagline || "");
      setEditBio(userData.bio || "");
      setEditLinks(userData.links || "");
      setEditKeywords(userData.keywords?.join(", ") || "");
    }
  }, [userData, user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    setSaveSuccess(false);
    setSaveError("");
    try {
      await updateUserProfile({
        displayName: editDisplayName,
        nickname: editNickname,
        tagline: editTagline,
        bio: editBio,
        links: editLinks,
        keywords: editKeywords.split(',').map(k => k.trim()).filter(Boolean)
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message || "Failed to update profile parameters.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Creator Application States
  const [appState, setAppState] = useState<'form' | 'vetting' | 'approved'>('form');
  const [artworks, setArtworks] = useState<string[]>(Array(10).fill(''));
  const [vettingLogs, setVettingLogs] = useState<string[]>([]);

  // Creator Dashboard - New Design States
  const [isAddingDesign, setIsAddingDesign] = useState(false);
  const [newDesign, setNewDesign] = useState({
    title: '',
    price: '',
    imageUrl: '',
    description: ''
  });

  const handleAddDesign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesign.title || !newDesign.price || !user) return;

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newDesign.title,
          price: Number(newDesign.price),
          imageUrl: newDesign.imageUrl,
          description: newDesign.description,
          creatorId: user.uid,
          creatorName: userData?.displayName || user.displayName || 'Club Creator',
          entityType: 'Poster',
          status: 'Active'
        })
      });
      if (res.ok) {
        setNewDesign({ title: '', price: '', imageUrl: '', description: '' });
        setIsAddingDesign(false);
        // Refresh products list
        const prodRes = await fetch('/api/products');
        if (prodRes.ok) {
          const prods = await prodRes.json();
          setSavedPosters(prods.filter((p: any) => p.creatorId === user.uid));
        }
      } else {
        const data = await res.json();
        await logSystemError("handleAddDesign", data.error);
        alert("Failed to upload design. Admins have been notified.");
      }
    } catch (err: any) {
      await logSystemError("handleAddDesign network", err);
      alert("Network error. Admins have been notified.");
    }
  };

  const handleApplyCreator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (artworks.filter(a => a.trim() !== '').length < 3) {
      alert("Please provide details/titles for at least 3 artworks.");
      return;
    }

    setAppState('vetting');
    setVettingLogs([]);

    const logsList = [
      "SYS_VETTING: Establishing cryptographic pipeline to node...",
      "SYS_VETTING: Retrieving artwork manifests (10 nodes submitted)...",
      "SYS_VETTING: Analyzing design vector 1/10: " + artworks[0] + " - PASS",
      "SYS_VETTING: Analyzing design vector 2/10: " + artworks[1] + " - PASS",
      "SYS_VETTING: Analyzing design vector 3/10: " + artworks[2] + " - PASS",
      "SYS_VETTING: Analyzing design vector 4/10: " + artworks[3] + " - PASS",
      "SYS_VETTING: Analyzing design vector 5/10: " + artworks[4] + " - PASS",
      "SYS_VETTING: Analyzing design vector 6/10: " + artworks[5] + " - PASS",
      "SYS_VETTING: Analyzing design vector 7/10: " + artworks[6] + " - PASS",
      "SYS_VETTING: Analyzing design vector 8/10: " + artworks[7] + " - PASS",
      "SYS_VETTING: Analyzing design vector 9/10: " + artworks[8] + " - PASS",
      "SYS_VETTING: Analyzing design vector 10/10: " + artworks[9] + " - PASS",
      "SYS_VETTING: Vetting verification complete. Style matrix meets Syndicate standards.",
      "SYS_VETTING: Transmitting application to Administrator nodes...",
      "SYS_VETTING: Awaiting manual operator clearance."
    ];

    let currentLogIndex = 0;
    const interval = setInterval(() => {
      if (currentLogIndex < logsList.length) {
        setVettingLogs(prev => [...prev, logsList[currentLogIndex]]);
        currentLogIndex++;
      } else {
        clearInterval(interval);
        submitRoleUpgrade();
      }
    }, 400);
  };

  const submitRoleUpgrade = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          uid: user.uid, 
          username: userData?.displayName || user.displayName || 'Unknown',
          email: userData?.email || user.email || 'Unknown',
          artworks: artworks,
          status: 'pending'
        })
      });
      if (res.ok) {
        setAppState('approved');
      } else {
        const data = await res.json();
        await logSystemError("submitRoleUpgrade", data.error);
        alert("Application submission failed. Admins have been notified.");
        setAppState('form');
      }
    } catch (err: any) {
      await logSystemError("submitRoleUpgrade network", err);
      alert("Network error during application. Admins have been notified.");
      setAppState('form');
    }
  };

  const syncDashboardData = async () => {
    if (!user) return;
    try {
      // Fetch creator's uploaded products
      const prodRes = await authFetch('/api/products');
      if (prodRes.ok) {
        const prods = await prodRes.json();
        setSavedPosters(prods.filter((p: any) => p.creatorId === user.uid));
      }

      // Fetch wishlist
      const wishRes = await fetch(`/api/users/${user.uid}/wishlist`, {
        credentials: 'include'
      });
      if (wishRes.ok) {
        const wishData = await wishRes.json();
        setWishlist(wishData.items || []);
        setIsWishlistPublic(wishData.isPublic !== undefined ? wishData.isPublic : true);
      }

      // Always fetch BUYER orders (orders this user placed)
      const buyerRes = await fetch(`/api/orders/user/${user.uid}`, {
        credentials: 'include'
      });
      if (buyerRes.ok) {
        const buyerData = await buyerRes.json();
        setOrders(buyerData);
      }

      // If creator, also fetch incoming sales orders
      if (userData?.roles?.includes('creator')) {
        const salesRes = await fetch(`/api/orders/creator/${user.uid}`, {
          credentials: 'include'
        });
        if (salesRes.ok) {
          const salesData = await salesRes.json();
          setCreatorOrders(salesData);
        }
      }
    } catch (err) {
      console.error("Failed to sync terminal dashboard data:", err);
    }
  };

  useEffect(() => {
    syncDashboardData();
    const interval = setInterval(syncDashboardData, 30000);
    return () => clearInterval(interval);
  }, [user, userData]);

  const toggleWishlistVisibility = async () => {
    if (!user) return;
    try {
      const newPublicStatus = !isWishlistPublic;
      
      const putRes = await fetch(`/api/users/${user.uid}/wishlist`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ items: wishlist, isPublic: newPublicStatus })
      });

      if (putRes.ok) {
        setIsWishlistPublic(newPublicStatus);
      }
    } catch (err) {
      console.error("Failed to toggle wishlist visibility:", err);
    }
  };

  const handleUpdateRequestStatus = async (requestId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/requests/${requestId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        alert(`Request status updated to ${newStatus}`);
      } else {
        const data = await res.json();
        await logSystemError("handleUpdateRequestStatus", data.error);
        alert("Error updating request status. Admins have been notified.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const seedSampleData = async () => {
    if (!user) return;
    const samples = [
      {
        title: "NEON SYNDICATE 01",
        price: 45,
        imageUrl: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=1000&auto=format&fit=crop",
        creatorId: user.uid,
        creatorName: userData?.displayName || "Alpha Node",
        entityType: "Poster",
        createdAt: new Date().toISOString()
      },
      {
        title: "VOID RUNNER 2049",
        price: 55,
        imageUrl: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000&auto=format&fit=crop",
        creatorId: user.uid,
        creatorName: userData?.displayName || "Alpha Node",
        entityType: "Poster",
        createdAt: new Date().toISOString()
      },
      {
        title: "615 CLUB JACKET",
        price: 120,
        imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1000&auto=format&fit=crop",
        creatorId: user.uid,
        creatorName: userData?.displayName || "Alpha Node",
        entityType: "BazaarItem",
        createdAt: new Date().toISOString()
      }
    ];

    for (const s of samples) {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(s)
      });
    }
    alert("Sample Artifacts Deployed.");
  };

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center font-sans text-xs text-[#00ffcc] tracking-widest relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,255,204,0.1)_0%,transparent_70%)]" />
      <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1 }}>
        SECURE GATEWAY SYNCING...
      </motion.div>
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 pt-20 font-sans relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,0,255,0.05)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full border border-[#3dbca1]/30 bg-black/60 backdrop-blur-xl p-10 shadow-[0_0_50px_rgba(61,188,161,0.1)] text-center relative z-10"
      >
        <User className="w-16 h-16 text-[#3dbca1] mx-auto mb-6 animate-pulse" />
        <h1 className="text-2xl font-black text-white uppercase tracking-wide mb-4">Identity Verification Required</h1>
        <p className="text-zinc-400 text-xs mb-10 leading-relaxed">Access to the Terminal syndicate hub is restricted to verified patrons and creators.</p>
        <Button 
          onClick={login}
          className="w-full h-14 bg-[#3dbca1] text-black hover:bg-white font-black uppercase rounded-2xl transition-all duration-300 tracking-[0.2em]"
        >
          CONNECT IDENTITY
        </Button>
      </motion.div>
    </div>
  );



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Order_Confirmed': return 'text-[#3dbca1]';
      case 'Printing_Processing': return 'text-[#fcaf3e]';
      case 'Dispatched': return 'text-[#9b51e0]';
      case 'Out_for_Delivery': return 'text-[#ef3836]';
      case 'Delivered': return 'text-zinc-400 border-zinc-700';
      default: return 'text-zinc-500';
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 px-4 pb-4 md:px-8 md:pb-8 pt-28 font-sans relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(61,188,161,0.05)_0%,transparent_50%)] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(155,81,224,0.05)_0%,transparent_50%)] pointer-events-none mix-blend-screen" />
      <div className="max-w-7xl mx-auto relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-[#0f0a20]/60 backdrop-blur-2xl border border-white/10 rounded-xl overflow-hidden h-fit shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
              <div className="p-6 bg-zinc-900/40 border-b border-white/5 flex items-center gap-4 relative overflow-hidden">
                <img src={user.photoURL || ''} alt="" className="w-12 h-12 rounded-full border border-zinc-700 shadow-md relative z-20" />
                <div className="relative z-20">
                  <h3 className="font-bold text-white tracking-tight text-lg">{userData?.displayName || user.displayName}</h3>
                  <span className="text-[11px] text-[#3dbca1] border border-[#3dbca1]/30 bg-[#3dbca1]/10 px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                    {userData?.roles?.includes('creator') ? 'Syndicate Creator' : 'Verified Patron'}
                  </span>
                </div>
              </div>
              <CardContent className="p-3 space-y-1 relative z-20">
                {[
                  { id: 'overview', icon: User, label: 'Overview', show: true },
                  // Buyer tabs
                  { id: 'orders', icon: Package, label: 'My Orders', show: !userData?.roles?.includes('creator') || activeMode === 'buyer' },
                  { id: 'wishlist', icon: Heart, label: 'Wishlist', show: !userData?.roles?.includes('creator') || activeMode === 'buyer' },
                  // Creator tabs
                  { id: 'vault', icon: Bookmark, label: 'My Drops', show: userData?.roles?.includes('creator') },
                  { id: 'fulfillment', icon: Box, label: 'Fulfillment', show: userData?.roles?.includes('creator') },
                  // Common
                  { id: 'following', icon: Users, label: 'Network', show: true },
                  ...(!userData?.roles?.includes('creator') ? [{ id: 'apply', icon: FileText, label: 'Apply', show: true }] : []),
                  { id: 'settings', icon: Settings, label: 'Params', show: true }
                ].filter(item => item.show).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold tracking-wide transition-all duration-300 rounded-lg ${activeTab === item.id ? 'bg-[#3dbca1]/10 text-[#3dbca1] shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </button>
                ))}
                <button 
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm uppercase tracking-widest text-[#ef3836] hover:bg-[#ef3836]/10 transition-all duration-300 ease-in-out mt-8"
                >
                  <LogOut className="w-4 h-4" />
                  Terminate Session
                </button>
              </CardContent>
            </Card>

            {userData?.roles?.includes('creator') && (
              <Card className="bg-zinc-900/30 border-[#9b51e0]/30 rounded-2xl h-fit p-6 border border-dashed space-y-3">
                <p className="text-zinc-400 text-[10px] uppercase mb-1 tracking-widest font-bold">Creator Grid Access</p>
                <Link to="/custom-requests" className="block">
                  <Button className="w-full bg-transparent border border-[#9b51e0] text-[#9b51e0] hover:bg-[#9b51e0] hover:text-white rounded-2xl uppercase font-black text-[10px] tracking-widest h-11 transition-all">
                    Open The Forge
                  </Button>
                </Link>
                <Link to={`/home/portfolio/${user.uid}`} className="block">
                  <Button className="w-full bg-[#3dbca1] hover:bg-[#2eaa8e] text-black font-black uppercase text-[10px] tracking-widest h-11 rounded-2xl transition-all">
                    Customize Portfolio
                  </Button>
                </Link>
                <div className="pt-4 border-t border-white/10">
                  <Button 
                    onClick={() => setActiveMode(activeMode === 'creator' ? 'buyer' : 'creator')}
                    className={`w-full h-12 uppercase tracking-widest font-bold text-xs rounded-2xl transition-all border ${activeMode === 'creator' ? 'bg-[#ef3836] hover:bg-[#d32f2f] text-white border-[#ef3836]' : 'bg-transparent text-[#fcaf3e] border-[#fcaf3e] hover:bg-[#fcaf3e] hover:text-black'}`}
                  >
                    Switch to {activeMode === 'creator' ? 'Buyer Mode' : 'Creator Mode'}
                  </Button>
                </div>
              </Card>
            )}
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 hover:border-[#3dbca1]/50 transition-all duration-300 shadow-lg group relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      <p className="text-zinc-400 text-[11px] uppercase tracking-wider mb-2 font-semibold group-hover:text-white transition-all duration-300 ease-in-out">Saved Drops</p>
                      <h4 className="text-4xl font-black text-white">{savedPosters.length}</h4>
                    </Card>
                    <Card className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 hover:border-[#3dbca1]/50 transition-all duration-300 shadow-lg group relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      <p className="text-zinc-400 text-[11px] uppercase tracking-wider mb-2 font-semibold group-hover:text-[#3dbca1] transition-all duration-300 ease-in-out">Network Nodes</p>
                      <h4 className="text-4xl font-black text-white">{userData?.followingCount || 0}</h4>
                    </Card>
                    <Card className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 hover:border-[#3dbca1]/50 transition-all duration-300 shadow-lg group relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      <p className="text-zinc-400 text-[11px] uppercase tracking-wider mb-2 font-semibold group-hover:text-amber-400 transition-all duration-300 ease-in-out">
                        {userData?.roles?.includes('creator') && activeMode === 'creator' ? 'Incoming Orders' : 'Pending Transit'}
                      </p>
                      <h4 className="text-4xl font-black text-white">
                        {userData?.roles?.includes('creator') && activeMode === 'creator'
                          ? creatorOrders.filter(o => o.status !== 'Delivered').length
                          : orders.filter(o => o.status !== 'Delivered').length}
                      </h4>
                    </Card>
                  </div>

                  <Card className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-4 md:p-8 shadow-lg relative z-20">
                    <CardHeader className="border-b border-white/5 bg-transparent pb-4">
                      <CardTitle className="text-sm uppercase tracking-widest font-semibold text-[#3dbca1]">Operator Credentials</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <span className="text-[11px] text-zinc-500 uppercase tracking-widest block font-semibold">System Name / Display Name</span>
                          <span className="text-white text-base font-semibold block tracking-wide">{userData?.displayName || user?.displayName || 'N/A'}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[11px] text-zinc-500 uppercase tracking-widest block font-semibold">Alias / Nickname</span>
                          <span className="text-white text-base font-semibold block tracking-wide">{userData?.nickname || 'NONE'}</span>
                        </div>
                      </div>

                      {userData?.roles?.includes('creator') && (
                        <>
                          <div className="border-t border-white/5 my-4"></div>
                          <div className="space-y-4">
                            <div className="space-y-1">
                              <span className="text-[11px] text-zinc-500 uppercase tracking-widest block font-semibold">Creator Tagline</span>
                              <span className="text-amber-400 text-sm font-semibold tracking-wide block">{DOMPurify.sanitize((userData?.tagline || 'NO TAGLINE DEFINED').normalize('NFKC'))}</span>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[11px] text-zinc-500 uppercase tracking-widest block font-semibold">Creator Bio</span>
                              <p className="text-zinc-300 text-sm leading-relaxed max-w-2xl">{DOMPurify.sanitize((userData?.bio || 'No bio configured in settings.').normalize('NFKC'))}</p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[11px] text-zinc-500 uppercase tracking-widest block font-semibold">Linked Platforms (Portfolio / Socials)</span>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {userData?.links ? (
                                  userData.links.split(',').map((link: string, idx: number) => {
                                    const trimmed = DOMPurify.sanitize(link.trim().normalize('NFKC'));
                                    if (!trimmed) return null;
                                    const href = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
                                    return (
                                      <a
                                        key={idx}
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[#3dbca1] hover:bg-[#3dbca1]/10 transition-all duration-300 ease-in-out text-xs border border-white/10 rounded-full px-3 py-1 font-semibold tracking-wide"
                                      >
                                        {trimmed.replace(/https?:\/\/(www\.)?/, '')}
                                      </a>
                                    );
                                  })
                                ) : (
                                  <span className="text-zinc-600 italic text-xs">No links linked to node.</span>
                                )}
                              </div>
                            </div>
                            <div className="pt-6 border-t border-white/5 flex justify-end">
                              <Link to={`/home/portfolio/${user.uid}`}>
                                <Button className="bg-[#3dbca1] hover:bg-[#2eaa8e] text-black font-bold uppercase tracking-wider h-10 px-6 rounded-lg transition-all shadow-md">
                                  Customize Public Page
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-4 md:p-8 shadow-lg relative z-20">
                    <CardHeader className="border-b border-white/5 bg-transparent pb-4">
                      <CardTitle className="text-sm uppercase tracking-widest font-semibold text-[#3dbca1]">Active Transits</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {orders.length > 0 ? (
                        <div className="divide-y divide-zinc-800">
                          {orders.filter(o => o.status !== 'Delivered').map((order) => (
                            <div key={order.id} className="p-6 flex flex-col md:flex-row justify-between gap-6">
                              <div>
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="text-[10px] text-zinc-500">#{order.id.slice(-8).toUpperCase()}</span>
                                  <span className={`text-[10px] uppercase font-bold tracking-widest ${getStatusColor(order.status)}`}>
                                    {order.status.replace(/_/g, ' ')}
                                  </span>
                                </div>
                                <h5 className="text-white font-bold uppercase tracking-tight">{order.items?.[0]?.title} {order.items?.length > 1 && `+ ${order.items.length - 1} more`}</h5>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right hidden md:block">
                                  <p className="text-[10px] text-zinc-500 uppercase mb-1">ETA Unknown</p>
                                  <p className="text-white font-bold">₹ {order.total}</p>
                                </div>
                                <Button variant="outline" className="rounded-2xl border-white/10 text-xs h-10 px-4 uppercase tracking-widest hover:bg-zinc-900">
                                  Trace
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-12 text-center text-zinc-600 uppercase tracking-widest text-xs italic">
                          No active transits detected in the grid.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {activeTab === 'wishlist' && (
                <motion.div
                  key="wishlist"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/10 pb-4 gap-4">
                    <div>
                      <h3 className="text-2xl font-black uppercase text-white">Identity Wishlist</h3>
                      <p className="text-zinc-500 text-[10px] uppercase tracking-widest mt-1">Curated artifacts you intend to acquire.</p>
                    </div>
                    <div className="flex items-center gap-4">
                      {isWishlistPublic && (
                        <Link 
                          to={`/wishlist/${user.uid}`}
                          className="text-[10px] text-[#3dbca1] hover:underline uppercase tracking-widest font-bold"
                        >
                          View Public Link
                        </Link>
                      )}
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${isWishlistPublic ? 'text-[#3dbca1]' : 'text-[#ef3836]'}`}>
                        {isWishlistPublic ? 'UNLOCKED / PUBLIC' : 'LOCKED / PRIVATE'}
                      </span>
                      <Button 
                        onClick={toggleWishlistVisibility}
                        variant="outline" 
                        className="rounded-lg border-zinc-700 hover:border-zinc-500 text-[10px] h-8 px-4 uppercase tracking-widest font-semibold transition-all"
                      >
                        Toggle Visibility
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {wishlist.map((item: any) => (
                      <div key={item.id} className="group relative aspect-square border border-white/10 bg-[#0f0a20] rounded-xl overflow-hidden shadow-lg hover:shadow-[0_0_20px_rgba(0,255,204,0.3)] transition-all">
                        <img src={item.imageUrl} alt="" className="w-full h-full object-cover opacity-40 group-hover:opacity-100 transition-all" />
                        <div className="absolute inset-0 p-4 flex flex-col justify-between">
                          <div className="flex justify-between">
                            <span className="text-[10px] bg-black/80 px-2 py-1 text-white uppercase font-bold tracking-widest">WISH</span>
                          </div>
                          <div>
                            <p className="text-white font-bold uppercase text-[10px] tracking-widest truncate">{item.title}</p>
                            <p className="text-[#3dbca1] text-[10px] font-bold mt-1">₹ {item.price}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {wishlist.length === 0 && (
                      <div className="col-span-full py-20 text-center border-2 border-dashed border-white/10">
                        <Heart className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                        <p className="text-zinc-600 uppercase tracking-widest text-sm">No items in wishlist</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'vault' && (
                <motion.div
                  key="vault"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-end border-b border-white/10 pb-4 gap-4">
                    <div>
                      <h3 className="text-2xl font-black uppercase text-white">Your Personal Vault</h3>
                      <p className="text-zinc-500 text-[10px] uppercase tracking-widest mt-1">
                        {userData?.roles?.includes('creator') 
                          ? 'Manage your uploaded designs and deploy new products.' 
                          : 'Designs you have acquired or created.'}
                      </p>
                    </div>
                    <div className="flex gap-4">
                      {userData?.roles?.includes('creator') && (
                        <Button
                          onClick={() => setIsAddingDesign(!isAddingDesign)}
                          className="bg-[#3dbca1] text-black hover:bg-[#2eaa8e] font-bold uppercase text-[11px] tracking-wider rounded-lg h-10 px-6 shrink-0 shadow-md transition-all"
                        >
                          {isAddingDesign ? "Cancel" : "Upload Design"}
                        </Button>
                      )}
                      <span className="text-zinc-500 text-xs uppercase tracking-widest self-end font-semibold">{savedPosters.length} Items</span>
                    </div>
                  </div>

                  {isAddingDesign && userData?.roles?.includes('creator') && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }} 
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-[#3dbca1]/50 bg-black/50 backdrop-blur-xl p-6 space-y-4 rounded-xl"
                    >
                      <h4 className="text-sm font-black text-[#3dbca1] uppercase tracking-widest">Deploy New Art Artifact</h4>
                      <form onSubmit={handleAddDesign} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
                          <div className="space-y-1">
                            <Label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block">Designation (Title)</Label>
                            <Input
                              type="text"
                              required
                              value={newDesign.title}
                              onChange={(e) => setNewDesign({ ...newDesign, title: e.target.value })}
                              placeholder="e.g. SYSTEM_OVERDRIVE"
                              className="bg-black/50 border border-white/10 rounded-lg p-3 text-xs uppercase focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block">Sell Value (USD)</Label>
                            <Input
                              type="number"
                              required
                              value={newDesign.price}
                              onChange={(e) => setNewDesign({ ...newDesign, price: e.target.value })}
                              placeholder="e.g. 50"
                              className="bg-black/50 border border-white/10 rounded-lg p-3 text-xs focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1 md:col-span-2">
                            <Label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block">Vector Image URL</Label>
                            <Input
                              type="url"
                              value={newDesign.imageUrl}
                              onChange={(e) => setNewDesign({ ...newDesign, imageUrl: e.target.value })}
                              placeholder="https://images.unsplash.com/..."
                              className="bg-black/50 border border-white/10 rounded-lg p-3 text-xs focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1 md:col-span-2">
                            <Label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block">Artifact Description</Label>
                            <textarea
                              value={newDesign.description}
                              onChange={(e) => setNewDesign({ ...newDesign, description: e.target.value })}
                              placeholder="Describe the aesthetic and specs of this design vector..."
                              className="w-full h-24 bg-black/50 border border-white/10 rounded-lg p-3 text-xs font-sans focus:outline-none"
                            />
                          </div>
                        </div>
                        <Button
                          type="submit"
                          className="w-full h-12 bg-[#3dbca1] hover:bg-[#2eaa8e] text-black rounded-lg font-bold uppercase tracking-wider transition-all shadow-md"
                        >
                          Transmit Design to Vault Grid
                        </Button>
                      </form>
                    </motion.div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {savedPosters.map((poster) => (
                      <div key={poster.id} className="group relative aspect-[3/4] border border-white/10 bg-zinc-900/50 hover:border-[#3dbca1] transition-all rounded-xl overflow-hidden">
                        <img src={poster.imageUrl} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-white font-bold uppercase text-xs tracking-widest mb-1 truncate">{DOMPurify.sanitize((poster.title || '').normalize('NFKC'))}</p>
                          <p className="text-[#3dbca1] text-[10px] font-bold uppercase mb-2">By {DOMPurify.sanitize((poster.creatorName || '').normalize('NFKC'))}</p>
                          {poster.description && (
                            <p className="text-zinc-400 text-[8px] uppercase tracking-wider mb-4 line-clamp-2">{DOMPurify.sanitize((poster.description || '').normalize('NFKC'))}</p>
                          )}
                          <span className="text-[#fcaf3e] font-bold text-xs mb-2 block">₹ {poster.price}</span>
                          <Button className="w-full h-8 bg-white text-black hover:bg-zinc-200 text-[10px] font-bold uppercase rounded-lg shadow-sm transition-all">Buy Now</Button>
                        </div>
                      </div>
                    ))}
                    {savedPosters.length === 0 && (
                      <div className="col-span-full py-20 text-center border-2 border-dashed border-white/10 rounded-xl">
                        <Bookmark className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                        <p className="text-zinc-600 uppercase tracking-widest text-sm">Vault is currently empty</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'fulfillment' && (
                <motion.div
                  key="fulfillment"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-end border-b border-white/10 pb-4">
                    <div>
                      <h3 className="text-2xl font-black uppercase text-white">Fulfillment Terminal</h3>
                      <p className="text-zinc-500 text-[10px] uppercase tracking-widest mt-1">Incoming sales from buyers — mark as shipped when dispatched.</p>
                    </div>
                    <span className="text-[#3dbca1] font-black text-sm">{creatorOrders.filter(o => o.status !== 'Delivered').length} pending</span>
                  </div>
                  
                  {creatorOrders.length > 0 ? (
                    <div className="space-y-4">
                      {creatorOrders.map((order) => (
                        <Card key={order.id} className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden hover:border-zinc-700 transition-all duration-300 ease-in-out">
                          <div className="p-6 bg-zinc-900/20 flex flex-col md:flex-row gap-6">
                            <div className="flex-grow">
                              <div className="flex items-center gap-3 mb-4">
                                <span className="bg-zinc-800 text-zinc-400 text-[10px] px-2 py-1 uppercase font-bold tracking-widest rounded-md">ORDER #{order.id.slice(-8).toUpperCase()}</span>
                                <span className={`text-[10px] uppercase font-black tracking-widest ${getStatusColor(order.status)}`}>
                                  {order.status.replace(/_/g, ' ')}
                                </span>
                              </div>
                              
                              {/* Progress Tracker */}
                              <div className="relative mt-8 mb-4">
                                <div className="h-[2px] w-full bg-zinc-800 absolute top-1/2 -translate-y-1/2" />
                                <div className="flex justify-between relative z-10">
                                  {['Order_Confirmed', 'Printing_Processing', 'Dispatched', 'Delivered'].map((step, idx) => {
                                    const steps = ['Order_Confirmed', 'Printing_Processing', 'Dispatched', 'Out_for_Delivery', 'Delivered'];
                                    const currentIdx = steps.indexOf(order.status);
                                    const stepIdx = steps.indexOf(step);
                                    const isCompleted = stepIdx <= currentIdx;
                                    const isCurrent = stepIdx === currentIdx;

                                    return (
                                      <div key={step} className="flex flex-col items-center">
                                        <div className={`w-3 h-3 rounded-full border-2 border-black transition-all duration-500 ${isCompleted ? 'bg-[#3dbca1] shadow-[0_0_10px_#3dbca1]' : 'bg-zinc-800'}`} />
                                        <span className={`mt-2 text-[8px] uppercase tracking-widest font-bold ${isCurrent ? 'text-white' : 'text-zinc-600'} hidden sm:block`}>
                                          {step.split('_')[0]}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                            <div className="md:w-48 flex flex-col md:items-end justify-between border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6 gap-2">
                               <div className="text-right mb-2">
                                  <p className="text-[10px] text-zinc-500 uppercase mb-1">Total Identity Value</p>
                                  <p className="text-white font-bold uppercase text-lg">₹ {order.total}</p>
                                </div>
                                {activeMode === 'creator' && order.status !== 'Delivered' && (
                                  <Button 
                                    onClick={async () => {
                                      try {
                                        const nextStatus = order.status === 'Order_Confirmed' || order.status === 'Printing_Processing'
                                          ? 'Dispatched' 
                                          : 'Delivered';
                                        const res = await fetch(`/api/orders/${order.id}/status`, {
                                          method: 'PUT',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ status: nextStatus })
                                        });
                                        if (res.ok) {
                                          syncDashboardData();
                                        }
                                      } catch (err) {
                                        console.error(err);
                                      }
                                    }}
                                    className="w-full bg-[#3dbca1] text-black hover:bg-white font-black uppercase text-[11px] h-10 rounded-lg transition-all duration-300 ease-in-out"
                                  >
                                    {order.status === 'Order_Confirmed' || order.status === 'Printing_Processing' ? 'SHIP ITEM' : 'DELIVER ITEM'}
                                  </Button>
                                )}
                                <Button className="w-full bg-transparent border border-zinc-700 text-white rounded-lg uppercase text-[11px] font-bold tracking-wider h-10 hover:bg-zinc-800 transition-all duration-300 ease-in-out">
                                  Get Manifest
                                </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 text-center border-2 border-dashed border-white/10 rounded-xl">
                      <Package className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                      <p className="text-zinc-600 uppercase tracking-widest text-sm">No incoming orders yet</p>
                      <p className="text-zinc-700 text-[10px] uppercase tracking-widest mt-2">When buyers purchase your products, orders will appear here.</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'orders' && (
                <motion.div
                  key="orders"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-end border-b border-white/10 pb-4">
                    <div>
                      <h3 className="text-2xl font-black uppercase text-white">My Orders</h3>
                      <p className="text-zinc-500 text-[10px] uppercase tracking-widest mt-1">Orders you have placed — track your shipments here.</p>
                    </div>
                    <span className="text-[#fcaf3e] font-black text-sm">{orders.filter(o => o.status !== 'Delivered').length} in transit</span>
                  </div>

                  {orders.length > 0 ? (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <Card key={order.id} className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden hover:border-zinc-700 transition-all duration-300 ease-in-out">
                          <div className="p-6 bg-zinc-900/20 flex flex-col md:flex-row gap-6">
                            <div className="flex-grow">
                              <div className="flex items-center gap-3 mb-4">
                                <span className="bg-zinc-800 text-zinc-400 text-[10px] px-2 py-1 uppercase font-bold tracking-widest rounded-md">ORDER #{order.id.slice(-8).toUpperCase()}</span>
                                <span className={`text-[10px] uppercase font-black tracking-widest ${getStatusColor(order.status)}`}>
                                  {order.status.replace(/_/g, ' ')}
                                </span>
                              </div>
                              <h5 className="text-white font-bold uppercase tracking-tight mb-1">{order.items?.[0]?.title}{order.items?.length > 1 && ` + ${order.items.length - 1} more`}</h5>
                              <p className="text-zinc-500 text-[10px] uppercase tracking-widest">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                              {/* Progress Tracker */}
                              <div className="relative mt-6 mb-2">
                                <div className="h-[2px] w-full bg-zinc-800 absolute top-1/2 -translate-y-1/2" />
                                <div className="flex justify-between relative z-10">
                                  {['Order_Confirmed', 'Printing_Processing', 'Dispatched', 'Delivered'].map((step) => {
                                    const steps = ['Order_Confirmed', 'Printing_Processing', 'Dispatched', 'Out_for_Delivery', 'Delivered'];
                                    const currentIdx = steps.indexOf(order.status);
                                    const stepIdx = steps.indexOf(step);
                                    const isCompleted = stepIdx <= currentIdx;
                                    const isCurrent = stepIdx === currentIdx;
                                    return (
                                      <div key={step} className="flex flex-col items-center">
                                        <div className={`w-3 h-3 rounded-full border-2 border-black transition-all duration-500 ${isCompleted ? 'bg-[#3dbca1] shadow-[0_0_10px_#3dbca1]' : 'bg-zinc-800'}`} />
                                        <span className={`mt-2 text-[7px] uppercase tracking-widest font-bold ${isCurrent ? 'text-white' : 'text-zinc-600'} hidden sm:block`}>
                                          {step.split('_')[0]}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                            <div className="md:w-40 flex flex-col md:items-end justify-between border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6 gap-2">
                              <div className="text-right">
                                <p className="text-[10px] text-zinc-500 uppercase mb-1">Total</p>
                                <p className="text-white font-bold text-lg">₹ {order.total}</p>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 text-center border-2 border-dashed border-white/10 rounded-xl">
                      <Package className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                      <p className="text-zinc-600 uppercase tracking-widest text-sm">No orders placed yet</p>
                      <p className="text-zinc-700 text-[10px] uppercase tracking-widest mt-2">Head to the Vault to acquire items.</p>
                    </div>
                  )}
                </motion.div>
              )}
              {activeTab === 'following' && (
                <motion.div
                  key="following"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-end border-b border-white/10 pb-4">
                    <h3 className="text-2xl font-black uppercase text-white">Network Sync</h3>
                  </div>
                  <div className="py-20 text-center border-2 border-dashed border-white/10 rounded-xl">
                    <Users className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                    <p className="text-zinc-600 uppercase tracking-widest text-sm">No active node connections.</p>
                  </div>
                </motion.div>
              )}

              {activeTab === 'apply' && (
                <motion.div
                  key="apply"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6 max-w-xl"
                >
                  <div className="flex justify-between items-end border-b border-white/10 pb-4">
                    <div>
                      <h3 className="text-2xl font-black uppercase text-white tracking-wide">Apply for Creator Node</h3>
                      <p className="text-zinc-500 text-[10px] uppercase tracking-widest mt-1">Submit a manifest of 10 original artworks for Syndicate validation.</p>
                    </div>
                  </div>

                  {appState === 'form' && (
                    <form onSubmit={handleApplyCreator} className="space-y-6 bg-black/50 backdrop-blur-xl border border-white/10 p-6 rounded-xl">
                      <p className="text-zinc-400 text-xs leading-relaxed uppercase tracking-wider mb-2">
                        To unlock creator privileges (posting designs to the Vault, fulfilling Forge custom briefs), you must list the titles or links of 10 original artwork vector nodes you have created.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {artworks.map((url, i) => (
                          <div key={i} className="space-y-2">
                            <Label className="text-[10px] text-zinc-500 uppercase tracking-widest">Artwork {i + 1}</Label>
                            <Input 
                              value={url}
                              onChange={(e) => {
                                const newArts = [...artworks];
                                newArts[i] = e.target.value;
                                setArtworks(newArts);
                              }}
                              placeholder="https://..."
                              className="bg-black/50 border-white/10 rounded-lg text-xs h-10 focus-visible:ring-[#00ffcc]"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center mt-8 pt-8 border-t border-white/5">
                        <Button variant="ghost" onClick={() => setAppState('form')} className="text-zinc-500 hover:text-white rounded-lg font-semibold uppercase tracking-wider">Cancel</Button>
                        <Button type="submit" disabled={artworks.filter(a => a.trim() !== '').length < 3} className="bg-[#3dbca1] text-black hover:bg-[#2eaa8e] rounded-lg uppercase font-bold tracking-wider h-12 px-8 shadow-md transition-all">
                          Transmit Creative Manifest (10 Nodes)
                        </Button>
                      </div>
                    </form>
                  )}

                  {appState === 'vetting' && (
                    <Card className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-8 text-center max-w-xl mx-auto shadow-[0_0_30px_rgba(0,255,204,0.15)] relative overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,255,204,0.1)_0%,transparent_50%)] pointer-events-none" />
                      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,6px_100%]" />
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[#3dbca1] text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#3dbca1] animate-ping shrink-0" />
                          <span>SYNAPSE_ANALYSIS: Processing artwork nodes...</span>
                        </div>
                        <div className="font-sans text-[10px] text-[#3dbca1]/80 space-y-1.5 h-56 overflow-y-auto border border-white/10 bg-zinc-950 p-4 scrollbar-thin">
                          {vettingLogs.map((log, idx) => (
                            <p key={idx} className="leading-relaxed animate-fade-in">{log}</p>
                          ))}
                        </div>
                      </div>
                      <div className="text-center text-[10px] text-zinc-500 uppercase tracking-widest">
                        Node elevation sequence active. Do not terminate connection.
                      </div>
                    </Card>
                  )}

                  {appState === 'approved' && (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 border-2 border-[#3dbca1] text-[#3dbca1] rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(61,188,161,0.2)]">
                           <Box className="w-8 h-8" />
                        </div>
                        <h3 className="text-[#3dbca1] font-heading uppercase text-xl mb-2 tracking-widest font-bold">Application Submitted</h3>
                        <p className="text-zinc-500 uppercase text-xs tracking-widest max-w-md mx-auto mb-8">
                          Your portfolio is now under review by Club 615 administrators. You will be granted access upon approval.
                        </p>
                        <Button 
                          onClick={() => setAppState('form')}
                          className="bg-transparent border border-[#3dbca1] text-[#3dbca1] hover:bg-[#3dbca1] hover:text-black rounded-lg uppercase font-bold tracking-wider transition-all"
                        >
                          Review Application
                        </Button>
                      </div>
                    )}
                </motion.div>
              )}

              {activeTab === 'settings' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="max-w-xl space-y-8"
                >
                  <div className="space-y-6 border border-white/10 bg-zinc-900/40 backdrop-blur-xl rounded-2xl p-6 shadow-lg">
                    <h3 className="text-sm font-semibold uppercase text-[#3dbca1] tracking-widest border-b border-white/10 pb-4">Profile Parameters</h3>
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[11px] uppercase tracking-widest text-zinc-500 font-semibold block">Display Name</label>
                        <input 
                          type="text"
                          required
                          value={editDisplayName}
                          onChange={(e) => setEditDisplayName(e.target.value)}
                          placeholder="DISPLAY_NAME"
                          className="w-full px-4 h-11 bg-zinc-900/50 border border-zinc-700 focus:border-[#3dbca1] text-white rounded-lg text-sm tracking-wide focus:outline-none transition-all duration-300 ease-in-out"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold block">Nickname / Alias</label>
                        <input 
                          type="text"
                          value={editNickname}
                          onChange={(e) => setEditNickname(e.target.value)}
                          placeholder="OPERATOR_ALIAS"
                          className="w-full px-4 h-11 bg-zinc-900/50 border border-zinc-700 focus:border-[#3dbca1] text-white rounded-lg text-sm tracking-wide focus:outline-none transition-all duration-300 ease-in-out"
                        />
                      </div>

                      {userData?.roles?.includes('creator') && (
                        <>
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase tracking-widest text-[#9b51e0] font-bold block">Creator Tagline</label>
                            <input 
                              type="text"
                              value={editTagline}
                              onChange={(e) => setEditTagline(e.target.value)}
                              placeholder="e.g. MARKETING ARTIST, DESIGN INTERFACE"
                              className="w-full px-4 h-11 bg-zinc-900/50 border border-zinc-700 focus:border-[#9b51e0] text-white rounded-lg text-sm tracking-wide focus:outline-none transition-all duration-300 ease-in-out"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] uppercase tracking-widest text-amber-400 font-semibold block">Skills / Keywords (Comma Separated)</label>
                            <input 
                              type="text"
                              value={editKeywords}
                              onChange={(e) => setEditKeywords(e.target.value)}
                              placeholder="e.g. Graphic Design, Web Dev, Figma, Cyberpunk"
                              className="w-full px-4 h-11 bg-zinc-900/50 border border-zinc-700 focus:border-[#3dbca1] text-white rounded-lg text-sm tracking-wide focus:outline-none transition-all duration-300 ease-in-out"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] uppercase tracking-widest text-amber-400 font-semibold block">Creator Bio</label>
                            <textarea 
                              value={editBio}
                              onChange={(e) => setEditBio(e.target.value)}
                              placeholder="Describe your capabilities and work profile..."
                              rows={4}
                              className="w-full p-4 bg-zinc-900/50 border border-zinc-700 focus:border-[#3dbca1] text-white rounded-lg text-sm tracking-wide focus:outline-none resize-none transition-all duration-300 ease-in-out"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] uppercase tracking-widest text-amber-400 font-semibold block">Hyperlinks (Comma-separated)</label>
                            <input 
                              type="text"
                              value={editLinks}
                              onChange={(e) => setEditLinks(e.target.value)}
                              placeholder="e.g. portfolio.net, github.com/user"
                              className="w-full px-4 h-11 bg-zinc-900/50 border border-zinc-700 focus:border-[#3dbca1] text-white rounded-lg text-sm tracking-wide focus:outline-none transition-all duration-300 ease-in-out"
                            />
                          </div>
                        </>
                      )}

                      {saveSuccess && (
                        <p className="text-[#3dbca1] text-[10px] uppercase tracking-wider font-bold">✓ Profile parameters updated successfully.</p>
                      )}
                      {saveError && (
                        <p className="text-[#ef3836] text-[10px] uppercase tracking-wider font-bold">⚠ Error: {saveError}</p>
                      )}

                      <Button 
                        type="submit"
                        disabled={savingProfile}
                        className="bg-[#3dbca1] text-black hover:bg-[#2eaa8e] disabled:bg-[#3dbca1]/50 rounded-lg uppercase font-bold tracking-wider h-12 w-full shadow-md transition-all"
                      >
                        {savingProfile ? "SAVING NODE DATA..." : "UPDATE NODE PARAMETERS"}
                      </Button>
                    </form>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-sm font-bold uppercase text-white tracking-widest border-b border-white/10 pb-2">Developer Tools</h3>
                    <div className="p-6 bg-zinc-900 border border-white/10 space-y-4">
                      <p className="text-zinc-500 text-[10px] uppercase tracking-widest mb-4">Initialize the synchronization grid with sample artifacts or override node roles.</p>
                      <Button 
                        onClick={seedSampleData}
                        className="bg-zinc-800 text-white hover:bg-[#3dbca1] rounded-2xl uppercase font-black text-[10px] tracking-widest h-12 w-full"
                      >
                        Deploy Sample Artifacts
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-sm font-bold uppercase text-white tracking-widest border-b border-white/10 pb-2">Account Params</h3>
                    <div className="space-y-4">
                      <Button onClick={logout} variant="outline" className="w-full h-12 border-white/10 text-[#ef3836] hover:bg-[#ef3836] hover:text-white rounded-2xl uppercase text-[10px] font-black tracking-widest">
                        Deauthorize Session
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
