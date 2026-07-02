import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../components/AuthProvider';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { ShoppingBag, Package, ShieldAlert, Clock, CheckCircle2, XCircle, Loader } from 'lucide-react';
import { Button } from '../components/ui/button';
import DOMPurify from 'dompurify';

export default function ClientDashboard() {
  const { user, userData, loading, activeMode } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'purchases' | 'requests'>('purchases');
  const [orders, setOrders] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const fetchData = async () => {
      setLoadingData(true);
      try {
        const [ordersRes, requestsRes] = await Promise.all([
          fetch(`/api/orders/user/${user.uid}`, { credentials: 'include' }),
          fetch(`/api/requests?viewerId=${user.uid}`, { credentials: 'include' })
        ]);

        if (ordersRes.ok) setOrders(await ordersRes.json());
        if (requestsRes.ok) setRequests(await requestsRes.json());
      } catch (err) {
        console.error('Failed to fetch client data:', err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [user?.uid]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center font-sans p-4">
        <ShieldAlert className="w-16 h-16 text-[#3dbca1] mx-auto animate-pulse" />
        <p className="text-[#3dbca1] text-xs uppercase tracking-widest mt-4">Authenticating Client Node...</p>
      </div>
    );
  }

  if (!user || activeMode === 'creator') {
    return <Navigate to="/home" replace />;
  }

  const statusIcon = (status: string) => {
    if (status === 'Completed') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (status === 'Cancelled') return <XCircle className="w-4 h-4 text-red-500" />;
    return <Clock className="w-4 h-4 text-amber-400" />;
  };

  const statusColor = (status: string) => {
    if (status === 'Completed') return 'text-emerald-500';
    if (status === 'Cancelled') return 'text-red-500';
    return 'text-amber-400';
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 px-4 sm:px-8 pt-28 pb-12 font-sans relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(61,188,161,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(61,188,161,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(252,175,62,0.05)_0%,transparent_50%)] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(61,188,161,0.05)_0%,transparent_50%)] pointer-events-none mix-blend-screen" />
      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-[#3dbca1]/30 pb-6">
          <div>
            <h1 className="text-4xl font-heading uppercase text-white mb-2">
              <span className="text-[#3dbca1]">Client</span> Command
            </h1>
            <p className="text-zinc-500 uppercase tracking-widest text-sm">Asset & Request Management</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-black border border-white/10 px-4 py-2 text-right">
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Client ID</div>
              <div className="text-emerald-500 text-xs uppercase tracking-widest font-black">
                {user.uid.substring(0, 8).toUpperCase()}
              </div>
            </div>
            <div className="bg-black border border-white/10 px-4 py-2 text-right">
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Total Orders</div>
              <div className="text-[#3dbca1] text-xs uppercase tracking-widest font-black">{orders.length}</div>
            </div>
          </div>
        </div>

        {/* Dashboard Navigation */}
        <div className="flex flex-wrap gap-4 border-b border-white/10 pb-px overflow-x-auto whitespace-nowrap scrollbar-hide">
          <button
            onClick={() => setActiveTab('purchases')}
            className={`pb-4 text-xs font-black uppercase tracking-widest transition-all duration-300 ease-in-out relative ${activeTab === 'purchases' ? 'text-[#3dbca1]' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <div className="flex items-center gap-2"><ShoppingBag className="w-4 h-4" /> Vault Assets ({orders.length})</div>
            {activeTab === 'purchases' && (
              <motion.div layoutId="clientTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3dbca1] shadow-[0_0_10px_rgba(61,188,161,0.5)]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`pb-4 text-xs font-black uppercase tracking-widest transition-all duration-300 ease-in-out relative ${activeTab === 'requests' ? 'text-[#fcaf3e]' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <div className="flex items-center gap-2"><Package className="w-4 h-4" /> Active Forges ({requests.length})</div>
            {activeTab === 'requests' && (
              <motion.div layoutId="clientTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#fcaf3e] shadow-[0_0_10px_rgba(252,175,62,0.5)]" />
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {loadingData ? (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
              <Loader className="w-8 h-8 text-[#3dbca1] animate-spin" />
              <p className="text-zinc-500 text-xs uppercase tracking-widest">Loading data from secure vault...</p>
            </div>
          ) : activeTab === 'purchases' ? (
            orders.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-white/10 text-zinc-500 uppercase tracking-widest text-xs">
                No acquired assets found in your vault.{' '}
                <Link to="/home/marketplace" className="text-[#3dbca1] hover:underline">Browse the Vault</Link> to expand your collection.
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-zinc-900/50 border border-white/10 p-6 hover:border-zinc-700 transition-all duration-300 ease-in-out"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                      <div>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Order ID</p>
                        <p className="text-white font-bold text-sm font-sans">{order.id}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {statusIcon(order.status)}
                        <span className={`text-xs font-bold uppercase tracking-widest ${statusColor(order.status)}`}>
                          {order.status || 'Processing'}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs border-t border-white/10 pt-4">
                      <div>
                        <p className="text-zinc-500 uppercase tracking-widest mb-1 text-[10px]">Items</p>
                        <p className="text-zinc-300">{order.items?.length || 0} item(s)</p>
                      </div>
                      <div>
                        <p className="text-zinc-500 uppercase tracking-widest mb-1 text-[10px]">Total</p>
                        <p className="text-[#3dbca1] font-bold">₹ {Number(order.total || 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-zinc-500 uppercase tracking-widest mb-1 text-[10px]">Date</p>
                        <p className="text-zinc-300">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '—'}</p>
                      </div>
                    </div>
                    {order.items && order.items.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {order.items.map((item: any, i: number) => (
                          <span key={i} className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-1 uppercase tracking-widest">
                            {item.title} x{item.quantity}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )
          ) : (
            requests.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-white/10 text-zinc-500 uppercase tracking-widest text-xs">
                No active custom requests.{' '}
                <Link to="/home/requests" className="text-[#fcaf3e] hover:underline">Commission a creator</Link> to start a new forge project.
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((req) => (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-zinc-900/50 border border-white/10 p-6 hover:border-zinc-700 transition-all duration-300 ease-in-out"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                      <div>
                        <p className="text-white font-bold text-sm uppercase tracking-tight">{req.title || 'Custom Request'}</p>
                        <p className="text-zinc-500 text-[10px] uppercase tracking-widest mt-1">Creator: {req.creatorName || '—'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {statusIcon(req.status)}
                        <span className={`text-xs font-bold uppercase tracking-widest ${statusColor(req.status)}`}>
                          {req.status || 'Pending'}
                        </span>
                      </div>
                    </div>
                    {req.description && (
                      <p className="text-zinc-400 text-xs leading-relaxed border-t border-white/10 pt-3 mt-3">{DOMPurify.sanitize(req.description.normalize('NFKC'))}</p>
                    )}
                  </motion.div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
