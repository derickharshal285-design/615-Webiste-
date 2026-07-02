import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Package, Trash2, Plus, Minus, Info, CreditCard } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useCartStore } from '../store/cart';
import { useAuth } from '../components/AuthProvider';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { logSystemError } from '../lib/logger';

export default function Cart() {
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCartStore();
  const { user, login, activeMode } = useAuth();
  const navigate = useNavigate();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  if (activeMode === 'creator') {
    return <Navigate to="/home" replace />;
  }

  const handleCheckout = async () => {
    if (!user) {
      login();
      return;
    }
    if (items.length === 0) return;
    
    setIsCheckingOut(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: user.uid,
          items: items.map(i => ({ id: i.id, title: i.title, price: i.price, quantity: i.quantity, imageUrl: i.imageUrl || '', creatorId: i.creatorId || '' })),
          total: totalPrice()
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Checkout failed.');
      }

      clearCart();
      navigate('/home/terminal');
    } catch (err: any) {
      console.error(err);
      await logSystemError("checkout", err);
      alert("Checkout error. Admins have been notified.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 px-4 md:px-8 pt-28 pb-12 font-sans relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(61,188,161,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(61,188,161,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(252,175,62,0.05)_0%,transparent_50%)] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(61,188,161,0.05)_0%,transparent_50%)] pointer-events-none mix-blend-screen" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16 border-b border-white/10 pb-8">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <Package className="text-[#3dbca1] w-8 h-8 md:w-10 md:h-10" />
              <h1 className="text-4xl md:text-5xl font-black uppercase text-white tracking-wide">Manifest</h1>
            </div>
            <p className="text-[#3dbca1] uppercase tracking-widest text-xs font-bold drop-shadow-[0_0_10px_rgba(61,188,161,0.5)]">
              Pending Sync Inventory
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Items Grid (Takes up 2 cols on lg) */}
          <div className="lg:col-span-2 space-y-8">
            {items.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-[#3dbca1]/50 transition-all duration-300 shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
                  >
                    <div className="aspect-[16/9] relative overflow-hidden bg-[#0f0a20]">
                      <img src={item.imageUrl} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-700" />
                      <div className="absolute top-2 right-2">
                        <button onClick={() => removeItem(item.id)} className="bg-black/50 p-2 rounded-full text-zinc-400 hover:text-[#fcaf3e] hover:bg-black/80 transition-all duration-300 ease-in-out backdrop-blur-md">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-white font-bold uppercase text-sm tracking-tight mb-2 truncate">{item.title}</h3>
                      <div className="flex justify-between items-center mt-4">
                        <div className="flex items-center gap-3 bg-black/50 rounded-lg p-1 border border-white/10">
                          <button 
                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            className="w-8 h-8 flex items-center justify-center hover:bg-white/10 text-zinc-400 hover:text-white transition-all rounded-md"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm font-bold text-white w-6 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-white/10 text-zinc-400 hover:text-white transition-all rounded-md"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-[#3dbca1] font-bold text-lg tracking-widest drop-shadow-[0_0_8px_rgba(61,188,161,0.3)]">₹ {item.price * item.quantity}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="py-40 text-center border-2 border-dashed border-white/10 rounded-3xl bg-white/5 backdrop-blur-sm">
                <Package className="w-16 h-16 text-zinc-600 mx-auto mb-6 opacity-50" />
                <p className="text-zinc-500 uppercase tracking-widest text-sm font-bold">Your manifest is currently empty.</p>
                <Link to="/home/marketplace">
                  <Button className="mt-8 bg-transparent border border-[#3dbca1] text-[#3dbca1] hover:bg-[#3dbca1] hover:text-black rounded-xl font-bold uppercase tracking-widest px-8">
                    Return to Vault
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Checkout Panel */}
          <div className="lg:col-span-1">
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 sticky top-32 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
              <h3 className="text-xl font-black uppercase text-white mb-8 tracking-widest border-b border-white/10 pb-4">Order Summary</h3>
              
              <div className="space-y-4 mb-8">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between text-xs">
                    <span className="text-zinc-400 truncate pr-4">{item.quantity}x {item.title}</span>
                    <span className="text-white">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-end mb-8 pt-6 border-t border-white/10">
                <span className="text-xs text-zinc-500 uppercase tracking-widest">Aggregate Value</span>
                <span className="text-white text-3xl font-black drop-shadow-[0_0_15px_rgba(61,188,161,0.5)] text-[#3dbca1]">₹ {totalPrice().toFixed(2)}</span>
              </div>
              
              <div className="bg-[#3dbca1]/10 border border-[#3dbca1]/30 p-4 rounded-xl mb-8 flex items-start gap-3 shadow-[0_0_10px_rgba(61,188,161,0.1)]">
                <Info className="w-5 h-5 text-[#3dbca1] shrink-0 mt-0.5" />
                <p className="text-[10px] text-[#3dbca1] uppercase tracking-widest leading-relaxed font-bold">
                  Logistics processed via secure fulfillment engine. Tracking syncs to terminal instantly.
                </p>
              </div>

              <Button 
                onClick={handleCheckout}
                disabled={isCheckingOut || items.length === 0}
                className="w-full h-16 bg-gradient-to-r from-[#3dbca1] to-[#fcaf3e] text-white hover:opacity-90 font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-[0_0_20px_rgba(252,175,62,0.4)] border-none"
              >
                {isCheckingOut ? (
                  <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity }}>
                    Processing...
                  </motion.div>
                ) : (
                  <span className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" /> Execute Sync
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
