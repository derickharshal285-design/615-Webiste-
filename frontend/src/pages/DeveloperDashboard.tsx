import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Cpu, 
  Database, 
  Truck, 
  Plus, 
  Trash2, 
  Settings, 
  Terminal as TerminalIcon, 
  UserCheck, 
  RefreshCw, 
  AlertTriangle,
  FileText,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../components/AuthProvider';
import { authFetch } from '../lib/authFetch';
import DOMPurify from 'dompurify';

export default function DeveloperDashboard() {
  const { user, userData } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'requests'>('overview');
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [systemLogs, setSystemLogs] = useState<string[]>([
    "SYS_INIT: Booting developer dashboard v1.0",
    "GRID_SYNC: Establishing Express API polling...",
    "AUTH_NET: Developer token verified."
  ]);

  // Form State
  const [newProduct, setNewProduct] = useState({
    title: '',
    price: '',
    entityType: 'Poster',
    imageUrl: '',
    description: ''
  });

  const [overrideUid, setOverrideUid] = useState(user?.uid || '');

  // Passcode Protection Gate
  const [passcode, setPasscode] = useState("");
  const [isPasscodeAuthorized, setIsPasscodeAuthorized] = useState(
    sessionStorage.getItem("admin_authorized") === "true"
  );
  const [passcodeError, setPasscodeError] = useState(false);

  const handleVerifyPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === "615club") {
      sessionStorage.setItem("admin_authorized", "true");
      setIsPasscodeAuthorized(true);
      setPasscodeError(false);
    } else {
      setPasscodeError(true);
      setPasscode("");
    }
  };

  // Log function
  const addLog = (msg: string) => {
    setSystemLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 15)]);
  };

  useEffect(() => {
    addLog("GRID_SYNC: Polling active. Syncing data with Firestore.");
    
    const fetchData = async () => {
      try {
        const pRes = await authFetch('/api/products');
        if (pRes.ok) setProducts(await pRes.json());

        const oRes = await authFetch('/api/orders');
        if (oRes.ok) setOrders(await oRes.json());

        const rRes = await authFetch('/api/requests');
        if (rRes.ok) setRequests(await rRes.json());
        
        setLoading(false);
      } catch (err: any) {
        addLog(`SYNC_ERROR: ${err.message}`);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // API Call: Add Product
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.title || !newProduct.price) return;
    
    addLog(`POST: Dispatching new product '${newProduct.title}' to Firestore...`);
    try {
      const res = await authFetch('/api/products', {
        method: 'POST',
        body: JSON.stringify({
          ...newProduct,
          price: Number(newProduct.price),
          creatorId: user?.uid || 'developer',
          creatorName: userData?.displayName || 'Club Developer',
          createdAt: new Date().toISOString()
        })
      });
      if (res.ok) {
        addLog("SUCCESS: Created new physical product asset.");
      } else {
        addLog("API Error adding product");
      }
      setNewProduct({ title: '', price: '', entityType: 'Poster', imageUrl: '', description: '' });
      setIsAdding(false);
    } catch (err: any) {
      addLog(`FETCH_FAILED: ${err.message}`);
    }
  };

  // API Call: Delete Product
  const handleDeleteProduct = async (id: string, title: string) => {
    addLog(`DELETE: Requesting deletion of product '${title}' (${id})...`);
    try {
      await authFetch(`/api/products/${id}`, { method: 'DELETE' });
      addLog(`API_SUCCESS: Product ${id} deleted.`);
    } catch (err: any) {
      addLog(`API_ERROR: ${err.message}`);
    }
  };

  // API Call: Update Order Status
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    addLog(`PUT: Updating order status for ${orderId} to '${status}'...`);
    try {
      await authFetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      addLog(`API_SUCCESS: Order status updated.`);
    } catch (err: any) {
      addLog(`FETCH_FAILED: ${err.message}`);
    }
  };

  // API Call: Update Brief Request Status
  const handleUpdateBriefStatus = async (requestId: string, status: string) => {
    addLog(`PUT: Updating brief status for ${requestId} to '${status}'...`);
    try {
      await authFetch(`/api/requests/${requestId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      addLog(`API_SUCCESS: Request status updated.`);
    } catch (err: any) {
      addLog(`API_ERROR: ${err.message}`);
    }
  };

  // API Call: Override Roles
  const handleOverrideRole = async (role: string) => {
    if (!overrideUid) return addLog("SYS_WARN: Override requires a user UID.");
    addLog(`POST: Initiating security role override: granting '${role}' to [${overrideUid}]...`);
    try {
      const res = await authFetch(`/api/users/override-role`, {
        method: 'POST',
        body: JSON.stringify({ uid: overrideUid, role: role })
      });
      if (res.ok) {
        addLog(`SUCCESS: Granted admin access to uid=${overrideUid}`);
      } else {
        const data = await res.json();
        addLog(`ERROR: ${data.error}`);
      }
      alert(`Roles overridden: ${role}. Refresh to update local context.`);
    } catch (err: any) {
      addLog(`API_ERROR: ${err.message}`);
    }
  };

  if (!isPasscodeAuthorized) {
    return (
      <div className="crt-screen min-h-screen bg-zinc-950 text-emerald-400 font-sans flex items-center justify-center p-4 pt-20">
        {/* Neon scanning background overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none -z-10"></div>
        {/* Scanline CRT overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,6px_100%]" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md border border-emerald-500/50 bg-black p-8 shadow-[0_0_30px_rgba(16,185,129,0.15)] relative overflow-hidden"
        >
          <div className="relative z-10 text-center space-y-6">
            <AlertTriangle className="w-16 h-16 text-emerald-400 mx-auto animate-pulse" />
            <div>
              <h2 className="text-emerald-300 uppercase tracking-widest font-bold font-heading text-xl crt-glow-green">SYS_GATE: CLEARANCE REQUIRED</h2>
              <p className="text-emerald-600 text-[10px] uppercase tracking-widest mt-1">Enter operator clearance key to authorize system access.</p>
            </div>
            
            <form onSubmit={handleVerifyPasscode} className="space-y-4">
              <div className="space-y-1 text-left">
                <label className="text-[9px] uppercase tracking-widest text-emerald-500 font-bold block">Clearance Key</label>
                <input 
                  type="password"
                  required
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="CLEARANCE_KEY"
                  className="w-full px-4 h-12 bg-zinc-900 border border-emerald-500/30 focus:border-emerald-400 text-emerald-300 rounded-2xl text-xs tracking-widest uppercase focus:outline-none"
                />
              </div>
              {passcodeError && (
                <p className="text-red-500 text-[10px] uppercase tracking-wider font-bold">CLEARANCE VERIFICATION FAILED: INVALID KEY</p>
              )}
              <Button 
                type="submit"
                className="w-full h-12 bg-emerald-500 text-black hover:bg-emerald-400 rounded-2xl uppercase font-bold tracking-widest transition-all duration-300"
              >
                Validate Operator Key
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="crt-screen min-h-screen bg-zinc-950 text-emerald-400 font-sans pt-28 pb-12 px-4 sm:px-6 lg:px-8">
      {/* Neon scanning background overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none -z-10"></div>
      
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Status Header */}
        <div className="border border-emerald-500/30 bg-emerald-950/10 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
          <div>
            <h1 className="text-3xl font-heading tracking-wider text-emerald-300 uppercase crt-glow-green">
              CLUB 615 // SYSTEM OPERATOR GRID
            </h1>
            <p className="text-emerald-500 text-xs uppercase tracking-[0.2em] mt-1">
              ADMIN CONTROL PANEL • VERSION 1.0.4
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4 text-xs font-bold">
            <div className="bg-emerald-950/40 border border-emerald-500/30 px-4 py-2 rounded-sm flex items-center gap-2">
              <Activity className="w-4 h-4 animate-pulse text-emerald-300" />
              <span>STATUS: ONLINE</span>
            </div>
            <div className="bg-emerald-950/40 border border-emerald-500/30 px-4 py-2 rounded-sm flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-300" />
              <span>DB_SYNC: ACTIVE</span>
            </div>
            <Link to="/developer/terminal">
              <Button className="bg-emerald-500 text-black hover:bg-emerald-400 font-bold uppercase rounded-2xl px-4 h-9">
                <TerminalIcon className="w-4 h-4 mr-2" /> Open Shell
              </Button>
            </Link>
          </div>
        </div>

        {/* Global Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "POSTERS IN GRID", value: products.filter(p => p.entityType === 'Poster').length, icon: Database },
            { label: "BAZAAR MERCH", value: products.filter(p => p.entityType === 'BazaarItem').length, icon: Database },
            { label: "FULFILLMENT LOGS", value: orders.length, icon: Truck },
            { label: "INCOMING BRIEFS", value: requests.length, icon: FileText }
          ].map((stat, i) => (
            <div key={i} className="border border-emerald-500/20 bg-black p-4 flex justify-between items-center">
              <div>
                <p className="text-emerald-600 text-[10px] tracking-wider uppercase font-bold">{stat.label}</p>
                <p className="text-3xl font-bold text-emerald-300 mt-1 crt-glow-green">{stat.value}</p>
              </div>
              <stat.icon className="w-8 h-8 text-emerald-500/20" />
            </div>
          ))}
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-emerald-500/30">
          {(['overview', 'products', 'orders', 'requests'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); addLog(`MENU: Switch viewport to [${tab.toUpperCase()}]`); }}
              className={`px-6 py-3 font-bold uppercase tracking-widest text-xs border-r border-emerald-500/20 transition-all
                ${activeTab === tab 
                  ? 'bg-emerald-500 text-black font-extrabold crt-glow-green border-t-2 border-t-emerald-300' 
                  : 'text-emerald-500/60 hover:text-emerald-400 hover:bg-emerald-950/20'
                }
              `}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Main Work Area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Main Grid Pane */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Viewport: Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <Card className="bg-black border-emerald-500/30 rounded-2xl text-emerald-400">
                  <CardHeader className="border-b border-emerald-500/20">
                    <CardTitle className="text-emerald-300 uppercase tracking-widest text-sm flex items-center gap-2">
                      <Settings className="w-4 h-4 text-emerald-400" /> Security Bypass & Operator Overrides
                    </CardTitle>
                    <CardDescription className="text-emerald-600 font-sans text-xs">
                      Elevate local client variables to bypass Firebase auth and test custom routes.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    <div className="space-y-2">
                      <Label className="text-emerald-500 text-[10px] uppercase font-bold tracking-widest">TARGET PROFILE UID</Label>
                      <div className="flex gap-4">
                        <Input 
                          value={overrideUid}
                          onChange={(e) => setOverrideUid(e.target.value)}
                          placeholder="e.g. user_identity_hash"
                          className="bg-zinc-950 border-emerald-500/30 text-emerald-300 rounded-2xl focus-visible:ring-emerald-400"
                        />
                        <Button 
                          onClick={() => setOverrideUid(user?.uid || '')}
                          className="bg-transparent border border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-black rounded-2xl"
                        >
                          My UID
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="border border-emerald-500/20 p-4 space-y-3">
                        <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">ADMIN PRIVILEGES</h4>
                        <p className="text-[10px] text-emerald-600 uppercase">Allows adding new drops, viewing all transaction files, overriding logistics.</p>
                        <Button onClick={() => handleOverrideRole('admin')} className="w-full bg-emerald-500/20 hover:bg-emerald-500 hover:text-black border border-emerald-500 text-emerald-300 rounded-2xl h-10 font-bold uppercase text-[10px]">
                          Grant Admin
                        </Button>
                      </div>

                      <div className="border border-emerald-500/20 p-4 space-y-3">
                        <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">CREATOR PRIVILEGES</h4>
                        <p className="text-[10px] text-emerald-600 uppercase">Allows uploading custom designs, editing portfolios, claiming design briefs.</p>
                        <Button onClick={() => handleOverrideRole('creator')} className="w-full bg-emerald-500/20 hover:bg-emerald-500 hover:text-black border border-emerald-500 text-emerald-300 rounded-2xl h-10 font-bold uppercase text-[10px]">
                          Grant Creator
                        </Button>
                      </div>

                      <div className="border border-emerald-500/20 p-4 space-y-3">
                        <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">VISITOR PORTALS</h4>
                        <p className="text-[10px] text-emerald-600 uppercase">Test client-side rendering pathways. Jump straight into the customer site.</p>
                        <Link to="/home" className="block">
                          <Button className="w-full bg-transparent hover:bg-emerald-500 hover:text-black border border-emerald-500/60 text-emerald-400 rounded-2xl h-10 font-bold uppercase text-[10px]">
                            Exit to Home
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Developer Checklist */}
                <div className="border border-emerald-500/20 bg-black p-6 space-y-4">
                  <h3 className="text-emerald-300 uppercase tracking-widest font-bold text-sm">OPERATOR RUNBOOK</h3>
                  <div className="space-y-2 text-xs">
                    {[
                      { check: true, text: "Migrated file structure to root-level /frontend and /backend directories" },
                      { check: true, text: "Created Node Express backend on port 5000 accessing Firestore" },
                      { check: true, text: "Bound Vercel serverless functions endpoint via /api redirects" },
                      { check: true, text: "Differentiated client views under /home and builder consoles under /developer" },
                      { check: false, text: "Finish adapting custom briefs forge prompts to call serverless Gemini endpoint" }
                    ].map((step, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <span className={step.check ? "text-emerald-400" : "text-amber-500"}>
                          {step.check ? "[✔]" : "[ ]"}
                        </span>
                        <span className={step.check ? "text-emerald-400/80" : "text-emerald-500"}>{step.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Viewport: Products */}
            {activeTab === 'products' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-emerald-300 uppercase tracking-widest font-bold">GRID INVENTORY CONSOLE</h3>
                  <Button 
                    onClick={() => setIsAdding(!isAdding)}
                    className="bg-emerald-500 text-black hover:bg-emerald-400 font-bold uppercase rounded-2xl h-10 px-6"
                  >
                    {isAdding ? "Cancel" : <><Plus className="w-4 h-4 mr-2" /> Deploy Drop</>}
                  </Button>
                </div>

                {isAdding && (
                  <Card className="bg-black border-amber-500/40 rounded-2xl text-emerald-400">
                    <CardHeader>
                      <CardTitle className="text-amber-300 uppercase tracking-widest text-sm">Deploy New Product Parameter</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleAddProduct} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-emerald-500">Designation / Title</Label>
                            <Input 
                              value={newProduct.title}
                              onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                              required
                              placeholder="e.g. Retro Synth"
                              className="bg-zinc-950 border-emerald-500/30 text-emerald-300 rounded-2xl focus-visible:ring-amber-400"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-emerald-500">Value (USD)</Label>
                            <Input 
                              type="number"
                              value={newProduct.price}
                              onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                              required
                              placeholder="e.g. 45"
                              className="bg-zinc-950 border-emerald-500/30 text-emerald-300 rounded-2xl focus-visible:ring-amber-400"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-emerald-500">Inventory Type</Label>
                            <select
                              value={newProduct.entityType}
                              onChange={(e) => setNewProduct({ ...newProduct, entityType: e.target.value })}
                              className="w-full h-10 bg-zinc-950 border border-emerald-500/30 rounded-2xl px-3 text-emerald-300 text-xs focus:outline-none"
                            >
                              <option value="Poster">Vault (Poster)</option>
                              <option value="BazaarItem">Bazaar (Merch)</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-emerald-500">Image Grid URL</Label>
                            <Input 
                              value={newProduct.imageUrl}
                              onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                              placeholder="https://..."
                              className="bg-zinc-950 border-emerald-500/30 text-emerald-300 rounded-2xl focus-visible:ring-amber-400"
                            />
                          </div>
                        </div>
                        <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase rounded-2xl h-12 mt-4">
                          Transmit Drop Parameters
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                )}

                <div className="border border-emerald-500/20 bg-black">
                  <div className="p-4 border-b border-emerald-500/20 flex justify-between bg-zinc-950/60 font-bold text-emerald-300 text-xs tracking-wider">
                    <span>Active Inventory</span>
                    <span className="text-[10px] text-emerald-500">Live Grid Sync</span>
                  </div>
                  
                  <div className="divide-y divide-emerald-500/10">
                    {products.map(product => (
                      <div key={product.id} className="p-4 flex items-center justify-between hover:bg-emerald-950/10 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-16 bg-zinc-900 border border-emerald-500/30 overflow-hidden flex items-center justify-center">
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Database className="w-6 h-6 text-emerald-600/30" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-emerald-200 uppercase">{product.title}</h4>
                            <p className="text-emerald-500 text-xs mt-0.5">
                              Value: ${product.price} | Type: {product.entityType}
                            </p>
                          </div>
                        </div>

                        <Button 
                          onClick={() => handleDeleteProduct(product.id, product.title)}
                          className="bg-transparent border border-red-500/30 hover:border-red-500 text-red-500 hover:bg-red-500/10 rounded-2xl size-9 p-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    {products.length === 0 && (
                      <div className="p-8 text-center text-emerald-600 italic">No products deployed on the grid.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Viewport: Orders */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <h3 className="text-emerald-300 uppercase tracking-widest font-bold">LOGISTICS & ORDER ROUTING</h3>
                
                <div className="border border-emerald-500/20 bg-black">
                  <div className="p-4 border-b border-emerald-500/20 bg-zinc-950/60 font-bold text-emerald-300 text-xs">
                    Transaction Logs
                  </div>

                  <div className="divide-y divide-emerald-500/10 text-xs">
                    {orders.map(order => (
                      <div key={order.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="bg-emerald-950 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 font-bold">
                              #{order.id.slice(-8).toUpperCase()}
                            </span>
                            <span className="text-emerald-600">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="font-bold text-emerald-200">
                            {order.items?.map((i: any) => i.title).join(', ')}
                          </p>
                          <p className="text-amber-400 font-bold">TOTAL: ${order.total}</p>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[10px] text-emerald-500 uppercase font-bold">Status Pipeline</Label>
                          <select
                            value={order.status}
                            onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                            className="bg-black border border-emerald-500/30 text-emerald-300 text-xs px-2 py-1.5 rounded-2xl w-48 outline-none focus:border-emerald-400"
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
                      <div className="p-8 text-center text-emerald-600 italic">No transaction files synced in logistics.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Viewport: Requests */}
            {activeTab === 'requests' && (
              <div className="space-y-6">
                <h3 className="text-emerald-300 uppercase tracking-widest font-bold">FORGE CUSTOM BRIEF QUEUE</h3>
                
                <div className="space-y-4">
                  {requests.map(req => (
                    <div key={req.id} className="border border-emerald-500/20 bg-black p-6 space-y-4 relative">
                      
                      <div className="flex justify-between items-start border-b border-emerald-500/10 pb-4">
                        <div>
                          <h4 className="text-lg font-bold text-emerald-200 uppercase">{req.title}</h4>
                          <p className="text-xs text-emerald-500 mt-1">
                            Requested By: <span className="text-emerald-400 font-bold">{req.viewerId.slice(-8).toUpperCase()}</span> • Creator ID: {req.creatorId.slice(-8).toUpperCase()}
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 font-bold uppercase tracking-wider text-[10px] border
                          ${req.status === 'Pending' ? 'bg-amber-950/40 border-amber-500/30 text-amber-400' : ''}
                          ${req.status === 'Approved' ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400' : ''}
                          ${req.status === 'In_Production' ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400' : ''}
                          ${req.status === 'Rejected' ? 'bg-red-950/40 border-red-500/30 text-red-400' : ''}
                        `}>
                          {req.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                        <div className="space-y-1">
                          <span className="text-emerald-600 text-[10px] uppercase font-bold tracking-wider">Concept Notes:</span>
                          <p className="text-emerald-300 whitespace-pre-wrap">{DOMPurify.sanitize((req.notes || "No concept notes provided.").normalize('NFKC'))}</p>
                        </div>

                        <div className="space-y-2 border-l border-emerald-500/10 pl-4">
                          <span className="text-emerald-600 text-[10px] uppercase font-bold tracking-wider">Parameters / Specifications:</span>
                          <div className="space-y-1 text-emerald-400">
                            <div>• Dimension: {req.specs?.size || "Not set"}</div>
                            <div>• Theme: {req.specs?.theme || "Not set"}</div>
                            {req.specs?.description && (
                              <div className="mt-2 text-emerald-500 italic">"{DOMPurify.sanitize(req.specs.description.normalize('NFKC'))}"</div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-4 border-t border-emerald-500/10 pt-4 justify-end">
                        <Button 
                          onClick={() => handleUpdateBriefStatus(req.id, 'Approved')}
                          className="bg-emerald-500/20 border border-emerald-500 text-emerald-300 hover:bg-emerald-500 hover:text-black font-bold uppercase text-[10px] rounded-2xl h-9 px-4"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" /> Accept Brief
                        </Button>
                        <Button 
                          onClick={() => handleUpdateBriefStatus(req.id, 'Rejected')}
                          className="bg-transparent border border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-bold uppercase text-[10px] rounded-2xl h-9 px-4"
                        >
                          <XCircle className="w-4 h-4 mr-2" /> Reject Brief
                        </Button>
                      </div>

                    </div>
                  ))}

                  {requests.length === 0 && (
                    <div className="p-12 text-center border border-dashed border-emerald-500/20 bg-black text-emerald-600 italic">
                      Forge queue is empty. No design briefs transmitted.
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Right Logging Pane */}
          <div className="space-y-6">
            
            {/* System Console Logs */}
            <div className="border border-emerald-500/30 bg-black p-4 flex flex-col h-[500px]">
              <div className="flex items-center gap-2 border-b border-emerald-500/20 pb-3 mb-3 text-emerald-300 font-bold text-xs">
                <TerminalIcon className="w-4 h-4" />
                <span>OPERATOR CONSOLE</span>
              </div>
              
              <div className="flex-grow overflow-y-auto space-y-2 text-[10px] scrollbar-thin scrollbar-thumb-emerald-500/20">
                {systemLogs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed">
                    <span className="text-emerald-600">&gt;&nbsp;</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-emerald-500/20 pt-3 mt-3 flex justify-between items-center text-[10px] text-emerald-600">
                <span>BUFFER STATUS: ACTIVE</span>
                <button 
                  onClick={() => setSystemLogs(["Console buffers purged. Starting clean."])}
                  className="hover:text-emerald-300 font-bold uppercase transition-all duration-300 ease-in-out"
                >
                  Clear Logs
                </button>
              </div>
            </div>

            {/* Quick Navigation / Core Return */}
            <div className="border border-emerald-500/20 bg-black p-4 space-y-4">
              <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Quick Commands</h4>
              <div className="space-y-2">
                <Link to="/home" className="block">
                  <Button className="w-full bg-zinc-950 border border-emerald-500/30 hover:border-emerald-500 text-emerald-400 rounded-2xl h-10 font-bold uppercase text-[10px]">
                    Main Marketplace
                  </Button>
                </Link>
                <Link to="/developer/admin" className="block">
                  <Button className="w-full bg-zinc-950 border border-emerald-500/30 hover:border-emerald-500 text-emerald-400 rounded-2xl h-10 font-bold uppercase text-[10px]">
                    System Catalog
                  </Button>
                </Link>
                <Link to="/developer/terminal" className="block">
                  <Button className="w-full bg-zinc-950 border border-emerald-500/30 hover:border-emerald-500 text-emerald-400 rounded-2xl h-10 font-bold uppercase text-[10px]">
                    Shell Terminal
                  </Button>
                </Link>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
