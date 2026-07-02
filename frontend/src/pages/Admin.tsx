import React, { useState, useEffect } from "react";
import { Plus, Image as ImageIcon, Settings, Trash2, Edit, Package, ShieldAlert } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { motion } from "motion/react";
import { useAuth } from "../components/AuthProvider";
import { authFetch } from "../lib/authFetch";
import { logSystemError } from "../lib/logger";
import DOMPurify from "dompurify";

export default function Admin() {
  const { user, userData, login } = useAuth();
  
  const [posters, setPosters] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [creators, setCreators] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newPoster, setNewPoster] = useState({ 
    title: "", 
    price: "", 
    status: "Active", 
    imageUrl: "", 
    entityType: "Service",
    description: "",
    keywords: ""
  });
  const [loadingBase, setLoadingBase] = useState(true);

  // Passcode Protection Gate
  const [passcode, setPasscode] = useState("");
  const [isPasscodeAuthorized, setIsPasscodeAuthorized] = useState(
    sessionStorage.getItem("admin_authorized") === "true"
  );
  const [passcodeError, setPasscodeError] = useState(false);

  const handleVerifyPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === "615") {
      sessionStorage.setItem("admin_authorized", "true");
      setIsPasscodeAuthorized(true);
      setPasscodeError(false);
    } else {
      setPasscodeError(true);
      setPasscode("");
    }
  };

  // Check if current user is admin OR if they entered the passcode for this session
  const isAdmin = userData?.roles?.includes('admin') || isPasscodeAuthorized;

  useEffect(() => {
    if (!isAdmin) return;

    const fetchData = async () => {
      try {
        const pRes = await authFetch('/api/products');
        if (pRes.ok) setPosters(await pRes.json());
        
        const oRes = await authFetch('/api/orders');
        if (oRes.ok) setOrders(await oRes.json());

        const uRes = await authFetch('/api/users');
        if (uRes.ok) {
          const users = await uRes.json();
          setCreators(users.filter((u: any) => u.roles?.includes('creator')));
        }
        
        const aRes = await authFetch('/api/applications');
        if (aRes.ok) {
          setApplications(await aRes.json());
        }

        const lRes = await authFetch('/api/logs');
        if (lRes.ok) {
          setSystemLogs(await lRes.json());
        }
      } catch (err) {
        console.error("Failed to fetch admin dashboard data:", err);
      } finally {
        setLoadingBase(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  const handleGrantAdmin = async () => {
    if (!user) return login();
    try {
      const uRes = await authFetch('/api/users');
      if (uRes.ok) {
        const users = await uRes.json();
        const me = users.find((u: any) => u.uid === user.uid);
        const roles = me?.roles || [];
        if (!roles.includes('admin')) {
          await authFetch(`/api/users/override-role`, {
             method: 'POST',
             body: JSON.stringify({ uid: user.uid, role: 'admin' })
          });
        }
      }
      alert("Admin privileges granted. Refreshing constraints.");
    } catch (err: any) {
      await logSystemError("handleGrantAdmin", err);
      alert("An error occurred during override. Admins have been notified.");
    }
  };

  const handleAddPoster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPoster.title && newPoster.price && user) {
      try {
        const newDoc = {
          title: newPoster.title,
          price: Number(newPoster.price),
          status: newPoster.status,
          imageUrl: newPoster.imageUrl,
          creatorId: user.uid,
          creatorName: "Club 615 Foundry",
          entityType: newPoster.entityType,
          description: "",
          keywords: newPoster.keywords.split(',').map(k => k.trim()).filter(Boolean),
          createdAt: new Date().toISOString()
        };
        await authFetch('/api/products', {
          method: 'POST',
          body: JSON.stringify(newDoc)
        });
        setNewPoster({ title: "", price: "", status: "Active", imageUrl: "", entityType: "Service", description: "", keywords: "" });
        setIsAdding(false);
      } catch (err: any) {
        await logSystemError("handleAddPoster", err);
        alert("Failed to add product. Error logged for admins.");
      }
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await authFetch(`/api/products/${id}`, { method: 'DELETE' });
    } catch (err: any) {
      await logSystemError("handleDelete product", err);
      alert("Failed to delete product. Error logged.");
    }
  };

  const handleDownloadLogs = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(systemLogs, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `615_system_logs_${new Date().getTime()}.json`);
    dlAnchorElem.click();
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await authFetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err: any) {
      await logSystemError("updateOrderStatus", err);
      alert("Failed to update order status. Error logged.");
    }
  };


  const handleApproveApplication = async (appId: string, uid: string, tier: number) => {
    try {
      const res = await authFetch(`/api/applications/${appId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status: 'approved', tier, uid })
      });
      if (res.ok) {
        setApplications(apps => apps.map(a => a.id === appId ? { ...a, status: 'approved', tier } : a));
        alert('Creator approved successfully!');
      }
    } catch (err: any) {
      await logSystemError("handleApproveApplication", err);
      alert("Failed to approve. Error logged.");
    }
  };

  const handleRejectApplication = async (appId: string) => {
    try {
      const res = await authFetch(`/api/applications/${appId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status: 'rejected' })
      });
      if (res.ok) {
        setApplications(apps => apps.map(a => a.id === appId ? { ...a, status: 'rejected' } : a));
      }
    } catch (err: any) {
      await logSystemError("handleRejectApplication", err);
      alert("Failed to reject. Error logged.");
    }
  };

  if (!isPasscodeAuthorized) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center font-sans p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md border border-[#ef3836]/50 bg-black p-8 shadow-[0_0_30px_rgba(239,56,54,0.15)] relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ef3836_1px,transparent_1px),linear-gradient(to_bottom,#ef3836_1px,transparent_1px)] bg-[size:1rem_1rem] opacity-[0.03] pointer-events-none"></div>
          <div className="relative z-10 text-center space-y-6">
            <ShieldAlert className="w-16 h-16 text-[#ef3836] mx-auto" />
            <div>
              <h2 className="text-[#ef3836] uppercase tracking-widest font-bold font-heading text-xl">SYS_GATE: ADMIN OVERRIDE</h2>
              <p className="text-zinc-500 text-[10px] uppercase tracking-widest mt-1">Enter operator clearance key to unlock database.</p>
            </div>
            
            <form onSubmit={handleVerifyPasscode} className="space-y-4">
              <div className="space-y-1 text-left">
                <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block">Operator Clearance Key</label>
                <input 
                  type="password"
                  required
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="CLEARANCE_KEY"
                  className="w-full px-4 h-12 bg-zinc-900 border border-white/10 focus:border-[#ef3836] text-white rounded-2xl text-xs tracking-widest uppercase focus:outline-none"
                />
              </div>
              {passcodeError && (
                <p className="text-[#ef3836] text-[10px] uppercase tracking-wider font-bold"> clearance verification failed: invalid key</p>
              )}
              <Button 
                type="submit"
                className="w-full h-12 bg-[#ef3836] text-white hover:bg-[#d32f2f] rounded-2xl uppercase font-bold tracking-widest transition-all duration-300"
              >
                Validate Key
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center font-sans p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md border border-[#ef3836]/50 bg-black p-8 shadow-[0_0_30px_rgba(239,56,54,0.15)] relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ef3836_1px,transparent_1px),linear-gradient(to_bottom,#ef3836_1px,transparent_1px)] bg-[size:1rem_1rem] opacity-[0.03] pointer-events-none"></div>
          <div className="relative z-10 text-center">
            <ShieldAlert className="w-16 h-16 text-[#ef3836] mx-auto mb-6" />
            <h2 className="text-[#ef3836] uppercase tracking-widest font-bold mb-4 font-heading text-xl">System Auth Required</h2>
            <p className="text-zinc-500 text-xs uppercase tracking-widest mb-8">
              Access denied. Developer override required to instantiate administrator privileges.
            </p>
            <Button 
              onClick={handleGrantAdmin} 
              className="w-full h-12 bg-transparent border border-[#ef3836] text-[#ef3836] hover:bg-[#ef3836] hover:text-white rounded-2xl uppercase font-bold tracking-widest transition-all duration-300"
            >
              Override & Grant Access
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 px-4 sm:px-8 pb-8 pt-28 font-sans">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 border-b border-[#3dbca1]/30 pb-6 flex justify-between items-end flex-wrap gap-4"
        >
          <div>
            <h1 className="text-4xl font-heading uppercase text-white mb-2">
              <span className="text-[#3dbca1]">Admin</span> Dashboard
            </h1>
            <p className="text-zinc-500 uppercase tracking-widest text-sm">System Backend Terminal v1.0</p>
          </div>
          <Button 
            onClick={() => setIsAdding(!isAdding)}
            className="bg-[#3dbca1] text-black hover:bg-[#2eaa8e] font-bold uppercase rounded-2xl h-12 px-6"
          >
            {isAdding ? "Cancel" : <><Plus className="w-4 h-4 mr-2" /> New Drop</>}
          </Button>
        </motion.div>

        <Tabs defaultValue="products" className="w-full">
          <TabsList className="bg-zinc-900 border border-white/10 rounded-2xl mb-8 w-full justify-start h-14 overflow-x-auto">
            <TabsTrigger value="applications" className="data-[state=active]:bg-[#ef3836] data-[state=active]:text-white rounded-2xl uppercase tracking-widest font-bold px-8 h-full">Applications</TabsTrigger>
            <TabsTrigger value="products" className="data-[state=active]:bg-[#3dbca1] data-[state=active]:text-black rounded-2xl uppercase tracking-widest font-bold px-8 h-full">Products</TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-[#3dbca1] data-[state=active]:text-black rounded-2xl uppercase tracking-widest font-bold px-8 h-full">Orders</TabsTrigger>
            <TabsTrigger value="portfolios" className="data-[state=active]:bg-[#3dbca1] data-[state=active]:text-black rounded-2xl uppercase tracking-widest font-bold px-8 h-full">Portfolios</TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-red-500 data-[state=active]:text-black text-xs uppercase tracking-widest font-black rounded-2xl">
              <ShieldAlert className="w-3 h-3 inline mr-1" />
              System Logs
            </TabsTrigger>
            <TabsTrigger value="database" className="data-[state=active]:bg-[#3dbca1] data-[state=active]:text-black rounded-2xl uppercase tracking-widest font-bold px-8 h-full">Database Logs</TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-[#3dbca1] data-[state=active]:text-black rounded-2xl uppercase tracking-widest font-bold px-8 h-full">System</TabsTrigger>
          </TabsList>

          <TabsContent value="applications" className="space-y-6">
            <h2 className="text-2xl font-heading uppercase text-white mb-6 tracking-wide flex items-center gap-2">
              <ShieldAlert className="text-[#ef3836] w-6 h-6" /> Creator Applications
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {applications.filter(a => a.status === 'pending').map(app => (
                <Card key={app.id} className="bg-zinc-900 border-white/10 rounded-2xl hover:border-[#ef3836]/50 transition-all duration-300 ease-in-out">
                  <CardHeader>
                    <CardTitle className="text-[#ef3836] font-sans text-lg uppercase tracking-widest">
                      {app.username}
                    </CardTitle>
                    <CardDescription className="text-zinc-500 font-sans text-xs">{app.email}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="text-xs uppercase tracking-widest text-zinc-400 mb-2">Submitted Artworks:</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {app.artworks.slice(0, 4).map((art: string, i: number) => (
                          <div key={i} className="text-[10px] text-zinc-300 truncate bg-black border border-white/10 p-2">
                            {art}
                          </div>
                        ))}
                      </div>
                      {app.artworks.length > 4 && (
                        <p className="text-[10px] text-zinc-500 mt-2">+{app.artworks.length - 4} more...</p>
                      )}
                    </div>
                    <div className="flex gap-2 pt-4 border-t border-white/10">
                      <Button onClick={() => handleApproveApplication(app.id, app.uid, 1)} className="flex-1 bg-[#3dbca1] text-black hover:bg-[#2eaa8e] rounded-2xl uppercase font-bold text-xs">
                        Approve Tier 1
                      </Button>
                      <Button onClick={() => handleApproveApplication(app.id, app.uid, 2)} className="flex-1 bg-[#fcaf3e] text-black hover:bg-[#e09935] rounded-2xl uppercase font-bold text-xs">
                        Approve Tier 2
                      </Button>
                      <Button onClick={() => handleRejectApplication(app.id)} className="flex-1 bg-transparent border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-2xl uppercase font-bold text-xs">
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {applications.filter(a => a.status === 'pending').length === 0 && (
                <div className="col-span-full py-12 text-center text-zinc-500 border border-white/10 bg-black/50">
                  <p className="uppercase tracking-widest text-xs font-bold">No pending applications</p>
                </div>
              )}
            </div>
            
            <h3 className="text-lg font-heading uppercase text-zinc-500 mt-12 mb-4 tracking-wide">Processed Applications</h3>
            <div className="space-y-2">
              {applications.filter(a => a.status !== 'pending').map(app => (
                <div key={app.id} className="flex items-center justify-between p-4 border border-white/10 bg-black">
                  <div>
                    <span className="font-bold text-white uppercase text-xs tracking-widest">{app.username}</span>
                    <span className="text-zinc-500 text-[10px] ml-4">{app.email}</span>
                  </div>
                  <div className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1 ${app.status === 'approved' ? 'text-[#3dbca1] border border-[#3dbca1]/30 bg-[#3dbca1]/10' : 'text-zinc-500 border border-zinc-700'}`}>
                    {app.status} {app.tier ? `(T${app.tier})` : ''}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="products">
            {isAdding && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8 overflow-hidden"
              >
                <Card className="bg-zinc-900 border-[#fcaf3e]/50 rounded-2xl shadow-[0_0_15px_rgba(252,175,62,0.1)]">
                  <CardHeader>
                    <CardTitle className="uppercase text-[#fcaf3e] font-heading text-2xl tracking-wider">Initialize New Drop</CardTitle>
                    <CardDescription className="text-zinc-400 font-sans">Establish new product parameters in the database.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddPoster} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="title" className="text-zinc-300 uppercase tracking-widest text-xs">Designation</Label>
                          <Input 
                            id="title" 
                            value={newPoster.title}
                            onChange={(e) => setNewPoster({ ...newPoster, title: e.target.value })}
                            className="bg-zinc-950 border-white/10 rounded-2xl focus-visible:ring-[#fcaf3e] h-12" 
                            placeholder="e.g. Akira Red" 
                            required 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="price" className="text-zinc-300 uppercase tracking-widest text-xs">Value (USD)</Label>
                          <Input 
                            id="price" 
                            type="number"
                            value={newPoster.price}
                            onChange={(e) => setNewPoster({ ...newPoster, price: e.target.value })}
                            className="bg-zinc-950 border-white/10 rounded-2xl focus-visible:ring-[#fcaf3e] h-12" 
                            placeholder="e.g. 45" 
                            min="0"
                            required 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="type" className="text-zinc-300 uppercase tracking-widest text-xs">Classification</Label>
                          <select 
                            id="type"
                            value={newPoster.entityType}
                            onChange={(e) => setNewPoster({...newPoster, entityType: e.target.value})}
                            className="w-full h-12 bg-zinc-950 border border-white/10 rounded-2xl px-3 uppercase text-xs focus:ring-[#fcaf3e] outline-none"
                          >
                            <option value="Service">Vault (Service)</option>
                            <option value="BazaarItem">Bazaar (Merch)</option>
                            <option value="Digital Service">Digital Service</option>
                            <option value="Consultation">Consultation</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="imageUrl" className="text-zinc-300 uppercase tracking-widest text-xs">Image Link</Label>
                          <Input 
                            id="imageUrl" 
                            type="url"
                            value={newPoster.imageUrl}
                            onChange={(e) => setNewPoster({ ...newPoster, imageUrl: e.target.value })}
                            className="bg-zinc-950 border-white/10 rounded-2xl focus-visible:ring-[#fcaf3e] h-12" 
                            placeholder="https://..." 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="keywords" className="text-zinc-300 uppercase tracking-widest text-xs">Keywords (Comma Separated)</Label>
                          <Input 
                            id="keywords" 
                            type="text"
                            value={newPoster.keywords}
                            onChange={(e) => setNewPoster({ ...newPoster, keywords: e.target.value })}
                            className="bg-zinc-950 border-white/10 rounded-2xl focus-visible:ring-[#fcaf3e] h-12" 
                            placeholder="e.g. Design, Web, Minimalist" 
                          />
                        </div>
                      </div>
                      <Button type="submit" className="w-full bg-[#fcaf3e] text-black hover:bg-[#eda136] rounded-2xl font-bold uppercase tracking-widest h-12 mt-4">
                        Deploy to Grid
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            <div className="bg-zinc-900 border border-white/10">
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-zinc-950/50">
                <h3 className="uppercase tracking-widest text-zinc-400 font-bold">Active Inventory</h3>
                <span className="text-xs bg-[#3dbca1]/20 text-[#3dbca1] px-3 py-1 uppercase tracking-widest border border-[#3dbca1]/50">Live</span>
              </div>
              <div className="divide-y divide-zinc-800">
                {posters.map((poster) => (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={poster.id} 
                    className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-zinc-800/50 transition-all duration-300 ease-in-out group"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 w-full sm:w-auto">
                      <div className="w-16 h-20 shrink-0 bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-600 overflow-hidden">
                        {poster.imageUrl ? (
                          <img src={poster.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-8 h-8" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-white mb-1 uppercase tracking-wide group-hover:text-[#3dbca1] transition-all duration-300 ease-in-out">{poster.title}</h4>
                        <div className="flex gap-4 text-sm text-zinc-500 items-center">
                          <span className="flex items-center gap-1"><span className="text-[#fcaf3e]">$</span>{poster.price}</span>
                          <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded-sm uppercase tracking-widest">{poster.entityType}</span>
                        </div>
                        {poster.keywords && poster.keywords.length > 0 && (
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {poster.keywords.map((k: string, i: number) => (
                              <span key={i} className="text-[8px] uppercase tracking-widest px-1.5 py-0.5 bg-zinc-800/50 text-[#3dbca1] border border-[#3dbca1]/20">
                                {k}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 opacity-50 group-hover:opacity-100 transition-opacity">
                      <Button onClick={() => handleDelete(poster.id)} variant="ghost" size="icon" className="text-zinc-400 hover:text-[#ef3836] hover:bg-[#ef3836]/10 hover:border-[#ef3836]/50 border border-transparent rounded-2xl">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
                {posters.length === 0 && !loadingBase && (
                  <div className="p-12 text-center text-zinc-500 uppercase tracking-widest">
                    No active drops found in the grid.
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="orders">
             <div className="bg-zinc-900 border border-white/10">
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-zinc-950/50">
                <h3 className="uppercase tracking-widest text-zinc-400 font-bold">Fulfillment Orders</h3>
              </div>
              <div className="divide-y divide-zinc-800">
                {orders.map((order) => (
                  <div key={order.id} className="p-6 flex flex-col md:flex-row justify-between gap-6 hover:bg-zinc-800/30 transition-all duration-300 ease-in-out">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[10px] bg-zinc-800 text-white px-2 py-0.5 uppercase font-bold tracking-widest">
                          #{order.id.slice(-8).toUpperCase()}
                        </span>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h5 className="text-white font-bold uppercase tracking-wide text-sm mb-1">{order.items?.map((i:any) => i.title).join(', ')}</h5>
                      <p className="text-[#fcaf3e] text-xs font-bold uppercase tracking-widest">TOTAL: ${order.total}</p>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2 shrink-0 md:w-64">
                       <Label className="text-[10px] uppercase tracking-widest text-zinc-500">Logistics Override</Label>
                       <select 
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className={`w-full h-10 bg-black border rounded-2xl px-3 text-xs uppercase font-bold outline-none
                            ${order.status === 'Order_Confirmed' ? 'border-[#3dbca1] text-[#3dbca1]' : ''}
                            ${order.status === 'Printing_Processing' ? 'border-[#fcaf3e] text-[#fcaf3e]' : ''}
                            ${order.status === 'Dispatched' ? 'border-[#9b51e0] text-[#9b51e0]' : ''}
                            ${order.status === 'Out_for_Delivery' ? 'border-[#ef3836] text-[#ef3836]' : ''}
                            ${order.status === 'Delivered' ? 'border-zinc-700 text-zinc-500' : ''}
                          `}
                       >
                         <option value="Payment_Pending">Payment Pending</option>
                         <option value="Order_Confirmed">Order Confirmed</option>
                         <option value="Printing_Processing">Printing / Processing</option>
                         <option value="Dispatched">Dispatched</option>
                         <option value="Out_for_Delivery">Out for Delivery</option>
                         <option value="Delivered">Delivered</option>
                       </select>
                    </div>
                  </div>
                ))}
                {orders.length === 0 && (
                   <div className="p-12 text-center text-zinc-500 uppercase tracking-widest">
                    No transit logs found.
                  </div>
                )}
              </div>
             </div>
          </TabsContent>

          <TabsContent value="portfolios">
             <div className="bg-zinc-900 border border-white/10">
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-zinc-950/50">
                <h3 className="uppercase tracking-widest text-zinc-400 font-bold">Creator Portfolios</h3>
              </div>
              <div className="divide-y divide-zinc-800">
                {creators.map((c) => (
                  <div key={c.uid} className="p-6 flex flex-col md:flex-row justify-between gap-6 hover:bg-zinc-800/30 transition-all duration-300 ease-in-out">
                    <div className="flex gap-4 items-start">
                      <div className="w-12 h-12 border border-zinc-700 overflow-hidden bg-zinc-950 p-0.5">
                        <img src={c.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${c.displayName}`} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="text-white font-bold uppercase text-sm">{DOMPurify.sanitize((c.displayName || '').normalize('NFKC'))}</h4>
                          <span className="text-[8px] border border-zinc-850 px-2 py-0.5 uppercase tracking-widest text-zinc-500">
                            {c.email}
                          </span>
                        </div>
                        <p className="text-[#9b51e0] text-[10px] uppercase font-black tracking-widest mt-1">
                          {DOMPurify.sanitize((c.tagline || 'NO TAGLINE').normalize('NFKC'))}
                        </p>
                        <p className="text-zinc-400 text-xs mt-2 max-w-xl font-sans leading-relaxed">
                          {DOMPurify.sanitize((c.bio || 'No bio configured.').normalize('NFKC'))}
                        </p>
                      </div>
                    </div>

                    <div className="md:w-72 space-y-2 text-right">
                      <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Layout Codes Configuration</p>
                      {c.portfolioConfig ? (
                        <div className="bg-black/60 p-3 border border-zinc-850 text-left font-sans text-[9px] text-[#3dbca1] overflow-x-auto max-h-24 scrollbar-thin">
                          <p className="font-bold text-zinc-500 mb-1">
                            Theme: [F: {c.portfolioConfig.theme?.font || 'orb'} | A: {c.portfolioConfig.theme?.accent || 'em'} | S: {c.portfolioConfig.theme?.scanlines ? 'Y' : 'N'}]
                          </p>
                          {c.portfolioConfig.blocks?.map((block: any, idx: number) => (
                            <div key={idx} className="truncate">
                              Block {idx + 1}: {block.type === 'h' ? 'Hero Banner' : block.type === 'b' ? 'Bio Profile' : block.type === 'g' ? 'Works' : block.type === 'l' ? 'Blog' : block.type === 'c' ? 'Custom' : 'Links'} 
                              {block.font ? ` [f: ${block.font}]` : ''}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-zinc-650 text-[10px] uppercase tracking-widest italic block">
                          No Custom Portfolio Layout Configured
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {creators.length === 0 && (
                   <div className="p-12 text-center text-zinc-500 uppercase tracking-widest">
                    No creator nodes indexed in grid directory.
                  </div>
                )}
              </div>
             </div>
          </TabsContent>

          <TabsContent value="database">
            <Card className="bg-zinc-900 border-white/10 rounded-2xl mb-6">
              <CardHeader className="border-b border-white/10 bg-zinc-950">
                <CardTitle className="uppercase text-[#3dbca1] font-heading text-xl tracking-wider flex items-center justify-between">
                  <span>Raw Database State Logs</span>
                  <span className="text-[10px] text-zinc-500 font-sans tracking-widest animate-pulse border border-[#3dbca1]/20 px-2 py-1 bg-[#3dbca1]/10">LIVE SYNC</span>
                </CardTitle>
                <CardDescription className="text-zinc-500 font-sans text-[10px]">Real-time reflection of the central JSON persistence layer (updates every 5s).</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800">
                  <div className="p-4">
                    <h4 className="text-[10px] uppercase font-bold text-zinc-400 mb-3 tracking-widest">Products / Services</h4>
                    <pre className="bg-black p-4 text-[10px] text-[#3dbca1] font-sans overflow-auto h-[500px] border border-white/10 custom-scrollbar">
                      {JSON.stringify(posters, null, 2)}
                    </pre>
                  </div>
                  <div className="p-4">
                    <h4 className="text-[10px] uppercase font-bold text-zinc-400 mb-3 tracking-widest">Global Orders</h4>
                    <pre className="bg-black p-4 text-[10px] text-[#fcaf3e] font-sans overflow-auto h-[500px] border border-white/10 custom-scrollbar">
                      {JSON.stringify(orders, null, 2)}
                    </pre>
                  </div>
                  <div className="p-4">
                    <h4 className="text-[10px] uppercase font-bold text-zinc-400 mb-3 tracking-widest">Registered Creators</h4>
                    <pre className="bg-black p-4 text-[10px] text-[#9b51e0] font-sans overflow-auto h-[500px] border border-white/10 custom-scrollbar">
                      {JSON.stringify(creators, null, 2)}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="bg-zinc-900 border-white/10 rounded-2xl">
              <CardContent className="h-[400px] flex items-center justify-center text-zinc-500 uppercase tracking-widest font-sans text-sm flex-col gap-4">
                <Settings className="w-8 h-8 opacity-20 animate-pulse" />
                Deeper Access Restricted
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs">
            <Card className="bg-zinc-900 border-white/10 rounded-2xl text-red-500">
              <CardHeader className="border-b border-red-500/20 bg-red-950/20 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-sans uppercase tracking-[0.2em] font-black flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5" /> 
                    System Watchdog Logs
                  </CardTitle>
                  <CardDescription className="text-red-400/60 font-sans mt-1">Fatal exceptions caught by the AI Watchdog ErrorBoundary.</CardDescription>
                </div>
                <Button onClick={handleDownloadLogs} className="bg-red-500 hover:bg-red-600 text-black uppercase tracking-widest text-xs font-black rounded-2xl">
                  Download All Logs (.JSON)
                </Button>
              </CardHeader>
              <CardContent className="p-0 font-sans">
                {systemLogs.length === 0 ? (
                  <div className="p-8 text-center text-red-500/50 uppercase tracking-widest text-xs">
                    No exceptions logged in database.
                  </div>
                ) : (
                  <div className="divide-y divide-red-900/50">
                    {systemLogs.map((log: any, idx: number) => (
                      <div key={idx} className="p-4 hover:bg-red-950/20 transition-all duration-300 ease-in-out">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-black uppercase tracking-widest bg-red-500 text-black px-2 py-0.5">
                            EXCEPTION
                          </span>
                          <span className="text-[10px] text-red-500/60 uppercase">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-sm font-bold text-red-400 mb-2">{log.error}</div>
                        <div className="text-xs text-red-300/60 break-all mb-4 border-l-2 border-red-500/30 pl-2">
                          URL: {log.url}
                        </div>
                        <div className="bg-black/50 p-3 rounded-2xl overflow-x-auto text-[10px] text-red-400/80 leading-relaxed">
                          {log.componentStack || log.stack || 'No stack trace available.'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

