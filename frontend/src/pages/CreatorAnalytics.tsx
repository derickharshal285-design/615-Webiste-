import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Eye, Heart, MousePointerClick, DollarSign, Activity, ArrowUpRight, ArrowLeft, Package } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';

export default function CreatorAnalytics() {
  const { user, userData, loading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!user?.uid || !userData?.roles?.includes('creator')) return;

    const fetchAnalytics = async () => {
      setLoadingData(true);
      try {
        const [ordersRes, productsRes, requestsRes] = await Promise.all([
          fetch('/api/orders', { credentials: 'include' }),
          fetch(`/api/products?creatorId=${user.uid}`),
          fetch(`/api/requests?creatorId=${user.uid}`, { credentials: 'include' })
        ]);

        const allOrders = ordersRes.ok ? await ordersRes.json() : [];
        const myProducts = productsRes.ok ? await productsRes.json() : [];
        const myRequests = requestsRes.ok ? await requestsRes.json() : [];

        // Filter orders that contain creator's products
        const myProductIds = new Set(myProducts.map((p: any) => p.id));
        const creatorOrders = allOrders.filter((o: any) =>
          o.items?.some((i: any) => myProductIds.has(i.id))
        );

        setOrders(creatorOrders);
        setProducts(myProducts);
        setRequests(myRequests);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchAnalytics();
  }, [user?.uid, userData?.roles]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center font-sans p-4">
        <Activity className="w-16 h-16 text-[#ef3836] mx-auto animate-pulse" />
        <p className="text-[#ef3836] text-xs uppercase tracking-widest mt-4">Authenticating Node...</p>
      </div>
    );
  }

  if (!user || !userData?.roles?.includes('creator')) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center font-sans p-4">
        <div className="text-center space-y-4">
          <Activity className="w-16 h-16 text-[#ef3836] mx-auto animate-pulse" />
          <h2 className="text-[#ef3836] uppercase tracking-widest font-bold text-xl">Access Denied</h2>
          <p className="text-zinc-500 text-xs uppercase tracking-widest">Creator authorization required for analytics node.</p>
          <button onClick={() => navigate('/home')} className="mt-4 border border-[#ef3836] text-[#ef3836] px-6 py-2 uppercase tracking-widest text-xs font-bold hover:bg-[#ef3836] hover:text-white transition-all duration-300 ease-in-out">
            Return to Nexus
          </button>
        </div>
      </div>
    );
  }

  // Build 7-day chart data from real orders
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString('en', { weekday: 'short' });
  });

  const chartData = last7Days.map((name, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = d.toDateString();
    const dayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === dayStr);
    const dayRequests = requests.filter(r => new Date(r.createdAt).toDateString() === dayStr);
    return {
      name,
      orders: dayOrders.length,
      revenue: dayOrders.reduce((sum: number, o: any) => {
        const creatorItems = o.items?.filter((it: any) => products.find((p: any) => p.id === it.id)) || [];
        return sum + creatorItems.reduce((s: number, it: any) => s + (it.price * it.quantity), 0);
      }, 0),
      requests: dayRequests.length,
    };
  });

  const totalRevenue = orders.reduce((sum, o) => {
    const creatorItems = o.items?.filter((it: any) => products.find((p: any) => p.id === it.id)) || [];
    return sum + creatorItems.reduce((s: number, it: any) => s + (it.price * it.quantity), 0);
  }, 0);

  const pendingRequests = requests.filter(r => r.status === 'pending' || r.status === 'open').length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 px-4 sm:px-8 pt-28 pb-12 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-[#ef3836]/30 pb-6">
          <div>
            <Link to={`/home/portfolio/${user.uid}`} className="text-zinc-500 hover:text-white flex items-center gap-2 text-xs uppercase tracking-widest mb-4 transition-all duration-300 ease-in-out">
              <ArrowLeft className="w-4 h-4" /> Back to Customizer
            </Link>
            <h1 className="text-4xl font-heading uppercase text-white mb-2">
              <span className="text-[#ef3836]">Creator</span> Analytics
            </h1>
            <p className="text-zinc-500 uppercase tracking-widest text-sm">System Performance Telemetry</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-black border border-white/10 px-4 py-2 text-right">
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Network Status</div>
              <div className="text-emerald-500 text-xs uppercase tracking-widest font-black flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Online
              </div>
            </div>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard icon={<Package />} label="Active Services" value={String(products.length)} trend={products.length > 0 ? '+' + products.length : '0'} color="#3dbca1" />
          <MetricCard icon={<MousePointerClick />} label="Total Orders (All)" value={String(orders.length)} trend={orders.length > 0 ? '+' + orders.length : '0'} color="#ef3836" />
          <MetricCard icon={<Heart />} label="Open Requests" value={String(pendingRequests)} trend={pendingRequests > 0 ? '+' + pendingRequests : '0'} color="#a855f7" />
          <MetricCard icon={<DollarSign />} label="Est. Revenue" value={`₹${totalRevenue.toFixed(0)}`} trend={totalRevenue > 0 ? `+₹${totalRevenue.toFixed(0)}` : '₹0'} color="#f59e0b" />
        </div>

        {/* Main Chart */}
        <div className="bg-black border border-white/10 p-6 relative overflow-hidden group hover:border-zinc-700 transition-all duration-300 ease-in-out">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-[0.02] pointer-events-none"></div>
          <h3 className="text-zinc-400 uppercase tracking-widest font-bold text-xs mb-6 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#ef3836]" /> Orders & Revenue (Past 7 Days)
          </h3>
          {loadingData ? (
            <div className="h-[300px] flex items-center justify-center text-zinc-600 text-xs uppercase tracking-widest">
              Loading telemetry...
            </div>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="name" stroke="#52525b" tick={{ fill: '#52525b', fontSize: 10, fontFamily: 'monospace' }} />
                  <YAxis stroke="#52525b" tick={{ fill: '#52525b', fontSize: 10, fontFamily: 'monospace' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', fontFamily: 'monospace', fontSize: '12px' }}
                    itemStyle={{ textTransform: 'uppercase', fontWeight: 'bold' }}
                  />
                  <Line type="monotone" dataKey="orders" name="Orders" stroke="#3dbca1" strokeWidth={2} dot={{ fill: '#3dbca1', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, stroke: '#fff' }} />
                  <Line type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="#fcaf3e" strokeWidth={2} dot={{ fill: '#fcaf3e', strokeWidth: 2, r: 4 }} />
                  <Line type="monotone" dataKey="requests" name="Requests" stroke="#a855f7" strokeWidth={2} dot={{ fill: '#a855f7', strokeWidth: 2, r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Recent Orders Table */}
        <div className="bg-black border border-white/10 p-6 relative overflow-hidden">
          <h3 className="text-zinc-400 uppercase tracking-widest font-bold text-xs mb-6 flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-[#3dbca1]" /> Recent Orders
          </h3>
          {loadingData ? (
            <div className="p-8 text-center text-zinc-500 uppercase tracking-widest text-[10px]">Loading...</div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 uppercase tracking-widest text-[10px] border border-dashed border-white/10">
              No orders yet. Share your portfolio to get discovered.
            </div>
          ) : (
            <div className="space-y-2">
              {orders.slice(0, 10).map((order) => (
                <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border border-white/10 hover:border-zinc-700 transition-all duration-300 ease-in-out">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] text-zinc-600 font-sans">{order.id?.substring(0, 12)}...</span>
                    <span className="text-zinc-300 text-xs">{order.items?.length || 0} item(s)</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[#3dbca1] text-xs font-bold">₹{Number(order.total || 0).toFixed(2)}</span>
                    <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 ${
                      order.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' :
                      order.status === 'Cancelled' ? 'bg-red-500/10 text-red-500' :
                      'bg-amber-500/10 text-amber-400'
                    }`}>{order.status || 'Processing'}</span>
                    <span className="text-zinc-600 text-[10px]">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '—'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, trend, color }: { icon: React.ReactNode, label: string, value: string, trend: string, color: string }) {
  const isPositive = !trend.startsWith('-') && trend !== '0' && trend !== '₹0';
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-black border border-white/10 p-5 group transition-all"
      style={{ borderBottomColor: `${color}40` }}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="text-zinc-500 group-hover:text-white transition-all duration-300 ease-in-out" style={{ color: color }}>
          {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-5 h-5' })}
        </div>
        <div className={`text-[10px] font-bold tracking-widest px-2 py-0.5 ${isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-800 text-zinc-500'}`}>
          {trend}
        </div>
      </div>
      <div className="space-y-1">
        <h4 className="text-2xl font-heading text-white">{value}</h4>
        <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{label}</p>
      </div>
    </motion.div>
  );
}
